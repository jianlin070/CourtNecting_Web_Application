import React, { useEffect, useState } from "react";
import NavigationBar from "./navigationBar";
import Chart from "react-google-charts";
import { MDBDataTableV5 } from "mdbreact";
import "../sass/dashboard.scss";
import axios from "axios";
import {
  faSquare,
  faCalendarCheck,
  faCheckSquare,
  faDatabase,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalizeFirstLetter, formatDdMM } from "../utility";

export default function Dashboard() {
  const [badmintonCourts, _setBadmintonCourtsRef] = useState([]);
  const [reservationsCount, setReservationsCount] = useState([]);
  const [unavailableCourts, setUnavailableCourts] = useState([]);
  const [upcomingCount, setUpcomingCount] = useState([0]);
  const badmintonCourtsRef = React.useRef(badmintonCourts);
  const [filter, setFilter] = useState("all");

  const setBadmintonCourts = (data) => {
    badmintonCourtsRef.current = data;
    _setBadmintonCourtsRef(data);
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

  const getDatatableRows = (data) =>
    data.map((elem) => ({
      id: elem._id,
      user_email: elem.user_email,
      court_no: elem.court_no,
      status: getReservationStatus(elem.datetime),
      updatedAt: new Date(Date.parse(elem.datetime)).toLocaleString(),
    }));

  const countUpcomingCourts = (data) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set current date to midnight

    // Filter reservations that are upcoming for today
    const upcomingCourts = data.filter((reservation) => {
      const reservationDate = new Date(reservation.datetime);
      reservationDate.setHours(0, 0, 0, 0); // Set reservation date to midnight
      const endTime = new Date(reservationDate);
      endTime.setHours(endTime.getHours() + 2);
      return (
        reservationDate.getTime() === currentDate.getTime() &&
        reservationDate > currentDate
      );
    });

    const upcomingCount = upcomingCourts.length;

    setUpcomingCount(upcomingCount);
  };

  useEffect(() => {
    document.title = "Dashboard";

    const initDataTable = async () => {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return;

      const response = await axios.get("/admin/list-reservations?limit=10000", {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (response.status === 200) {
        setBadmintonCourts(response.data.data.map((e) => e));
        countUpcomingCourts(response.data.data.map((e) => e));

        const reservationData = [];
        let date = new Date();
        for (let i = 0; i < 7; i++) {
          reservationData.push([formatDdMM(date), 0]);
          date.setDate(date.getDate() - 1);
        }
        reservationData.reverse();

        response.data.data.forEach((reservation) => {
          const key = formatDdMM(new Date(reservation.datetime));
          for (const data of reservationData) {
            if (data[0] === key) {
              data[1]++;
              break;
            }
          }
        });

        setReservationsCount(reservationData);
      }
    };

    const getUnavailableCourts = async () => {
      // Get the current date in local time
      const currentDate = new Date();

      // Get the current hour in local time
      const currentHour = currentDate.getHours();

      console.log(currentHour);

      // Find the nearest past time based on the specified times
      const nearestPastTime = [9, 11, 13, 15, 17, 19, 21]
        .reverse()
        .find((time) => time <= currentHour);

      // Set the datetime to the nearest upcoming time in local time
      currentDate.setHours(nearestPastTime, 0, 0, 0);

      console.log(currentDate);

      const response = await axios.post("/reservation/unavailble-court-no", {
        datetime: currentDate,
      });

      if (response.status === 200) {
        let reservations = getDatatableRows(badmintonCourts);
        setUnavailableCourts(response.data.unavailableCourts);
      }
    };

    // const intervalId = setInterval(() => {
    initDataTable();
    getUnavailableCourts();
    // }, 1000);

    // return () => clearInterval(intervalId);
  }, []);

  const filteredRows = () => {
    switch (filter) {
      case "all":
        return getDatatableRows(
          badmintonCourtsRef.current.filter(
            (reservation) =>
              getReservationStatus(reservation.datetime)
          ).slice().reverse()
        );
      case "active":
        return getDatatableRows(
          badmintonCourtsRef.current.filter(
            (reservation) =>
              getReservationStatus(reservation.datetime) === "Active"
          ).slice().reverse()
        );
      case "upcoming":
        return getDatatableRows(
          badmintonCourtsRef.current.filter(
            (reservation) =>
              getReservationStatus(reservation.datetime) === "Upcoming"
          ).slice().reverse()
        );
      case "expired":
        return getDatatableRows(
          badmintonCourtsRef.current.filter(
            (reservation) =>
              getReservationStatus(reservation.datetime) === "Expired"
          ).slice().reverse()
        );
      default:
        return getDatatableRows(badmintonCourtsRef.current);
    }
  };

  return (
    <>
      <NavigationBar />
      <div className="main">
        <div className="row gx-4 mb-4">
          <div className="col">
            <div className="card badminton-court-empty-info px-5 py-3">
              <h3>
                <FontAwesomeIcon icon={faSquare} className="me-3" />
                {6 - unavailableCourts.length}
              </h3>
              <h6>Empty Courts</h6>
            </div>
          </div>
          <div className="col">
            <div className="card badminton-court-reserved-info px-5 py-3">
              <h3>
                <FontAwesomeIcon icon={faCalendarCheck} className="me-3" />
                {unavailableCourts.length}
              </h3>
              <h6>Reserved Courts</h6>
            </div>
          </div>
          <div className="col">
            <div className="card badminton-court-total-info px-5 py-3">
              <h3>
                <FontAwesomeIcon icon={faCheckSquare} className="me-3" />
                {6}
              </h3>
              <h6>Total Courts</h6>
            </div>
          </div>
          <div className="col">
            <div className="card badminton-court-upcoming-info px-5 py-3">
              <h3>
                <FontAwesomeIcon icon={faDatabase} className="me-3" />
                {upcomingCount}
              </h3>
              <h6>Today's Upcoming Reservations</h6>
            </div>
          </div>
        </div>
        <div className="row gx-4 mb-4">
          <div className="col-md-6">
            <div className="card">
              <Chart
                width={"100%"}
                height={"300px"}
                chartType="PieChart"
                loader={<div>Loading Chart</div>}
                data={[
                  ["Status", "Number"],
                  ["Reserved", unavailableCourts.length],
                  ["Available", 6 - unavailableCourts.length],
                ]}
                options={{
                  title: "Courts Availability",
                  is3D: true,
                  slices: {
                    0: { color: "MediumSeaGreen" },
                    1: { color: "DodgerBlue" },
                    2: { color: "Tomato" },
                  },
                }}
                rootProps={{ "data-testid": "2" }}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <Chart
                width={"100%"}
                height={"300px"}
                chartType="LineChart"
                loader={<div>Loading Chart</div>}
                data={[["x", "Number of reservations"], ...reservationsCount]}
                options={{
                  hAxis: {
                    title: "Days",
                  },
                  vAxis: {
                    title: "Total reservation",
                  },
                }}
                rootProps={{ "data-testid": "1" }}
              />
            </div>
          </div>
        </div>
        <div className="row pb-5">
          <div className="col">
            <div className="card p-3">
              <div className="filter-buttons">
                <button
                  className={filter === "all" ? "active" : ""}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  className={filter === "active" ? "active" : ""}
                  onClick={() => setFilter("active")}
                >
                  Active
                </button>
                <button
                  className={filter === "upcoming" ? "active" : ""}
                  onClick={() => setFilter("upcoming")}
                >
                  Upcoming
                </button>
                <button
                  className={filter === "expired" ? "active" : ""}
                  onClick={() => setFilter("expired")}
                >
                  Expired
                </button>
              </div>
              <MDBDataTableV5
                hover
                entriesOptions={[5, 20, 25]}
                entries={5}
                pagesAmount={4}
                data={{
                  columns: [
                    {
                      label: "Reservation ID",
                      field: "id",
                      width: 150,
                      attributes: {},
                    },
                    {
                      label: "User Email",
                      field: "user_email",
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
                    {
                      label: "Reserved At",
                      field: "updatedAt",
                      width: 150,
                      attributes: {},
                    },
                  ],
                  rows: filteredRows(),
                }}
                materialSearch
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
