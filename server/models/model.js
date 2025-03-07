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
  email: { type: String, required: true },
  questions: [String],
  answerur: [String],
  accuracy: String,
});

const Interview = mongoose.model("Interview", interviewSchema);

const simulationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  tests: [
    {
      testName: { type: String, required: true },
      questions: [
        {
          questionText: { type: String, required: true },
          userAnswer: { type: String, required: true },
          correctAnswer: { type: String, required: true },
          isCorrect: { type: Boolean, required: true },
        },
      ],
    },
  ],
});

const Simulation = mongoose.model("Simulation", simulationSchema);

module.exports = {
  Resume,
  InterviewSession,
  AIFeedback,
  Interview,
  Simulation,
};
