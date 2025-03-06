const { Configuration, OpenAIApi } = require('openai');
const vosk = require('vosk');
const wav = require('node-wav');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const VOSK_MODEL_PATH = path.join(__dirname, 'models', 'vosk-model-small-en-us');

class SpeechRecognizer {
    constructor(config = {}) {
        this.preferredEngine = config.preferredEngine || 'whisper';
        this.openai = config.openaiApiKey ? 
            new OpenAIApi(new Configuration({ apiKey: config.openaiApiKey })) : null;
        
        if (fs.existsSync(VOSK_MODEL_PATH)) {
            vosk.setLogLevel(-1);
            this.voskModel = new vosk.Model(VOSK_MODEL_PATH);
        }
    }

    async convertToWav(audioBuffer, inputFormat) {
        const tempInput = path.join(__dirname, `temp_input_${Date.now()}.${inputFormat}`);
        const tempOutput = path.join(__dirname, `temp_output_${Date.now()}.wav`);

        await writeFile(tempInput, audioBuffer);

        return new Promise((resolve, reject) => {
            ffmpeg(tempInput)
                .toFormat('wav')
                .on('error', error => {
                    unlink(tempInput).catch(() => {});
                    reject(error);
                })
                .on('end', async () => {
                    try {
                        const wavData = await fs.promises.readFile(tempOutput);
                        await Promise.all([
                            unlink(tempInput),
                            unlink(tempOutput)
                        ]);
                        resolve(wavData);
                    } catch (error) {
                        reject(error);
                    }
                })
                .save(tempOutput);
        });
    }

    async transcribeWithWhisper(audioBuffer, options = {}) {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured for Whisper STT');
        }

        try {
            const response = await this.openai.createTranscription(
                audioBuffer,
                'whisper-1',
                options.language || 'en',
                options.prompt,
                options.responseFormat || 'json',
                options.temperature || 0
            );
            return response.data.text;
        } catch (error) {
            throw new Error(`Whisper transcription failed: ${error.message}`);
        }
    }

    async transcribeWithVosk(audioBuffer) {
        if (!this.voskModel) {
            throw new Error('Vosk model not loaded');
        }

        try {
            const wavData = wav.decode(audioBuffer);
            const sampleRate = wavData.sampleRate;
            
            const recognizer = new vosk.Recognizer({
                model: this.voskModel,
                sampleRate: sampleRate
            });

            recognizer.acceptWaveform(wavData.channelData[0]);
            const result = recognizer.finalResult();
            recognizer.free();

            return result.text;
        } catch (error) {
            throw new Error(`Vosk transcription failed: ${error.message}`);
        }
    }

    async transcribe(audioBuffer, options = {}) {
        const engine = options.engine || this.preferredEngine;
        const inputFormat = options.inputFormat || 'wav';

        try {
            let processedAudio = audioBuffer;
            if (inputFormat !== 'wav') {
                processedAudio = await this.convertToWav(audioBuffer, inputFormat);
            }

            if (engine === 'whisper' && this.openai) {
                return await this.transcribeWithWhisper(processedAudio, options);
            } else if (engine === 'vosk' && this.voskModel) {
                return await this.transcribeWithVosk(processedAudio);
            } else {
                const availableEngine = this.openai ? 'whisper' : 'vosk';
                return await this.transcribe(processedAudio, { 
                    ...options, 
                    engine: availableEngine 
                });
            }
        } catch (error) {
            throw new Error(`Speech recognition failed: ${error.message}`);
        }
    }
}

module.exports = SpeechRecognizer; 