# Real-Time AI-Powered Mock Interview System

A backend system for conducting AI-powered mock interviews with real-time feedback on speech, grammar, tone, and voice gestures.

## Features

- **Real-time Speech Processing**: Accepts live audio via WebSockets and converts to text
- **Response Analysis**: Evaluates correctness compared to expected answers
- **Grammar Analysis**: Assesses grammatical accuracy and clarity
- **Tone Analysis**: Analyzes pitch, speed, and volume to evaluate confidence
- **Voice Gesture Analysis**: Analyzes speech rate, voice quality, pitch variability, and pause patterns
- **Real-time Feedback**: Provides immediate structured feedback in JSON format

## Technology Stack

- **Backend**: Node.js with Express
- **Real-time Communication**: WebSockets
- **Speech-to-Text**: OpenAI Whisper (local installation) or Node-Whisper
- **NLP/Text Analysis**: Hugging Face models (BERT, BART, RoBERTa)
- **Audio Analysis**: Praat (optional) with JavaScript fallback
- **Voice Gesture Analysis**: Praat or JavaScript-based analysis of vocal characteristics

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)
- OpenAI Whisper (for local speech-to-text) or Node-Whisper
- Hugging Face API key (for NLP models)
- Praat (optional, for advanced audio analysis)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/ai-mock-interview-system.git
   cd ai-mock-interview-system
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file with the following environment variables:

   ```
   PORT=3000
   HUGGING_FACE_TOKEN=your_hugging_face_api_token
   ```

4. Install Whisper (optional for local processing):

   ```
   pip install openai-whisper
   ```

5. Install Praat (optional for advanced audio analysis):
   - Download from [Praat website](https://www.fon.hum.uva.nl/praat/)
   - Add to system PATH

### Running the Server

Start the development server:

```
npm run dev
```

For production:

```
npm start
```

## API Usage

### WebSocket API

Connect to the WebSocket server:

```javascript
const socket = new WebSocket("ws://localhost:3000");
```

#### Message Types

1. **startInterview**: Initialize interview with questions

   ```javascript
   socket.send(
     JSON.stringify({
       type: "startInterview",
       question: "Tell me about your experience with Node.js",
       expectedAnswer:
         "I have 3 years of experience with Node.js building RESTful APIs and WebSocket applications.",
     })
   );
   ```

2. **audioChunk**: Send audio data chunk

   ```javascript
   socket.send(
     JSON.stringify({
       type: "audioChunk",
       audio: base64EncodedAudioData,
     })
   );
   ```

3. **audioComplete**: Signal the end of audio input

   ```javascript
   socket.send(
     JSON.stringify({
       type: "audioComplete",
     })
   );
   ```

#### Response Types

1. **connection**: Initial connection response

   ```javascript
   {
     type: 'connection',
     clientId: 'uuid',
     message: 'Connected to interview server'
   }
   ```

2. **interviewStarted**: Confirmation of interview start

   ```javascript
   {
     type: 'interviewStarted',
     question: 'Tell me about your experience with Node.js'
   }
   ```

3. **feedback**: Real-time feedback

   ```javascript
   {
     type: 'feedback',
     analysis: {
       transcription: 'I have worked with Node.js for 2 years...',
       correctness: { /* correctness analysis */ },
       grammar: { /* grammar analysis */ }
     }
   }
   ```

4. **completeAnalysis**: Complete analysis at the end of a response

   ```javascript
   {
     type: 'completeAnalysis',
     analysis: {
       transcription: 'Full transcription...',
       correctness: { /* detailed correctness analysis */ },
       grammar: { /* detailed grammar analysis */ },
       tone: { /* tone analysis with pitch, volume, confidence */ },
       voiceGestures: { /* voice gesture analysis with speech rate, pitch variability, etc. */ }
     }
   }
   ```

## Voice Gesture Analysis

The voice gesture analysis evaluates the following aspects of your speech:

1. **Speech Rate**: Measures how quickly you speak (syllables per second)
2. **Pitch Variability**: Analyzes vocal variety and intonation patterns
3. **Voice Quality**: Measures jitter and shimmer to assess voice clarity and stability
4. **Pause Patterns**: Analyzes frequency and duration of pauses

Each aspect includes:

- Quantitative measurements
- Qualitative assessment
- Personalized suggestions for improvement
- Overall strengths and areas for improvement

## Customization and Extension

The system is designed to be modular and extensible:

- **Speech-to-Text**: Change the speech recognition engine in `services/speechToText.js`
- **Response Analysis**: Adjust or add new analysis metrics in `services/responseAnalyzer.js`
- **Tone Analysis**: Customize tone analysis parameters in `services/toneAnalyzer.js`
- **Voice Gesture Analysis**: Modify voice gesture detection in `services/gestureAnalyzer.js`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
