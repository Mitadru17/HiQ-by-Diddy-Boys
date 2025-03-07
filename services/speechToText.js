const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Using local Whisper model for speech-to-text
// This implementation assumes you have Whisper installed locally
// Alternative: You can use the OpenAI API for Whisper

class SpeechToTextService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  async transcribe(audioBuffer) {
    try {
      // Generate a unique file name for this audio chunk
      const timestamp = Date.now();
      const audioPath = path.join(this.tempDir, `audio_${timestamp}.wav`);
      
      // Write audio buffer to file
      fs.writeFileSync(audioPath, audioBuffer);
      
      // Process with Whisper (local installation)
      // You can change the model size based on your needs (tiny, base, small, medium, large)
      const { stdout, stderr } = await execPromise(`whisper ${audioPath} --model base --language en --output_format txt`);
      
      if (stderr) {
        console.error('Whisper stderr:', stderr);
      }
      
      // Read transcription result
      const transcriptionPath = `${audioPath}.txt`;
      let transcription = '';
      
      if (fs.existsSync(transcriptionPath)) {
        transcription = fs.readFileSync(transcriptionPath, 'utf8').trim();
        
        // Clean up temporary files
        this.cleanupFiles(audioPath, transcriptionPath);
      }
      
      return transcription;
    } catch (error) {
      console.error('Error in speech-to-text processing:', error);
      return null;
    }
  }
  
  // Alternative implementation using Node-Whisper package
  async transcribeWithNodeWhisper(audioBuffer) {
    try {
      const nodeWhisper = require('node-whisper');
      
      // Generate a unique file name for this audio chunk
      const timestamp = Date.now();
      const audioPath = path.join(this.tempDir, `audio_${timestamp}.wav`);
      
      // Write audio buffer to file
      fs.writeFileSync(audioPath, audioBuffer);
      
      // Process with node-whisper
      const transcription = await nodeWhisper.transcribe(audioPath, {
        modelName: 'base', // tiny, base, small, medium, large
        language: 'en'
      });
      
      // Clean up temporary file
      fs.unlinkSync(audioPath);
      
      return transcription.text;
    } catch (error) {
      console.error('Error in node-whisper processing:', error);
      return null;
    }
  }
  
  cleanupFiles(...filePaths) {
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

module.exports = new SpeechToTextService(); 