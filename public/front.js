(async function () {
  // --- Configuration Object ---
  const CONFIG = {
    elements: {
      startButton: document.getElementById("start_button"),
      audio: document.getElementById("qt_audio"),
      audioAsk: document.getElementById("qt_audio_ask"),
      storyChoiceTable: document.getElementById("story_choice_table"),
      faceImage: document.getElementById("qt_face")
    },
    urls: {
      schedule: "",
      storyIndex: "/stories/index.json",
      audioBase: "/audio/",
      qtBase: "/qt/"
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
    stories: [],
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

  let emotionSchedule = [];

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
    }
  }
  
  // Starts the clock and updates the face image based on the current state.
  function startClock() {
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

  async function downloadStories() {
    const dataStoryIndex = await fetch(CONFIG.urls.storyIndex);
    const stories = await dataStoryIndex.json();

    for (let storyUrl of stories) {
      const dataStory = await fetch(storyUrl);
      const story = await dataStory.json();

      CONFIG.stories.push(story);
    }

    console.log(CONFIG.stories);
  // --- Fetch the Emotion Schedule ---
  //const dataSchedule = await fetch(CONFIG.urls.schedule);
  //const emotionSchedule = await dataSchedule.json();

  story_choice_table.innerHTML = "";

    for (let index in CONFIG.stories) {
      console.log(index);
      let story = CONFIG.stories[index];

      let tableRow = document.createElement("tr");
      let tableRowData = document.createElement("td");
      let tableRowDataButton = document.createElement("button");
      tableRowDataButton.classList.add("send_button");
      tableRowDataButton.textContent = story.name;
      tableRowDataButton.addEventListener("click", () => {
        selectStory(index);
        hasEnded = false;
        resumeAudio();
      });
      tableRowDataButton.addEventListener("mouseover", () => {
        let audio = new Audio(story.audio_name);
        audio.play();
      });

      tableRowData.appendChild(tableRowDataButton);
      tableRow.appendChild(tableRowData);

      story_choice_table.appendChild(tableRow);
    }
  }

  function selectStory(index) {
    let story = CONFIG.stories[index];

    emotionSchedule = story.emotions;

    for (let emotion of emotionSchedule) {
      emotion.consumed = false;
    }

    CONFIG.elements.audio.src = story.audio;
  }

  // --- Initialization ---
// Stop mouth movement when audio ends
CONFIG.elements.audio.addEventListener("ended", () => {
    keepMouthShut = true;  // Ensure the mouth remains open (normal state)
    hasEnded = true;
    console.log(emotionSchedule);
  });

await downloadStories();
selectStory(0); // first one by default
startClock();

})();
