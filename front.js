var qtAudio = document.getElementById("qt_audio");
var qtAudioAsk = document.getElementById("qt_audio_ask");
var qtAudioAnswer = document.getElementById("qt_audio_answer");

var send_container = document.getElementById("send_container");

var send_button1 = document.getElementById("send_button1");
var send_button2 = document.getElementById("send_button2");
var send_button3 = document.getElementById("send_button3");
var send_button4 = document.getElementById("send_button4");

var send_buttons = [send_button1, send_button2, send_button3, send_button4];

var data = await fetch("http://localhost:8888/files/test_audio.json");
var qtAudioEmotions = await data.json();

var qtFace = document.getElementById("qt_face");

var emotions = ["affection", "colère", "confusion", "embarassement", "joie", "neutre", "peur", "surprise", "timide", "tristesse"]

var dict = {"colère": "colère.png", "peur": "peur.png", "joie": "joie.png", "tristesse": "tristesse.png"}
var dict_audio = {"affection": "affection.opus", "colère": "colère.opus", "confusion": "confusion.opus", "embarassement": "embarassement.opus", "joie": "joie.opus", "neutre": "neutre.opus", "peur": "peur.opus", "surprise": "surprise.opus", "timide": "timide.opus", "tristesse": "tristesse.opus"}

var timeouts = [];

var blinking = false;
var closedMouth = false;
var emotionSet = null;
var pauseStatus = false;

var clock = 0;
var clockPause = 0;

function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

function setEmotion(emotion) {
    if (emotion in dict) {
        emotionSet = emotion;
        setTimeout(() => {
            pause();

            qtAudioAsk.currentTime = 0;
            qtAudioAsk.play();

            shuffle(emotions);
            let randomIndex = Math.floor(Math.random() * 3);

            let answers = [null, null, null, null]
            answers[randomIndex] = emotion;

            let j = 0;
            for (let i = 0; i < 4; ++i) {
                if (i != randomIndex) {
                    answers[i] = emotions[j];
                    j += 1;
                }
            }

            showAnswers(answers);
        }, 1500);
    }
}

function hideAnswers() {
    console.log(send_container);
    send_container.style.visibility = "visible";
}

function showAnswers(answers) {
    for (let i = 0; i < 4; ++i) {
        if (answers[i] == null) {
            send_buttons[i].style.visibility = "hidden";
        }
        else {
            send_buttons[i].style.visibility = "visible";
            send_buttons[i].textContent = answers[i];
            send_buttons[i].onmouseover = () => {
                qtAudioAnswer.src = `http://localhost:8888/files/audio/${dict_audio[answers[i]]}`
                qtAudioAnswer.currentTime = 0;
                qtAudioAnswer.play();
            };

            if (answers[i] == emotionSet) {
                send_buttons[i].onclick = () => {
                    qtAudioAnswer.src = `http://localhost:8888/files/audio/bravo.opus`
                    qtAudioAnswer.currentTime = 0;
                    qtAudioAnswer.play();

                    setTimeout(() => {
                        emotionSet = null;
                        send_container.style.display = "none";
                        send_container.style.visibility = "hidden";
                        resume();
                    }, 2000);
                };
            }
            else {
                send_buttons[i].onclick = () => {
                    qtAudioAnswer.src = `http://localhost:8888/files/audio/perdu.opus`
                    qtAudioAnswer.currentTime = 0;
                    qtAudioAnswer.play();

                    setTimeout(() => {
                        emotionSet = null;
                        send_container.style.display = "none";
                        send_container.style.visibility = "hidden";
                        resume();
                    }, 2000);
                };
            }
        }
    }
    send_container.style.display = "flex";
    send_container.style.visibility = "visible";
}

function launchClock() {
    setInterval(() => {
        clock += 100;

        if (!pauseStatus) {
            if (emotionSet != null) {
                qtFace.src = `http://localhost:8888/files/qt/${dict[emotionSet]}`;
            }
            else {
                if (blinking) {
                    if (closedMouth) {
                        qtFace.src = `http://localhost:8888/files/qt/normal.png`;
                    }
                    else {
                        qtFace.src = `http://localhost:8888/files/qt/normal4.png`;
                    }
                }
                else {
                    if (closedMouth) {
                        qtFace.src = `http://localhost:8888/files/qt/normal2.png`;
                    }
                    else {
                        qtFace.src = `http://localhost:8888/files/qt/normal3.png`;
                    }
                }
            }
        }
    }, 100);

    setInterval(() => {
        blinking = true;
        setTimeout(() => {
            blinking = false;
        }, 200);
    }, 3000);

    setInterval(() => {
        closedMouth = true;
        setTimeout(() => {
            closedMouth = false;
        }, 250);
    }, 500);
}

function setEmotionTimeouts() {
    console.log(qtAudioEmotions);
    for (let timepoint of qtAudioEmotions) {
        if (timepoint.time * 1000.0 - clockPause > 0) {
            timeouts.push(setTimeout(() => {
                setEmotion(timepoint.emotion);
            }, timepoint.time * 1000.0 - clockPause));
        }
    }
}

function pauseEmotionTimeouts() {
    for (let timeout of timeouts) {
        clearTimeout(timeout);
    }
    timeouts = []
}

function pause() {
    qtAudio.pause();
    pauseStatus = true;
    clockPause = clock;
    pauseEmotionTimeouts();
}

function resume() {
    qtAudio.play();
    pauseStatus = false;
    setEmotionTimeouts();
}

launchClock();
resume();