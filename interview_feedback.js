const express = require('express');
const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Evaluation criteria for different aspects of the interview
const evaluationCriteria = {
    communication: {
        clarity: 'Evaluates how clearly and articulately the candidate expresses their thoughts',
        confidence: 'Assesses the candidate\'s confidence level during responses',
        listening: 'Measures how well the candidate understands and responds to questions'
    },
    technicalKnowledge: {
        accuracy: 'Evaluates the correctness of technical information provided',
        depth: 'Assesses the depth of understanding in the field',
        problemSolving: 'Measures ability to approach technical challenges'
    },
    behavioral: {
        structure: 'Evaluates use of STAR method and response organization',
        relevance: 'Assesses how well examples match the questions',
        reflection: 'Measures self-awareness and learning from experiences'
    },
    overall: {
        adaptability: 'Evaluates flexibility in handling different types of questions',
        professionalism: 'Assesses professional demeanor and communication style',
        cultural_fit: 'Evaluates alignment with organizational values and culture'
    }
};

// Function to analyze interview responses using AI
async function analyzeResponse(response, questionType) {
    try {
        const prompt = `Analyze the following interview response for a ${questionType} question:
        "${response}"
        
        Provide detailed feedback on:
        1. Strengths
        2. Areas for improvement
        3. Specific recommendations
        4. Score (1-10)
        
        Consider: clarity, structure, relevance, and depth of the response.`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
            temperature: 0.7,
            max_tokens: 1000
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error analyzing response:', error);
        throw error;
    }
}

// Endpoint to submit interview responses for analysis
router.post('/analyze', async (req, res) => {
    try {
        const { responses, interviewType } = req.body;

        if (!responses || !Array.isArray(responses)) {
            return res.status(400).json({ error: 'Invalid responses format' });
        }

        const feedback = await Promise.all(
            responses.map(async (response) => {
                const analysis = await analyzeResponse(response.answer, response.questionType);
                return {
                    question: response.question,
                    questionType: response.questionType,
                    analysis
                };
            })
        );

        // Generate overall feedback summary
        const overallFeedback = await generateOverallFeedback(feedback);

        res.json({
            feedback,
            overallFeedback,
            evaluationCriteria
        });
    } catch (error) {
        console.error('Error processing interview feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to generate overall feedback summary
async function generateOverallFeedback(feedbackArray) {
    try {
        const feedbackSummary = feedbackArray.map(f => f.analysis).join('\n\n');
        
        const prompt = `Based on the following detailed feedback from multiple interview responses:
        "${feedbackSummary}"
        
        Provide a comprehensive summary including:
        1. Overall performance assessment
        2. Key strengths demonstrated
        3. Priority areas for improvement
        4. Actionable recommendations for preparation
        5. Overall interview readiness score (1-10)`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
            temperature: 0.7,
            max_tokens: 1000
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating overall feedback:', error);
        throw error;
    }
}

module.exports = router; 