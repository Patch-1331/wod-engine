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
