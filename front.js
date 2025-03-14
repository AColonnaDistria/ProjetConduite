var qtAudio = document.getElementById("qt_audio");

var data = await fetch("http://localhost:8888/files/test_audio.json");
var qtAudioEmotions = await data.json();

var qtFace = document.getElementById("qt_face");

var dict = {"dégoût": "🤢", "colère": "😡", "peur": "😨", "joie": "😃", "tristesse": "😥"}

for (let timepoint of qtAudioEmotions) {
    setTimeout(() => {
        if (timepoint.emotion in dict) {
            qtFace.textContent = dict[timepoint.emotion];
        }
    }, timepoint.time * 1000.0);
}

qtAudio.play();