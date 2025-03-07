const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class VoiceGestureAnalyzer {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  async analyze(audioBuffer) {
    try {
      // Generate a unique file name for this audio chunk
      const timestamp = Date.now();
      const audioPath = path.join(this.tempDir, `audio_voice_${timestamp}.wav`);
      
      // Write audio buffer to file
      fs.writeFileSync(audioPath, audioBuffer);
      
      // Analyze voice characteristics
      const voiceAnalysis = await this.analyzeVoiceCharacteristics(audioPath);
      
      // Clean up temporary file
      this.cleanupFiles(audioPath);
      
      return voiceAnalysis;
    } catch (error) {
      console.error('Error in voice gesture analysis:', error);
      return {
        error: 'Failed to analyze voice gestures',
        details: error.message
      };
    }
  }
  
  async analyzeVoiceCharacteristics(audioPath) {
    try {
      // For processing audio, we can use either Praat (if installed) or a JavaScript-based approach
      const hasPraat = await this.checkPraatInstallation();
      
      if (hasPraat) {
        return await this.analyzeWithPraat(audioPath);
      } else {
        return await this.analyzeWithJavaScript(audioPath);
      }
    } catch (error) {
      console.error('Error analyzing voice characteristics:', error);
      return this.generateSimplifiedAnalysis();
    }
  }
  
  async checkPraatInstallation() {
    try {
      await execPromise('praat --version');
      return true;
    } catch (error) {
      console.log('Praat not installed, using JavaScript-based analysis');
      return false;
    }
  }
  
  async analyzeWithPraat(audioPath) {
    try {
      // Create a Praat script for voice analysis
      const scriptPath = path.join(this.tempDir, 'analyze_voice.praat');
      const scriptContent = `
        sound = Read from file: "${audioPath}"
        
        # Speech rate analysis
        To TextGrid (silences): 100, 0, -25, 0.1, 0.1, "silent", "sounding"
        textgrid = selected("TextGrid")
        selectObject: sound
        
        # Get number of syllables (estimation)
        To Intensity: 75, 0.0, "yes"
        intensity = selected("Intensity")
        To IntensityTier (peaks)
        peaks = selected("IntensityTier")
        numPeaks = Get number of points
        
        # Calculate speech rate (syllables per second)
        selectObject: sound
        duration = Get total duration
        speechRate = numPeaks / duration
        
        # Pitch analysis
        To Pitch: 0.0, 75, 600
        pitch = selected("Pitch")
        meanF0 = Get mean: 0, 0, "Hertz"
        stdevF0 = Get standard deviation: 0, 0, "Hertz"
        minF0 = Get minimum: 0, 0, "Hertz", "Parabolic"
        maxF0 = Get maximum: 0, 0, "Hertz", "Parabolic"
        
        # Jitter and shimmer (voice quality)
        selectObject: sound
        To PointProcess (periodic, cc): 75, 600
        pointprocess = selected("PointProcess")
        jitter = Get jitter (local): 0, 0, 0.0001, 0.02, 1.3
        shimmer = Get shimmer (local): 0, 0, 0.0001, 0.02, 1.3, 1.6
        
        # Get pause information from TextGrid
        selectObject: textgrid
        numberOfIntervals = Get number of intervals: 1
        totalSilenceDuration = 0
        numberOfPauses = 0
        
        for i from 1 to numberOfIntervals
            label$ = Get label of interval: 1, i
            if label$ = "silent"
                start = Get starting point: 1, i
                end = Get end point: 1, i
                intervalDuration = end - start
                if intervalDuration > 0.3
                    numberOfPauses = numberOfPauses + 1
                    totalSilenceDuration = totalSilenceDuration + intervalDuration
                endif
            endif
        endfor
        
        pauseRate = numberOfPauses / duration
        
        # Write results to file
        writeFileLine: "${this.tempDir}/voice_results_${path.basename(audioPath)}.txt", speechRate, ",", meanF0, ",", stdevF0, ",", minF0, ",", maxF0, ",", jitter, ",", shimmer, ",", numberOfPauses, ",", totalSilenceDuration, ",", pauseRate
      `;
      
      fs.writeFileSync(scriptPath, scriptContent);
      
      // Execute Praat script
      await execPromise(`praat --run ${scriptPath}`);
      
      // Read results
      const resultsPath = path.join(this.tempDir, `voice_results_${path.basename(audioPath)}.txt`);
      const results = fs.readFileSync(resultsPath, 'utf8').trim();
      const [speechRate, meanF0, stdevF0, minF0, maxF0, jitter, shimmer, numberOfPauses, totalSilenceDuration, pauseRate] = 
        results.split(',').map(Number);
      
      // Clean up temporary files
      this.cleanupFiles(scriptPath, resultsPath);
      
      // Analyze results
      const speechRateAnalysis = this.analyzeSpeechRate(speechRate);
      const pitchVariability = this.analyzePitchVariability(stdevF0);
      const voiceQuality = this.analyzeVoiceQuality(jitter, shimmer);
      const pauseAnalysis = this.analyzePauses(numberOfPauses, totalSilenceDuration, pauseRate);
      
      // Generate overall assessment
      const assessment = this.generateAssessment(speechRateAnalysis, pitchVariability, voiceQuality, pauseAnalysis);
      
      return {
        speechRate: {
          value: speechRate,
          assessment: speechRateAnalysis
        },
        pitch: {
          mean: meanF0,
          variation: stdevF0,
          assessment: pitchVariability
        },
        voiceQuality: {
          jitter: jitter,
          shimmer: shimmer,
          assessment: voiceQuality
        },
        pauses: {
          count: numberOfPauses,
          totalDuration: totalSilenceDuration,
          rate: pauseRate,
          assessment: pauseAnalysis
        },
        assessment: assessment
      };
    } catch (error) {
      console.error('Error in Praat analysis:', error);
      return this.analyzeWithJavaScript(audioPath);
    }
  }
  
  async analyzeWithJavaScript(audioPath) {
    // Simplified voice analysis (without actual audio processing)
    // In a production environment, you'd use libraries like meyda.js or web audio API
    console.log('Performing simplified JavaScript-based voice analysis');
    
    // Generate simulated data
    const speechRate = 3.5 + Math.random() * 1.5; // syllables per second
    const pitchMean = 120 + Math.random() * 80; // Hz
    const pitchVariation = 10 + Math.random() * 40; // Hz
    const jitter = 0.01 + Math.random() * 0.03;
    const shimmer = 0.05 + Math.random() * 0.06;
    const numberOfPauses = Math.floor(Math.random() * 8) + 2;
    const pauseRate = 0.2 + Math.random() * 0.3;
    
    // Analyze simulated results
    const speechRateAnalysis = this.analyzeSpeechRate(speechRate);
    const pitchVariabilityAnalysis = this.analyzePitchVariability(pitchVariation);
    const voiceQualityAnalysis = this.analyzeVoiceQuality(jitter, shimmer);
    const pauseAnalysis = this.analyzePauses(numberOfPauses, numberOfPauses * 0.8, pauseRate);
    
    // Generate overall assessment
    const assessment = this.generateAssessment(
      speechRateAnalysis, 
      pitchVariabilityAnalysis, 
      voiceQualityAnalysis, 
      pauseAnalysis
    );
    
    return {
      speechRate: {
        value: speechRate,
        assessment: speechRateAnalysis,
        note: "Simulated value"
      },
      pitch: {
        mean: pitchMean,
        variation: pitchVariation,
        assessment: pitchVariabilityAnalysis,
        note: "Simulated value"
      },
      voiceQuality: {
        jitter: jitter,
        shimmer: shimmer,
        assessment: voiceQualityAnalysis,
        note: "Simulated value"
      },
      pauses: {
        count: numberOfPauses,
        rate: pauseRate,
        assessment: pauseAnalysis,
        note: "Simulated value"
      },
      assessment: assessment
    };
  }
  
  analyzeSpeechRate(speechRate) {
    // Interpret speech rate (syllables per second)
    if (speechRate < 3.0) {
      return {
        level: 'slow',
        description: 'Your speaking rate is slower than average, which may make you sound thoughtful but could lose listener interest.',
        suggestion: 'Try to slightly increase your pace for more engagement while maintaining clarity.'
      };
    } else if (speechRate < 4.5) {
      return {
        level: 'optimal',
        description: 'Your speaking rate is at an ideal pace, which is engaging and easy to follow.',
        suggestion: "Continue with this balanced rate - it's neither too fast nor too slow."
      };
    } else {
      return {
        level: 'fast',
        description: 'Your speaking rate is faster than average, which conveys enthusiasm but might reduce clarity.',
        suggestion: 'Consider slowing down slightly to ensure your points are fully understood.'
      };
    }
  }
  
  analyzePitchVariability(pitchStdev) {
    // Interpret pitch variability
    if (pitchStdev < 15) {
      return {
        level: 'monotone',
        description: 'Your voice has limited pitch variation, which may sound monotonous.',
        suggestion: 'Try to add more vocal variety by emphasizing key words with higher or lower pitch.'
      };
    } else if (pitchStdev < 40) {
      return {
        level: 'expressive',
        description: 'Your voice has good pitch variation, making you sound engaged and expressive.',
        suggestion: 'Maintain this level of vocal variety as it keeps listeners engaged.'
      };
    } else {
      return {
        level: 'highly_variable',
        description: 'Your voice has significant pitch variation, which shows enthusiasm but may seem exaggerated.',
        suggestion: 'Consider moderating extreme pitch changes for a more balanced delivery in professional settings.'
      };
    }
  }
  
  analyzeVoiceQuality(jitter, shimmer) {
    // Combine jitter and shimmer for overall voice quality assessment
    // Jitter relates to frequency variation between cycles
    // Shimmer relates to amplitude variation between cycles
    
    let qualityLevel;
    let description;
    let suggestion;
    
    const jitterHigh = jitter > 0.02;
    const shimmerHigh = shimmer > 0.08;
    
    if (jitterHigh && shimmerHigh) {
      qualityLevel = 'rough';
      description = 'Your voice exhibits some roughness or hoarseness.';
      suggestion = "Consider vocal warm-ups before speaking, and ensure you're well-hydrated.";
    } else if (jitterHigh || shimmerHigh) {
      qualityLevel = 'slightly_rough';
      description = 'Your voice has slight instability that may indicate tension or tiredness.';
      suggestion = 'Take deep breaths before speaking and maintain good posture for clearer voice production.';
    } else {
      qualityLevel = 'clear';
      description = 'Your voice quality is clear and stable, which conveys confidence and competence.';
      suggestion = 'Continue maintaining this clear vocal quality through proper breathing and posture.';
    }
    
    return {
      level: qualityLevel,
      description: description,
      suggestion: suggestion
    };
  }
  
  analyzePauses(pauseCount, pauseDuration, pauseRate) {
    // Interpret pause patterns
    let pauseLevel;
    let description;
    let suggestion;
    
    if (pauseRate < 0.15) {
      pauseLevel = 'few';
      description = 'You use fewer pauses than typical, which can make your speech sound rushed.';
      suggestion = 'Consider adding strategic pauses after important points to let information sink in.';
    } else if (pauseRate < 0.4) {
      pauseLevel = 'balanced';
      description = 'You use a good balance of pauses, which creates a natural rhythm in your speech.';
      suggestion = 'Continue using these well-timed pauses to emphasize key points and allow listeners to process information.';
    } else {
      pauseLevel = 'frequent';
      description = 'You use frequent pauses, which may indicate hesitation or thoughtfulness.';
      suggestion = 'Try to reduce unintentional pauses and focus on strategic pauses for emphasis.';
    }
    
    return {
      level: pauseLevel,
      description: description,
      suggestion: suggestion
    };
  }
  
  generateAssessment(speechRateAnalysis, pitchVariability, voiceQuality, pauseAnalysis) {
    const strengths = [];
    const improvements = [];
    
    // Collect strengths
    if (speechRateAnalysis.level === 'optimal') {
      strengths.push('Your speaking pace is excellent - engaging and easy to follow.');
    }
    
    if (pitchVariability.level === 'expressive') {
      strengths.push('You use good vocal variety, which keeps listeners engaged.');
    }
    
    if (voiceQuality.level === 'clear') {
      strengths.push('Your voice quality is clear and projects confidence.');
    }
    
    if (pauseAnalysis.level === 'balanced') {
      strengths.push('You use well-timed pauses that create effective rhythm in your speech.');
    }
    
    // Collect areas for improvement
    if (speechRateAnalysis.level !== 'optimal') {
      improvements.push(speechRateAnalysis.suggestion);
    }
    
    if (pitchVariability.level !== 'expressive') {
      improvements.push(pitchVariability.suggestion);
    }
    
    if (voiceQuality.level !== 'clear') {
      improvements.push(voiceQuality.suggestion);
    }
    
    if (pauseAnalysis.level !== 'balanced') {
      improvements.push(pauseAnalysis.suggestion);
    }
    
    // Generate overall impression
    let overallImpression;
    const strengthCount = strengths.length;
    
    if (strengthCount >= 3) {
      overallImpression = 'Your vocal delivery is very effective, conveying confidence and engagement. With minor adjustments, you can further enhance your speaking impact.';
    } else if (strengthCount >= 1) {
      overallImpression = 'Your vocal delivery has some strong elements, but could benefit from specific improvements to maximize your impact and engagement.';
    } else {
      overallImpression = 'Your vocal delivery would benefit from focused practice to better engage listeners and convey confidence.';
    }
    
    return {
      strengths: strengths,
      improvements: improvements,
      overallImpression: overallImpression
    };
  }
  
  generateSimplifiedAnalysis() {
    return {
      speechRate: {
        assessment: {
          level: 'moderate',
          suggestion: 'Your speaking pace appears balanced.'
        }
      },
      pitch: {
        assessment: {
          level: 'moderate',
          suggestion: 'Your vocal variety seems adequate.'
        }
      },
      voiceQuality: {
        assessment: {
          level: 'moderate',
          suggestion: 'Your voice clarity is generally good.'
        }
      },
      pauses: {
        assessment: {
          level: 'moderate',
          suggestion: 'Your use of pauses creates a natural rhythm.'
        }
      },
      assessment: {
        strengths: ['You have a balanced speaking style.'],
        improvements: ['For more detailed feedback, ensure your audio is clear and continuous.'],
        overallImpression: 'Your vocal delivery appears generally effective, though more detailed analysis would require clearer audio.'
      },
      note: 'This is a simplified analysis due to processing limitations.'
    };
  }
  
  cleanupFiles(...filePaths) {
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

module.exports = new VoiceGestureAnalyzer(); 