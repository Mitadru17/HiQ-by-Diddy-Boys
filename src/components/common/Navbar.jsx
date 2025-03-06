import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DataProvider } from "../../App";

function Navbar() {
  const { token ,setToken} = useContext(DataProvider);
  const nav = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove the token from localStorage
    setToken(null)
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
            <li>Home</li>
          </Link>
          <li>Features</li>
          <li>Support</li>
        </ul>
        <div>
          {token ? (
            <p
              onClick={handleLogout} // Fixed: Ensure the function is invoked on click
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
