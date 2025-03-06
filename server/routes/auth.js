const verifyToken = require("../config/jwtVerify");
const {
  handleLogin,
  handleSignup,
  handleVerify,
  handleUserData,
} = require("../controllers/authCont");

const Router = require("express").Router();
Router.post("/login", handleLogin);
Router.post("/signup", handleSignup);
Router.get("/verify-user", verifyToken, handleVerify);
Router.get("/user-data", verifyToken, handleUserData);

module.exports = Router;
