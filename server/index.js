const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { analyzeResume } = require("./resumeAnalyzer");
const { analyzeQuestion } = require("./questionAnalyzer");
const { connect } = require("./models/conn");
require("dotenv").config();
connect();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    // Create uploads directory if it doesn't exist
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
  storage: storage,
  fileFilter: fileFilter,
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
      // Analyze the resume and get results
      const analysisResults = await analyzeResume(filePath);

      // Clean up - delete the uploaded file after analysis
      fs.unlinkSync(filePath);

      return res.status(200).json(analysisResults);
    } catch (error) {
      // Clean up the file even if analysis fails
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    details: err.message,
  });
});

app.get("/questions", async (req, res) => {
  const { topic } = req.query;

  // Validate topic parameter
  if (!topic) {
    return res.status(400).json({ error: "Topic is required." });
  }

  try {
    // Get the question from analyzeQuestion function
    const questionResult = await analyzeQuestion(topic);

    // If an error occurred while analyzing the question, handle it
    if (questionResult.error) {
      return res.status(500).json(questionResult);
    }

    // Send the question back to the client
    res.json(questionResult );
  } catch (error) {
    console.error("Error fetching question:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the question." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
