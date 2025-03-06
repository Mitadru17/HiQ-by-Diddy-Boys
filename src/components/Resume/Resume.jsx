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
      const response = await axios.post("/analyze-resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

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

      {/* Upload Box (Hidden when Response is Shown) */}
      {!analysisResult && (
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
      )}

      {/* Resume Analysis Report (3 Cards) */}
      {analysisResult && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl h-[50vh] ">
          {/* Card 1: Score & Progress */}
          <div className="p-6 bg-gray-100 border border-gray-300 w-[10vw] shadow-lg text-center  h-[20vh] rounded-full overflow-hidden" >
            <h2 className="text-sm font-bold text-gray-800 mt-5">Resume Score</h2>
            <p className="text-xl font-semibold text-gray-700 mt-2">
              {analysisResult.score}/100
            </p>
            <div className="w-full bg-gray-300 rounded-full h-4 mt-2 ">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${analysisResult.score}%`,
                  backgroundColor:
                    analysisResult.score > 80
                      ? "#22c55e"
                      : analysisResult.score > 50
                      ? "#facc15"
                      : "#ef4444",
                }}
              ></div>
            </div>
          </div>

          {/* Card 2: Improvements */}
          <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg shadow-lg h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-yellow-600">Improvements ✍️</h2>
            <ul className="list-disc list-inside text-gray-700 mt-2">
              {analysisResult.improvements.map((improve, index) => (
                <li className=" font-monst font-bold" key={index}>{improve}</li>
              ))}
            </ul>
          </div>

          {/* Card 3: Grammar & Missing Keywords */}
          <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg shadow-lg h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-red-500">Grammar Issues ❌</h2>
            {analysisResult.grammar_issues.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700 mt-2">
                {analysisResult.grammar_issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No grammar issues found 🎉</p>
            )}

            <h2 className="text-xl font-bold text-purple-600 mt-4">
              Missing Keywords 🔍
            </h2>
            {analysisResult.missing_keywords.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700 mt-2 h-[80vh] overflow-y-auto">
                {analysisResult.missing_keywords.map((keyword, index) => (
                  <li key={index}>{keyword}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No missing keywords detected ✅</p>
            )}
          </div>
        </div>
      )}

      <Threads amplitude={2} distance={1} enableMouseInteraction={true} />
    </div>
  );
}

export default Resume;
