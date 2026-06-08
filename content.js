// content.js — watches leetcode and tells bakut what happened

function extensionAlive() {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

function updateBakut(event) {
  if (!extensionAlive()) return;

  try {
    chrome.storage.local.get(
      ["hunger", "happy", "energy", "lastEvent"],
      (state) => {
        if (chrome.runtime.lastError || !extensionAlive()) return;

        let hunger = state.hunger ?? 80;
        let happy = state.happy ?? 75;
        let energy = state.energy ?? 90;

        if (event === "accepted") {
          happy = Math.min(100, happy + 30);
          hunger = Math.min(100, hunger + 10);
          energy = Math.min(100, energy + 10);
        }

        if (event === "wrong") {
          happy = Math.max(0, happy - 20);
          hunger = Math.max(0, hunger - 10);
        }

        if (event === "stuck") {
          happy = Math.max(0, happy - 5);
          energy = Math.max(0, energy - 5);
        }

        chrome.storage.local.set({
          hunger,
          happy,
          energy,
          lastEvent: event,
          lastDecayAt: Date.now(),
        });
      },
    );
  } catch {
    // extension was reloaded while this tab was open
  }
}

const observer = new MutationObserver(() => {
  if (!extensionAlive()) return;

  const body = document.body.innerText;

  if (body.includes("Accepted") && !body.includes("Not Accepted")) {
    updateBakut("accepted");
  } else if (body.includes("Wrong Answer")) {
    updateBakut("wrong");
  } else if (body.includes("Time Limit Exceeded")) {
    updateBakut("wrong");
  } else if (body.includes("Runtime Error")) {
    updateBakut("wrong");
  }
});

observer.observe(document.body, { childList: true, subtree: true });

setTimeout(() => {
  if (extensionAlive() && window.location.href.includes("/problems/")) {
    updateBakut("stuck");
  }
}, 20 * 60 * 1000);
