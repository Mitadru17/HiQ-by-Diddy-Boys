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

function App() {
  axios.defaults.baseURL = "https://resume-analyzer-mocha.vercel.app/";
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Main />} />

        {/* Dashboard Home */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Dashboard Sections */}
        <Route path="/dashboard/interview" element={<Interview />} />
        <Route path="/dashboard/coaching" element={<Coaching />} />
        <Route path="/dashboard/simulation" element={<Simulation />} />
        <Route path="/dashboard/reports" element={<Reports />} />
        <Route path="/dashboard/resume" element={<Resume />} />

      </Routes>
      <PopChat/>
      <Footer /> 
    </BrowserRouter>
  );
}

export default App;
