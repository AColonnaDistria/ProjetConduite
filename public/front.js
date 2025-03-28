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
      schedule: "https://qt800-e3178.web.app/stories/test_audio.json",
      audioBase: "https://qt800-e3178.web.app/audio/",
      qtBase: "https://qt800-e3178.web.app/qt/"
    },
    emotions: [
      "affection", "colère", "confusion", "embarassement",
      "joie", "neutre", "peur", "surprise", "timide", "tristesse"
    ],
    emotionImageMap: {
      "affection": "affection.png",
      "colère": "colère.png", 
      "confusion": "confusion.png", 
      "cri": "cri.png", 
      "embarassement": "embarassement.png", 
      "joie": "joie.png", 
      "neutre": "neutre.png",
      "peur": "peur.png",
      "surprise": "surprise.png", 
      "timide": "timide.png", 
      "tristesse": "tristesse.png"
    },
    emotionAudioMap: {
      "affection": "affection.opus",
      "colère": "colère.opus", 
      "confusion": "confusion.opus", 
      "cri": "cri.opus", 
      "embarassement": "embarassement.opus", 
      "joie": "joie.opus", 
      "neutre": "neutre.opus",
      "peur": "peur.opus",
      "surprise": "surprise.opus", 
      "timide": "timide.opus", 
      "tristesse": "tristesse.opus"
    },
    // You can update these if you want different default face images.
    faceImages: {
      blinkingClosed: "normal.png",  // when blinking and mouth is closed
      blinkingOpen: "normal4.png",     // when blinking and mouth is open
      normalClosed: "normal2.png",     // when not blinking but mouth is closed
      normalOpen: "normal3.png"        // when not blinking and mouth is open
    },
    intervals: {
      clock: 100,
      blink: 3000,          // blink every 3000ms
      blinkDuration: 200,     // blink lasts for 200ms
      mouthClose: 500,      // close mouth every 500ms briefly
      mouthCloseDuration: 250 // duration of closed mouth state in ms
    },
    answer: {
      delay: 0,          // delay before showing answer options (ms)
      resumeDelay: 2000     // delay after an answer is clicked (ms)
    }
  };

  // --- State Variables ---
  let timeouts = [];
  let blinking = false;
  let closedMouth = false;
  let keepMouthShut = true;
  let currentEmotion = null;
  let isPaused = false;
  let hasEnded = false;

  // --- Fetch the Emotion Schedule ---
  const dataSchedule = await fetch(CONFIG.urls.schedule);
  const emotionSchedule = await dataSchedule.json();

  // --- Helper Functions ---
  // Fisher-Yates Shuffle to randomize arrays
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Displays the emotion and schedules answer options
  function displayEmotion(emotion) {
    console.log("test");
    console.log(emotion);
    if (CONFIG.emotionImageMap[emotion]) {
      currentEmotion = emotion;
      CONFIG.elements.faceImage.src = `${CONFIG.urls.qtBase}${CONFIG.emotionImageMap[currentEmotion]}`;
      pauseAudio();

      CONFIG.elements.audioAsk.currentTime = 0;
      CONFIG.elements.audioAsk.play();

      // Prepare answer options with one correct answer at a random index.
      const answerOptions = new Array(4).fill(null);
      const correctIndex = Math.floor(Math.random() * 4);
      answerOptions[correctIndex] = emotion;

      // Create a list of distractors ensuring they aren’t the correct answer.
      const distractors = CONFIG.emotions.filter(e => e !== emotion);
      shuffleArray(distractors);

      let distractorIndex = 0;
      for (let i = 0; i < answerOptions.length; i++) {
        if (i !== correctIndex) {
          answerOptions[i] = distractors[distractorIndex];
          distractorIndex++;
        }
      }

      showAnswerOptions(answerOptions);
    }
  }

  // Hides the answer options container.
  function hideAnswerOptions() {
    CONFIG.elements.sendContainer.style.display = "none";
    CONFIG.elements.sendContainer.style.visibility = "hidden";
  }

  // Displays answer options and attaches event handlers.
  function showAnswerOptions(options) {
    CONFIG.elements.sendButtons.forEach((button, index) => {
      const option = options[index];
      if (!option) {
        button.style.visibility = "hidden";
      } else {
        button.style.visibility = "visible";
        button.textContent = option;
        // Play the corresponding emotion audio on hover.
        button.onmouseover = () => {
          CONFIG.elements.audioAnswer.src = `${CONFIG.urls.audioBase}${CONFIG.emotionAudioMap[option]}`;
          CONFIG.elements.audioAnswer.currentTime = 0;
          CONFIG.elements.audioAnswer.play();
        };
        // On click, play success or failure sound and resume the audio.
        button.onclick = () => {
          if (option === currentEmotion) {
            CONFIG.elements.audioAnswer.src = `${CONFIG.urls.audioBase}bravo.opus`;
          } else {
            CONFIG.elements.audioAnswer.src = `${CONFIG.urls.audioBase}perdu.opus`;
          }
          CONFIG.elements.audioAnswer.currentTime = 0;
          CONFIG.elements.audioAnswer.play();
          setTimeout(() => {
            currentEmotion = null;
            hideAnswerOptions();
            resumeAudio();
          }, CONFIG.answer.resumeDelay);
        };
      }
    });
    CONFIG.elements.sendContainer.style.display = "flex";
    CONFIG.elements.sendContainer.style.visibility = "visible";
  }

  // Starts the clock and updates the face image based on the current state.
  function startClock() {
    for (let emotion of emotionSchedule) {
      emotion.consumed = false;
    }
    console.log(emotionSchedule);

    setInterval(() => {
      if (!isPaused) {
        if (!currentEmotion) {
          if (blinking) {
            CONFIG.elements.faceImage.src = (closedMouth || keepMouthShut)
              ? `${CONFIG.urls.qtBase}${CONFIG.faceImages.blinkingClosed}`
              : `${CONFIG.urls.qtBase}${CONFIG.faceImages.blinkingOpen}`;
          } else {
            CONFIG.elements.faceImage.src = (closedMouth || keepMouthShut)
              ? `${CONFIG.urls.qtBase}${CONFIG.faceImages.normalClosed}`
              : `${CONFIG.urls.qtBase}${CONFIG.faceImages.normalOpen}`;
          }
        }
      }
    }, CONFIG.intervals.clock);

    // Blink every blink interval.
    setInterval(() => {
      blinking = true;
      setTimeout(() => {
        blinking = false;
      }, CONFIG.intervals.blinkDuration);
    }, CONFIG.intervals.blink);

    // Briefly close the mouth every mouthClose interval.
    setInterval(() => {
      closedMouth = true;
      setTimeout(() => {
        closedMouth = false;
      }, CONFIG.intervals.mouthCloseDuration);
    }, CONFIG.intervals.mouthClose);
  }

  // Schedules emotion cues based on the fetched schedule.
  function scheduleEmotions() {
    clearScheduledEmotions();
    emotionSchedule.forEach(timepoint => {
      const delay = (timepoint.time - CONFIG.elements.audio.currentTime) * 1000;
      if (!timepoint.consumed && delay > 0) {
        const timeoutId = setTimeout(() => {
          timepoint.consumed = true;
          displayEmotion(timepoint.emotion);
        }, delay);
        timeouts.push(timeoutId);
      }
    });
  }

  // Clears all scheduled emotion timeouts.
  function clearScheduledEmotions() {
    timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    timeouts = [];
  }

  // Pauses the main audio and cancels scheduled emotion events.
  function pauseAudio() {
    CONFIG.elements.audio.pause();
    isPaused = true;
    keepMouthShut = true;
    clearScheduledEmotions();
  }

  // Resumes the main audio and re-schedules the remaining emotion events.
  function resumeAudio() {
    isPaused = false;
    if (!hasEnded) {
      keepMouthShut = false;
      CONFIG.elements.audio.play();
      scheduleEmotions();
    }
  }

  // --- Initialization ---
// Stop mouth movement when audio ends
CONFIG.elements.audio.addEventListener("ended", () => {
    keepMouthShut = true;  // Ensure the mouth remains open (normal state)
    hasEnded = true;
    console.log(emotionSchedule);
  });

startClock();

CONFIG.elements.startButton.addEventListener("click", () => {
  resumeAudio();
})
  
})();
