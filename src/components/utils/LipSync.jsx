import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { toast } from "react-toastify";

export default function LipSync() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  useEffect(() => {
    async function loadModels() {
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      setModelsLoaded(true);
    }
    loadModels();
  }, []);

  // Start video once models are loaded
  useEffect(() => {
    if (!modelsLoaded) return;

    let streamRef;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        streamRef = stream;
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Error accessing webcam:", err));

    // Cleanup function – stops the stream, clears video, and reloads after 3s
    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      // Delay reload by 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };
  }, [modelsLoaded]);

  // Detection loop
  useEffect(() => {
    let intervalId;

    const detectFaces = async () => {
      if (!modelsLoaded || !videoRef.current) return;

      const results = await faceapi
        .detectAllFaces(videoRef.current)
        .withFaceLandmarks();

      if (results.length === 0) {
        toast.error("No face detected. Please face the camera.");
      } else if (results.length === 1) {
        const detection = results[0].detection;
        console.log("Face confidence:", detection.score);
        if (detection.score < 0.5) {
          toast.warn("Face confidence is too low! Please position yourself clearly.");
        }
      } else {
        toast.error("Multiple persons detected! Only one person is allowed.");
      }
    };

    if (modelsLoaded) {
      intervalId = setInterval(detectFaces, 1000);
    }

    return () => clearInterval(intervalId);
  }, [modelsLoaded]);

  return (
    <div className="w-screen h-screen relative flex flex-col items-center justify-center">
      <div
        className="w-1/2 h-screen flex justify-center items-center"
        style={{ position: "relative" }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
          width="320"
          height="320"
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
          width="320"
          height="320"
        />
      </div>
    </div>
  );
}
