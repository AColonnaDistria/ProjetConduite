(async function () {
  // --- Configuration Object ---
  const CONFIG = {
    elements: {
      startButton: document.getElementById("start_button"),
      audio: document.getElementById("qt_audio"),
      audioAsk: document.getElementById("qt_audio_ask"),
      audioAnswer: document.getElementById("qt_audio_answer"),
      sendContainer: document.getElementById("send_container"),
      sendButtons: [
        document.getElementById("send_button1"),
        document.getElementById("send_button2"),
        document.getElementById("send_button3"),
        document.getElementById("send_button4")
      ],
      faceImage: document.getElementById("qt_face")
    },
    urls: {
      schedule: "/stories/LeoEtForetMag.json",
      audioBase: "/audio/",
      qtBase: "/qt/",
      storyAudio: "/audio/story_audio.mp3",
    },
    backgroundImageSchedule: [
      { time: 0, image: "images/im1.png" },
      { time: 33, image: "images/im2.png" },  // 33 seconds
      { time: 60, image: "images/im3.png" },  // 1 minute
      { time: 78, image: "images/im4.png" },  // 1 minute 18 seconds
      { time: 110, image: "images/im5.png" },
      { time: 140, image: "images/im6.png" },
      { time: 185, image: "images/im7.png" },
      { time: 218, image: "images/im8.png" },
    ],
    emotions: [
      "affection", "colère", "confusion", "embarassement",
      "joie", "neutre", "peur", "surprise", "timide", "tristesse"
    ],
    emotionImageMap: {
      "colère": "colère.png",
      "peur": "peur.png",
      "joie": "joie.png",
      "tristesse": "tristesse.png"
    },
    emotionAudioMap: {
      "affection": "affection.opus",
      "colère": "colère.opus",
      "confusion": "confusion.opus",
      "embarassement": "embarassement.opus",
      "joie": "joie.opus",
      "neutre": "neutre.opus",
      "peur": "peur.opus",
      "surprise": "surprise.opus",
      "timide": "timide.opus",
      "tristesse": "tristesse.opus"
    },
    faceImages: {
      blinkingClosed: "normal.png",
      blinkingOpen: "normal4.png",
      normalClosed: "normal2.png",
      normalOpen: "normal3.png"
    },
    intervals: {
      clock: 100,
      blink: 3000,
      blinkDuration: 200,
      mouthClose: 500,
      mouthCloseDuration: 250
    },
    answer: {
      delay: 1500,
      resumeDelay: 2000
    }
  };

  // --- State Variables ---
  let storyAudio = new Audio(CONFIG.urls.storyAudio);
  let timeouts = [];
  let blinking = false;
  let closedMouth = false;
  let keepMouthShut = true;
  let currentEmotion = null;
  let isPaused = false;
  let clock = 0;
  let pauseTime = 0;

  // --- Fetch the Emotion Schedule ---
  const dataSchedule = await fetch(CONFIG.urls.schedule);
  const emotionSchedule = await dataSchedule.json();

  // --- Helper Functions ---
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Function to change background based on the audio time
  function changeBackground(imageUrl) {

    document.body.style.backgroundImage = `url(${imageUrl})`;
    document.body.style.backgroundSize = "cover"; // Ensures the image covers the entire screen
    document.body.style.backgroundPosition = "center"; // Centers the image
    document.body.style.transition = "background-size 2s ease-in-out"; // Adds a smooth transition for zooming
  }

  // Check for background change based on audio time
  function checkBackgroundChange() {
    const currentTime = storyAudio.currentTime;

    CONFIG.backgroundImageSchedule.forEach(change => {
      if (currentTime >= change.time && !change.changed) {
        changeBackground(change.image); // Change the background
        change.changed = true; // Mark that the background has been changed for this time
      }
    });
  }

  // --- Emotion Scheduling Functions ---
  function scheduleEmotions() {
    clearScheduledEmotions();
    emotionSchedule.forEach(timepoint => {
      const delay = (timepoint.time - pauseTime) * 1000;
      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          displayEmotion(timepoint.emotion);
        }, delay);
        timeouts.push(timeoutId);
      }
    });
  }

  function pauseAudio() {
    CONFIG.elements.audio.pause();
    isPaused = true;
    keepMouthShut = true;
    pauseTime = clock;
    clearScheduledEmotions();
  }

  function resumeAudio() {
    CONFIG.elements.audio.play();
    isPaused = false;
    keepMouthShut = false;
    scheduleEmotions();
  }

  // --- Start clock function ---
  function startClock() {
    setInterval(() => {
      clock++;
    }, 1000); // Increment clock every second
  }

  // Set interval to check the background change while the audio is playing
  setInterval(() => {
    if (!isPaused) {
      checkBackgroundChange(); // Check and change background based on audio time
    }
  }, 1000); // Check every second

  CONFIG.elements.startButton.addEventListener("click", () => {
    storyAudio.play().then(() => {
      console.log("Story audio is playing!");
      storyAudio.addEventListener("ended", () => {
        console.log("Story audio has finished, now moving to the questions.");
        resumeAudio();
      });
    }).catch((error) => {
      console.log("Error playing story audio:", error);
    });
  });

  startClock();
})();
