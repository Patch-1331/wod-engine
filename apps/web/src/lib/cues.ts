/** Sound/vibration feedback for round taps — needs to register without eyes on the screen. */

export function vibrate(pattern: number | number[]) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

let audioCtx: AudioContext | null = null;

export function beep(freq = 880, durationMs = 150) {
  try {
    audioCtx ??= new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch {
    // Web Audio unsupported or blocked — cues are a nice-to-have, fail silently.
  }
}

export function roundCompleteCue() {
  vibrate(80);
  beep(880, 120);
}

export function finishCue() {
  vibrate([100, 60, 100]);
  beep(660, 200);
}

/** Fires once when the time cap is reached, whether or not the user taps Finish. */
export function capReachedCue() {
  vibrate([150, 80, 150, 80, 150]);
  beep(440, 400);
}

/**
 * Interval-timer cues (Feature #30). The EMOM/Tabata screen advances on its
 * own, so these carry the transitions the athlete can't tap for: work is
 * pitched high and rest low, and the last seconds of a phase tick so the
 * next one never arrives unannounced.
 */
export function workStartCue() {
  vibrate([120, 60, 120]);
  beep(880, 250);
}

export function restStartCue() {
  vibrate(80);
  beep(440, 250);
}

/** The last few seconds of a phase — deliberately short and quiet next to the transition itself. */
export function countdownTickCue() {
  beep(660, 60);
}

/** The last interval has run out; only the Finish tap is left. */
export function sequenceCompleteCue() {
  vibrate([200, 80, 200, 80, 200]);
  beep(520, 500);
}
