import React, { useState } from "react";
import { IoReturnUpBack } from "react-icons/io5";
import { Link } from "react-router-dom";
import Threads from "../utils/Threads";

function Simulation() {
  // State to store user-selected options
  const [difficulty, setDifficulty] = useState("Beginner");
  const [duration, setDuration] = useState("15 minutes");
  const [focusArea, setFocusArea] = useState("Technical Skills");

  return (
    <div className="w-screen h-screen flex flex-col  items-center text-black p-6 ">
      {/* Header Section */}
      <div className="flex p-4 justify-between w-full max-w-3xl">
        <Link to="/dashboard">
          <IoReturnUpBack fontSize={40} className="cursor-pointer" />
        </Link>
        <h1 className="text-[40px] font-bold">Interview Simulation</h1>
        <p></p>
      </div>

      {/* Simulation Container */}
      <div className="space-y-6 p-6 w-full max-w-4xl rounded-lg">
        {/* Title */}
        <h2 className="text-2xl font-bold mb-4 text-center">Select an Interview Scenario</h2>

        {/* Grid Layout for Scenarios & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-monst">
          {/* Available Scenarios */}
          <div className="bg-gray-700 rounded-lg p-6 text-white font-monst">
            <h3 className="text-xl font-bold mb-4">Available Scenarios</h3>
            <div className="space-y-4 font-monst">
              {[
                "Technical Interview - Frontend Developer",
                "Behavioral Interview - Team Lead",
                "System Design Discussion",
                "Problem Solving Challenge",
                "Cultural Fit Assessment",
              ].map((scenario, index) => (
                <button
                  key={index}
                  className="w-full text-left p-4 rounded-lg bg-gray-800 hover:bg-gray-600 transition-colors"
                >
                  {scenario}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Settings */}
          <div className="bg-gray-700 rounded-lg p-6 text-white font-monst">
            <h3 className="text-xl font-bold mb-4">Simulation Settings</h3>
            <div className="space-y-4 font-monst">
              {/* Difficulty Selection */}
              <div className="flex justify-between items-center font-monst">
                <span>Difficulty</span>
                <select
                  className="bg-gray-800 rounded-lg px-4 py-2 font-monst"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              {/* Duration Selection */}
              <div className="flex justify-between items-center font-monst">
                <span>Duration</span>
                <select
                  className="bg-gray-800 rounded-lg px-4 py-2"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                </select>
              </div>

              {/* Focus Area Selection */}
              <div className="flex justify-between items-center font-monst">
                <span>Focus Areas</span>
                <select
                  className="bg-gray-800 rounded-lg px-4 py-2"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                >
                  <option>Technical Skills</option>
                  <option>Soft Skills</option>
                  <option>Leadership</option>
                </select>
              </div>

              {/* Start Simulation Button */}
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg mt-4"
              >
                Start Simulation
              </button>
            </div>
          </div>
        </div>
      </div>
      <Threads amplitude={5} distance={4} enableMouseInteraction={true} />
    </div>
  );
}

export default Simulation;
