import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { useLocation } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

function Reports() {
  const [reports, setReports] = useState({ interviews: [], simulations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const location = useLocation();
  const newTestData = location.state?.testData;
  const aiInterviewData = location.state?.aiInterviewData;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to view reports');
        setLoading(false);
        return;
      }

      const response = await axios.get('/simulate/reports', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setReports({
          interviews: response.data.interviews || [],
          simulations: response.data.simulations || []
        });
      } else {
        setError('Failed to load reports');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching reports');
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall test performance
  const calculateTestPerformance = () => {
    if (!reports.simulations || reports.simulations.length === 0) {
      return { correct: 0, incorrect: 0, totalTests: 0 };
    }

    let correct = 0;
    let incorrect = 0;
    let totalTests = 0;

    reports.simulations.forEach(simulation => {
      if (simulation.tests && simulation.tests.length > 0) {
        totalTests += simulation.tests.length;
        
        simulation.tests.forEach(test => {
          if (test.questions && test.questions.length > 0) {
            test.questions.forEach(question => {
              if (question.isCorrect) {
                correct++;
              } else {
                incorrect++;
              }
            });
          }
        });
      }
    });

    return { correct, incorrect, totalTests };
  };

  // Prepare data for charts
  const prepareChartData = () => {
    const performance = calculateTestPerformance();
    
    // Pie chart data for correct vs incorrect answers
    const pieData = {
      labels: ['Correct', 'Incorrect'],
      datasets: [
        {
          data: [performance.correct, performance.incorrect],
          backgroundColor: ['#4CAF50', '#F44336'],
          borderColor: ['#388E3C', '#D32F2F'],
          borderWidth: 1,
        },
      ],
    };

    // Bar chart data for test performance by category
    const testCategories = {};
    reports.simulations.forEach(simulation => {
      simulation.tests.forEach(test => {
        const testName = test.testName;
        if (!testCategories[testName]) {
          testCategories[testName] = { correct: 0, incorrect: 0, total: 0 };
        }
        
        test.questions.forEach(question => {
          testCategories[testName].total++;
          if (question.isCorrect) {
            testCategories[testName].correct++;
          } else {
            testCategories[testName].incorrect++;
          }
        });
      });
    });

    const barData = {
      labels: Object.keys(testCategories),
      datasets: [
        {
          label: 'Correct Answers',
          data: Object.values(testCategories).map(cat => cat.correct),
          backgroundColor: '#4CAF50',
        },
        {
          label: 'Incorrect Answers',
          data: Object.values(testCategories).map(cat => cat.incorrect),
          backgroundColor: '#F44336',
        },
      ],
    };

    // Line chart for progress over time
    const timelineData = {
      labels: reports.simulations.map((_, index) => `Test ${index + 1}`),
      datasets: [
        {
          label: 'Score (%)',
          data: reports.simulations.map(simulation => {
            let correct = 0;
            let total = 0;
            
            simulation.tests.forEach(test => {
              test.questions.forEach(question => {
                total++;
                if (question.isCorrect) correct++;
              });
            });
            
            return total > 0 ? (correct / total) * 100 : 0;
          }),
          fill: false,
          borderColor: '#2196F3',
          tension: 0.1,
        },
      ],
    };

    return { pieData, barData, timelineData };
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  // If we have new test data from a just-completed test, show it
  if (newTestData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Test Results</h1>
        
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium">Total Questions</p>
              <p className="text-3xl font-bold">{newTestData.length}</p>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium">Correct Answers</p>
              <p className="text-3xl font-bold">{newTestData.filter(q => q.isCorrect).length}</p>
            </div>
            
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium">Incorrect Answers</p>
              <p className="text-3xl font-bold">{newTestData.filter(q => !q.isCorrect).length}</p>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Score</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full" 
                style={{ width: `${(newTestData.filter(q => q.isCorrect).length / newTestData.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-right mt-2">
              {Math.round((newTestData.filter(q => q.isCorrect).length / newTestData.length) * 100)}%
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Question Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Your Answer
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Correct Answer
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {newTestData.map((question, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {question.questionText}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {question.userAnswer}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {question.correctAnswer}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${question.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {question.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => fetchReports()} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          View All Reports
        </button>
      </div>
    );
  }

  // If we have AI interview data from a just-completed interview, show it
  if (aiInterviewData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">AI Interview Results</h1>
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Interview Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium">Accuracy</p>
              <p className="text-3xl font-bold">{aiInterviewData.accuracy}%</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <p className="text-lg font-medium">Question</p>
              <p className="text-xl">{aiInterviewData.question}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Your Answer</h3>
            <p className="text-gray-700">{aiInterviewData.transcription}</p>
          </div>
        </div>
        <button 
          onClick={() => fetchReports()} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          View All Reports
        </button>
      </div>
    );
  }

  // If we have historical data, show the analytics dashboard
  const { pieData, barData, timelineData } = prepareChartData();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button 
          className={`py-2 px-4 mr-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`py-2 px-4 mr-2 ${activeTab === 'tests' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('tests')}
        >
          Test Results
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'interviews' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('interviews')}
        >
          Interview Results
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Total Tests</h2>
              <p className="text-4xl font-bold text-blue-600">{reports.simulations.reduce((acc, sim) => acc + sim.tests.length, 0)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Total Interviews</h2>
              <p className="text-4xl font-bold text-green-600">{reports.interviews.length}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Average Score</h2>
              <p className="text-4xl font-bold text-purple-600">
                {calculateTestPerformance().correct + calculateTestPerformance().incorrect > 0 
                  ? Math.round((calculateTestPerformance().correct / (calculateTestPerformance().correct + calculateTestPerformance().incorrect)) * 100)
                  : 0}%
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Answer Distribution</h2>
              <div className="h-64">
                <Pie data={pieData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Progress Over Time</h2>
              <div className="h-64">
                <Line data={timelineData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Performance by Test Category</h2>
            <div className="h-80">
              <Bar 
                data={barData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test History</h2>
          
          {reports.simulations.length === 0 ? (
            <p className="text-gray-500">No test data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Correct
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.simulations.flatMap(simulation => 
                    simulation.tests.map((test, testIndex) => {
                      const totalQuestions = test.questions.length;
                      const correctAnswers = test.questions.filter(q => q.isCorrect).length;
                      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
                      
                      return (
                        <tr key={`${simulation._id}-${testIndex}`} className={testIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {test.testName}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {totalQuestions}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {correctAnswers}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${score}%` }}></div>
                              </div>
                              <span>{score}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Interviews Tab */}
      {activeTab === 'interviews' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Interview History</h2>
          
          {reports.interviews.length === 0 ? (
            <p className="text-gray-500">No interview data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Answer
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Accuracy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.interviews.map((interview, index) => (
                    <tr key={interview._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {interview.questions.join(', ')}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {interview.answerur ? interview.answerur.join(', ') : 'No answer provided'}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {interview.accuracy || 'Not evaluated'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;