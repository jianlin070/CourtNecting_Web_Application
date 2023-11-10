import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { useHistory } from "react-router-dom";
import { MDBInput } from "mdbreact";
import "../sass/signInForm.scss";

const axios = require("axios");

export default function SignInForm(props) {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Sign In";
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();

    const response = await axios.post(
      "/admin/login",
      {
        username: email,
        password: password,
      },
      {
        validateStatus: function (status) {
          return status < 500;
        },
      }
    );

    if (response.status === 201) {
      setError("");

      localStorage.setItem("jwtToken", response.data.token);
      localStorage.setItem("adminEmail", "admin@gmial.com");
      localStorage.setItem("adminUsername", "admin");

      props.setIsAuthenticated(true);
      history.replace("/");
    } else {
      const data = response.data;
      setError(`*${data.error}`);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center main">
      <div className="card card-body login-card">
        <form className="px-4" onSubmit={handleSignIn}>
          <div>
            <img
              src={logo}
              alt="Logo"
              style={{
                display: "block",
                margin: "auto",
                marginBottom: -15,
                width: 200, 
                height: 200, 
              }}
            />
            <h1
              style={{ fontWeight: "bold", textAlign: "center", fontSize: 38 }}
              className="sign-in-title"
            >
              courtNecting
            </h1>
          </div>
          <div className="mb-4">
            <h4 className="text-center sign-in-title mt-4">Sign in</h4>
          </div>
          <div>
            <div className="form-group mb-3">
              <MDBInput
                label="Username"
                type="text"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <MDBInput
                label="Password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <span className="text-danger">{error}</span>
          <div className="d-flex justify-content-center my-4">
            <button className="btn btn-sign-in col-12">Sign in</button>
          </div>
        </form>
      </div>
    </div>
  );
}
