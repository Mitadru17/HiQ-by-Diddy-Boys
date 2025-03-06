import React, { useState } from "react";
import { IoChatbubbles, IoClose, IoSend } from "react-icons/io5";
import Threads from "../utils/Threads";

function PopChat() {
  const [isOpen, setIsOpen] = useState(false); // State to toggle chat visibility
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
    <div className="z-50">
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 z-50 right-5 bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-all"
      >
        {isOpen ? <IoClose size={30} /> : <IoChatbubbles size={30} />}
      </button>

      {/* Chat Popup Window */}
      {isOpen && (
        <div className="fixed bottom-16 z-50 right-5 w-[25vw] h-[550px] bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col">
          {/* Chat Header */}
          <div className="bg-red-500 text-white p-3 flex justify-between items-center rounded-t-lg">
            <h2 className="text-lg font-bold">Diddy's Chat</h2>
            <IoClose size={25} className="cursor-pointer" onClick={() => setIsOpen(false)} />
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 bg-blue-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">Ask Your Doubts with Our Diddy's!</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start my-2 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* AI Logo for AI Messages (Outside Message Box) */}
                  {msg.sender === "ai" && (
                    <img
                      src={"../Navbar/logo.webp"}
                      alt="AI Logo"
                      className="w-8 h-8 mr-2 rounded-full shadow-md"
                    />
                  )}

                  {/* Message Box */}
                  <div
                    className={`rounded-lg p-3 max-w-[80%] break-words shadow-md ${
                      msg.sender === "user"
                        ? "bg-blue-100 border text-black rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                        : "bg-gray-200 text-black rounded-tr-lg rounded-br-lg rounded-bl-3xl"
                    }`}
                  >
                    <p className="font-sans">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            {loading && <p className="text-gray-500 text-center mt-2">Typing...</p>}
          </div>

          {/* Chat Input */}
          <div className="p-3 flex items-center border-t border-gray-300">
            <input
              type="text"
              className="flex-grow p-2 border border-gray-400 rounded-l-lg"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-red-500 text-white px-3 py-2 rounded-r-lg hover:bg-red-600 transition flex items-center"
            >
              <IoSend size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Animated Threads Effect */}
      {isOpen && (
        <div className="absolute bottom-0 w-full">
          <Threads amplitude={2} distance={1} enableMouseInteraction={true} />
        </div>
      )}
    </div>
  );
}

export default PopChat;
