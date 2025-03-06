const OpenAI = require('openai');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const path = require('path');
const answerEvaluator = require('./answer_evaluator');
const speechCharacteristics = require('./speech_characteristics');

const router = express.Router();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for handling audio file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `interview_audio_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept audio files only
        const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only WAV, MP3, and WebM audio files are allowed.'));
        }
    },
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB max file size
    }
});

// Endpoint to transcribe audio to text
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const audioPath = req.file.path;
        
        // Transcribe audio using Whisper API
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
            language: "en",
            response_format: "json",
            temperature: 0.2
        });

        // Clean up the uploaded file
        fs.unlinkSync(audioPath);

        res.json({
            success: true,
            transcription: transcription.text
        });

    } catch (error) {
        console.error('Error transcribing audio:', error);
        
        // Clean up the uploaded file in case of error
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            error: 'Error transcribing audio',
            message: error.message
        });
    }
});

// Endpoint to transcribe and analyze interview response
router.post('/transcribe-and-analyze', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const { questionType, question, context } = req.body;
        if (!questionType) {
            return res.status(400).json({ error: 'Question type is required' });
        }

        const audioPath = req.file.path;
        const startTime = Date.now();
        
        // Transcribe audio using Whisper API
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
            language: "en",
            response_format: "json",
            temperature: 0.2
        });

        // Get audio duration in seconds
        const durationSeconds = (Date.now() - startTime) / 1000;

        // Clean up the uploaded file
        fs.unlinkSync(audioPath);

        // Parallel processing of content and speech analysis
        const [contentEvaluation, speechAnalysis] = await Promise.all([
            answerEvaluator.evaluateAnswer(
                transcription.text,
                question,
                questionType,
                context ? JSON.parse(context) : {}
            ),
            speechCharacteristics.analyzeSpeech(
                transcription.text,
                durationSeconds
            )
        ]);

        // Combine both analyses into a comprehensive evaluation
        const combinedEvaluation = {
            content: contentEvaluation,
            delivery: speechAnalysis,
            overall: {
                score: calculateOverallScore(contentEvaluation, speechAnalysis),
                recommendations: [
                    ...contentEvaluation.recommendations,
                    ...speechAnalysis.recommendations
                ].sort((a, b) => a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0)
            }
        };

        res.json({
            success: true,
            transcription: transcription.text,
            evaluation: combinedEvaluation
        });

    } catch (error) {
        console.error('Error processing audio:', error);
        
        // Clean up the uploaded file in case of error
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            error: 'Error processing audio',
            message: error.message
        });
    }
});

// Endpoint for real-time feedback during speech
router.post('/stream-feedback', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const { questionType, question, context, isComplete } = req.body;
        const audioPath = req.file.path;
        const startTime = Date.now();

        // Transcribe the audio segment
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
            language: "en",
            response_format: "json",
            temperature: 0.2
        });

        const durationSeconds = (Date.now() - startTime) / 1000;

        // Clean up the audio file
        fs.unlinkSync(audioPath);

        // If this is the final segment, perform full analysis
        if (isComplete === 'true') {
            const [contentEvaluation, speechAnalysis] = await Promise.all([
                answerEvaluator.evaluateAnswer(
                    transcription.text,
                    question,
                    questionType,
                    context ? JSON.parse(context) : {}
                ),
                speechCharacteristics.analyzeSpeech(
                    transcription.text,
                    durationSeconds
                )
            ]);

            const combinedEvaluation = {
                content: contentEvaluation,
                delivery: speechAnalysis,
                overall: {
                    score: calculateOverallScore(contentEvaluation, speechAnalysis),
                    recommendations: [
                        ...contentEvaluation.recommendations,
                        ...speechAnalysis.recommendations
                    ].sort((a, b) => a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0)
                }
            };

            return res.json({
                success: true,
                transcription: transcription.text,
                evaluation: combinedEvaluation,
                isComplete: true
            });
        }

        // For ongoing speech, provide quick feedback on delivery
        const quickAnalysis = await speechCharacteristics.analyzeSpeech(
            transcription.text,
            durationSeconds
        );

        res.json({
            success: true,
            transcription: transcription.text,
            quickFeedback: {
                pace: quickAnalysis.pace,
                tone: quickAnalysis.tone,
                fluency: {
                    score: quickAnalysis.fluency.fluencyScore,
                    fillerWords: quickAnalysis.fluency.fillerWords
                },
                recommendations: quickAnalysis.recommendations
            },
            isComplete: false
        });

    } catch (error) {
        console.error('Error processing audio stream:', error);
        
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            error: 'Error processing audio stream',
            message: error.message
        });
    }
});

/**
 * Calculate overall score combining content and delivery
 */
function calculateOverallScore(contentEvaluation, speechAnalysis) {
    const weights = {
        content: 0.6,
        delivery: 0.4
    };

    const contentScore = contentEvaluation.scores.weightedOverall;
    const deliveryScore = (
        speechAnalysis.fluency.fluencyScore * 0.4 +
        speechAnalysis.tone.professionalTone * 10 * 0.3 +
        (speechAnalysis.pace.paceCategory === 'optimal' ? 10 : 7) * 0.3
    );

    return (contentScore * weights.content + deliveryScore * weights.delivery).toFixed(1);
}

module.exports = router; 