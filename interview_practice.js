const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Configuration, OpenAIApi } = require('openai');
const mongoose = require('mongoose');
const { HfInference } = require('@huggingface/inference');
const natural = require('natural');
const SpeechRecognizer = require('./speech_recognition');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const speechRecognizer = new SpeechRecognizer({
    openaiApiKey: process.env.OPENAI_API_KEY,
    preferredEngine: process.env.SPEECH_ENGINE || 'whisper'
});

mongoose.connect(process.env.MONGODB_URI);

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    targetRole: String,
    practiceStats: {
        totalSessions: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        averageScores: {
            clarity: { type: Number, default: 0 },
            confidence: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 },
            overall: { type: Number, default: 0 }
        }
    },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const InterviewSessionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sessionType: String,
    jobRole: String,
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    questions: [{
        questionId: mongoose.Schema.Types.ObjectId,
        question: String,
        response: String,
        feedback: Object,
        nlpAnalysis: Object,
        scores: {
            clarity: Number,
            confidence: Number,
            accuracy: Number,
            overall: Number
        },
        duration: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    overallPerformance: {
        averageScores: {
            clarity: Number,
            confidence: Number,
            accuracy: Number,
            overall: Number
        },
        improvement: {
            clarity: Number,
            confidence: Number,
            accuracy: Number,
            overall: Number
        },
        duration: Number
    }
});

const InterviewSession = mongoose.model('InterviewSession', InterviewSessionSchema);

const InterviewResponseSchema = new mongoose.Schema({
    question: String,
    response: String,
    feedback: Object,
    nlpAnalysis: Object,
    timestamp: { type: Date, default: Date.now }
});

const InterviewResponse = mongoose.model('InterviewResponse', InterviewResponseSchema);

const QuestionSchema = new mongoose.Schema({
    jobRole: String,
    type: String,
    difficulty: String,
    question: String,
    expectedTopics: [String],
    createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', QuestionSchema);

async function generateInterviewQuestions(jobRole, type, difficulty, count = 5) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Generate ${count} interview questions for:
        Job Role: ${jobRole}
        Interview Type: ${type}
        Difficulty Level: ${difficulty}

        Return response in JSON format:
        {
            "questions": [
                {
                    "question": "the interview question",
                    "type": "behavioral/technical/situational",
                    "difficulty": "easy/medium/hard",
                    "expectedTopics": ["topic1", "topic2"],
                    "purpose": "what this question assesses"
                }
            ]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const questions = JSON.parse(response.text());

        const savedQuestions = [];
        for (const q of questions.questions) {
            const questionDoc = new Question({
                jobRole,
                type,
                difficulty,
                question: q.question,
                expectedTopics: q.expectedTopics
            });
            await questionDoc.save();
            savedQuestions.push(q);
        }

        return {
            success: true,
            data: {
                questions: savedQuestions,
                metadata: {
                    jobRole,
                    type,
                    difficulty,
                    count: savedQuestions.length
                }
            }
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

async function getQuestionsByFilters(filters = {}, limit = 10) {
    try {
        const query = {};
        if (filters.jobRole) query.jobRole = filters.jobRole;
        if (filters.type) query.type = filters.type;
        if (filters.difficulty) query.difficulty = filters.difficulty;

        const questions = await Question.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        return {
            success: true,
            data: questions
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

async function convertSpeechToText(audioBuffer, options = {}) {
    try {
        return await speechRecognizer.transcribe(audioBuffer, {
            inputFormat: options.inputFormat || 'wav',
            language: options.language || 'en',
            engine: options.engine,
            prompt: options.prompt
        });
    } catch (error) {
        if (error.message.includes('OpenAI API key not configured')) {
            return await speechRecognizer.transcribe(audioBuffer, {
                ...options,
                engine: 'vosk'
            });
        }
        throw error;
    }
}

async function analyzeResponse(question, responseText) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze this interview response for the question: "${question}"
    Response: "${responseText}"
    
    Provide a detailed analysis in JSON format with the following structure:
    {
        "clarity": {
            "score": number (0-100),
            "feedback": ["specific point 1", "specific point 2"],
            "improvements": ["suggestion 1", "suggestion 2"]
        },
        "confidence": {
            "score": number (0-100),
            "feedback": ["specific point 1", "specific point 2"],
            "improvements": ["suggestion 1", "suggestion 2"]
        },
        "pace": {
            "score": number (0-100),
            "feedback": ["specific point 1", "specific point 2"],
            "improvements": ["suggestion 1", "suggestion 2"]
        },
        "overall": {
            "score": number (0-100),
            "summary": "brief overall assessment",
            "keyStrengths": ["strength 1", "strength 2"],
            "keyAreas": ["improvement area 1", "improvement area 2"]
        }
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
}

async function evaluateAnswerWithNLP(question, answer, expectedTopics = []) {
    try {
        const tokenizer = new natural.WordTokenizer();
        const sentenceTokenizer = new natural.SentenceTokenizer();

        const sentences = sentenceTokenizer.tokenize(answer);
        const words = tokenizer.tokenize(answer);

        const sentimentAnalysis = await hf.textClassification({
            model: 'SamLowe/roberta-base-go_emotions',
            inputs: answer
        });

        const textCoherence = await hf.textClassification({
            model: 'cointegrated/roberta-large-cola-english',
            inputs: answer
        });

        const keywordExtraction = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: answer
        });

        const topicCoverage = expectedTopics.map(topic => {
            const topicWords = tokenizer.tokenize(topic.toLowerCase());
            const found = topicWords.some(word => 
                words.map(w => w.toLowerCase()).includes(word)
            );
            return { topic, covered: found };
        });

        const clarity = {
            sentenceStructure: {
                averageLength: words.length / sentences.length,
                sentenceCount: sentences.length,
                complexSentences: sentences.filter(s => s.split(' ').length > 20).length
            },
            coherenceScore: textCoherence[0].score,
            topicCoverage
        };

        const confidence = {
            emotionalTone: sentimentAnalysis[0].label,
            emotionScore: sentimentAnalysis[0].score,
            assertiveLanguage: words.filter(word => 
                ['definitely', 'certainly', 'absolutely', 'confident', 'sure'].includes(word.toLowerCase())
            ).length
        };

        const accuracy = {
            keywordRelevance: keywordExtraction.map((score, idx) => ({
                word: words[idx],
                relevance: score
            })).filter(k => k.relevance > 0.5),
            topicAlignment: topicCoverage.filter(t => t.covered).length / expectedTopics.length * 100
        };

        return {
            clarity,
            confidence,
            accuracy,
            metrics: {
                clarityScore: Math.min(100, (clarity.coherenceScore * 100 + 
                    (1 - Math.abs(15 - clarity.sentenceStructure.averageLength) / 15) * 100) / 2),
                confidenceScore: Math.min(100, (confidence.emotionScore * 50 + 
                    Math.min(confidence.assertiveLanguage * 10, 50))),
                accuracyScore: accuracy.topicAlignment
            }
        };

    } catch (error) {
        throw new Error(`NLP analysis failed: ${error.message}`);
    }
}

async function processInterviewResponse(question, audioBuffer) {
    try {
        const responseText = await convertSpeechToText(audioBuffer);
        const [analysis, nlpAnalysis] = await Promise.all([
            analyzeResponse(question, responseText),
            evaluateAnswerWithNLP(question, responseText)
        ]);

        const interviewResponse = new InterviewResponse({
            question,
            response: responseText,
            feedback: analysis,
            nlpAnalysis
        });
        await interviewResponse.save();

        const combinedAnalysis = {
            ...analysis,
            nlpMetrics: nlpAnalysis.metrics,
            detailedAnalysis: {
                clarity: {
                    ...analysis.clarity,
                    nlpDetails: nlpAnalysis.clarity
                },
                confidence: {
                    ...analysis.confidence,
                    nlpDetails: nlpAnalysis.confidence
                },
                accuracy: nlpAnalysis.accuracy
            }
        };

        return {
            success: true,
            data: {
                transcription: responseText,
                analysis: combinedAnalysis
            }
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

async function getPreviousResponses(limit = 10) {
    try {
        const responses = await InterviewResponse.find()
            .sort({ timestamp: -1 })
            .limit(limit);
        return {
            success: true,
            data: responses
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

async function startInterviewSession(userId, sessionType, jobRole) {
    try {
        const session = new InterviewSession({
            userId,
            sessionType,
            jobRole
        });
        await session.save();
        return {
            success: true,
            data: {
                sessionId: session._id,
                startTime: session.startTime
            }
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

async function addResponseToSession(sessionId, questionData) {
    try {
        const session = await InterviewSession.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const [analysis, nlpAnalysis] = await Promise.all([
            analyzeResponse(questionData.question, questionData.response),
            evaluateAnswerWithNLP(questionData.question, questionData.response)
        ]);

        const scores = {
            clarity: (analysis.clarity.score + nlpAnalysis.metrics.clarityScore) / 2,
            confidence: (analysis.confidence.score + nlpAnalysis.metrics.confidenceScore) / 2,
            accuracy: nlpAnalysis.metrics.accuracyScore,
            overall: analysis.overall.score
        };

        session.questions.push({
            question: questionData.question,
            response: questionData.response,
            feedback: analysis,
            nlpAnalysis,
            scores,
            duration: questionData.duration
        });

        await session.save();

        return {
            success: true,
            data: {
                scores,
                feedback: analysis,
                nlpAnalysis
            }
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

async function endInterviewSession(sessionId) {
    try {
        const session = await InterviewSession.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        session.endTime = new Date();
        session.overallPerformance = calculateSessionPerformance(session);
        await session.save();

        await updateUserStats(session.userId, session.overallPerformance);

        return {
            success: true,
            data: {
                sessionDuration: session.endTime - session.startTime,
                performance: session.overallPerformance
            }
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

async function calculateSessionPerformance(session) {
    const scores = session.questions.map(q => q.scores);
    const previousSession = await InterviewSession.findOne({
        userId: session.userId,
        endTime: { $exists: true },
        _id: { $ne: session._id }
    }).sort({ endTime: -1 });

    const averageScores = {
        clarity: average(scores.map(s => s.clarity)),
        confidence: average(scores.map(s => s.confidence)),
        accuracy: average(scores.map(s => s.accuracy)),
        overall: average(scores.map(s => s.overall))
    };

    const improvement = previousSession ? {
        clarity: averageScores.clarity - previousSession.overallPerformance.averageScores.clarity,
        confidence: averageScores.confidence - previousSession.overallPerformance.averageScores.confidence,
        accuracy: averageScores.accuracy - previousSession.overallPerformance.averageScores.accuracy,
        overall: averageScores.overall - previousSession.overallPerformance.averageScores.overall
    } : {
        clarity: 0,
        confidence: 0,
        accuracy: 0,
        overall: 0
    };

    return {
        averageScores,
        improvement,
        duration: session.endTime - session.startTime
    };
}

async function updateUserStats(userId, sessionPerformance) {
    const user = await User.findOne({ userId });
    if (!user) return;

    const oldStats = user.practiceStats;
    const newStats = {
        totalSessions: oldStats.totalSessions + 1,
        totalQuestions: oldStats.totalQuestions + session.questions.length,
        averageScores: {
            clarity: updateAverage(oldStats.averageScores.clarity, sessionPerformance.averageScores.clarity, oldStats.totalSessions),
            confidence: updateAverage(oldStats.averageScores.confidence, sessionPerformance.averageScores.confidence, oldStats.totalSessions),
            accuracy: updateAverage(oldStats.averageScores.accuracy, sessionPerformance.averageScores.accuracy, oldStats.totalSessions),
            overall: updateAverage(oldStats.averageScores.overall, sessionPerformance.averageScores.overall, oldStats.totalSessions)
        }
    };

    user.practiceStats = newStats;
    await user.save();
}

async function getUserProgress(userId, timeRange = 30) {
    try {
        const endDate = new Date();
        const startDate = new Date(endDate - timeRange * 24 * 60 * 60 * 1000);

        const sessions = await InterviewSession.find({
            userId,
            endTime: { $exists: true, $gte: startDate, $lte: endDate }
        }).sort({ startTime: 1 });

        const progressData = {
            sessions: sessions.length,
            questionsAnswered: sessions.reduce((sum, s) => sum + s.questions.length, 0),
            averageScoresTrend: sessions.map(s => ({
                date: s.endTime,
                scores: s.overallPerformance.averageScores
            })),
            improvementAreas: calculateImprovementAreas(sessions),
            strongestSkills: calculateStrongSkills(sessions),
            sessionDurations: sessions.map(s => ({
                date: s.endTime,
                duration: s.overallPerformance.duration
            }))
        };

        const user = await User.findOne({ userId });
        
        return {
            success: true,
            data: {
                progress: progressData,
                overall: user.practiceStats
            }
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

function calculateImprovementAreas(sessions) {
    const recentSessions = sessions.slice(-3);
    const scores = ['clarity', 'confidence', 'accuracy'];
    
    return scores
        .map(metric => ({
            metric,
            average: average(recentSessions.map(s => s.overallPerformance.averageScores[metric]))
        }))
        .sort((a, b) => a.average - b.average)
        .slice(0, 2)
        .map(item => item.metric);
}

function calculateStrongSkills(sessions) {
    const recentSessions = sessions.slice(-3);
    const scores = ['clarity', 'confidence', 'accuracy'];
    
    return scores
        .map(metric => ({
            metric,
            average: average(recentSessions.map(s => s.overallPerformance.averageScores[metric]))
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 2)
        .map(item => item.metric);
}

function average(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function updateAverage(oldAvg, newValue, oldCount) {
    return (oldAvg * oldCount + newValue) / (oldCount + 1);
}

module.exports = { 
    processInterviewResponse, 
    getPreviousResponses,
    generateInterviewQuestions,
    getQuestionsByFilters,
    evaluateAnswerWithNLP,
    startInterviewSession,
    addResponseToSession,
    endInterviewSession,
    getUserProgress
}; 