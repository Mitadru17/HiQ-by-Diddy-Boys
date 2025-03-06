const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeResume } = require('./resumeAnalyzer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for memory storage (not disk storage which won't work on serverless)
const storage = multer.memoryStorage();

// Filter function to accept only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max file size
});

// Resume analysis endpoint
app.post('/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file is not a PDF' });
    }

    // Since we're using memory storage, file data is in buffer, not on disk
    const fileBuffer = req.file.buffer;
    
    try {
      // Analyze the resume and get results with buffer directly
      const analysisResults = await analyzeResume(fileBuffer);
      
      return res.status(200).json(analysisResults);
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze resume', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    details: err.message 
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Resume analysis endpoint: http://localhost:${PORT}/analyze-resume`);
  });
}

// Export for Vercel
module.exports = app; 