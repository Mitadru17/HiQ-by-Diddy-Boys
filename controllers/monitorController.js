const detectFaceViolations = require("../services/facedetection");
const detectAudioViolations = require("../services/audioDetection");
const detectScreenViolations = require("../services/screenDetection");

const monitorInterview = async (req, res) => {
    try {
        const faceViolations = await detectFaceViolations();
        const audioViolations = await detectAudioViolations();
        const screenViolations = await detectScreenViolations();

        res.json({
            faceViolations,
            audioViolations,
            screenViolations,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { monitorInterview };
