import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Main from "./components/LandingPage/Main";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Dashboard from "./components/Dashboard/Main";
import Interview from "./components/Interview/Interview";
import Coaching from "./components/LiveCoaching/Coaching";
import Simulation from "./components/Simulation/Simulation";
import Reports from "./components/Reports/Reports";
import Resume from "./components/Resume/Resume";
import PopChat from "./components/common/Chatbot";
import axios from "axios";
import Signup from "./components/Auth/Signup";
import Login from "./components/Auth/Login";
import React, { createContext, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import MCQTest from "./components/Simulation/MCQtes";
export const DataProvider = createContext();

function App() {
  axios.defaults.baseURL = "https://hi-q-by-diddy-boys-htkl.vercel.app/";
  // axios.defaults.baseURL = "http://localhost:3000/";
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [userData, setUserData] = useState([]);
  const [ischat,setChat] = useState(false)
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`/auth/user-data`, {
        headers: { Authorization: `Bearer ${token}` }, // Send the token in the Authorization header
      });
      setUserData(response.data); // Store user data
    } catch (error) {
      console.error(
        "Error fetching user data:",
        error.response ? error.response.data : error.message
      );
    }
  };


  useEffect(() => {
    if (token) {
      fetchUserData(); // Fetch user data only if token is present
   
    }
  }, [token]);
  return (
    <DataProvider.Provider value={{ token, setToken,ischat,setChat }}>
      <BrowserRouter>
      <ToastContainer/>
        <Navbar />
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/mcq-test" element={<MCQTest />} />

          {/* Dashboard Home */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Dashboard Sections */}
          <Route path="/dashboard/interview" element={<Interview />} />
          <Route path="/dashboard/coaching" element={<Coaching />} />
          <Route path="/dashboard/simulation" element={<Simulation />} />
          <Route path="/dashboard/reports" element={<Reports />} />
          <Route path="/dashboard/resume" element={<Resume />} />
        </Routes>
        <PopChat />
        <Footer />
      </BrowserRouter>
    </DataProvider.Provider>
  );
}

export default App;
