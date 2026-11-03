/**
 * Procedural Web Audio Engine
 * Supports RPM synthesis, tire screeches, nitro whoosh, collision impacts,
 * level-up & gacha unboxing chimes, plus 3 selectable procedural synth tracks!
 */

export class SoundEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  engineOsc: OscillatorNode | null = null;
  engineSubOsc: OscillatorNode | null = null;
  engineGain: GainNode | null = null;
  engineFilter: BiquadFilterNode | null = null;
  driftGain: GainNode | null = null;
  nitroGain: GainNode | null = null;
  isRunning: boolean = false;
  bgmInterval: any = null;
  step: number = 0;
  activeTrackId: number = 0; // 0: Synthwave, 1: Eurobeat, 2: Cyber Wangan

  constructor() {
    this.ctx = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    // 1. Dual oscillator engine note
    this.engineOsc = this.ctx.createOscillator();
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineSubOsc.type = 'triangle';
    this.engineOsc.frequency.value = 65;
    this.engineSubOsc.frequency.value = 32.5;
    this.engineGain.gain.value = 0.0001;

    // Warm JDM exhaust lowpass filter
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 380;

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    // 2. White noise buffer for tire screech & nitro jet
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Bandpass filter for tire screech
    const screechFilter = this.ctx.createBiquadFilter();
    screechFilter.type = 'bandpass';
    screechFilter.frequency.value = 1450;
    screechFilter.Q.value = 4.5;
    this.driftGain = this.ctx.createGain();
    this.driftGain.gain.value = 0.0001;

    // Bandpass filter for nitro jet flame
    const nitroFilter = this.ctx.createBiquadFilter();
    nitroFilter.type = 'bandpass';
    nitroFilter.frequency.value = 420;
    nitroFilter.Q.value = 1.2;
    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.value = 0.0001;

    whiteNoise.connect(screechFilter);
    screechFilter.connect(this.driftGain);
    this.driftGain.connect(this.ctx.destination);

    whiteNoise.connect(nitroFilter);
    nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.ctx.destination);

    this.engineOsc.start();
    this.engineSubOsc.start();
    whiteNoise.start();
    this.isRunning = true;
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateDriving(speedRatio: number, isDrifting: boolean, isNitro: boolean, active: boolean) {
    if (!this.isRunning || !this.ctx || this.muted || !active) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
        this.driftGain?.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
        this.nitroGain?.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      }
      return;
    }

    const now = this.ctx.currentTime;
    // Simulate 6-gear RPM sawtooth sweep
    const gearMod = (speedRatio * 5.2) % 1;
    const baseFreq = 58 + speedRatio * 145 + gearMod * 55 + (isNitro ? 35 : 0);

    this.engineOsc?.frequency.setTargetAtTime(baseFreq, now, 0.04);
    this.engineSubOsc?.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
    this.engineFilter?.frequency.setTargetAtTime(300 + speedRatio * 900, now, 0.05);
    this.engineGain?.gain.setTargetAtTime(0.055 + speedRatio * 0.045, now, 0.05);

    this.driftGain?.gain.setTargetAtTime(isDrifting && speedRatio > 0.15 ? 0.048 : 0.0001, now, 0.05);
    this.nitroGain?.gain.setTargetAtTime(isNitro ? 0.095 : 0.0001, now, 0.04);
  }

  playBeep(freq = 520, duration = 0.14, type: OscillatorType = 'sine') {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playCollision() {
    this.playBeep(110, 0.18, 'sawtooth');
  }

  playLevelUp() {
    if (this.muted) return;
    this.resume();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playBeep(freq, 0.22, 'triangle'), idx * 85);
    });
  }

  playUnboxFanfare(rarity: string) {
    if (this.muted) return;
    this.resume();
    const notes = rarity === 'Legendary'
      ? [440, 554, 659, 880, 1108, 1318]
      : rarity === 'Epic'
      ? [440, 554, 659, 880]
      : [440, 550, 660];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playBeep(freq, 0.28, 'square'), idx * 100);
    });
  }

  startSynthMusic(trackIndex = 0) {
    this.stopSynthMusic();
    this.activeTrackId = trackIndex;

    // Track 0: Cyberpunk Synthwave (125 BPM)
    // Track 1: Initial D Eurobeat Bass (150 BPM)
    // Track 2: Dark Wangan Midnight (135 BPM)
    const patterns = [
      { tempo: 240, notes: [55, 55, 65.41, 55, 73.42, 65.41, 49, 55] },
      { tempo: 195, notes: [73.42, 73.42, 87.31, 98.0, 73.42, 65.41, 55, 65.41] },
      { tempo: 220, notes: [49, 49, 49, 58.27, 49, 49, 65.41, 61.74] },
    ];

    const current = patterns[trackIndex % patterns.length];

    this.bgmInterval = setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const freq = current.notes[this.step % current.notes.length];
      this.step++;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = trackIndex === 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.028, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0008, this.ctx.currentTime + 0.21);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    }, current.tempo);
  }

  stopSynthMusic() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();

