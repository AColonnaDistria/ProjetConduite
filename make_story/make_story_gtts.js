const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { promisify } = require('util');
const ffmpeg = require('fluent-ffmpeg');
const gTTS = require('gtts');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const accessAsync = promisify(fs.access);
const mkdirAsync = promisify(fs.mkdir);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function ensureDirectoryExists(dir) {
    try {
        await accessAsync(dir);
    } catch {
        await mkdirAsync(dir, { recursive: true });
    }
}

function removeAccents(str) {
    return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function publicPathToWebPath(path) {
    return path.replace(/^public\//, '');
}

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

async function generateAudio(text, filePath) {
    return new Promise((resolve, reject) => {
        const gtts = new gTTS(text, 'fr');
        gtts.save(filePath, function (err) {
            if (err) {
                console.error('Erreur TTS :', err);
                reject(err);
            } else {
                console.log(`Audio sauvegardé : ${filePath}`);
                resolve(filePath);
            }
        });
    });
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
        const storyName = await askQuestion("Entrez le nom de l'histoire : ");
        rl.close();

        const formattedName = removeAccents(storyName).toLowerCase().replace(/\s+/g, '_');
        const rawText = await readFileAsync('make_story/text.txt', 'utf8');
        const { parts } = await extractEmotions(rawText);

        await ensureDirectoryExists('public/audio/audio_story');
        await ensureDirectoryExists('public/stories');
        await ensureDirectoryExists('make_story/story');

        // Generate story name audio
        const nameAudioPath = `public/audio/audio_story/${formattedName}_name.mp3`;
        await generateAudio(storyName, nameAudioPath);

        const audioFiles = [];
        const emotionTimestamps = [];
        let totalDuration = 0;

        for (let i = 0; i < parts.length; i++) {
            const audioPath = `make_story/story/audio_part_${i}.mp3`;
            await generateAudio(parts[i].text, audioPath);
            audioFiles.push(audioPath);

            const duration = await getAudioDuration(audioPath);
            totalDuration += duration;

            emotionTimestamps.push({ time: totalDuration, emotion: parts[i].emotion });
        }

        // Merge all audio parts
        const finalAudioPath = `public/audio/audio_story/${formattedName}.mp3`;
        await mergeAudioFiles(audioFiles, finalAudioPath);
        console.log(`Final audio généré : ${finalAudioPath}`);

        // Create JSON metadata
        const jsonData = {
            name: storyName,
            audio_name: publicPathToWebPath(nameAudioPath),
            audio: publicPathToWebPath(finalAudioPath),
            emotions: emotionTimestamps
        };

        const jsonFilePath = `public/stories/${formattedName}.json`;
        await writeFileAsync(jsonFilePath, JSON.stringify(jsonData, null, 2));
        console.log(`Fichier JSON créé : ${jsonFilePath}`);

        // Update story index
        const indexPath = 'public/stories/index.json';
        let index = [];

        try {
            const existing = await readFileAsync(indexPath, 'utf8');
            index = JSON.parse(existing);
        } catch {
            console.log('Création d’un nouveau fichier index...');
        }

        index.push(`stories/${formattedName}.json`);
        await writeFileAsync(indexPath, JSON.stringify(index, null, 2));
        console.log(`Index mis à jour : ${indexPath}`);
    } catch (error) {
        console.error('Erreur lors du traitement de l’histoire :', error);
    }
}

processStory();
