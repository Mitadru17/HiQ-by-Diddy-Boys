require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { analyzeResume } = require("./resumeAnalyzer");
const { analyzeQuestion, analyzeInterview } = require("./questionAnalyzer");
const { connect } = require("./models/conn");
const authRouter = require("./routes/auth");
const { Interview } = require("./models/model");
const verifyToken = require("./config/jwtVerify");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to DB
connect();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// ----------- 1) Multer for PDF Resume Uploads (diskStorage) -----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `resume-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Filter function to accept only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

// Resume analysis endpoint
app.post("/analyze-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded or file is not a PDF" });
    }

    const filePath = req.file.path;
    try {
      const analysisResults = await analyzeResume(filePath);
      fs.unlinkSync(filePath); // Clean up uploaded file
      return res.status(200).json(analysisResults);
    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return res.status(500).json({
      error: "Failed to analyze resume",
      details: error.message,
    });
  }
});

// ----------- 2) Questions Endpoint -----------
app.get("/questions", async (req, res) => {
  const { topic } = req.query;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required." });
  }

  try {
    const questionResult = await analyzeQuestion(topic);
    if (questionResult.error) {
      return res.status(500).json(questionResult);
    }
    res.json(questionResult);
  } catch (error) {
    console.error("Error fetching question:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the question." });
  }
});

// ----------- 3) Auth Router -----------
app.use("/auth", authRouter);

// ----------- 4) Multer for Audio Uploads (memoryStorage) -----------
const audioUpload = multer({ storage: multer.memoryStorage() });

// Mock-interview route: receives audio + question
app.post("/mock-interview", verifyToken, audioUpload.single("audio"), async (req, res) => {
  try {
    // 🔹 Retrieve question
    const { question } = req.body;

    if (!req.file || !question) {
      return res.status(400).json({ error: "No audio file uploaded." });
    }

    // Use `req.file.buffer` instead of `fs.createReadStream`
    const audioBuffer = req.file.buffer;

    // Prepare form-data for API
    const formData = new FormData();
    formData.append("file", audioBuffer, {
      filename: req.file.originalname ,
      contentType: req.file.mimetype,
    });

    // API Request Configuration
    const options = {
      method: "POST",
      url: "https://speech-to-text-ai.p.rapidapi.com/transcribe",
      params: { lang: "en", task: "transcribe" },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "speech-to-text-ai.p.rapidapi.com",
        ...formData.getHeaders(),
      },
      data: formData,
    };

    // Send the audio file to the Speech-to-Text API
    const response = await axios.request(options);

    // Extract transcription
    const transcription = response.data.text || "Transcription failed";

    // Analyze the answer based on the question
    const analysis = await analyzeAnswer(question, transcription);
     Interview.create({ email:req.user.email ,question, answerur: transcription, accuracy: analysis.accuracy });
    res.json({
      success: true,
      question,
      transcription,
      analysis,
    });
  } catch (err) {
    console.error("Error in /mock-interview:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ----------- 5) Global Error Handling -----------
app.use((err, req, res, next) => {
  console.error("Error in middleware:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    details: err.message,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Placeholder function for analyzing the answer
async function analyzeAnswer(question, transcription) {
  return await analyzeInterview(question, transcription);
}
