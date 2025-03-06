import React from "react";
import { IoReturnUpBack } from "react-icons/io5";
import { Link } from "react-router-dom";

function Interview() {
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center text-black p-6">
      <div className="flex p-4 justify-between w-full max-w-3xl">
        <Link to="/dashboard">
          <IoReturnUpBack fontSize={40} className="cursor-pointer" />
        </Link>
        <h1 className="text-[40px] font-bold text-center">Realtime Interview Practice </h1>
        <p></p>
      </div>
      <div>
        
      </div>
  
    </div>
  );
}

export default Interview;
