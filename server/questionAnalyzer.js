const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Generative AI client with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeQuestion = async (topic) => {
  try {
    // Define the generative model (gemini-1.5-flash or similar)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construct the prompt for the AI
    const prompt = `
      You are an expert in ${topic}. Please provide a detailed explanation of the following concept:

      Concept: ${topic}

      Your response should include the following:

      1. Question according to this topic for oral interviews only verbal answer expected from user.
      2. Question should not be more than 30 words.
      3. unique question asked in interview for this topic.

      Format your response as valid JSON with the key 'question'.
    `;

    // Generate content from the model based on the prompt
    const result = await model.generateContent(prompt);

    // Get the response text (it should be a JSON string)
    const responseText = result.response.text();

    // Call handleResponse with the response text
    return await handleResponse(responseText);
  } catch (error) {
    console.error("Error analyzing question:", error);
    return {
      error: "Failed to analyze the question. Please try again.",
    };
  }
};

const handleResponse = (responseText) => {
    try {
      // Remove the backticks and newlines, clean the JSON string
      const cleanedResponse = responseText.replace(/```json\n|\n```/g, '').trim();
  
      // Parse the cleaned response as JSON
      const parsedResponse = JSON.parse(cleanedResponse);
  
      // Check if 'question' exists in the parsed response
      if (!parsedResponse || !parsedResponse.question) {
        console.error("Error: 'question' not found in the response.");
        return { error: "Question not found in the response." };
      }
  
      // Return the cleaned question
     
      return { question: parsedResponse.question };
    } catch (error) {
      console.error("Error parsing the response:", error);
      return { error: "Failed to parse the response." };
    }
  };
  