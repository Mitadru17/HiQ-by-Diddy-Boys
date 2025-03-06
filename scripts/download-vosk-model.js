const https = require('https');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

const MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
const MODEL_DIR = path.join(__dirname, '..', 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'vosk-model-small-en-us');
const ZIP_PATH = path.join(MODEL_DIR, 'model.zip');

async function downloadModel() {
    if (fs.existsSync(MODEL_PATH)) {
        console.log('Vosk model already exists, skipping download');
        return;
    }

    console.log('Downloading Vosk model...');
    
    if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
    }

    await new Promise((resolve, reject) => {
        https.get(MODEL_URL, response => {
            const writeStream = fs.createWriteStream(ZIP_PATH);
            pipeline(response, writeStream)
                .then(resolve)
                .catch(reject);
        }).on('error', reject);
    });

    console.log('Extracting model...');
    
    const extract = require('extract-zip');
    await extract(ZIP_PATH, { dir: MODEL_DIR });
    
    console.log('Cleaning up...');
    fs.unlinkSync(ZIP_PATH);
    
    console.log('Vosk model setup complete');
}

downloadModel().catch(error => {
    console.error('Failed to download Vosk model:', error);
    process.exit(1);
}); 