function storageAlive() {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

const canvas = document.getElementById("bakut");
const ctx = canvas.getContext("2d");

const state = {
  hunger: 80,
  happy: 75,
  energy: 90,
  sleeping: false,
  animTick: 0,
  blinkTimer: 0,
  blink: false,
  shaking: 0,
  eating: 0,
  leetcodeReaction: 0,
};

const moodText = {
  morning: {
    idle: "bakut is stretching tiny wings.",
    happy: "bakut loves mornings!",
    excited: "bakut is READY. peep!",
    sad: "bakut needs food... peep.",
    sleeping: "bakut is still asleep.",
  },
  afternoon: {
    idle: "bakut is waddling around.",
    happy: "bakut is having a good day!",
    excited: "bakut wants to splash!",
    sad: "bakut needs attention... peep.",
    sleeping: "bakut is napping.",
  },
  evening: {
    idle: "bakut is watching the sunset.",
    happy: "bakut is cozy tonight.",
    excited: "bakut refuses to calm down!",
    sad: "bakut is lonely...",
    sleeping: "bakut is dozing off.",
  },
  night: {
    idle: "bakut is a little sleepy.",
    happy: "bakut is resting.",
    excited: "bakut will NOT sleep.",
    sad: "bakut is sad... peep.",
    sleeping: "bakut is deep asleep. zzz",
  },
};

const talkReplies = {
  happy: ["peep!", "peep peep! :)", "*flaps tiny wings*", "peeeep~", "*wiggles happily*"],
  idle: ["...peep?", "*tilts head*", "peep.", "*blinks at you*"],
  sad: ["...peep.", "*sad peep*", "..."],
  excited: ["PEEP PEEP!!!", "*zooms in a circle*", "PEEEP!!", "*flaps wings wildly*"],
  sleeping: ["zzz...", "*tiny snore*", "...z"],
};

const leetcodeLogs = {
  accepted: "leetcode: accepted!\nbakut is SO proud. PEEP PEEP!!",
  wrong: "leetcode: wrong answer...\nbakut winces. ...peep.",
  stuck: "you've been stuck a while...\nbakut is pacing nervously. peep?",
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function getMood() {
  if (state.leetcodeReaction > 0) {
    if (state.leetcodeReaction === 1) return "excited";
    if (state.leetcodeReaction === 2) return "sad";
    return "sad";
  }
  if (state.sleeping) return "sleeping";
  if (state.hunger < 20 || state.happy < 20) return "sad";
  if (state.happy > 85 && state.energy > 60) return "excited";
  if (state.happy > 55) return "happy";
  return "idle";
}

function log(msg) {
  document.getElementById("log").textContent = msg;
}

function saveState() {
  if (!storageAlive()) return;
  try {
    chrome.storage.local.set({
      hunger: state.hunger,
      happy: state.happy,
      energy: state.energy,
      sleeping: state.sleeping,
      lastDecayAt: Date.now(),
    });
  } catch {
    // extension was reloaded
  }
}

function applyStoragePatch(patch) {
  if (patch.hunger != null) state.hunger = patch.hunger;
  if (patch.happy != null) state.happy = patch.happy;
  if (patch.energy != null) state.energy = patch.energy;
  if (patch.sleeping != null) state.sleeping = patch.sleeping;
  updateUI();
}

function handleLastEvent(event) {
  if (event === "accepted") {
    state.leetcodeReaction = 1;
    state.shaking = 0;
    log(leetcodeLogs.accepted);
    chrome.storage.local.set({ lastEvent: null });
  } else if (event === "wrong") {
    state.leetcodeReaction = 2;
    state.shaking = 10;
    log(leetcodeLogs.wrong);
    chrome.storage.local.set({ lastEvent: null });
  } else if (event === "stuck") {
    state.leetcodeReaction = 3;
    state.shaking = 8;
    log(leetcodeLogs.stuck);
    chrome.storage.local.set({ lastEvent: null });
  }
}

function loadState() {
  if (!storageAlive()) return;
  try {
    chrome.storage.local.get(
      ["hunger", "happy", "energy", "sleeping", "lastEvent"],
      (s) => {
        if (chrome.runtime.lastError || !storageAlive()) return;
      state.hunger = s.hunger ?? 80;
      state.happy = s.happy ?? 75;
      state.energy = s.energy ?? 90;
      state.sleeping = s.sleeping ?? false;

      if (s.lastEvent) {
        handleLastEvent(s.lastEvent);
      }

      drawBakut();
      updateUI();
      },
    );
  } catch {
    // extension was reloaded
  }
}

function drawBakut() {
  ctx.clearRect(0, 0, 180, 180);
  const cx = 90;
  const cy = 95;
  const mood = getMood();
  const t = state.animTick;

  const bounceY = state.sleeping
    ? 0
    : mood === "excited"
      ? Math.sin(t * 0.18) * 5
      : Math.sin(t * 0.07) * 2;
  const shakeX = state.shaking > 0 ? Math.sin(t * 0.8) * 4 : 0;
  const by = cy + bounceY;
  const bx = cx + shakeX;

  ctx.save();
  ctx.translate(bx, by);

  const yellow = "#F5C842";
  const darkYellow = "#D4A017";
  const fluffLight = "#FDE68A";

  ctx.beginPath();
  ctx.ellipse(0, 42, 28, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.07)";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(26, 18, 12, 9, 0.5, 0, Math.PI * 2);
  ctx.fillStyle = fluffLight;
  ctx.fill();

  const wflapL = state.sleeping
    ? 0
    : mood === "excited"
      ? Math.sin(t * 0.25) * 18
      : Math.sin(t * 0.08) * 4;
  ctx.save();
  ctx.translate(-22, 10);
  ctx.rotate((-0.3 + wflapL * 0.017) * Math.PI);
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 8, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = yellow;
  ctx.fill();
  ctx.restore();

  const wflapR = state.sleeping
    ? 0
    : mood === "excited"
      ? Math.sin(t * 0.25 + 0.5) * 18
      : Math.sin(t * 0.08 + 0.5) * 4;
  ctx.save();
  ctx.translate(22, 10);
  ctx.rotate((0.3 - wflapR * 0.017) * Math.PI);
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 8, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = yellow;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.ellipse(0, 16, 28, 26, 0, 0, Math.PI * 2);
  ctx.fillStyle = yellow;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, 22, 16, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = fluffLight;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -18, 22, 0, Math.PI * 2);
  ctx.fillStyle = yellow;
  ctx.fill();

  [[-4, -38, 7], [4, -40, 5], [-10, -36, 5]].forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fillStyle = fluffLight;
    ctx.fill();
  });

  [[-14, -12], [14, -12]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.ellipse(dx, dy, 6, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,150,100,0.25)";
    ctx.fill();
  });

  if (state.leetcodeReaction === 2 || state.leetcodeReaction === 3) {
    ctx.fillStyle = "rgba(100,160,255,0.6)";
    const tf = Math.sin(t * 0.15) * 3;
    ctx.beginPath();
    ctx.ellipse(-12, -14 + tf, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -12 + tf, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.leetcodeReaction === 3) {
    ctx.fillStyle = "rgba(100,200,255,0.6)";
    ctx.beginPath();
    ctx.ellipse(20, -30, 3, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.sleeping) {
    ctx.strokeStyle = darkYellow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-9, -20, 5, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(9, -20, 5, Math.PI, 0);
    ctx.stroke();
  } else if (state.blink) {
    ctx.fillStyle = darkYellow;
    ctx.beginPath();
    ctx.ellipse(-9, -20, 5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(9, -20, 5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (state.leetcodeReaction === 2) {
    ctx.strokeStyle = "#2C2C2A";
    ctx.lineWidth = 1.5;
    [[-9, -20], [9, -20]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(dx - 3, dy - 3);
      ctx.lineTo(dx + 3, dy + 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(dx + 3, dy - 3);
      ctx.lineTo(dx - 3, dy + 3);
      ctx.stroke();
    });
  } else {
    const eyeSize = mood === "excited" ? 6 : mood === "sad" ? 4 : 5;
    ctx.fillStyle = "#2C2C2A";
    ctx.beginPath();
    ctx.arc(-9, -20, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9, -20, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(-7, -22, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, -22, 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (mood === "sad") {
      ctx.strokeStyle = darkYellow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, -28);
      ctx.lineTo(-5, -26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, -26);
      ctx.lineTo(14, -28);
      ctx.stroke();
    }
    if (mood === "excited") {
      ctx.strokeStyle = darkYellow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, -30);
      ctx.lineTo(-4, -29);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, -29);
      ctx.lineTo(14, -30);
      ctx.stroke();
    }
  }

  const beakOpen =
    state.eating > 0 ? 4 : mood === "excited" ? 2 : 0;
  ctx.fillStyle = "#E07B20";
  ctx.beginPath();
  ctx.moveTo(-6, -13);
  ctx.lineTo(6, -13);
  ctx.lineTo(0, -7 + beakOpen);
  ctx.closePath();
  ctx.fill();
  if (beakOpen > 0) {
    ctx.fillStyle = "#C0392B";
    ctx.beginPath();
    ctx.moveTo(-4, -13);
    ctx.lineTo(4, -13);
    ctx.lineTo(0, -10 + beakOpen);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#E07B20";
  ctx.beginPath();
  ctx.ellipse(-10, 42, 9, 4, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(10, 42, 9, 4, 0.1, 0, Math.PI * 2);
  ctx.fill();

  [-10, 10].forEach((fx) => {
    [-4, 0, 4].forEach((tx) => {
      ctx.beginPath();
      ctx.ellipse(fx + tx, 46, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#E07B20";
      ctx.fill();
    });
  });

  ctx.restore();
}

function updateUI() {
  const mood = getMood();
  const time = getTimeOfDay();
  document.getElementById("time-badge").textContent = time;
  document.getElementById("mood-line").textContent =
    (moodText[time] && moodText[time][mood]) || "bakut is here.";

  document.getElementById("hunger-bar").style.width =
    Math.round(state.hunger) + "%";
  document.getElementById("happy-bar").style.width =
    Math.round(state.happy) + "%";
  document.getElementById("energy-bar").style.width =
    Math.round(state.energy) + "%";
  document.getElementById("hunger-val").textContent = Math.round(state.hunger);
  document.getElementById("happy-val").textContent = Math.round(state.happy);
  document.getElementById("energy-val").textContent = Math.round(state.energy);

  document.getElementById("zzz").classList.toggle("show", state.sleeping);
  document
    .getElementById("hearts")
    .classList.toggle("show", mood === "happy" && !state.sleeping);
  document
    .getElementById("sparkle")
    .classList.toggle("show", mood === "excited");
}

function feedBakut() {
  if (state.sleeping) {
    log("bakut is asleep... let bakut rest.");
    return;
  }
  state.hunger = Math.min(100, state.hunger + 30);
  state.happy = Math.min(100, state.happy + 5);
  state.eating = 20;
  log("you dropped some crumbs.\nbakut pecks them up eagerly. peep!");
  saveState();
}

function petBakut() {
  if (state.sleeping) {
    log("bakut stirs softly... but stays asleep.");
    return;
  }
  state.happy = Math.min(100, state.happy + 20);
  log("you gently stroke bakut's fluffy head.\nbakut closes eyes and peeeps softly.");
  saveState();
}

function playWithBakut() {
  if (state.sleeping) {
    log("bakut is asleep! shhh.");
    return;
  }
  if (state.energy < 15) {
    log("bakut is too tired to play... tiny yawn.");
    return;
  }
  state.happy = Math.min(100, state.happy + 25);
  state.energy = Math.max(0, state.energy - 20);
  state.hunger = Math.max(0, state.hunger - 10);
  log("you roll a tiny ball.\nbakut CHASES it with maximum seriousness. peep!");
  saveState();
}

function putToSleep() {
  if (state.sleeping) {
    state.sleeping = false;
    state.energy = Math.min(100, state.energy + 30);
    log("bakut wakes up, blinks twice.\n...peep?");
  } else {
    state.sleeping = true;
    log("you dim the lights.\nbakut fluffs up and closes eyes. zzz...");
  }
  saveState();
}

function pokeBakut() {
  if (state.sleeping) {
    state.sleeping = false;
    log("BAKUT JOLTS AWAKE.\n...PEEP?!");
    saveState();
    return;
  }
  state.shaking = 15;
  state.happy = Math.max(0, state.happy - 5);
  log("you poke bakut.\nbakut gives you a very long stare. ...peep.");
  saveState();
}

function talkToBakut() {
  const input = document.getElementById("talk-input");
  const msg = input.value.trim().toLowerCase();
  if (!msg) return;
  input.value = "";
  const mood = getMood();
  const replies = talkReplies[mood] || talkReplies.idle;
  const reply = replies[Math.floor(Math.random() * replies.length)];
  let reaction = "";
  if (
    msg.includes("love") ||
    msg.includes("cute") ||
    msg.includes("beautiful") ||
    msg.includes("good")
  ) {
    state.happy = Math.min(100, state.happy + 12);
    reaction = "\n*bakut does a happy little spin*";
  } else if (
    msg.includes("bad") ||
    msg.includes("ugly") ||
    msg.includes("stupid")
  ) {
    state.happy = Math.max(0, state.happy - 10);
    reaction = "\n*offended peep*";
  } else if (
    msg.includes("food") ||
    msg.includes("eat") ||
    msg.includes("hungry") ||
    msg.includes("bread")
  ) {
    reaction =
      state.hunger > 60 ? "\n*pats full belly*" : "\n*eyes go wide*";
  } else if (
    msg.includes("sleep") ||
    msg.includes("tired") ||
    msg.includes("rest")
  ) {
    reaction = "\n*tiny yawn*";
  }
  log('you: "' + msg + '"\nbakut: ' + reply + reaction);
  saveState();
}

document.getElementById("btn-feed").addEventListener("click", feedBakut);
document.getElementById("btn-pet").addEventListener("click", petBakut);
document.getElementById("btn-play").addEventListener("click", playWithBakut);
document.getElementById("btn-sleep").addEventListener("click", putToSleep);
document.getElementById("btn-poke").addEventListener("click", pokeBakut);
document.getElementById("btn-talk").addEventListener("click", talkToBakut);
document.getElementById("talk-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") talkToBakut();
});

if (storageAlive()) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    const patch = {};
    if (changes.hunger) patch.hunger = changes.hunger.newValue;
    if (changes.happy) patch.happy = changes.happy.newValue;
    if (changes.energy) patch.energy = changes.energy.newValue;
    if (changes.sleeping) patch.sleeping = changes.sleeping.newValue;
    if (Object.keys(patch).length) applyStoragePatch(patch);

    if (changes.lastEvent?.newValue) {
      handleLastEvent(changes.lastEvent.newValue);
      drawBakut();
    }
  });
}

drawBakut();
updateUI();
loadState();

setInterval(() => {
  state.animTick++;

  state.blinkTimer++;
  if (state.blinkTimer > 80 && Math.random() < 0.08) {
    state.blink = true;
    setTimeout(() => {
      state.blink = false;
    }, 120);
    state.blinkTimer = 0;
  }

  if (state.shaking > 0) state.shaking--;
  if (state.eating > 0) state.eating--;
  if (state.leetcodeReaction > 0) state.leetcodeReaction--;

  drawBakut();
}, 80);
