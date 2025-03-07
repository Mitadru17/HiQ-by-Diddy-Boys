const axios = require('axios');

class ResponseAnalyzerService {
  constructor() {
    // Hugging Face API token should be stored in environment variables
    this.apiToken = process.env.HUGGING_FACE_TOKEN;
    this.bertModelEndpoint = 'https://api-inference.huggingface.co/models/bert-base-uncased';
    this.bartModelEndpoint = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
    this.grammarModelEndpoint = 'https://api-inference.huggingface.co/models/textattack/roberta-base-CoLA';
  }

  async analyzeCorrectness(userResponse, expectedAnswer) {
    try {
      // Compare the user's response with the expected answer using semantic similarity
      const payload = {
        inputs: {
          source_sentence: expectedAnswer,
          sentences: [userResponse]
        }
      };

      const response = await axios.post(
        this.bertModelEndpoint,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const similarityScore = response.data[0];
      
      // Classify the response using zero-shot classification
      const classificationPayload = {
        inputs: userResponse,
        parameters: {
          candidate_labels: ["correct", "partially correct", "incorrect"]
        }
      };

      const classificationResponse = await axios.post(
        this.bartModelEndpoint,
        classificationPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract suggestions based on missing key points
      const keyPoints = this.extractKeyPoints(expectedAnswer);
      const includedPoints = this.findIncludedPoints(userResponse, keyPoints);
      const missingPoints = keyPoints.filter(point => !includedPoints.includes(point));

      // Format feedback
      return {
        similarity: similarityScore,
        classification: {
          label: classificationResponse.data.labels[0],
          score: classificationResponse.data.scores[0]
        },
        keyPoints: {
          total: keyPoints.length,
          included: includedPoints,
          missing: missingPoints
        },
        suggestions: this.generateSuggestions(missingPoints)
      };
    } catch (error) {
      console.error('Error in correctness analysis:', error);
      return {
        error: 'Failed to analyze response correctness',
        details: error.message
      };
    }
  }

  async analyzeGrammar(text) {
    try {
      const payload = {
        inputs: text
      };

      const response = await axios.post(
        this.grammarModelEndpoint,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Classify text for grammatical correctness
      const grammarScore = response.data[0][0].score;
      
      // Simple grammar error detection
      const commonErrors = this.detectCommonGrammarErrors(text);

      return {
        grammarScore: grammarScore,
        isGrammaticallyCorrect: grammarScore > 0.7,
        clarity: this.assessClarity(text),
        errors: commonErrors,
        suggestions: this.generateGrammarSuggestions(commonErrors)
      };
    } catch (error) {
      console.error('Error in grammar analysis:', error);
      return {
        error: 'Failed to analyze grammar',
        details: error.message
      };
    }
  }

  // Helper functions
  extractKeyPoints(expectedAnswer) {
    // Simple implementation - split by sentences and consider each as a key point
    // A more sophisticated approach would use NLP to extract actual key points
    return expectedAnswer
      .split(/[.!?]/)
      .map(point => point.trim())
      .filter(point => point.length > 10); // Filter out short fragments
  }

  findIncludedPoints(userResponse, keyPoints) {
    // Simplified approach - check if the user response contains key phrases from each point
    return keyPoints.filter(point => {
      const keyPhrases = this.extractKeyPhrases(point);
      return keyPhrases.some(phrase => 
        userResponse.toLowerCase().includes(phrase.toLowerCase())
      );
    });
  }

  extractKeyPhrases(text) {
    // Extract important phrases (simplified approach - just key noun phrases)
    // A more sophisticated approach would use NLP for key phrase extraction
    const words = text.split(' ');
    
    // Generate phrases of 2-3 words that might be significant
    const phrases = [];
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i+1]}`);
      if (i < words.length - 2) {
        phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
      }
    }
    
    return phrases;
  }

  generateSuggestions(missingPoints) {
    if (missingPoints.length === 0) {
      return ['Your answer covered all key points. Well done!'];
    }
    
    return [
      'Consider including these points in your answer:',
      ...missingPoints.map(point => `- ${point}`)
    ];
  }

  detectCommonGrammarErrors(text) {
    const errors = [];
    
    // Check for repeated words
    const repeatedWordRegex = /\b(\w+)\s+\1\b/gi;
    const repeatedWords = text.match(repeatedWordRegex);
    
    if (repeatedWords) {
      errors.push({
        type: 'repeatedWords',
        instances: repeatedWords
      });
    }
    
    // Check for sentence fragments (simplified)
    const sentences = text.split(/[.!?]/);
    const fragments = sentences.filter(sentence => {
      const trimmed = sentence.trim();
      return trimmed.length > 0 && trimmed.length < 15;
    });
    
    if (fragments.length > 0) {
      errors.push({
        type: 'possibleFragments',
        instances: fragments
      });
    }
    
    return errors;
  }

  generateGrammarSuggestions(errors) {
    const suggestions = [];
    
    for (const error of errors) {
      if (error.type === 'repeatedWords') {
        suggestions.push('Avoid word repetition: ' + error.instances.join(', '));
      } else if (error.type === 'possibleFragments') {
        suggestions.push('Try to use complete sentences instead of fragments.');
      }
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Your grammar appears to be good.');
    }
    
    return suggestions;
  }

  assessClarity(text) {
    // Simplified clarity assessment
    // More sophisticated approach would analyze sentence structure and vocabulary
    
    // Average words per sentence
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;
    
    if (sentences.length === 0) return { score: 0, level: 'poor' };
    
    const avgWordsPerSentence = totalWords / sentences.length;
    
    // Assess clarity based on sentence length
    let clarityScore = 0;
    let clarityLevel = '';
    
    if (avgWordsPerSentence < 10) {
      // Too short - might be too simplistic
      clarityScore = 0.5;
      clarityLevel = 'somewhat clear, but potentially too simplistic';
    } else if (avgWordsPerSentence > 25) {
      // Too long - might be complex and hard to follow
      clarityScore = 0.3;
      clarityLevel = 'potentially unclear - sentences are quite long';
    } else {
      // Good range
      clarityScore = 0.9;
      clarityLevel = 'good';
    }
    
    return {
      score: clarityScore,
      level: clarityLevel,
      metrics: {
        avgWordsPerSentence
      }
    };
  }
}

module.exports = new ResponseAnalyzerService(); 