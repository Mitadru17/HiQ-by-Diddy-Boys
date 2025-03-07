require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Import our modules
const speechToText = require('./services/speechToText');
const responseAnalyzer = require('./services/responseAnalyzer');
const toneAnalyzer = require('./services/toneAnalyzer');
const voiceGestureAnalyzer = require('./services/gestureAnalyzer');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections
const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const userSession = {
    id: clientId,
    ws,
    audioChunks: [],
    videoChunks: [],
    interviewState: {
      currentQuestion: null,
      expectedAnswer: null,
      analysisResults: {}
    }
  };
  
  clients.set(clientId, userSession);
  
  console.log(`Client connected: ${clientId}`);
  
  // Send welcome message with client ID
  ws.send(JSON.stringify({
    type: 'connection',
    clientId,
    message: 'Connected to interview server'
  }));
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'startInterview':
          // Initialize interview with questions
          userSession.interviewState.currentQuestion = data.question;
          userSession.interviewState.expectedAnswer = data.expectedAnswer;
          ws.send(JSON.stringify({
            type: 'interviewStarted',
            question: data.question
          }));
          break;
          
        case 'audioChunk':
          // Process incoming audio chunk
          userSession.audioChunks.push(Buffer.from(data.audio, 'base64'));
          
          // After collecting enough audio, process speech-to-text
          if (userSession.audioChunks.length >= 10) { // Adjust based on performance
            const audioBuffer = Buffer.concat(userSession.audioChunks);
            const transcription = await speechToText.transcribe(audioBuffer);
            userSession.audioChunks = []; // Reset for next batch
            
            if (transcription) {
              // Analyze the response
              const correctnessAnalysis = await responseAnalyzer.analyzeCorrectness(
                transcription, 
                userSession.interviewState.expectedAnswer
              );
              
              const grammarAnalysis = await responseAnalyzer.analyzeGrammar(transcription);
              
              userSession.interviewState.analysisResults = {
                transcription,
                correctness: correctnessAnalysis,
                grammar: grammarAnalysis
              };
              
              // Send real-time feedback
              ws.send(JSON.stringify({
                type: 'feedback',
                analysis: userSession.interviewState.analysisResults
              }));
            }
          }
          break;
          
        case 'audioComplete':
          // Final processing when audio segment is complete
          if (userSession.audioChunks.length > 0) {
            const audioBuffer = Buffer.concat(userSession.audioChunks);
            const transcription = await speechToText.transcribe(audioBuffer);
            
            // Voice gesture analysis (replaces video-based gesture analysis)
            const voiceGestureAnalysis = await voiceGestureAnalyzer.analyze(audioBuffer);
            
            // Full tone analysis
            const toneAnalysis = await toneAnalyzer.analyze(audioBuffer);
            
            userSession.audioChunks = []; // Reset for next segment
            
            userSession.interviewState.analysisResults = {
              ...userSession.interviewState.analysisResults,
              transcription,
              voiceGestures: voiceGestureAnalysis,
              tone: toneAnalysis
            };
            
            ws.send(JSON.stringify({
              type: 'completeAnalysis',
              analysis: userSession.interviewState.analysisResults
            }));
          }
          break;
          
        case 'videoFrame':
          // We're no longer using video frames, inform the client
          ws.send(JSON.stringify({
            type: 'info',
            message: 'Video analysis has been replaced with voice gesture analysis'
          }));
          break;
          
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing your request'
      }));
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });
});

// REST API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 