const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract text from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text from the PDF
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from the resume PDF');
  }
}

/**
 * Analyze resume using Google Gemini API
 * @param {string} resumeText - The text content of the resume
 * @returns {Promise<Object>} - Analysis results
 */
async function getGeminiAnalysis(resumeText) {
  try {
    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare the prompt for resume analysis
    const prompt = `
    You are a professional resume analyzer. Please analyze the following resume text and provide the following:
    
    1. SCORE: Give an overall score out of 100 based on clarity, structure, relevance, and completeness.
    2. GRAMMAR_ISSUES: Identify and list any grammar or spelling mistakes.
    3. IMPROVEMENTS: Suggest specific improvements for structure, wording, and clarity.
    4. MISSING_KEYWORDS: Identify industry-specific keywords that are missing and would improve the resume.
    
    Format your response as valid JSON with these keys: 'score', 'grammar_issues', 'improvements', and 'missing_keywords'.
    For 'grammar_issues' and 'missing_keywords', return arrays of strings.
    For 'improvements', return an array of improvement suggestions.
    For 'score', return a number between 0 and 100.
    
    Here is the resume text to analyze:
    ${resumeText}
    `;

    // Generate the content from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Parse the JSON response
    // The model should return valid JSON, but we'll handle parsing errors just in case
    try {
      // Find JSON content in the response - sometimes the model adds explanatory text
      const jsonMatch = responseText.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      
      // Parse and validate the JSON structure
      const analysis = JSON.parse(jsonStr);
      
      // Ensure all required fields are present
      const validatedAnalysis = {
        score: typeof analysis.score === 'number' ? analysis.score : 0,
        grammar_issues: Array.isArray(analysis.grammar_issues) ? analysis.grammar_issues : [],
        improvements: Array.isArray(analysis.improvements) ? analysis.improvements : [],
        missing_keywords: Array.isArray(analysis.missing_keywords) ? analysis.missing_keywords : []
      };
      
      return validatedAnalysis;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // Fallback to a structured response if parsing fails
      return {
        score: 0,
        grammar_issues: ['Unable to analyze grammar issues due to an error'],
        improvements: ['Unable to provide specific improvements due to an error'],
        missing_keywords: ['Unable to identify missing keywords due to an error'],
        error: 'Failed to parse Gemini API response'
      };
    }
  } catch (error) {
    console.error('Error with Gemini API:', error);
    throw new Error(`Failed to analyze resume with Gemini API: ${error.message}`);
  }
}

/**
 * Analyze a resume PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeResume(filePath) {
  try {
    // Extract text from the PDF
    const resumeText = await extractTextFromPDF(filePath);
    
    // If no text was extracted, throw an error
    if (!resumeText || resumeText.trim() === '') {
      throw new Error('No text content found in the resume');
    }
    
    // Get analysis from Gemini
    const analysisResults = await getGeminiAnalysis(resumeText);
    
    return {
      success: true,
      ...analysisResults
    };
  } catch (error) {
    console.error('Resume analysis error:', error);
    throw error;
  }
}

module.exports = { analyzeResume }; 