import { getSetting } from "../settings/settingsStore";

let context = null;
let masterGain = null;
let effectsGain = null;
let musicGain = null;
let musicTimer = null;
let musicStep = 0;
let currentScene = "menu";

const NOTES = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  G3: 196,
  A3: 220,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392,
  A4: 440,
  C5: 523.25,
  E5: 659.25,
};

function enabled() {
  return getSetting("soundEnabled", false);
}

function settings() {
  return {
    master: getSetting("masterVolume", 0.72),
    effects: getSetting("effectsVolume", 0.82),
    music: getSetting("musicVolume", 0.34),
    musicEnabled: getSetting("musicEnabled", true),
  };
}

function ensureContext() {
  if (context) return context;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  context = new AudioContext();
  masterGain = context.createGain();
  effectsGain = context.createGain();
  musicGain = context.createGain();
  effectsGain.connect(masterGain);
  musicGain.connect(masterGain);
  masterGain.connect(context.destination);
  applyVolumes();
  return context;
}

function applyVolumes() {
  if (!context) return;
  const value = settings();
  masterGain.gain.setTargetAtTime(
    enabled() ? value.master : 0,
    context.currentTime,
    0.03,
  );
  effectsGain.gain.setTargetAtTime(value.effects, context.currentTime, 0.03);
  musicGain.gain.setTargetAtTime(value.music, context.currentTime, 0.08);
}

export async function unlockAudio() {
  const audio = ensureContext();
  if (audio?.state === "suspended") await audio.resume();
  applyVolumes();
  if (enabled()) syncMusic();
}

function tone(frequency, duration, options = {}) {
  if (!enabled()) return;
  const audio = ensureContext();
  if (!audio || audio.state !== "running") return;
  const now = audio.currentTime + (options.delay || 0);
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = options.type || "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  if (options.slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(
      options.slideTo,
      now + duration,
    );
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(options.volume || 0.16, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(options.music ? musicGain : effectsGain);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function chord(notes, duration, options = {}) {
  notes.forEach((note, index) =>
    tone(note, duration, {
      ...options,
      delay: (options.delay || 0) + index * (options.stagger || 0),
    }),
  );
}

export function playSound(name) {
  if (!enabled()) return;
  const sounds = {
    click: () => tone(NOTES.C5, 0.07, { volume: 0.06, type: "triangle" }),
    gem: () =>
      chord([NOTES.E5, NOTES.A4], 0.18, {
        volume: 0.1,
        stagger: 0.035,
        type: "sine",
      }),
    returnGem: () =>
      tone(NOTES.E5, 0.22, {
        slideTo: NOTES.A4,
        volume: 0.1,
        type: "triangle",
      }),
    confirm: () =>
      chord([NOTES.C4, NOTES.E4, NOTES.G4], 0.32, {
        volume: 0.09,
        stagger: 0.045,
        type: "triangle",
      }),
    purchase: () =>
      chord([NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5], 0.48, {
        volume: 0.12,
        stagger: 0.055,
        type: "triangle",
      }),
    reserve: () =>
      chord([NOTES.A3, NOTES.C4, NOTES.E4], 0.38, {
        volume: 0.1,
        stagger: 0.06,
        type: "sine",
      }),
    gold: () =>
      chord([NOTES.E4, NOTES.A4, NOTES.C5], 0.52, {
        volume: 0.12,
        stagger: 0.07,
        type: "sine",
      }),
    noble: () =>
      chord([NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5, NOTES.E5], 0.75, {
        volume: 0.13,
        stagger: 0.08,
        type: "triangle",
      }),
    draw: () =>
      tone(NOTES.D4, 0.2, { slideTo: NOTES.A4, volume: 0.08, type: "sine" }),
    seat: () =>
      chord([NOTES.G4, NOTES.C5], 0.3, {
        volume: 0.1,
        stagger: 0.05,
        type: "triangle",
      }),
    countdown: () =>
      chord([NOTES.C3, NOTES.C4], 0.35, { volume: 0.12, type: "triangle" }),
    begin: () =>
      chord([NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4, NOTES.G4], 1.15, {
        volume: 0.14,
        stagger: 0.06,
        type: "triangle",
      }),
    achievement: () =>
      chord([NOTES.C5, NOTES.E5, NOTES.G4, NOTES.C5], 0.8, {
        volume: 0.12,
        stagger: 0.1,
        type: "sine",
      }),
    victory: () =>
      chord(
        [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5],
        1.8,
        { volume: 0.15, stagger: 0.09, type: "triangle" },
      ),
  };
  sounds[name]?.();
}

const MUSIC_PATTERNS = {
  menu: [
    NOTES.C3,
    NOTES.G3,
    NOTES.E4,
    NOTES.G3,
    NOTES.A3,
    NOTES.E4,
    NOTES.C4,
    NOTES.E4,
  ],
  game: [
    NOTES.A3,
    NOTES.E4,
    NOTES.C4,
    NOTES.E4,
    NOTES.G3,
    NOTES.D4,
    NOTES.C4,
    NOTES.D4,
  ],
  victory: [
    NOTES.C3,
    NOTES.E3,
    NOTES.G3,
    NOTES.C4,
    NOTES.G3,
    NOTES.E4,
    NOTES.C4,
    NOTES.G3,
  ],
};

function musicTick() {
  if (
    !enabled() ||
    !settings().musicEnabled ||
    !context ||
    context.state !== "running"
  )
    return;
  const pattern = MUSIC_PATTERNS[currentScene] || MUSIC_PATTERNS.menu;
  const note = pattern[musicStep % pattern.length];
  tone(note, 1.4, { volume: 0.065, type: "sine", music: true });
  tone(note * 2, 0.7, {
    volume: 0.025,
    type: "triangle",
    music: true,
    delay: 0.05,
  });
  musicStep += 1;
}

function syncMusic() {
  applyVolumes();
  const shouldPlay = enabled() && settings().musicEnabled;
  if (!shouldPlay) {
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = null;
    return;
  }
  if (!musicTimer) {
    musicTick();
    musicTimer = window.setInterval(musicTick, 1250);
  }
}

export function setMusicScene(scene) {
  currentScene = scene || "menu";
  musicStep = 0;
  syncMusic();
}

export function refreshAudioSettings() {
  applyVolumes();
  syncMusic();
}
