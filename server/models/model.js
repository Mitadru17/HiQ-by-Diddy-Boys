const mongoose = require("mongoose");

// ✅ Resume Schema
const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skills: [String],
  experience: String,
  education: String,
  uploadedAt: { type: Date, default: Date.now },
});
const Resume = mongoose.model("Resume", resumeSchema);

// ✅ Interview Session Schema
const interviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  feedback: { type: mongoose.Schema.Types.ObjectId, ref: "AIFeedback" },
});
const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);

// ✅ AI Feedback Schema
const aiFeedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  interviewSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InterviewSession",
  },
  grammarScore: Number,
  clarityScore: Number,
  confidenceScore: Number,
  feedbackText: String,
  createdAt: { type: Date, default: Date.now },
});
const AIFeedback = mongoose.model("AIFeedback", aiFeedbackSchema);

const interviewSchema = new mongoose.Schema({
  user: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    required: true,
  },
  duration: { type: Number, enum: [15, 30, 45], required: true },
  focusArea: {
    type: String,
    enum: ["Leadership", "Soft Skills", "Technical Skills"],
    required: true,
  },
  questions: [String],
  responses: [String],
  feedback: String,
});

const Interview = mongoose.model("Interview", interviewSchema);

module.exports = {
  connectDB,
  User,
  Resume,
  InterviewSession,
  AIFeedback,
  Interview,
};
