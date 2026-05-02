// ============================
// CANDY PIXEL - Synthesized Audio (Web Audio API)
// Síntese procedural via Web Audio API — sem arquivos externos
// Volume separado: Música vs SFX
// ============================

import { loadSettings, saveSettings } from "./settings";

let audioCtx: AudioContext | null = null;
let sfxGainNode: GainNode | null = null;
let musicGainNode: GainNode | null = null;
let hihatBuffer: AudioBuffer | null = null; // cache do buffer de ruído para hi-hat

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();

    // Criar gain nodes persistentes
    sfxGainNode = audioCtx.createGain();
    sfxGainNode.connect(audioCtx.destination);

    musicGainNode = audioCtx.createGain();
    musicGainNode.connect(audioCtx.destination);

    // Carregar volumes salvos
    const settings = loadSettings();
    sfxGainNode.gain.value = settings.sfxVolume / 100;
    musicGainNode.gain.value = settings.musicVolume / 100;
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function getSfxOutput(): GainNode {
  getAudioContext();
  return sfxGainNode!;
}

function getMusicOutput(): GainNode {
  getAudioContext();
  return musicGainNode!;
}

// ---------- Volume Controls ----------

export function setMusicVolume(value: number): void {
  const clamped = Math.max(0, Math.min(100, value));
  const settings = loadSettings();
  settings.musicVolume = clamped;
  saveSettings(settings);

  if (musicGainNode) {
    musicGainNode.gain.value = clamped / 100;
  }
}

export function setSfxVolume(value: number): void {
  const clamped = Math.max(0, Math.min(100, value));
  const settings = loadSettings();
  settings.sfxVolume = clamped;
  saveSettings(settings);

  if (sfxGainNode) {
    sfxGainNode.gain.value = clamped / 100;
  }
}

export function getMusicVolume(): number {
  return loadSettings().musicVolume;
}

export function getSfxVolumeValue(): number {
  return loadSettings().sfxVolume;
}

// ---------- SFX Tone Helper ----------

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "square",
  volume: number = 0.1,
  frequencyEnd?: number,
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (frequencyEnd) {
      osc.frequency.linearRampToValueAtTime(
        frequencyEnd,
        ctx.currentTime + duration,
      );
    }

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(getSfxOutput());

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported or blocked
  }
}

// ---------- SFX Functions ----------

export function playShootSound() {
  playTone(800, 0.1, "square", 0.06, 400);
}

export function playEnemyShootSound() {
  playTone(300, 0.1, "sawtooth", 0.04, 150);
}

export function playJumpSound() {
  playTone(300, 0.15, "sine", 0.06, 600);
}

export function playHitSound() {
  playTone(200, 0.2, "sawtooth", 0.08, 80);
}

export function playEnemyDeathSound() {
  playTone(600, 0.15, "square", 0.07, 100);
  setTimeout(() => playTone(400, 0.1, "square", 0.05, 50), 80);
}

export function playCollectSound() {
  // Genérico: jingle ascendente de 2 notas (data_chip / score)
  playTone(600, 0.1, "sine", 0.06, 900);
  setTimeout(() => playTone(900, 0.1, "sine", 0.05, 1200), 60);
}

// Cura — 3 notas ascendentes em maior, soa "vida restaurada"
export function playHealthPickupSound() {
  playTone(523, 0.08, "triangle", 0.06); // C5
  setTimeout(() => playTone(659, 0.08, "triangle", 0.06), 60); // E5
  setTimeout(() => playTone(784, 0.12, "triangle", 0.07), 120); // G5
}

// Munição — duplo "tin" curto
export function playAmmoPickupSound() {
  playTone(880, 0.05, "square", 0.04); // A5
  setTimeout(() => playTone(1175, 0.07, "triangle", 0.05), 50); // D6
}

// Buff de escudo — acorde maior triádico (poderoso)
export function playShieldBuffSound() {
  playTone(392, 0.25, "triangle", 0.06); // G4
  playTone(523, 0.25, "triangle", 0.05); // C5
  playTone(659, 0.25, "triangle", 0.05); // E5
}

// Buff de munição infinita — fanfarra rápida ascendente
export function playMilkshakeBuffSound() {
  const notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.1, "triangle", 0.06), i * 50);
  });
}

// Lançador de Bombom desbloqueado — trompete heroico
export function playWeaponUnlockSound() {
  playTone(330, 0.15, "sawtooth", 0.05); // E4
  setTimeout(() => playTone(440, 0.15, "sawtooth", 0.05), 100); // A4
  setTimeout(() => playTone(523, 0.3, "sawtooth", 0.07), 200); // C5
  setTimeout(() => playTone(784, 0.4, "triangle", 0.08), 320); // G5
}

export function playBossHitSound() {
  playTone(150, 0.3, "sawtooth", 0.08, 50);
}

export function playVictorySound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, "sine", 0.08), i * 150);
  });
}

export function playGameOverSound() {
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, "sawtooth", 0.06), i * 200);
  });
}

export function playMenuSelectSound() {
  // Jingle candy: duas notas ascendentes (quinta justa) estilo "ding-tin"
  playTone(523.25, 0.06, "triangle", 0.05); // C5
  setTimeout(() => playTone(783.99, 0.1, "triangle", 0.05), 40); // G5
}

export function playBossPhaseSound() {
  playTone(100, 0.5, "sawtooth", 0.1, 300);
  setTimeout(() => playTone(200, 0.3, "square", 0.08, 500), 300);
}

// ============================
// Música de Fundo Chiptune Pop
// ============================

let musicInterval: ReturnType<typeof setInterval> | null = null;
let musicPlaying = false;

// Progressão candy feliz em Dó maior: I - V - vi - IV (C - G - Am - F)
// É a progressão pop "mais feliz do mundo" — usada em centenas de hits alegres.
const BASS_NOTES = [65.41, 98.0, 110.0, 87.31]; // C2, G2, A2, F2
const MELODY_NOTES = [
  [261.63, 329.63, 392.0, 523.25], // C maior (C-E-G-C)
  [246.94, 293.66, 392.0, 493.88], // G maior (B-D-G-B)
  [220.0, 261.63, 329.63, 440.0], // A menor (A-C-E-A)
  [261.63, 349.23, 440.0, 523.25], // F maior (C-F-A-C)
];

let musicStep = 0;

function playMusicStep() {
  try {
    const ctx = getAudioContext();
    const musicOut = getMusicOutput();
    const now = ctx.currentTime;
    const stepDuration = 0.4;

    const chordIndex = Math.floor(musicStep / 4) % BASS_NOTES.length;

    // Bass line — sawtooth grave
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    const bassFilter = ctx.createBiquadFilter();
    bassOsc.type = "sawtooth";
    bassOsc.frequency.setValueAtTime(BASS_NOTES[chordIndex], now);
    bassFilter.type = "lowpass";
    bassFilter.frequency.setValueAtTime(200, now);
    bassGain.gain.setValueAtTime(0.04, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration);
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(musicOut);
    bassOsc.start(now);
    bassOsc.stop(now + stepDuration);

    // Kick no tempo forte (a cada 4 steps)
    if (musicStep % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = "sine";
      kickOsc.frequency.setValueAtTime(150, now);
      kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      kickGain.gain.setValueAtTime(0.06, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      kickOsc.connect(kickGain);
      kickGain.connect(musicOut);
      kickOsc.start(now);
      kickOsc.stop(now + 0.15);
    }

    // Hi-hat nos offbeats — buffer reutilizado para evitar alocação contínua
    if (musicStep % 2 === 1) {
      const noiseLen = 0.05;
      if (!hihatBuffer) {
        const bufferSize = Math.floor(ctx.sampleRate * noiseLen);
        hihatBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = hihatBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.3;
        }
      }
      const noise = ctx.createBufferSource();
      noise.buffer = hihatBuffer;
      const hihatGain = ctx.createGain();
      const hihatFilter = ctx.createBiquadFilter();
      hihatFilter.type = "highpass";
      hihatFilter.frequency.setValueAtTime(8000, now);
      hihatGain.gain.setValueAtTime(0.02, now);
      hihatGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
      noise.connect(hihatFilter);
      hihatFilter.connect(hihatGain);
      hihatGain.connect(musicOut);
      noise.start(now);
    }

    // Arpejo melódico (nota a cada step)
    const chord = MELODY_NOTES[chordIndex];
    const noteIndex = musicStep % chord.length;
    const melodyOsc = ctx.createOscillator();
    const melodyGain = ctx.createGain();
    const melodyFilter = ctx.createBiquadFilter();
    // Triangle wave soa mais arredondado/glockenspiel — combina com tema candy
    melodyOsc.type = "triangle";
    melodyOsc.frequency.setValueAtTime(chord[noteIndex], now);
    melodyFilter.type = "lowpass";
    melodyFilter.frequency.setValueAtTime(1500, now);
    melodyFilter.frequency.exponentialRampToValueAtTime(
      400,
      now + stepDuration * 0.8,
    );
    melodyGain.gain.setValueAtTime(0.02, now);
    melodyGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + stepDuration * 0.8,
    );
    melodyOsc.connect(melodyFilter);
    melodyFilter.connect(melodyGain);
    melodyGain.connect(musicOut);
    melodyOsc.start(now);
    melodyOsc.stop(now + stepDuration * 0.8);

    musicStep++;
  } catch {
    // Audio not available
  }
}

export function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  musicStep = 0;
  // 150 BPM → 400ms per beat, subdividido em steps de 200ms
  musicInterval = setInterval(playMusicStep, 200);
}

export function stopMusic() {
  if (!musicPlaying) return;
  musicPlaying = false;
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  // Resetar cache do hi-hat — será recriado se AudioContext mudar
  hihatBuffer = null;
}

export function isMusicPlaying(): boolean {
  return musicPlaying;
}
