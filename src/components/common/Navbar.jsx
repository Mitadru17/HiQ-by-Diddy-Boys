import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DataProvider } from "../../App";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

// Register GSAP ScrollToPlugin
gsap.registerPlugin(ScrollToPlugin);

function Navbar() {
  const { token, setToken, ischat, setChat } = useContext(DataProvider);
  const nav = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove the token from localStorage
    setToken(null);
  };

  // Function to handle smooth scrolling
  const handleScroll = (targetClass) => {
    gsap.to(window, {
      duration: 1,
      scrollTo: `.${targetClass}`, // Scroll to the section with the given class
      ease: "power2.inOut",
    });
  };

  return (
    <div className="w-screen h-20 flex flex-col justify-between items-center">
      <nav className="w-screen h-20 flex justify-between items-center">
        <img
          src="./Navbar/left.webp"
          className="w-[350px] -translate-x-[8vw]"
          alt="Logo"
        />
        <ul className="flex justify-evenly text-black text-2xl items-center w-[30%] -translate-x-40">
          <Link to={"/"}>
            <li onClick={() => handleScroll("home")}>Home</li>
          </Link>
          <li
            onClick={() => handleScroll("feature")}
            className="cursor-pointer"
          >
            Features
          </li>
          <li
            onClick={() => {
              handleScroll("support"), setChat(!ischat);
            }}
            className="cursor-pointer"
          >
            Support
          </li>
        </ul>
        <div>
          {token ? (
            <p
              onClick={handleLogout}
              className="p-2 border-black border bg-red-500 text-white w-[200px] mr-5 text-center rounded-full cursor-pointer"
            >
              Logout
            </p>
          ) : (
            <Link to={"/login"}>
              <p className="p-2 border-black border bg-red-500 text-white w-[200px] mr-5 text-center rounded-full cursor-pointer">
                Login
              </p>
            </Link>
          )}
        </div>
      </nav>
      <div className="border-b-4 border-black w-1/2"></div>
    </div>
  );
}

export default Navbar;
