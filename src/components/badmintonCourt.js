// Import necessary React components and libraries
import React, { useEffect, useState, useRef } from "react";
import { MDBDataTableV5 } from "mdbreact";
import NavigationBar from "./navigationBar";
import LoadingBar from "./loadingBar";
import SweetAlert from "react-bootstrap-sweetalert";
import { capitalizeFirstLetter } from "../utility";
import "../sass/badmintonCourt.scss";
import axios from "axios";
import { formatAmPm, formatDdMMyyyy } from "../utility";
import Swal from "sweetalert2";

// Define the main component
export default function BadmintonCourt() {
  // Define and initialize component state using the useState hook
  const [state, _setState] = useState({
    isLoading: true,
    courtPlan: {
      isLoaded: false,
      height: 0,
    },
    currCourt: 1,
    unavailableCourts: [],
  });

  // Define additional state variables using the useState hook
  const [showDialog, setShowDialog] = useState(false);
  const [modalData, setModalData] = useState({ reservations: [] });
  const stateRef = useRef(state);

  // Define a function to set the component state
  const setState = (state) => {
    stateRef.current = state;
    _setState(state);
  };

  // useEffect hook to run code on component mount
  useEffect(() => {
    // Set the document title
    document.title = "Courts Info";

    // Initialize courts and unavailable courts data
    const initCourts = async () => {
      let newState = {
        ...state,
      };
      newState.badmintonCourt = { courts: [1, 2, 3, 4, 5, 6] };
      newState.isLoading = false;
      setState(newState);
    };

    // Fetch and update unavailable courts data
    const getUnavailableCourts = async () => {
      // Get the current date in local time
      const currentDate = new Date();

      // Get the current hour in local time
      const currentHour = currentDate.getHours();

      // Find the nearest past time based on the specified times
      const nearestPastTime = [9, 11, 13, 15, 17, 19, 21]
        .reverse()
        .find((time) => time <= currentHour);

      // Set the datetime to the nearest upcoming time in local time
      currentDate.setHours(nearestPastTime, 0, 0, 0);

      const response = await axios.post("/reservation/unavailble-court-no", {
        datetime: currentDate,
      });

      if (response.status === 200) {
        let newState = { ...stateRef.current };
        newState.unavailableCourts = response.data.unavailableCourts;
        setState(newState);
      }
    };

    // Call the initialization and data fetching functions
    initCourts();
    getUnavailableCourts();
    handleQueryReservationsList(1);
  }, []);

  useEffect(() => {
    // Function to fetch reservation data
    const fetchReservationsData = async () => {
      try {
        const jwtToken = localStorage.getItem("jwtToken");
        if (!jwtToken) return;

        const response = await axios.get(
          `/admin/list-reservations?court_no=${state.currCourt}`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          }
        );

        if (response.status === 200) {
          setModalData({ reservations: response.data.data });
        } else {
          console.error("Error fetching reservations data");
        }
      } catch (error) {
        console.error(
          "An error occurred while fetching reservations data",
          error
        );
      }
    };

    // Fetch reservation data initially
    fetchReservationsData();

    // Set up interval to fetch data every 5 seconds
    const intervalId = setInterval(() => {
      fetchReservationsData();
    }, 5000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [state.currCourt]); // Add state.currCourt as a dependency to the dependency array

  // Function to determine reservation status based on datetime
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

  // Function to map reservation data for rendering
  const mapReservationsData = (reservations) => {
    let _reservations = reservations.map((reservation, index) => ({
      ...reservation,
      no: index + 1,
      date: `${formatDdMMyyyy(new Date(reservation.datetime))}`,
      slot: `${formatAmPm(
        new Date(new Date(reservation.datetime).getTime())
      )} - ${formatAmPm(
        new Date(new Date(reservation.datetime).getTime() + 2 * 60 * 60 * 1000)
      )}`,
      court_no: reservation.court_no,
      username: reservation.user_email,
      status: getReservationStatus(reservation.datetime),
      id: reservation._id,
      deleteButton: (
        <div
          className="btn btn-danger btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            Swal.fire({
              title: "Are you sure?",
              text: "Deleting a reservation means the credit won't be refunded to the customer. Are you sure you want to proceed?",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, delete it!",
              cancelButtonText: "No, cancel!",
            }).then((result) => {
              if (result.isConfirmed) {
                handleDeleteReservation(reservation._id);
                setShowDialog(true);
              }
            });
          }}
          disabled={true}
        >
          Delete
        </div>
      ),
    }));

    return _reservations.filter((res) => res.status !== "Expired");
  };

  // Async function to handle deletion of a reservation
  async function handleDeleteReservation(id) {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const response = await axios.delete(`/admin/reservation/${id}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    console.log(response);
    if (response.status === 200) {
      setShowDialog(true);
      handleQueryReservationsList(state.currCourt);
    } else {
      alert("Error Occurred");
    }
  }

  // Async function to fetch reservations data based on court number
  async function handleQueryReservationsList(court_no) {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const response = await axios.get(
      `/admin/list-reservations?court_no=${court_no}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status === 200) {
      setModalData({ reservations: response.data.data });
    } else {
      alert("Error Occurred");
    }
  }

  const handleChangeCourt = (e) => {
    console.log("Button Clicked. Value:", e.target.value);
    const courtNo = parseInt(e.target.value);

    if (!isNaN(courtNo)) {
      console.log("Valid Court Number:", courtNo);
      setState((prevState) => ({
        ...prevState,
        currCourt: courtNo,
      }));
      handleQueryReservationsList(courtNo);
    } else {
      console.error("Invalid court number:", e.target.value);
    }
  };

  //* Render */
  if (state.isLoading) {
    return (
      <>
        <NavigationBar />
        <LoadingBar />
      </>
    );
  }

  // Conditional rendering based on component state
  if (state.badmintonCourtError) {
    return (
      <>
        <NavigationBar />
        <div className="main">
          <span className="text-danger">{state.badmintonCourtError}</span>
        </div>
      </>
    );
  }
  return (
    <>
      <NavigationBar />
      <div className="main">
        <CourtSelector
          className="mb-4"
          onClick={handleChangeCourt}
          courts={state.badmintonCourt.courts}
          currCourt={state.currCourt}
          unavailableCourts={state.unavailableCourts}
        />
        <CourtMapNote className="mb-5" />
        <div style={{ minHeight: 1 }}></div>
        <h6 className="smallHeading">Court {state.currCourt} Reservations</h6>
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
                label: "Username", // Add this column for displaying username
                field: "username",
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
                label: "Action",
                field: "deleteButton",
                width: 150,
                attributes: {},
              },
            ],
            rows: mapReservationsData(modalData.reservations),
          }}
          materialSearch
        />
        <ShowReserveDialog show={showDialog} setShow={setShowDialog} />
      </div>
    </>
  );
}

function CourtMapNote(props) {
  return (
    <div className={props.className}>
      <div className="d-flex align-items-center">
        <div className="court-empty-indicator light-indicator me-1"></div>
        <small className="me-3">Available</small>
        <div className="court-occupied-indicator light-indicator me-1"></div>
        <small className="me-3">Occupied</small>
        <div className="mx-3"></div>
      </div>
    </div>
  );
}

function CourtSelector(props) {
  // Split the courts into two arrays, each containing three courts
  const topCourts = props.courts.slice(0, 3);
  const bottomCourts = props.courts.slice(3, 6);

  return (
    <div className={`text-center ${props.className}`}>
      <h5 className="smallHeading">Current Court Status</h5>
      <div className="d-flex flex-column align-items-center">
        {/* Display the first row of three courts */}
        <div className="d-flex">
          {topCourts.map((court) => (
            <button
              key={court}
              value={court}
              className={`btn ms-5 me-5 mt-5 btn-sm btn-lg btn-court-long ${
                court === props.currCourt ? "btn-court-checked" : "btn-court"
              }`}
              style={{ fontSize: "1.3rem" }}
              onClick={() => props.onClick({ target: { value: court } })}
            >
              <span style={{ display: "block" }}>
                {props.unavailableCourts.filter((un) => un === court).length >
                  0 && (
                  <div className="court-occupied-indicator light-indicator me-2"></div>
                )}
                {props.unavailableCourts.filter((un) => un === court).length ===
                  0 && (
                  <div className="court-empty-indicator light-indicator me-2"></div>
                )}
                <span style={{ textTransform: "capitalize" }}>Court</span>{" "}
                {court}
              </span>
            </button>
          ))}
        </div>

        {/* Display the second row of three courts */}
        <div className="d-flex">
          {bottomCourts.map((court) => (
            <button
              key={court}
              value={court}
              className={`btn ms-5 me-5 mt-5 btn-sm btn-lg btn-court-long ${
                court === props.currCourt ? "btn-court-checked" : "btn-court"
              }`}
              style={{ fontSize: "1.3rem" }}
              onClick={() => props.onClick({ target: { value: court } })}
            >
              <span style={{ display: "block" }}>
                {props.unavailableCourts.filter((un) => un === court).length >
                  0 && (
                  <div className="court-occupied-indicator light-indicator me-2"></div>
                )}
                {props.unavailableCourts.filter((un) => un === court).length ===
                  0 && (
                  <div className="court-empty-indicator light-indicator me-2"></div>
                )}
                <span style={{ textTransform: "capitalize" }}>Court</span>{" "}
                {court}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShowReserveDialog(props) {
  if (props.show === true) {
    return (
      <SweetAlert
        title="Deleted"
        type="success"
        onConfirm={() => {
          props.setShow(false);
        }}
      >
        Reservation has been deleted.
      </SweetAlert>
    );
  }
  return <></>;
}
