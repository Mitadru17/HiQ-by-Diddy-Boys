import React, { useState, useRef, useEffect } from "react";
import { IoReturnUpBack, IoPlay, IoStop, IoSend } from "react-icons/io5";
import { Link } from "react-router-dom";
import axios from "axios";

function Interview() {
  const [step, setStep] = useState(1);
  const [selectedInterview, setSelectedInterview] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [question, setQuestion] = useState("");
  const videoRef = useRef(null);
  const chunks = useRef([]);
  const intervalRef = useRef(null);
  const questionCount = useRef(0);
  const maxQuestions = 20; // 10 minutes (20 questions of 30s each)

  const interviewOptions = [
    "Technical Interview - Frontend Developer",
    "Behavioral Interview - Team Lead",
    "System Design Discussion",
    "Problem Solving Challenge",
    "Cultural Fit Assessment",
  ];

  // **Step 1: Select Interview Type**
  const handleSelectInterview = (type) => {
    setSelectedInterview(type);
    setStep(2);
  };

  // **Step 2: Start Testing Video & Audio**
  const startTesting = async () => {
    try {
      // ✅ Enumerate devices to get available video input devices (cameras)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Find front camera (if available) or fallback to the first available camera
      const frontCamera = videoDevices.find(device => device.label.toLowerCase().includes('front')) || videoDevices[0];
  
      // Define constraints based on the camera deviceId
      const constraints = {
        video: {
          deviceId: frontCamera.deviceId,
          facingMode: 'user', // Ensure front camera is used
        },
        audio: true,
      };
  
      // Request media stream
      const userStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(userStream);
      setIsTesting(true);
  
      // ✅ Assign video stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
      }
  
      console.log(userStream.getVideoTracks());
    } catch (error) {
      console.error("❌ Error accessing camera/microphone:", error);
      alert("❌ Please allow camera and microphone access to proceed.");
    }
  };
  

  // **Step 3: Start Interview Loop**
  const startInterview = () => {
    setStep(3);
    fetchQuestion();
    intervalRef.current = setInterval(() => {
      if (questionCount.current < maxQuestions) {
        fetchQuestion();
      } else {
        clearInterval(intervalRef.current);
        setStep(4); // Move to submit stage
      }
    }, 30000);
  };

  // **Fetch a question from API**
  const fetchQuestion = async () => {
    try {
      const response = await axios.get("https://your-api-endpoint.com/get-question");
      setQuestion(response.data.question);
      startRecording();
    } catch (error) {
      console.error("❌ Error fetching question:", error);
      setQuestion("⚠️ Error fetching question. Please try again.");
    }
  };

  // **Start Recording**
  const startRecording = () => {
    if (!stream) {
      alert("❌ Please test your camera and microphone first.");
      return;
    }

    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    setIsRecording(true);
    chunks.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      sendAudioToAPI(blob);
      questionCount.current += 1;
    };

    recorder.start();

    // Stop recording after 30 seconds
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
        setIsRecording(false);
      }
    }, 30000);
  };

  // **Send Audio to API**
  const sendAudioToAPI = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "response.webm");

    try {
      await axios.post("https://your-api-endpoint.com/upload-audio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("❌ Error uploading audio:", error);
    }
  };

  // **Stop Interview (if user wants to quit)**
  const stopInterview = () => {
    clearInterval(intervalRef.current);
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStep(4);
  };

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center text-black p-6">
      {/* Header */}
      <div className="flex p-4 justify-between w-full max-w-3xl">
        <Link to="/dashboard">
          <IoReturnUpBack fontSize={40} className="cursor-pointer" />
        </Link>
        <h1 className="text-[40px] font-bold text-center">Realtime Interview Practice</h1>
        <p></p>
      </div>

      {/* Step 1: Select Interview Type */}
      {step === 1 && (
        <div className="mt-6 w-full max-w-3xl">
          <h2 className="text-xl font-bold text-center mb-4">Choose an Interview Type</h2>
          <div className="space-y-4">
            {interviewOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectInterview(option)}
                className="w-full text-left p-4 rounded-lg bg-gray-800 text-white hover:bg-gray-600 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Test Audio & Video */}
      {step === 2 && (
        <div className="mt-6 flex flex-col items-center space-y-4">
          <p className="text-lg font-semibold">Interview Type: {selectedInterview}</p>
          {!isTesting ? (
            <button
              onClick={startTesting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
            >
              Test Audio & Video
            </button>
          ) : (
            <>
              {/* ✅ Fix for Black Screen */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-[400px] h-[300px] bg-black rounded-lg shadow-md"
              />
              <button
                onClick={startInterview}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
              >
                Start Interview
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3: Interview Session */}
      {step === 3 && (
        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold">Interview Question {questionCount.current + 1} / {maxQuestions}</h2>
          <p className="text-lg mt-4">{question}</p>
          <button onClick={stopInterview} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg mt-4">
            Stop Interview
          </button>
        </div>
      )}
    </div>
  );
}

export default Interview;  