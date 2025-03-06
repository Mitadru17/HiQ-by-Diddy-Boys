import React from "react";
import { IoReturnDownForward } from "react-icons/io5";
import Waves from "../utils/Waves";
import Next1 from "./Next1";
import Next2 from "./Next2";

function Main() {
  return (
    <>
    <div className="relative w-screen h-[88vh] p-4">
      {/* Waves Component (background) */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <Waves
          lineColor="#000"
          backgroundColor="rgba(255, 255, 255, 0.2)"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      </div>

      {/* Main Content */}
      <div className="relative flex justify-between items-center w-full h-full z-10 border-b-black bottom-4">
        <div className="w-1/2 h-full flex flex-col justify-between items-center">
          <h1 className="text-[60px] font-bold text-black font-sans">[HiQ]</h1>
          {/* <img src="./Navbar/logo.webp" className="w-[200px]" alt="" /> */}
          <p className="text-[100px] font-bold font-valorax">
            AI Powered MOCK TEST
          </p>

          <button className="flex w-[250px] flex-col bg-red-500 text-white p-1 rounded-full border-black border-2 items-center">
            Take Test
            <IoReturnDownForward fontSize={35} />
          </button>
        </div>
        <div>
          <img src="./Navbar/infinity.png" className="w-[800px]" alt="" />
        </div>
      </div>
    </div>
    <Next1/>
    <Next2/>
    </>
    
  );
}

export default Main;
