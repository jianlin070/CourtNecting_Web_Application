import React, { useState, useEffect } from "react";
import { MDBModal, MDBModalBody, MDBDataTableV5 } from "mdbreact";
import { formatDdMMyyyy, formatAmPm } from "../utility/index";
import NavigationBar from "./navigationBar";
import "../sass/userListing.scss";

const axios = require("axios");

export default function UserListing(props) {
  const getTemplate = (responseData = []) => {
    const mapData = (data) =>
      data.map((elem, index) => ({
        no: index + 1,
        name: elem.name,
        email: elem.email,
        credits: elem.credits,
        reservations: elem.reservations,
        clickEvent(row) {
          // setModalData(row);
          handleQueryReservationsList(row.email);
        },
      }));

    return {
      columns: [
        {
          label: "No.",
          field: "no",
          width: 150,
          attributes: {},
        },
        {
          label: "Name",
          field: "name",
          width: 150,
          attributes: {},
        },
        {
          label: "Email",
          field: "email",
          width: 150,
          attributes: {},
        },
        {
          label: "Credits",
          field: "credits",
          width: 150,
          attributes: {},
        },
      ],
      rows: mapData(responseData),
    };
  };

  const getReservationStatus = (datetime) => {
    const currentDate = new Date().getTime();
    const reservationDate = new Date(datetime).getTime();
    const endTime = new Date(reservationDate);
    endTime.setHours(endTime.getHours() + 2);
    if (reservationDate <= currentDate && currentDate <= endTime) {
      return "Active";
    }
    if (reservationDate > currentDate) {
      return "Upcoming";
    }
    return "Expired";
  };

  const mapReservationsData = (reservations) =>
    reservations.map((reservation, index) => ({
      ...reservation,
      no: index + 1,
      date: `${formatDdMMyyyy(new Date(reservation.datetime))}`,
      slot: `${formatAmPm(
        new Date(new Date(reservation.datetime).getTime())
      )} - ${formatAmPm(
        new Date(new Date(reservation.datetime).getTime() + 2 * 60 * 60 * 1000)
      )}`,
      court_no: reservation.court_no,
      status: getReservationStatus(reservation.datetime),
    }));

  const [modalData, setModalData] = useState(null);
  const [dataTable, setDataTable] = useState(getTemplate());

  useEffect(() => {
    document.title = "User Listing";
  }, []);

  async function handleQueryReservationsList(email) {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const response = await axios.get(`/admin/list-reservations?q=${email}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    if (response.status === 200) {
      setModalData({ email: email, reservations: response.data.data });
    } else {
      alert("Error Occurred");
    }
  }

  useEffect(() => {
    async function handleQueryUserList() {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return;

      const response = await axios.get("/admin/list-users", {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (response.status === 200) {
        setDataTable(getTemplate(response.data.data));
      } else {
        alert("Error Occurred");
      }
    }

    handleQueryUserList();
  }, []);

  return (
    <>
      <NavigationBar />
      {modalData && (
        <MDBModal
          size="lg"
          isOpen={!!modalData}
          toggle={() => {
            setModalData(null);
          }}
        >
          <MDBModalBody>
            <h3 className="modal-username">{modalData.email}</h3>
            <p className="modal-title">Reservations</p>
            <MDBDataTableV5
              hover
              entriesOptions={[5, 10]}
              entries={5}
              data={{
                columns: [
                  {
                    label: "Date",
                    field: "date",
                    width: 150,
                    attributes: {},
                  },
                  {
                    label: "Time Slot",
                    field: "slot",
                    width: 150,
                    attributes: {},
                  },
                  {
                    label: "Court No",
                    field: "court_no",
                    width: 150,
                    attributes: {},
                  },
                  {
                    label: "Status",
                    field: "status",
                    width: 150,
                    attributes: {},
                  },
                ],
                rows: mapReservationsData(modalData.reservations.slice().reverse()),
              }}
              materialSearch
            />
          </MDBModalBody>
        </MDBModal>
      )}

      <div className="main">
        <div className="card p-3">
          <MDBDataTableV5
            hover
            entriesOptions={[5, 10, 25, 50]}
            entries={5}
            data={dataTable}
            materialSearch
          />
        </div>
      </div>
    </>
  );
}
