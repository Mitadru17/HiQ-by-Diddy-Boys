const OpenAI = require('openai');
const { HfInference } = require('@huggingface/inference');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Evaluation criteria weights
const CRITERIA_WEIGHTS = {
    clarity: 0.25,
    correctness: 0.35,
    structure: 0.25,
    relevance: 0.15
};

class AnswerEvaluator {
    constructor() {
        this.tokenizer = tokenizer;
    }

    /**
     * Comprehensive evaluation of interview answers
     * @param {string} answer - The interview answer to evaluate
     * @param {string} question - The interview question
     * @param {string} questionType - Type of question (technical/behavioral/general)
     * @param {object} context - Additional context (job role, level, etc.)
     * @returns {Promise<object>} Detailed evaluation results
     */
    async evaluateAnswer(answer, question, questionType, context = {}) {
        try {
            // Parallel processing of different evaluations
            const [
                gptAnalysis,
                sentimentAnalysis,
                coherenceScore,
                technicalAccuracy
            ] = await Promise.all([
                this.getGPTAnalysis(answer, question, questionType, context),
                this.analyzeSentiment(answer),
                this.evaluateCoherence(answer),
                this.evaluateTechnicalAccuracy(answer, questionType, context)
            ]);

            // Combine all analyses into a comprehensive evaluation
            const evaluation = this.combineAnalyses({
                gptAnalysis,
                sentimentAnalysis,
                coherenceScore,
                technicalAccuracy
            });

            return evaluation;
        } catch (error) {
            console.error('Error in answer evaluation:', error);
            throw error;
        }
    }

    /**
     * Get detailed analysis using GPT-4
     */
    async getGPTAnalysis(answer, question, questionType, context) {
        const prompt = this.constructGPTPrompt(answer, question, questionType, context);
        
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
            temperature: 0.7,
            max_tokens: 1500,
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content);
    }

    /**
     * Analyze sentiment and confidence using Hugging Face
     */
    async analyzeSentiment(answer) {
        const result = await hf.textClassification({
            model: 'SamLowe/roberta-base-go_emotions',
            inputs: answer
        });

        // Get confidence and professional tone metrics
        const emotions = result.map(r => ({
            label: r.label,
            score: r.score
        }));

        return {
            emotions,
            confidence: this.calculateConfidenceScore(emotions),
            professionalism: this.assessProfessionalism(emotions)
        };
    }

    /**
     * Evaluate answer coherence and structure
     */
    async evaluateCoherence(answer) {
        const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Use Hugging Face for coherence analysis
        const coherenceScores = await Promise.all(
            sentences.map(async (sentence, i) => {
                if (i === 0) return 1;
                const prevSentence = sentences[i - 1];
                
                const result = await hf.textClassification({
                    model: 'cross-encoder/stsb-roberta-large',
                    inputs: {
                        source_sentence: prevSentence,
                        sentences: [sentence]
                    }
                });

                return result[0].score;
            })
        );

        return {
            overallCoherence: coherenceScores.reduce((a, b) => a + b, 0) / coherenceScores.length,
            sentenceFlowScores: coherenceScores,
            structureAnalysis: this.analyzeStructure(sentences)
        };
    }

    /**
     * Evaluate technical accuracy (for technical questions)
     */
    async evaluateTechnicalAccuracy(answer, questionType, context) {
        if (questionType !== 'technical') {
            return null;
        }

        const prompt = `Evaluate the technical accuracy of this answer in the context of ${context.role || 'the role'}:
        "${answer}"
        
        Provide:
        1. Accuracy score (0-100)
        2. Technical concepts mentioned
        3. Any technical inaccuracies
        4. Depth of technical knowledge demonstrated`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
            temperature: 0.5,
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content);
    }

    /**
     * Construct detailed GPT prompt for analysis
     */
    constructGPTPrompt(answer, question, questionType, context) {
        return `Analyze this ${questionType} interview answer for the role of ${context.role || 'the position'}:

Question: "${question}"
Answer: "${answer}"

Provide a detailed analysis in JSON format with the following structure:
{
    "clarity": {
        "score": "1-10",
        "strengths": [],
        "improvements": []
    },
    "structure": {
        "score": "1-10",
        "hasIntroduction": boolean,
        "hasMainPoints": boolean,
        "hasConclusion": boolean,
        "improvements": []
    },
    "content": {
        "score": "1-10",
        "relevance": "1-10",
        "depth": "1-10",
        "keyPoints": [],
        "missingElements": []
    },
    "delivery": {
        "conciseness": "1-10",
        "articulationScore": "1-10",
        "improvements": []
    },
    "overall": {
        "score": "1-10",
        "summary": "string",
        "topStrengths": [],
        "priorityImprovements": []
    }
}`;
    }

    /**
     * Analyze answer structure
     */
    analyzeStructure(sentences) {
        const wordCount = sentences.reduce((count, sentence) => 
            count + this.tokenizer.tokenize(sentence).length, 0);
        
        return {
            sentenceCount: sentences.length,
            averageSentenceLength: wordCount / sentences.length,
            structureScore: this.calculateStructureScore(sentences),
            hasIntroduction: this.detectIntroduction(sentences[0]),
            hasConclusion: this.detectConclusion(sentences[sentences.length - 1])
        };
    }

    /**
     * Calculate confidence score from emotion analysis
     */
    calculateConfidenceScore(emotions) {
        const confidenceIndicators = ['confident', 'neutral', 'optimistic'];
        const nervousnessIndicators = ['anxious', 'nervous', 'uncertain'];

        const confidenceScore = emotions
            .filter(e => confidenceIndicators.includes(e.label))
            .reduce((sum, e) => sum + e.score, 0);

        const nervousnessScore = emotions
            .filter(e => nervousnessIndicators.includes(e.label))
            .reduce((sum, e) => sum + e.score, 0);

        return (confidenceScore - nervousnessScore + 1) / 2; // Normalize to 0-1
    }

    /**
     * Assess professionalism from emotion analysis
     */
    assessProfessionalism(emotions) {
        const professionalEmotions = ['neutral', 'confident', 'serious'];
        const unprofessionalEmotions = ['angry', 'aggressive', 'sarcastic'];

        return {
            score: this.calculateProfessionalismScore(emotions, professionalEmotions, unprofessionalEmotions),
            areas: this.identifyProfessionalismAreas(emotions)
        };
    }

    /**
     * Combine all analyses into final evaluation
     */
    combineAnalyses({ gptAnalysis, sentimentAnalysis, coherenceScore, technicalAccuracy }) {
        const evaluation = {
            scores: {
                clarity: gptAnalysis.clarity.score,
                structure: (gptAnalysis.structure.score + coherenceScore.overallCoherence * 10) / 2,
                content: gptAnalysis.content.score,
                technical: technicalAccuracy?.accuracyScore || null,
                confidence: sentimentAnalysis.confidence * 10,
                overall: gptAnalysis.overall.score
            },
            analysis: {
                strengths: gptAnalysis.overall.topStrengths,
                improvements: gptAnalysis.overall.priorityImprovements,
                structure: {
                    coherence: coherenceScore,
                    organization: gptAnalysis.structure
                },
                delivery: {
                    confidence: sentimentAnalysis,
                    professionalism: sentimentAnalysis.professionalism
                },
                technical: technicalAccuracy
            },
            recommendations: this.generateRecommendations(gptAnalysis, coherenceScore, sentimentAnalysis)
        };

        evaluation.scores.weightedOverall = this.calculateWeightedScore(evaluation.scores);
        return evaluation;
    }

    /**
     * Calculate weighted overall score
     */
    calculateWeightedScore(scores) {
        return Object.entries(CRITERIA_WEIGHTS)
            .reduce((total, [criterion, weight]) => {
                return total + (scores[criterion] || 0) * weight;
            }, 0);
    }

    /**
     * Generate specific recommendations based on all analyses
     */
    generateRecommendations(gptAnalysis, coherenceScore, sentimentAnalysis) {
        const recommendations = [];

        // Add structure recommendations
        if (coherenceScore.overallCoherence < 0.8) {
            recommendations.push({
                aspect: 'Structure',
                suggestion: 'Improve answer flow and coherence between points',
                priority: 'High'
            });
        }

        // Add confidence recommendations
        if (sentimentAnalysis.confidence < 0.7) {
            recommendations.push({
                aspect: 'Delivery',
                suggestion: 'Work on projecting more confidence in responses',
                priority: 'Medium'
            });
        }

        // Add GPT-based recommendations
        gptAnalysis.overall.priorityImprovements.forEach(improvement => {
            recommendations.push({
                aspect: 'Content',
                suggestion: improvement,
                priority: 'High'
            });
        });

        return recommendations.sort((a, b) => 
            a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0
        );
    }
}

module.exports = new AnswerEvaluator(); 