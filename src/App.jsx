import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Main from "./components/LandingPage/Main";
import Navbar from "./components/common/Navbar";
import ClickSpark from "./components/utils/ClickSpark";
import Footer from "./components/common/Footer";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
