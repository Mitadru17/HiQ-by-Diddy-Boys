const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class ToneAnalyzerService {
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
      const audioPath = path.join(this.tempDir, `audio_tone_${timestamp}.wav`);
      
      // Write audio buffer to file
      fs.writeFileSync(audioPath, audioBuffer);
      
      // Analyze tone using Praat (requires Praat to be installed)
      // If Praat is not installed, we'll use a simplified JavaScript-based analysis
      const hasPraat = await this.checkPraatInstallation();
      
      let toneAnalysis;
      
      if (hasPraat) {
        toneAnalysis = await this.analyzeWithPraat(audioPath);
      } else {
        toneAnalysis = await this.analyzeWithJavaScript(audioPath);
      }
      
      // Clean up temporary file
      this.cleanupFiles(audioPath);
      
      return toneAnalysis;
    } catch (error) {
      console.error('Error in tone analysis:', error);
      return {
        error: 'Failed to analyze tone',
        details: error.message
      };
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
      // Create a Praat script for tone analysis
      const scriptPath = path.join(this.tempDir, 'analyze_tone.praat');
      const scriptContent = `
        sound = Read from file: "${audioPath}"
        To Pitch: 0.0, 75, 600
        meanF0 = Get mean: 0, 0, "Hertz"
        minF0 = Get minimum: 0, 0, "Hertz", "Parabolic"
        maxF0 = Get maximum: 0, 0, "Hertz", "Parabolic"
        stdevF0 = Get standard deviation: 0, 0, "Hertz"
        
        selectObject: sound
        To Intensity: 75, 0.0, "yes"
        meanIntensity = Get mean: 0, 0
        minIntensity = Get minimum: 0, 0, "Parabolic"
        maxIntensity = Get maximum: 0, 0, "Parabolic"
        
        writeFileLine: "${this.tempDir}/tone_results_${path.basename(audioPath)}.txt", 
        ...meanF0, ",", minF0, ",", maxF0, ",", stdevF0, ",", 
        ...meanIntensity, ",", minIntensity, ",", maxIntensity
      `;
      
      fs.writeFileSync(scriptPath, scriptContent);
      
      // Execute Praat script
      await execPromise(`praat --run ${scriptPath}`);
      
      // Read results
      const resultsPath = path.join(this.tempDir, `tone_results_${path.basename(audioPath)}.txt`);
      const results = fs.readFileSync(resultsPath, 'utf8').trim();
      const [meanF0, minF0, maxF0, stdevF0, meanIntensity, minIntensity, maxIntensity] = 
        results.split(',').map(Number);
      
      // Clean up temporary files
      this.cleanupFiles(scriptPath, resultsPath);
      
      // Interpret results
      const pitchVariability = this.interpretPitchVariability(stdevF0);
      const volumeLevel = this.interpretVolumeLevel(meanIntensity);
      const confidenceLevel = this.assessConfidence({
        pitchVariability,
        volumeLevel,
        pitchRange: maxF0 - minF0
      });
      
      return {
        pitch: {
          mean: meanF0,
          min: minF0,
          max: maxF0,
          variability: pitchVariability
        },
        volume: {
          mean: meanIntensity,
          min: minIntensity,
          max: maxIntensity,
          level: volumeLevel
        },
        confidence: confidenceLevel,
        suggestions: this.generateToneSuggestions(pitchVariability, volumeLevel, confidenceLevel)
      };
    } catch (error) {
      console.error('Error in Praat analysis:', error);
      return this.analyzeWithJavaScript(audioPath);
    }
  }
  
  async analyzeWithJavaScript(audioPath) {
    // This is a simplified tone analysis using JavaScript
    // In a production environment, you would use a proper audio analysis library
    // Such as librosa-js or TensorFlow.js with audio models
    
    // For this example, we'll return simulated results
    console.log('Performing simplified JavaScript-based tone analysis');
    
    // Generate some random values for demonstration
    const meanF0 = 120 + Math.random() * 50;
    const stdevF0 = 10 + Math.random() * 30;
    const meanIntensity = 60 + Math.random() * 15;
    
    // Interpret results
    const pitchVariability = this.interpretPitchVariability(stdevF0);
    const volumeLevel = this.interpretVolumeLevel(meanIntensity);
    const confidenceLevel = this.assessConfidence({
      pitchVariability,
      volumeLevel,
      pitchRange: 100
    });
    
    return {
      pitch: {
        mean: meanF0,
        variability: pitchVariability,
        note: "These values are simulated for demonstration purposes"
      },
      volume: {
        mean: meanIntensity,
        level: volumeLevel,
        note: "These values are simulated for demonstration purposes"
      },
      confidence: confidenceLevel,
      suggestions: this.generateToneSuggestions(pitchVariability, volumeLevel, confidenceLevel)
    };
  }
  
  interpretPitchVariability(stdevF0) {
    if (stdevF0 < 15) {
      return { level: 'low', description: 'monotone speaking style' };
    } else if (stdevF0 < 40) {
      return { level: 'moderate', description: 'good vocal variety' };
    } else {
      return { level: 'high', description: 'highly expressive speaking style' };
    }
  }
  
  interpretVolumeLevel(meanIntensity) {
    if (meanIntensity < 55) {
      return { level: 'low', description: 'quiet speaking volume' };
    } else if (meanIntensity < 70) {
      return { level: 'moderate', description: 'good speaking volume' };
    } else {
      return { level: 'high', description: 'loud speaking volume' };
    }
  }
  
  assessConfidence({ pitchVariability, volumeLevel, pitchRange }) {
    // Very simple heuristic for confidence assessment
    let confidenceScore = 0;
    
    // Moderate pitch variability indicates confidence
    if (pitchVariability.level === 'moderate') {
      confidenceScore += 0.4;
    } else if (pitchVariability.level === 'high') {
      confidenceScore += 0.3; // Too much variability might indicate nervousness
    } else {
      confidenceScore += 0.1; // Monotone suggests less confidence
    }
    
    // Moderate to high volume indicates confidence
    if (volumeLevel.level === 'moderate') {
      confidenceScore += 0.4;
    } else if (volumeLevel.level === 'high') {
      confidenceScore += 0.5;
    } else {
      confidenceScore += 0.1;
    }
    
    // Interpret confidence score
    let confidenceLevel = '';
    if (confidenceScore < 0.4) {
      confidenceLevel = 'low';
    } else if (confidenceScore < 0.7) {
      confidenceLevel = 'moderate';
    } else {
      confidenceLevel = 'high';
    }
    
    return {
      score: confidenceScore,
      level: confidenceLevel
    };
  }
  
  generateToneSuggestions(pitchVariability, volumeLevel, confidenceLevel) {
    const suggestions = [];
    
    if (pitchVariability.level === 'low') {
      suggestions.push('Try to vary your pitch more to sound more engaging and less monotone.');
    } else if (pitchVariability.level === 'high') {
      suggestions.push('Your vocal variety is excellent, but consider moderating extreme pitch changes for a more balanced delivery.');
    }
    
    if (volumeLevel.level === 'low') {
      suggestions.push('Consider speaking a bit louder to project confidence and ensure you are heard clearly.');
    } else if (volumeLevel.level === 'high') {
      suggestions.push('Your volume is good, but you may want to lower it slightly in some segments.');
    }
    
    if (confidenceLevel.level === 'low') {
      suggestions.push('Work on projecting more confidence by speaking at a moderate pace with good volume and vocal variety.');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Your tone and delivery sound confident and engaging.');
    }
    
    return suggestions;
  }
  
  cleanupFiles(...filePaths) {
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

module.exports = new ToneAnalyzerService(); 