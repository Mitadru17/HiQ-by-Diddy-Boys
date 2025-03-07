import React, { useState } from "react";
import { IoReturnUpBack } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import Threads from "../utils/Threads";
import Particles from "../utils/Particles";

function Simulation() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("Beginner");
  const [duration, setDuration] = useState("15 minutes");
  const [focusArea, setFocusArea] = useState("Technical Skills");
  const [selectedScenario, setSelectedScenario] = useState(""); // Scenario as Test Name

  const scenarios = [
    "Technical Interview - Frontend Developer",
    "Behavioral Interview - Team Lead",
    "System Design Discussion",
    "Problem Solving Challenge",
    "Cultural Fit Assessment",
  ];

  const startSimulation = () => {
    if (!selectedScenario) {
      alert("Please select a scenario before starting.");
      return;
    }

    // Navigate to MCQ Test page with selected options
    navigate("/mcq-test", {
      state: { selectedScenario, difficulty, duration, focusArea },
    });
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center text-black p-6">
      <div className="flex p-4 justify-between w-full max-w-3xl">
        <Link to="/dashboard">
          <IoReturnUpBack fontSize={40} className="cursor-pointer" />
        </Link>
        <h1 className="text-[40px] font-bold">Interview Simulation</h1>
        <p></p>
      </div>

      <div className="space-y-6 p-6 w-full max-w-4xl rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Select an Interview Scenario
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Scenarios - User must select one */}
          <div className="bg-gray-700 rounded-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Available Scenarios</h3>
            <div className="space-y-4">
              {scenarios.map((scenario, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedScenario === scenario
                      ? "bg-green-600"
                      : "bg-gray-800 hover:bg-gray-600"
                  }`}
                >
                  {scenario}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Settings */}
          <div className="bg-gray-700 rounded-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Simulation Settings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Difficulty</span>
                <select
                  className="bg-gray-800 rounded-lg px-4 py-2"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span>Duration</span>
                <select
                  className="bg-gray-800 rounded-lg px-4 py-2"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
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
                onClick={startSimulation}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg mt-4"
              >
                Start Simulation
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-screen w-screen -z-10" style={{ width: "100%", position: "absolute" }}>
        <Particles
          particleColors={["#000", "#000"]}
          particleCount={400}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      <Threads amplitude={5} distance={4} enableMouseInteraction={true} />
    </div>
  );
}

export default Simulation;
