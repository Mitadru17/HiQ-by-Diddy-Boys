import React, { useState } from "react";
import { IoReturnUpBack, IoSend } from "react-icons/io5";
import { Link } from "react-router-dom";
import Threads from "../utils/Threads";

function Coaching() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Function to handle sending user messages
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input after sending
    setLoading(true);

    // Add a placeholder AI message to update text dynamically
    const aiMessage = { sender: "ai", text: "" };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: input }] }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const fullText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't understand that.";

      // Simulate word-by-word streaming effect
      let currentText = "";
      for (const word of fullText.split(" ")) {
        currentText += word + " ";
        await new Promise((resolve) => setTimeout(resolve, 50)); // Adjust delay for better typing effect

        // Update the last AI message dynamically
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = currentText;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "ai", text: "Error fetching response. Try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center text-black p-6">
      {/* Header */}
      <div className="flex p-4 justify-between w-full max-w-3xl">
        <Link to="/dashboard">
          <IoReturnUpBack fontSize={40} className="cursor-pointer" />
        </Link>
        <h1 className="text-[40px] font-bold">Diddy's Chat</h1>
        <p></p>
      </div>

      {/* Chat Window */}
      <div className="w-full max-w-3xl h-[500px] font-sans text-sm border border-b-8 border-black rounded-2xl p-4 overflow-y-auto bg-blue-50 shadow-lg">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">
            Ask Your Doubts with Our Diddy's!
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start my-2 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Show AI Logo for AI Responses (Outside Answer Box) */}
              {msg.sender === "ai" && (
                <img
                  src={"../Navbar/logo.webp"}
                  alt="AI Logo"
                  className="w-10 h-10 mr-2 rounded-full shadow-md"
                />
              )}

              {/* Message Box */}
              <div
                className={`rounded-bl-lg rounded-tl-lg p-3 max-w-[80%] break-words  font-monst shadow-md ${
                  msg.sender === "user"
                    ? "bg-blue-100 border text-black rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                    : "bg-gray-200 text-black rounded-tr-lg rounded-br-lg rounded-bl-3xl"
                }`}
              >
                <p className="font-monst">{msg.text}</p>
              </div>
            </div>
          ))
        )}

        {loading && <p className="text-gray-500 text-center mt-2">Typing...</p>}
      </div>

      {/* Input Box */}
      <div className="flex w-full max-w-3xl mt-4">
        <input
          type="text"
          className="flex-grow p-3 border border-gray-400 rounded-l-lg"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-red-500 text-white px-4 py-3 rounded-r-lg hover:bg-red-600 transition flex items-center"
        >
          <IoSend fontSize={24} />
        </button>
      </div>
      <div className="h-[30vh] w-full">
      <Threads amplitude={2} distance={1} enableMouseInteraction={true} />
      </div>

    </div>
  );
}

export default Coaching;
