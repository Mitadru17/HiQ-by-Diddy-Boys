import React from "react";
import PixelCard from "../utils/Pixel";
import Crosshair from "../utils/Crosshair";
import { Link } from "react-router-dom";

function Dashboard() {
  const cards = [
    {
      title: "REALTIME AI INTERVIEW PRACTICE",
      description:
        "Experience AI-driven mock interviews with real-time feedback, helping you prepare for job opportunities more effectively.",
      link: "/dashboard/interview",
    },
    {
        title: "RESUME ANALYSIS",
        description:
          "Get detailed reports on your resume, highlighting areas for improvement and suggestions for better visibility.",
        link: "/dashboard/resume",
      },
    {
      title: "Q/A COACHING",
      description:
        "Get Reatime Answers of Your Questions from Human Like Chat Bot.",
      link: "/dashboard/coaching",
    },
    {
      title: "SIMULATION MODE",
      description:
        "Practice in a simulated interview environment with realistic scenarios and AI-generated questions.",
      link: "/dashboard/simulation",
    },
    {
      title: "REPORTS & ANALYTICS",
      description:
        "Get detailed reports on your performance, strengths, and areas for improvement with AI-powered analytics.",
      link: "/dashboard/reports",
    },
  ];

  return (
    <div className="h-screen w-screen mt-10 p-10">
      <Crosshair color="#000" />
      {/* Dashboard Header */}
      <h1 className="text-5xl font-bold mb-6 text-gray-800">Dashboard</h1>

      {/* Card Grid */}
      <div className="flex gap-6 w-full h-1/2 items-center justify-evenly flex-wrap">
        {cards.map((card, index) => (
          <Link to={card.link} key={index} className="h-full">
            <PixelCard variant="pink">
              <div className="h-full p-6 rounded-lg text-center transform hover:scale-105 transition-transform duration-300">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {card.title}
                </h2>
                <p className="text-gray-600 mt-3 font-dragon">
                  {card.description}
                </p>
              </div>
            </PixelCard>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
