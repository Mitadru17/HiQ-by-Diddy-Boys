import React from "react";
import Threads from "../utils/Threads";

function Next2() {
  return (
    <div className="border-b-4 border-black p-4">
      <h1 className="text-[60px]">Live Ai Powered Chat Support</h1>
      <div style={{ width: "100%", height: "500px", position: "relative" }}>
        {/* AI Image */}
        <img
          className="absolute z-10"
          src="./Next/ai.png"
          width={500}
          alt="AI Illustration"
        />

        {/* AI Description */}
        <p className="absolute z-20 left-[520px] top-[50px] text-4xl font-bold text-gray-800">
          AI-Powered Conversations
        </p>

        <p className="absolute z-20 left-[520px] top-[100px] text-lg text-gray-600 max-w-xl font-dragon">
          Experience the next-generation AI chatbot, powered by cutting-edge
          natural language processing. Engage in human-like conversations,
          get instant answers, and explore limitless creativity with ChatGPT.
        </p>

        {/* Key Features */}
        <ul className="absolute z-20 left-[520px] top-[300px] text-3xl text-gray-700 ">
          <li className="font-dragon">✅ Intelligent Responses</li>
          <li className="font-dragon">✅ Context-Aware Conversations</li>
          <li className="font-dragon">✅ Creative Writing Assistance</li>
          <li className="font-dragon">✅ Instant Problem Solving</li>
        </ul>

        {/* Interactive Threads Animation */}
        <Threads amplitude={2} distance={1} enableMouseInteraction={true} />
      </div>
    </div>
  );
}

export default Next2;
