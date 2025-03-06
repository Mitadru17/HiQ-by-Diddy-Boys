import React, { useState } from "react";
import { IoReturnDownForward, IoReturnUpBack } from "react-icons/io5";
import Threads from "../utils/Threads";
import axios from "axios";
import { Link } from "react-router-dom";

function Resume() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null); // Store API response

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a valid PDF or DOC file.");
        return;
      }

      setSelectedFile(file);
    }
  };

  // Upload file to API
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      setUploading(true);
      setAnalysisResult(null); // Clear previous results

      // API Call (Replace with your backend API)
      const response = await axios.post(
        "/analyze-resume",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploading(false);
      setAnalysisResult(response.data); // Store API response
    } catch (error) {
      setUploading(false);
      console.error("Error uploading file:", error);
      alert("Failed to upload. Please try again.");
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center text-black p-6">
      {/* Title */}
      <div className="flex p-4 justify-between w-full max-w-3xl">
        <Link to="/dashboard">
          <IoReturnUpBack fontSize={40} className="cursor-pointer" />
        </Link>
        <h1 className="text-[40px] font-bold">Resume Analysis</h1>
        <p></p>
      </div>

      {/* Upload Box */}
      <div className="border-black border-2 w-[500px] p-6 rounded-lg text-center shadow-lg bg-white flex flex-col justify-center items-center">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="w-full mb-4 border p-2 rounded-md cursor-pointer"
        />

        {/* Show selected file name */}
        {selectedFile && (
          <p className="text-gray-700 mt-2 font-semibold">
            Uploaded File: {selectedFile.name}
          </p>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`flex w-[250px] h-[50px] flex-col ${
            uploading ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
          } text-white p-1 rounded-full border-black border-2 items-center transition-all duration-300`}
        >
          {uploading ? "Uploading..." : "Upload Resume"}
          <IoReturnDownForward fontSize={20} />
        </button>
      </div>

      {/* Resume Analysis Report */}
      {analysisResult && (
        <div className="mt-10 w-[600px] p-6 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            Resume Analysis Report
          </h2>

          {/* Resume Score */}
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-gray-700">
              Resume Score:{" "}
              <span className="text-blue-500 text-2xl">
                {analysisResult.score}/100
              </span>
            </p>
          </div>

          {/* Strengths */}
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-green-600">
              Strengths ✅
            </h3>
            <ul className="list-disc list-inside text-gray-700">
              {analysisResult.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-red-600">
              Weaknesses ❌
            </h3>
            <ul className="list-disc list-inside text-gray-700">
              {analysisResult.weaknesses.map((weakness, index) => (
                <li key={index}>{weakness}</li>
              ))}
            </ul>
          </div>

          {/* Suggested Improvements */}
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-yellow-600">
              Improvements ✍️
            </h3>
            <ul className="list-disc list-inside text-gray-700">
              {analysisResult.improvements.map((improve, index) => (
                <li key={index}>{improve}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Threads amplitude={2} distance={1} enableMouseInteraction={true} />
    </div>
  );
}

export default Resume;
