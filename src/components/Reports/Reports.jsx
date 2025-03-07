import React, { useEffect, useState } from "react";
import axios from "axios";

function Reports() {
  const [reports, setReports] = useState({ interviews: [], simulations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  // Fetch reports from the API
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/simulate/reports", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setReports(response.data);
    } catch (err) {
      setError("Failed to fetch reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center p-6 bg-gray-100 text-black font-monst">
      <h1 className="text-3xl font-bold mb-6">📊 Your Reports</h1>

      {loading && <p>Loading reports...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
          {/* 🎤 Interview Section (Scrollable Menu) */}
          <div className="w-full md:w-1/3 p-4 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-bold mb-4">🎤 Interview Reports</h2>
            <div className="h-96 overflow-y-auto border p-2 rounded-lg">
              {reports.interviews.length > 0 ? (
                reports.interviews.map((interview, index) => (
                  <div key={index} className="p-3 border-b">
                    <p className="font-bold">📧 Email: {interview.email}</p>
                    <p>✅ Accuracy: {interview.accuracy}</p>
                    <p className="font-semibold">📝 Questions:</p>
                    <ul className="list-disc ml-5">
                      {interview.questions.map((q, i) => (
                        <li key={i} className="text-sm">{q}</li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No interview data found.</p>
              )}
            </div>
          </div>

          {/* 📝 Test Section (Cards) */}
          <div className="w-full md:w-2/3">
            <h2 className="text-xl font-bold mb-4">📝 Test Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.simulations.length > 0 ? (
                reports.simulations.map((simulation, simIndex) =>
                  simulation.tests.map((test, testIndex) => (
                    <div
                      key={`${simIndex}-${testIndex}`}
                      className="bg-white p-4 shadow-lg rounded-lg"
                    >
                      <h3 className="text-lg font-bold mb-2">{test.testName}</h3>
                      <p className="text-gray-600">📋 {test.questions.length} Questions</p>
                      <div className="mt-2">
                        {test.questions.map((q, i) => (
                          <p key={i} className="text-sm">
                            <strong>Q:</strong> {q.questionText} <br />
                            <strong>✅ Correct:</strong> {q.correctAnswer} <br />
                            <strong>❌ Your Answer:</strong> {q.userAnswer} <br />
                            <span className={q.isCorrect ? "text-green-500" : "text-red-500"}>
                              {q.isCorrect ? "✔ Correct" : "✖ Incorrect"}
                            </span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
                )
              ) : (
                <p className="text-gray-500">No test data found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
