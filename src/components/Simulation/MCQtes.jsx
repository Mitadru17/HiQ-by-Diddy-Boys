import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function MCQTest() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedScenario, difficulty, duration, focusArea } =
    location.state || {};

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Check if testName exists, else redirect
  useEffect(() => {
    if (!selectedScenario) {
      console.warn("❌ Test name is missing, redirecting...");
      navigate("/dashboard/simulation"); // Redirect to Simulation if testName is missing
      return;
    }
    fetchQuestions();
  }, [selectedScenario]);

  // Fetch questions from Gemini API
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const input = `Generate ${duration} multiple-choice questions for a ${difficulty} level ${selectedScenario} test focused on ${focusArea}. Provide each question with four answer choices and mark the correct answer. Format output as a JSON array: [{ "questionText": "Q1", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: input }] }],
          }),
        }
      );

      const data = await response.json();
      console.log("🟢 Raw Gemini Response:", data);

      // Extract JSON string inside the response text
      let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      responseText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // Parse the cleaned JSON string
      const parsedQuestions = JSON.parse(responseText);
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error("🔴 Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    const updatedAnswers = [
      ...selectedAnswers,
      {
        questionText: currentQuestion.questionText,
        correctAnswer: currentQuestion.correctAnswer,
        userAnswer: answer,
        isCorrect,
      },
    ];

    setSelectedAnswers(updatedAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitTest(updatedAnswers);
    }
  };

  // Submit test results
  const submitTest = async (testData) => {
    try {
      await axios.post(
        "/simulate/test-sub",
        {
          testName: selectedScenario,
          questions: testData,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      navigate("/dashboard/reports", { state: { testData } });
    } catch (error) {
      console.error("❌ Error submitting test:", error);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      {loading ? (
        <p>Loading questions...</p>
      ) : questions.length > 0 && currentIndex < questions.length ? (
        <div className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            Question {currentIndex + 1} / {questions.length}
          </h2>
          <p className="text-lg mb-4">{questions[currentIndex].questionText}</p>

          {questions[currentIndex].options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswerSelect(option)}
              className="block w-full text-left p-3 rounded-lg bg-gray-200 hover:bg-gray-300 mb-2"
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <p>No questions available.</p>
      )}
    </div>
  );
}

export default MCQTest;
