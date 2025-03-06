import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="w-screen h-20 flex flex-col justify-between items-center">
      <nav className="w-screen h-20 flex justify-between items-center">
        <img
          src="./Navbar/left.webp"
          className="w-[350px] -translate-x-[8vw]"
          alt=""
        />
        <ul className="flex justify-evenly text-black text-2xl items-center w-[30%] -translate-x-40">
          <Link to={"/"}>
            <li>Home</li>
          </Link>
          <li>Features</li>
          <li>Support</li>
        </ul>
        <p></p>
       
      </nav>
      <div className=" border-b-4 border-black w-1/2"></div>
    </div>
  );
}

export default Navbar;
// https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vecteezy.com%2Ffree-photos%2Finfinite-loop%3Fpage%3D5&psig=AOvVaw0Uv31nnKqsloO-tVGFXkQ2&ust=1741331958544000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCIjoiZv19IsDFQAAAAAdAAAAABAJ
