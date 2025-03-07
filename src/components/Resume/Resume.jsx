import React, { useState } from "react";
import { IoReturnDownForward, IoReturnUpBack } from "react-icons/io5";
import Threads from "../utils/Threads";
import axios from "axios";
import { Link } from "react-router-dom";

function Resume() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null); // Store API response
  const [suggestedCompanies, setSuggestedCompanies] = useState([]);
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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

  // Function to get company suggestions from Gemini
  const getCompanySuggestions = async (resumeData) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Based on the following resume analysis, suggest 5 suitable companies where this candidate should apply. Consider the missing keywords as areas for growth. Resume Analysis: ${JSON.stringify(
                      resumeData
                    )}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get company suggestions");
      }

      const data = await response.json();
      const suggestions = data.candidates[0].content.parts[0].text
        .split("\n")
        .filter((line) => line.trim())
        .slice(0, 5);
      setSuggestedCompanies(suggestions);
    } catch (error) {
      console.error("Error getting company suggestions:", error);
      setSuggestedCompanies([
        "Unable to generate company suggestions at this time.",
      ]);
    }
  };

  // Modify handleUpload to include company suggestions
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      setUploading(true);
      setAnalysisResult(null);

      const response = await axios.post("/analyze-resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setAnalysisResult(response.data);
      // Get company suggestions after resume analysis
      await getCompanySuggestions(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload. Please try again.");
    } finally {
      setUploading(false);
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

      {/* Resume Analysis Report (4 Cards) */}
      {analysisResult && (
        <div className="mt-40 flex justify-center items-start gap-10 w-full max-w-[90%] mx-auto flex-wrap">
          {/* Card 2: Improvements - Left Side */}
          <div className="w-[40%] p-8 bg-gray-100 border border-gray-300 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-95 hover:shadow-xl">
            <h2 className="text-xl font-bold text-yellow-600">Improvements ✍️</h2>
            <ul className="list-disc list-inside text-gray-700 mt-4">
              {analysisResult.improvements.map((improve, index) => (
                <li className="font-monst font-bold mb-2" key={index}>{improve}</li>
              ))}
            </ul>
          </div>

          {/* Card 1: Score & Progress - Center */}
          <div className="w-[220px] h-[220px] p-6 bg-gray-100 border border-gray-300 shadow-lg text-center rounded-full overflow-hidden flex flex-col justify-center items-center transform transition-all duration-300 hover:scale-95 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-800">Resume Score</h2>
            <p className="font-monst font-bold text-3xl text-gray-700 mt-2">
              {analysisResult.score}/100
            </p>
            <div className="w-[80%] bg-gray-300 rounded-full h-4 mt-3">
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

          {/* Card 3: Grammar & Missing Keywords - Right Side */}
          <div className="w-[40%] p-8 bg-gray-100 border border-gray-300 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-95 hover:shadow-xl">
            <h2 className="text-xl font-bold text-red-500">Grammar Issues ❌</h2>
            {analysisResult.grammar_issues.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700 mt-4">
                {analysisResult.grammar_issues.map((issue, index) => (
                  <li className="font-monst font-bold mb-2" key={index}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No grammar issues found 🎉</p>
            )}

            <h2 className="text-xl font-bold text-purple-600 mt-6">
              Missing Keywords 🔍
            </h2>
            {analysisResult.missing_keywords.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700 mt-4">
                {analysisResult.missing_keywords.map((keyword, index) => (
                  <li className="font-monst font-bold mb-2" key={index}>{keyword}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No missing keywords detected ✅</p>
            )}
          </div>

          {/* Card 4: Suggested Companies */}
          <div className="w-[40%] p-8 bg-gray-100 border border-gray-300 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-95 hover:shadow-xl mt-6">
            <h2 className="text-xl font-bold text-blue-600">Suggested Companies 🎯</h2>
            <ul className="list-disc list-inside text-gray-700 mt-4">
              {suggestedCompanies.map((company, index) => (
                <li className="font-monst font-bold mb-2" key={index}>{company}</li>
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
