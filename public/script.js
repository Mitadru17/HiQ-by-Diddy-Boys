async function startWebcam() {
    const video = document.getElementById("video");

    try {
        // Ask for camera permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            video.play();
        };
    } catch (err) {
        console.error("Error accessing webcam:", err);
    }
}

// Load models and start webcam
async function startApp() {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

    startWebcam();  // Start webcam after models load
}

// Run when page loads
window.onload = startApp;
