const natural = require('natural');
const { HfInference } = require('@huggingface/inference');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const NGrams = natural.NGrams;

class SpeechCharacteristics {
    constructor() {
        this.tokenizer = tokenizer;
        this.tfidf = new TfIdf();
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        
        // Initialize speech rate benchmarks (words per minute)
        this.SPEECH_RATE_BENCHMARKS = {
            slow: 120,
            optimal: 150,
            fast: 180
        };

        // Fluency markers
        this.FILLER_WORDS = new Set([
            'um', 'uh', 'er', 'ah', 'like', 'you know', 'sort of', 'kind of',
            'basically', 'actually', 'literally', 'stuff', 'things'
        ]);

        // Tone indicators
        this.TONE_MARKERS = {
            professional: ['therefore', 'consequently', 'furthermore', 'moreover', 'specifically'],
            confident: ['definitely', 'certainly', 'absolutely', 'clearly', 'strongly'],
            uncertain: ['maybe', 'perhaps', 'possibly', 'might', 'could be'],
            enthusiastic: ['excited', 'passionate', 'love', 'enjoy', 'fantastic']
        };
    }

    /**
     * Analyze speech characteristics from transcribed text
     * @param {string} text - Transcribed speech text
     * @param {number} durationSeconds - Duration of the speech in seconds
     * @returns {Promise<object>} Detailed speech analysis
     */
    async analyzeSpeech(text, durationSeconds) {
        const words = this.tokenizer.tokenize(text);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Parallel processing of different analyses
        const [
            toneAnalysis,
            fluencyMetrics,
            prosodyAnalysis
        ] = await Promise.all([
            this.analyzeTone(text),
            this.analyzeFluency(words, sentences),
            this.analyzeProsody(text)
        ]);

        // Calculate speaking pace
        const paceMetrics = this.analyzePace(words.length, durationSeconds);

        return {
            tone: toneAnalysis,
            fluency: fluencyMetrics,
            pace: paceMetrics,
            prosody: prosodyAnalysis,
            recommendations: this.generateRecommendations({
                toneAnalysis,
                fluencyMetrics,
                paceMetrics,
                prosodyAnalysis
            })
        };
    }

    /**
     * Analyze speech tone using HuggingFace model and linguistic markers
     */
    async analyzeTone(text) {
        // Use HuggingFace for emotion detection
        const emotionResult = await this.hf.textClassification({
            model: 'SamLowe/roberta-base-go_emotions',
            inputs: text
        });

        // Analyze professional tone markers
        const toneMarkerAnalysis = Object.entries(this.TONE_MARKERS)
            .reduce((acc, [tone, markers]) => {
                const count = markers.reduce((sum, marker) => 
                    sum + (text.toLowerCase().match(new RegExp(marker, 'g')) || []).length, 0);
                acc[tone] = count / markers.length; // Normalize by number of markers
                return acc;
            }, {});

        return {
            emotions: emotionResult.map(r => ({
                emotion: r.label,
                intensity: r.score
            })),
            professionalTone: toneMarkerAnalysis.professional,
            confidence: toneMarkerAnalysis.confident,
            enthusiasm: toneMarkerAnalysis.enthusiastic,
            uncertainty: toneMarkerAnalysis.uncertain,
            overallTone: this.calculateOverallTone(emotionResult, toneMarkerAnalysis)
        };
    }

    /**
     * Analyze speech fluency
     */
    async analyzeFluency(words, sentences) {
        // Calculate various fluency metrics
        const fillerWordCount = words.filter(word => 
            this.FILLER_WORDS.has(word.toLowerCase())).length;
        
        const repetitions = this.detectRepetitions(words);
        const sentenceComplexity = this.analyzeSentenceComplexity(sentences);
        
        // Calculate pause patterns using punctuation and natural breaks
        const pausePatterns = this.analyzePausePatterns(sentences);

        return {
            fillerWords: {
                count: fillerWordCount,
                ratio: fillerWordCount / words.length,
                instances: this.identifyFillerWords(words)
            },
            repetitions: {
                count: repetitions.length,
                instances: repetitions
            },
            sentenceStructure: {
                complexity: sentenceComplexity,
                variety: this.calculateSentenceVariety(sentences)
            },
            pausePatterns: pausePatterns,
            fluencyScore: this.calculateFluencyScore({
                fillerRatio: fillerWordCount / words.length,
                repetitionCount: repetitions.length,
                complexity: sentenceComplexity
            })
        };
    }

    /**
     * Analyze speech prosody (rhythm, stress, intonation)
     */
    async analyzeProsody(text) {
        // Analyze sentence endings for intonation patterns
        const intonationPatterns = this.analyzeIntonation(text);
        
        // Detect emphasis patterns using capitalization and punctuation
        const emphasisPatterns = this.detectEmphasis(text);

        return {
            intonation: intonationPatterns,
            emphasis: emphasisPatterns,
            rhythm: this.analyzeRhythm(text),
            naturalness: this.calculateNaturalness(text)
        };
    }

    /**
     * Analyze speaking pace
     */
    analyzePace(wordCount, durationSeconds) {
        const wordsPerMinute = (wordCount / durationSeconds) * 60;
        
        return {
            wordsPerMinute,
            paceCategory: this.categorizePace(wordsPerMinute),
            variability: this.calculatePaceVariability(wordCount, durationSeconds),
            recommendation: this.getPaceRecommendation(wordsPerMinute)
        };
    }

    /**
     * Detect repetitions in speech
     */
    detectRepetitions(words) {
        const repetitions = [];
        const ngrams = NGrams.bigrams(words);
        
        ngrams.forEach((bigram, index) => {
            if (index > 0 && 
                bigram[0].toLowerCase() === ngrams[index - 1][1].toLowerCase()) {
                repetitions.push({
                    word: bigram[0],
                    position: index
                });
            }
        });

        return repetitions;
    }

    /**
     * Analyze sentence complexity
     */
    analyzeSentenceComplexity(sentences) {
        return sentences.map(sentence => {
            const words = this.tokenizer.tokenize(sentence);
            const clauseCount = this.countClauses(sentence);
            
            return {
                length: words.length,
                clauses: clauseCount,
                complexity: this.calculateComplexityScore(words.length, clauseCount)
            };
        });
    }

    /**
     * Analyze pause patterns
     */
    analyzePausePatterns(sentences) {
        return sentences.map(sentence => {
            const commaCount = (sentence.match(/,/g) || []).length;
            const naturalBreaks = this.detectNaturalBreaks(sentence);
            
            return {
                deliberatePauses: commaCount,
                naturalBreaks: naturalBreaks,
                rhythm: this.assessPauseRhythm(sentence)
            };
        });
    }

    /**
     * Calculate overall fluency score
     */
    calculateFluencyScore({ fillerRatio, repetitionCount, complexity }) {
        const weights = {
            fillerWords: 0.3,
            repetitions: 0.3,
            complexity: 0.4
        };

        const fillerScore = Math.max(0, 1 - fillerRatio * 2);
        const repetitionScore = Math.max(0, 1 - (repetitionCount / 10));
        const complexityScore = this.normalizeComplexity(complexity);

        return (
            fillerScore * weights.fillerWords +
            repetitionScore * weights.repetitions +
            complexityScore * weights.complexity
        ) * 10; // Scale to 0-10
    }

    /**
     * Generate specific recommendations for improvement
     */
    generateRecommendations({ toneAnalysis, fluencyMetrics, paceMetrics, prosodyAnalysis }) {
        const recommendations = [];

        // Tone recommendations
        if (toneAnalysis.uncertainty > 0.3) {
            recommendations.push({
                aspect: 'Tone',
                suggestion: 'Use more confident language and avoid tentative phrases',
                priority: 'High'
            });
        }

        // Fluency recommendations
        if (fluencyMetrics.fillerWords.ratio > 0.1) {
            recommendations.push({
                aspect: 'Fluency',
                suggestion: 'Reduce filler words and practice more structured responses',
                priority: 'High',
                specificInstances: fluencyMetrics.fillerWords.instances
            });
        }

        // Pace recommendations
        if (paceMetrics.paceCategory !== 'optimal') {
            recommendations.push({
                aspect: 'Pace',
                suggestion: paceMetrics.recommendation,
                priority: 'Medium'
            });
        }

        // Prosody recommendations
        if (prosodyAnalysis.naturalness < 0.7) {
            recommendations.push({
                aspect: 'Delivery',
                suggestion: 'Work on making speech more natural and varied in tone',
                priority: 'Medium'
            });
        }

        return recommendations.sort((a, b) => 
            a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0
        );
    }
}

module.exports = new SpeechCharacteristics(); 