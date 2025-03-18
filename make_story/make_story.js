const fs = require('fs');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg'); // Assurez-vous que ffmpeg est installé
const { promisify } = require('util');
const openaiApiKey = process.env.OPENAI_API_KEY;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

async function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration);
        });
    });
}

async function extractEmotions(text) {
    const regex = /\[(.*?)\]/g;
    let match;
    const emotions = [];
    const parts = [];
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
        const emotion = match[1].trim();
        emotions.push(emotion);
        
        const precedingText = text.substring(lastIndex, match.index).trim();
        if (precedingText) {
            parts.push({ text: precedingText, emotion });
        }
        lastIndex = regex.lastIndex;
    }
    
    return { parts, emotions };
}

async function generateAudio(text, index) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/audio/speech',
            {
                model: "tts-1",
                input: text,
                voice: "alloy",
                response_format: "mp3",
                language: "fr"
            },
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            }
        );

        const fileName = `make_story/story/audio_part_${index}.mp3`;
        await writeFileAsync(fileName, response.data);
        console.log(`Audio sauvegardé : ${fileName}`);
        return fileName;
    } catch (error) {
        console.error(`Erreur lors de la génération audio :`, error);
        return null;
    }
}

async function mergeAudioFiles(audioFiles, outputFile) {
    return new Promise((resolve, reject) => {
        let command = ffmpeg();
        audioFiles.forEach(file => command.input(file));
        command
            .on('end', () => resolve(outputFile))
            .on('error', err => reject(err))
            .mergeToFile(outputFile, './temp');
    });
}

async function processStory() {
    try {
        const storyText = await readFileAsync('make_story/text.txt', 'utf8');
        const { parts, emotions } = await extractEmotions(storyText);
        
        const audioFiles = [];
        const emotionTimestamps = [];
        let cumulativeTime = 0;
        let firstEmotionTime = null;
        
        for (let i = 0; i < parts.length; i++) {
            const audioPath = await generateAudio(parts[i].text, i);
            if (audioPath) {
                audioFiles.push(audioPath);
                const duration = await getAudioDuration(audioPath);
                
                if (firstEmotionTime === null) {
                    firstEmotionTime = duration; // Set first timestamp to the first duration instead of 0
                } else {
                    firstEmotionTime += duration;
                }
                
                emotionTimestamps.push({ time: firstEmotionTime, emotion: parts[i].emotion });
            }
        }

        const finalAudioPath = 'make_story/story/final_story.mp3';
        await mergeAudioFiles(audioFiles, finalAudioPath);
        console.log(`Audio final généré : ${finalAudioPath}`);

        await writeFileAsync('make_story/story/emotions.json', JSON.stringify(emotionTimestamps, null, 2));
        console.log('Fichier emotions.json créé.');
    } catch (error) {
        console.error('Erreur lors du traitement de lhistoire :', error);
    }
}

processStory();
