import React, { useState, useRef, useEffect, useContext } from "react";
import { IoReturnUpBack, IoMic } from "react-icons/io5";
import { Link } from "react-router-dom";
import axios from "axios";
import LipSyncTracking from "../utils/LipSync";
import { DataProvider } from "../../App";

function Interview() {
    const [step, setStep] = useState(1);
    const [selectedInterview, setSelectedInterview] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0); // volume meter
    const [question, setQuestion] = useState("");
    const {token} = useContext(DataProvider)
  
    const [stream, setStream] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const chunks = useRef([]);
    const intervalRef = useRef(null);
    const questionCount = useRef(0);
    const maxQuestions = 20; // 10 minutes (20 questions @30s each)
  
    const interviewOptions = [
      "Technical Interview - Frontend Developer",
      "Behavioral Interview - Team Lead",
      "System Design Discussion",
      "Problem Solving Challenge",
      "Cultural Fit Assessment",
    ];
  
    // Step 1: Select Interview Type
    const handleSelectInterview = (type) => {
      setSelectedInterview(type);
      setStep(2);
    };
  
    // Step 2: Start Testing Video & Audio
    const startTesting = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);
        setIsTesting(true);
        initAudioMeter(userStream);
      } catch (error) {
        console.error("Error accessing camera/microphone:", error);
        alert("Please allow camera and microphone access to proceed.");
      }
    };
  
    // Audio meter
    const initAudioMeter = (userStream) => {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(userStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
  
      const dataArray = new Uint8Array(analyser.fftSize);
      source.connect(analyser);
  
      const updateVolume = () => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128.0;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const level = Math.min(rms * 100, 100);
        setAudioLevel(level);
        requestAnimationFrame(updateVolume);
      };
      updateVolume();
    };
  
    // Step 3: Start Interview Loop
    const startInterview = () => {
      setStep(3);
      fetchQuestion();
  
      // Fetch new question every 30s
      intervalRef.current = setInterval(() => {
        if (questionCount.current < maxQuestions) {
          fetchQuestion();
        } else {
          clearInterval(intervalRef.current);
          setStep(4);
        }
      }, 10000);
    };
  
    // Fetch question
    const fetchQuestion = async () => {
      try {
        const response = await axios.get(`/questions?topic=${selectedInterview}`);
        console.log("🟢 Question Fetched:", response.data.question);
  
        setQuestion(response.data.question); // Update question
  
        // Ensure question is updated before recording
        setTimeout(() => {
          console.log("🎤 Starting recording for:", response.data.question);
          startRecording(response.data.question);
        }, 500);
      } catch (error) {
        console.error("🔴 Error fetching question:", error);
        setQuestion("Error fetching question. Please try again.");
      }
    };
  
    // Start Audio-Only Recording
    const startRecording = (currentQuestion) => {
      if (!stream) {
        alert("Please test your camera & microphone first.");
        return;
      }
  
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        alert("No audio track found. Check your mic.");
        return;
      }
  
      const audioStream = new MediaStream([audioTrack]);
      const recorder = new MediaRecorder(audioStream);
      setMediaRecorder(recorder);
      setIsRecording(true);
      chunks.current = [];
  
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
  
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        questionCount.current += 1;
        sendAudioToAPI(blob, currentQuestion);
      };
  
      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setIsRecording(false);
        }
      }, 10000);
    };
  
    // Upload audio
    const sendAudioToAPI = async (audioBlob, currentQuestion) => {
      if (!currentQuestion) {
        console.warn("⚠️ Warning: `question` is empty! Ensure it's set before sending.");
        return;
      }
  
      const formData = new FormData();
      formData.append("audio", audioBlob, "response.webm");
      formData.append("question", currentQuestion);
  
      console.log("📤 Sending to backend:", currentQuestion);
  
      try {
        const response = await axios.post("/mock-interview", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${token}`  // Add Bearer Token here
              },

        });
  
        console.log("✅ Server response:", response.data);
      } catch (error) {
        console.error("❌ Error uploading audio:", error);
      }
    };
  
    // Stop Interview
    const stopInterview = () => {
      clearInterval(intervalRef.current);
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
      setStep(4);
    };

  return (
    <div className="flex w-screen h-screen items-center mt-10 justify-center overflow-hidden">
      {/* LEFT COLUMN: Show camera feed only if step >=2 and step <4 */}
      {step >= 2 && step < 4 && (
        <div className="w-1/2 h-full border-r border-gray-200">
          <div className="w-full h-full flex items-center justify-center">
            <LipSyncTracking />
          </div>
        </div>
      )}

      {/* RIGHT COLUMN: Steps & Controls */}
      <div className="w-1/2 h-full flex flex-col p-4 items-center justify-start overflow-auto">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-2">
          <Link to="/dashboard">
            <IoReturnUpBack fontSize={36} className="cursor-pointer" />
          </Link>
          <h1 className="text-2xl font-bold">Interview Practice</h1>
          <div style={{ width: 36, height: 36 }} />
        </div>

        {/* Step 1: Select Interview Type */}
        {step === 1 && (
          <div className="w-full flex flex-col items-center">
            <h2 className="text-lg font-bold mb-4">Choose an Interview Type</h2>
            <div className="space-y-3 w-full">
              {interviewOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectInterview(option)}
                  className="w-full text-left p-3 rounded-md bg-gray-800 text-white hover:bg-gray-600 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Steps 2 & 3: Testing / Interview in Progress */}
        {(step === 2 || step === 3) && (
          <div className="w-full flex flex-col items-center mt-4">
            {/* Interview type display (only step 2) */}
            {step === 2 && (
              <p className="text-base font-semibold mb-2">
                Interview Type: <span>{selectedInterview}</span>
              </p>
            )}

            {/* Microphone + Audio Level */}
            <div className="flex items-center space-x-2 mb-2">
              <IoMic
                size={25}
                color={isRecording ? "red" : "green"}
                style={{ marginRight: "4px" }}
              />
              <span>
                {isRecording
                  ? "Recording..."
                  : step === 2
                  ? "Mic Active (Testing)"
                  : "Mic On (Interview)"}
              </span>
            </div>

            {/* Audio Level Bar */}
            <div className="w-[150px] h-[10px] bg-gray-300 overflow-hidden">
              <div
                style={{
                  width: `${audioLevel}%`,
                  height: "100%",
                  background: "green",
                  transition: "width 0.1s",
                }}
              />
            </div>

            {/* Step 2 Buttons */}
            {step === 2 && !isTesting && (
              <button
                onClick={startTesting}
                className="bg-blue-500 text-white px-5 py-2 rounded-md font-medium mt-3 hover:bg-blue-600"
              >
                Test Audio &amp; Video
              </button>
            )}
            {step === 2 && isTesting && (
              <button
                onClick={startInterview}
                className="bg-green-500 text-white px-5 py-2 rounded-md font-medium mt-3 hover:bg-green-600"
              >
                Start Interview
              </button>
            )}

            {/* Step 3: Ongoing Interview */}
            {step === 3 && (
              <div className="flex flex-col items-center mt-4 space-y-3">
                <h2 className="text-lg font-bold">
                  Question {questionCount.current + 1} / {maxQuestions}
                </h2>
                <p className="text-center text-3xl font-bold font-monst p-4 border-2 border-black">
                  {question}
                </p>
                <button
                  onClick={stopInterview}
                  className="bg-red-500 text-white px-5 py-2 rounded-md font-medium hover:bg-red-600"
                >
                  Stop Interview
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Interview Complete */}
        {step === 4 && (
          <div className="mt-4 flex flex-col items-center">
            <h2 className="text-xl font-bold">Interview Complete</h2>
            <p className="text-base text-gray-700 mt-2">
              You can now review your audio or proceed to the next step.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;
