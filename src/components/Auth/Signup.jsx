import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DataProvider } from "../../App.jsx";
import checkSession from "../../../utils/session.js";

function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { token, setToken } = useContext(DataProvider);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setErrorMessage(""); // Reset error message on new submission

    try {
      const response = await axios.post(`/auth/signup`, {
        username,
        email,
        pass: password,
      });

      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 2xx
        setErrorMessage(error.response.data);
      } else {
        // Some other error occurred
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center text-black">
      <div className="absolute w-[85%] md:w-[50%] lg:w-[30%] top-[17%] rounded-2xl border border-[#393812] backdrop-blur-[37.60px] bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-b from-[#49d042] to-[#ffb912] opacity-[5%] rounded-2xl"></div>

        <form
          className="relative text-white p-3 lg:p-8 font-inter"
          onSubmit={handleSignup}
        >
          <h1 className="text-2xl lg:text-3xl text-black">Sign Up</h1>
          <p className="font-normal text-gray-600 text-xs md:text-sm">
            Join our UpskillGPT today!
          </p>

          {errorMessage && (
            <p className="text-red-500 text-xs">{errorMessage}</p>
          )}

          <div className="my-5 md:my-8 text-black">
            <p className="font-medium text-sm mb-2">Name</p>
            <div className="w-full border-b flex items-center pb-2 justify-between bg-white rounded-full p-2">
              <input
                className="bg-transparent text-xs lg:text-sm my-2 outline-none w-full font-monst"
                placeholder="Enter Your Name"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <img className="w-4" src="/Logo/account.svg" alt="account icon" />
            </div>
          </div>

          <div className="my-5 md:my-8 text-black">
            <p className="font-medium text-sm mb-2">Email</p>
            <div className="w-full border-b flex items-center pb-2 justify-between bg-white rounded-full p-2">
              <input
                className="bg-transparent text-xs lg:text-sm my-2 outline-none w-full font-monst"
                placeholder="Enter Your Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <img className="w-4" src="/Logo/email.svg" alt="email icon" />
            </div>
          </div>

          <div className="my-5 md:my-8 text-black">
            <p className="font-medium text-sm mb-2">Password</p>
            <div className="w-full border-b flex text-black items-center pb-2 justify-between bg-white rounded-full p-2">
              <input
                className="bg-transparent text-xs lg:text-sm my-2 text-black outline-none w-full font-monst "
                placeholder="Enter your Password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <img
                src={passwordVisible ? "/Logo/pass.svg" : "/Logo/arrowc.svg"}
                alt="Toggle Password Visibility"
                className="cursor-pointer w-4"
                onClick={togglePasswordVisibility}
              />
            </div>
          </div>

          <div className="border border-red-400 rounded-2xl w-full p-1 my-5 lg:my-6">
            <button
              type="submit"
              className="btnGrad p-2 rounded-xl w-full text-gray-900 font-semibold hover:opacity-80 transition-opacity"
            >
              Sign Up
            </button>
          </div>

          <p className="text-xs lg:text-sm w-full flex items-center text-black">
            Already have an account?
            <span
              onClick={() => navigate("/login")}
              className="text-red-500 font-bold ml-1 hover:underline cursor-pointer flex items-center"
            >
              Login
            </span>
            <i className="fa-solid fa-arrow-right -rotate-45 text-red-500 "></i>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
