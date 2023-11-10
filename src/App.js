import SignInForm from "./components/signInForm";
import Dashboard from "./components/dashboard";
import BadmintonCourt from "./components/badmintonCourt";
import UserListing from "./components/userListing";
import PrivateRoute from "./privateRoute";
import LoadingBar from "./components/loadingBar";

import {
  BrowserRouter as Router,
  Switch,
  Redirect,
  Route,
} from "react-router-dom";

import { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import "./sass/app.scss";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setisLoading] = useState(true);

  useEffect(() => {
    const axios = require("axios");
    const checkIsAuthenticated = async () => {
      try {
        const refreshToken = localStorage.getItem("jwtToken");
        console.log(refreshToken);
        const response = await axios.get(
          "/admin/list-users",
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
          {
            validateStatus: () => true,
          }
        );

        if (response.status === 200) {
          localStorage.setItem("jwtToken", refreshToken);
          setIsAuthenticated(true);
        }
        setisLoading(false);
      } catch (error) {
        setisLoading(false);
        setIsAuthenticated(false);
      }
    };
    checkIsAuthenticated();
  }, []);

  return isLoading ? (
    <LoadingBar />
  ) : (
    <Router>
      <Switch>
        <Redirect from="/" to="/dashboard" exact={true} />
        <Route
          path="/signIn"
          exact={true}
          render={(props) =>
            isAuthenticated ? (
              <Redirect to="/dashboard" />
            ) : (
              <SignInForm setIsAuthenticated={setIsAuthenticated}></SignInForm>
            )
          }
        />
        <PrivateRoute
          authed={isAuthenticated}
          exact={true}
          path="/dashboard"
          component={Dashboard}
        />
        <PrivateRoute
          authed={isAuthenticated}
          exact={true}
          path="/badmintonCourt"
          component={BadmintonCourt}
        />
        <PrivateRoute
          authed={isAuthenticated}
          exact={true}
          path="/userListing"
          component={UserListing}
        />
      </Switch>
    </Router>
  );
}

export default App;
