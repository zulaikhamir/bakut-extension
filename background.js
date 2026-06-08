// background.js — stat decay runs while the popup is closed (and while it is open)

const TICK_MS = 80;
const DECAY_ALARM = "statDecay";

const DEFAULTS = {
  hunger: 80,
  happy: 75,
  energy: 90,
  sleeping: false,
};

function applyStatDecay() {
  chrome.storage.local.get(
    ["hunger", "happy", "energy", "sleeping", "lastDecayAt"],
    (data) => {
      if (chrome.runtime.lastError) return;

      const now = Date.now();
      const last = data.lastDecayAt ?? now;
      const elapsed = Math.max(0, now - last);
      const ticks = elapsed / TICK_MS;

      if (ticks < 1) {
        chrome.storage.local.set({ lastDecayAt: now });
        return;
      }

      let hunger = data.hunger ?? DEFAULTS.hunger;
      let happy = data.happy ?? DEFAULTS.happy;
      let energy = data.energy ?? DEFAULTS.energy;
      const sleeping = data.sleeping ?? DEFAULTS.sleeping;

      if (!sleeping) {
        hunger = Math.max(0, hunger - 0.25 * ticks);
        happy = Math.max(0, happy - 0.12 * ticks);
        energy = Math.max(0, energy - 0.08 * ticks);
      } else {
        energy = Math.min(100, energy + 0.4 * ticks);
      }

      chrome.storage.local.set({
        hunger,
        happy,
        energy,
        lastDecayAt: now,
      });
    },
  );
}

function ensureDecayAlarm() {
  chrome.alarms.create(DECAY_ALARM, { periodInMinutes: 1 });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["lastDecayAt"], (data) => {
    if (data.lastDecayAt == null) {
      chrome.storage.local.set({ lastDecayAt: Date.now() });
    }
    ensureDecayAlarm();
    applyStatDecay();
  });
});

chrome.runtime.onStartup.addListener(() => {
  ensureDecayAlarm();
  applyStatDecay();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === DECAY_ALARM) {
    applyStatDecay();
  }
});
