const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeResume(resumeText, jobDescription = '') {
    try {
        if (!resumeText) {
            throw new Error('Resume text is required');
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        let prompt = `Analyze the following resume and provide a detailed assessment. 
        Extract key skills, work experience, and important keywords.
        
        Resume:
        ${resumeText}
        `;

        if (jobDescription) {
            prompt += `\n\nCompare with this job description:
            ${jobDescription}`;
        }

        prompt += `\n\nProvide the analysis in the following JSON format:
        {
            "skills": ["skill1", "skill2", ...],
            "workExperience": {
                "years": number,
                "keyPositions": ["position1", "position2", ...]
            },
            "strengths": ["strength1", "strength2", ...],
            "weaknesses": ["weakness1", "weakness2", ...],
            "improvements": ["suggestion1", "suggestion2", ...],
            "relevanceScore": number (0-100),
            "keywordMatches": ["keyword1", "keyword2", ...]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysisText = response.text();

        let analysis;
        try {
            analysis = JSON.parse(analysisText);
        } catch (parseError) {
            throw new Error('Failed to parse API response');
        }

        return {
            success: true,
            data: analysis
        };

    } catch (error) {
        return {
            success: false,
            error: {
                message: error.message,
                details: error.toString()
            }
        };
    }
}

module.exports = { analyzeResume };