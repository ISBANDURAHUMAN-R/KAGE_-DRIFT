import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Trophy, Zap, Flame, Shield, Settings, Volume2, VolumeX, Play,
  ChevronRight, ChevronLeft, Lock, Check, Award, Gauge, Sparkles,
  RotateCcw, Camera, Flag, Compass, Sliders, Wrench, Palette,
  Star, Timer, Crown, AlertTriangle, HelpCircle
} from 'lucide-react';

// ============================================================================
// 1. CONSTANTS, VEHICLES, TRACKS, CAREER & RIVALS DATA
// ============================================================================

const STORAGE_KEY = 'NEON_DRIFT_SAVE_V2';

const PAINT_PRESETS = [
  { id: 'crimson', name: 'Cyber Crimson', hex: '#ff1e56', emissive: '#ff0040' },
  { id: 'cyan', name: 'Neo Tokyo Cyan', hex: '#00f0ff', emissive: '#00c8ff' },
  { id: 'white', name: 'Akina White', hex: '#f4f6fb', emissive: '#38bdf8' },
  { id: 'purple', name: 'Midnight Purple', hex: '#8b5cf6', emissive: '#d946ef' },
  { id: 'gold', name: 'Raijin Gold', hex: '#fbbf24', emissive: '#f59e0b' },
  { id: 'lime', name: 'Acid Lime', hex: '#a3e635', emissive: '#4ade80' },
];

const UNDERGLOW_PRESETS = [
  { id: 'cyan', name: 'Cyber Cyan', hex: '#00f5ff' },
  { id: 'magenta', name: 'Tokyo Pink', hex: '#ff007f' },
  { id: 'lime', name: 'Nitro Lime', hex: '#39ff14' },
  { id: 'amber', name: 'Solar Gold', hex: '#ffaa00' },
  { id: 'violet', name: 'Phantom Violet', hex: '#a855f7' },
  { id: 'none', name: 'Off', hex: '#000000' },
];

const RIM_PRESETS = [
  { id: 'chrome', name: 'Alloy Silver', hex: '#e2e8f0' },
  { id: 'gold', name: 'Work Gold', hex: '#facc15' },
  { id: 'cyan', name: 'Neon Rim Cyan', hex: '#00f0ff' },
  { id: 'crimson', name: 'Redline', hex: '#fb7185' },
  { id: 'stealth', name: 'Carbon Matte', hex: '#334155' },
];

const VEHICLES = [
  {
    id: 'akira',
    name: 'AKIRA R-01',
    subtitle: 'Balanced Starter JDM Coupe',
    kanji: '暁 R-01',
    classTag: 'C-CLASS TUNER',
    cost: 0,
    baseStats: { speed: 72, accel: 75, handling: 80, drift: 78 },
    defaultPaint: 'crimson',
    defaultGlow: 'cyan',
    bodyStyle: 'coupe',
    description: 'Twin-scroll street coupe forged for Mount Akina hairpins and rain-slicked neon avenues.'
  },
  {
    id: 'kaze',
    name: 'KAZE GT',
    subtitle: 'High Acceleration Street Tuner',
    kanji: '風 GT',
    classTag: 'B-CLASS SPRINT',
    cost: 2500,
    baseStats: { speed: 78, accel: 90, handling: 76, drift: 74 },
    defaultPaint: 'cyan',
    defaultGlow: 'magenta',
    bodyStyle: 'tuner',
    description: 'Lightweight AWD launch monster with sequential twin-turbo response and aggressive aero.'
  },
  {
    id: 'shadow',
    name: 'SHADOW X',
    subtitle: 'High Top-Speed Wangan Devil',
    kanji: '影 X',
    classTag: 'A-CLASS WANGAN',
    cost: 5000,
    baseStats: { speed: 92, accel: 74, handling: 70, drift: 68 },
    defaultPaint: 'purple',
    defaultGlow: 'violet',
    bodyStyle: 'muscle',
    description: 'Built for 320+ KPH midnight highway runs with an elongated aerodynamic fastback silhouette.'
  },
  {
    id: 'yuki',
    name: 'YUKI DRIFT',
    subtitle: 'Touge Drift Specialist',
    kanji: '雪 DRIFT',
    classTag: 'A-CLASS SPEC-D',
    cost: 6500,
    baseStats: { speed: 76, accel: 82, handling: 88, drift: 96 },
    defaultPaint: 'white',
    defaultGlow: 'cyan',
    bodyStyle: 'drift',
    description: 'Widebody angle-kit legend with high-revving rotary spirit and effortless counter-steer balance.'
  },
  {
    id: 'raijin',
    name: 'RAIJIN RS',
    subtitle: 'High-Performance Cyber Prototype',
    kanji: '雷神 RS',
    classTag: 'S-CLASS PROTO',
    cost: 12000,
    baseStats: { speed: 90, accel: 88, handling: 86, drift: 85 },
    defaultPaint: 'gold',
    defaultGlow: 'amber',
    bodyStyle: 'super',
    description: 'Active downforce cyber-supercar pairing brutal mid-engine torque with razor-sharp apex grip.'
  },
  {
    id: 'void',
    name: 'VOID ZERO',
    subtitle: 'Endgame Anime Hypercar',
    kanji: '零式 VOID',
    classTag: 'X-CLASS HYPER',
    cost: 25000,
    baseStats: { speed: 99, accel: 96, handling: 92, drift: 90 },
    defaultPaint: 'lime',
    defaultGlow: 'lime',
    bodyStyle: 'hyper',
    description: 'Experimental zero-gravity Ground Effect hyper-machine. The undisputed apex of NEON DRIFT.'
  }
];

const UPGRADE_TYPES = [
  { id: 'engine', name: 'Engine Block', stat: 'speed', icon: Flame, baseCost: 800, desc: '+3 Top Speed per stage' },
  { id: 'turbo', name: 'Twin Turbo', stat: 'accel', icon: Zap, baseCost: 800, desc: '+3 Acceleration & N2O power' },
  { id: 'brakes', name: 'Carbon Brakes', stat: 'handling', icon: Shield, baseCost: 700, desc: '+3 Cornering & Braking grip' },
  { id: 'tires', name: 'Drift Compound', stat: 'drift', icon: Sparkles, baseCost: 750, desc: '+3 Drift control & multiplier' }
];

const TRACKS = [
  {
    id: 'tokyo',
    name: 'TOKYO NEON DISTRICT',
    kanji: '東京ネオン街',
    subtitle: 'Rain-Soaked Cyberpunk Metropolis',
    difficulty: 'NORMAL',
    lengthKm: '4.2 KM',
    theme: {
      skyTop: '#06071b',
      skyBottom: '#1e1035',
      fogColor: '#120c29',
      roadColor: '#131622',
      shoulderColor: '#ff007f',
      barrierColor: '#00f0ff',
      groundColor: '#080912',
      ambientLight: '#6366f1',
      dirLight: '#e0e7ff',
    },
    controlPoints: [
      [0, 0, 0],
      [0, 0, -240],
      [90, 6, -420],
      [260, 12, -450],
      [410, 4, -310],
      [420, 0, -90],
      [290, 0, 60],
      [180, 8, 190],
      [320, 14, 350],
      [180, 6, 480],
      [-40, 0, 430],
      [-150, 0, 260],
      [-60, 0, 130],
    ],
    sceneryType: 'city'
  },
  {
    id: 'akina',
    name: 'MOUNT AKINA PASS',
    kanji: '秋名山峠',
    subtitle: 'Sunset Cherry Blossom Touge Hairpins',
    difficulty: 'HARD',
    lengthKm: '4.8 KM',
    theme: {
      skyTop: '#1e1136',
      skyBottom: '#f97316',
      fogColor: '#4c1d4b',
      roadColor: '#1e202b',
      shoulderColor: '#f43f5e',
      barrierColor: '#fb923c',
      groundColor: '#1c1926',
      ambientLight: '#fb7185',
      dirLight: '#fde047',
    },
    controlPoints: [
      [0, 0, 0],
      [0, 5, -210],
      [-140, 16, -360],
      [-40, 26, -510],
      [170, 32, -540],
      [330, 24, -380],
      [210, 18, -220],
      [370, 12, -70],
      [390, 6, 150],
      [210, 2, 310],
      [60, 10, 220],
      [-90, 4, 340],
      [-140, 0, 170],
    ],
    sceneryType: 'mountain'
  },
  {
    id: 'coastal',
    name: 'COASTAL WANGAN HIGHWAY',
    kanji: '湾岸ハイウェイ',
    subtitle: 'High-Speed Oceanfront Bridges & Sweepers',
    difficulty: 'FAST',
    lengthKm: '5.5 KM',
    theme: {
      skyTop: '#041d3b',
      skyBottom: '#06b6d4',
      fogColor: '#0b2b4c',
      roadColor: '#182232',
      shoulderColor: '#38bdf8',
      barrierColor: '#2dd4bf',
      groundColor: '#03182e',
      ambientLight: '#38bdf8',
      dirLight: '#fef08a',
    },
    controlPoints: [
      [0, 0, 0],
      [0, 2, -310],
      [120, 14, -560],
      [380, 18, -580],
      [560, 10, -340],
      [540, 4, 20],
      [380, 0, 310],
      [140, 6, 460],
      [-110, 4, 380],
      [-140, 0, 180],
    ],
    sceneryType: 'coastal'
  }
];

const AI_RIVALS = [
  { id: 'r1', name: 'KENJI "KAGE" SATO', kanji: '佐藤 影', carId: 'raijin', paint: 'crimson', glow: 'cyan', personality: 'Apex Hunter', skillOffset: 0.98, lanePref: -3.5, quote: 'You think your tires can hold my line in the neon rain?' },
  { id: 'r2', name: 'REINA TAKAHASHI', kanji: '高橋 玲奈', carId: 'yuki', paint: 'white', glow: 'magenta', personality: 'Touge Queen', skillOffset: 0.95, lanePref: 3.2, quote: 'Show me a real four-wheel drift on the outside hairpin!' },
  { id: 'r3', name: 'DAIKI "BLITZ" MORI', kanji: '森 大輝', carId: 'shadow', paint: 'purple', glow: 'violet', personality: 'Wangan Demon', skillOffset: 0.92, lanePref: -1.8, quote: 'Once my twin-turbos spool on the straight, you are history.' },
  { id: 'r4', name: 'SORA HAYASHI', kanji: '林 空', carId: 'kaze', paint: 'cyan', glow: 'lime', personality: 'Late Braker', skillOffset: 0.89, lanePref: 2.0, quote: 'Braking is optional when you trust the downforce!' },
  { id: 'r5', name: 'RYUJI KUROSAWA', kanji: '黒沢 竜二', carId: 'void', paint: 'gold', glow: 'amber', personality: 'Cyber Boss', skillOffset: 1.01, lanePref: 0.8, quote: 'Welcome to Neon Drift. Try to keep my taillights in sight.' }
];

const CAREER_STAGES = [
  { id: 1, title: 'STAGE 01 // ROOKIE IGNITION', subtitle: 'Shibuya Midnight Sprint', trackId: 'tokyo', mode: 'race', difficulty: 'easy', rewardCr: 1800, rewardRep: 250, reqRep: 0, boss: 'SORA HAYASHI' },
  { id: 2, title: 'STAGE 02 // SAKURA SLIDE', subtitle: 'Akina Touge Drift Trial (Target: 4,500 PTS)', trackId: 'akina', mode: 'drift', driftTarget: 4500, difficulty: 'normal', rewardCr: 2600, rewardRep: 400, reqRep: 200, boss: 'REINA TAKAHASHI' },
  { id: 3, title: 'STAGE 03 // BAYSHORE SONIC', subtitle: 'Wangan 300KPH Showdown', trackId: 'coastal', mode: 'race', difficulty: 'normal', rewardCr: 3800, rewardRep: 650, reqRep: 500, boss: 'DAIKI "BLITZ" MORI' },
  { id: 4, title: 'STAGE 04 // CYBER RAIN DUEL', subtitle: 'Tokyo Neon Pro Circuit', trackId: 'tokyo', mode: 'race', difficulty: 'hard', rewardCr: 5500, rewardRep: 1000, reqRep: 1000, boss: 'KENJI "KAGE" SATO' },
  { id: 5, title: 'STAGE 05 // EMPEROR OF AKINA', subtitle: 'Grand Touge Final Championship', trackId: 'akina', mode: 'race', difficulty: 'hard', rewardCr: 10000, rewardRep: 2000, reqRep: 1800, boss: 'RYUJI KUROSAWA' }
];

const INITIAL_SAVE = {
  credits: 3000,
  rep: 100,
  selectedCar: 'akira',
  unlockedCars: ['akira'],
  completedCareer: [],
  bestTimes: {},
  bestDriftScores: {},
  customizations: {
    akira: { paint: 'crimson', glow: 'cyan', rim: 'chrome', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    kaze: { paint: 'cyan', glow: 'magenta', rim: 'gold', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    shadow: { paint: 'purple', glow: 'violet', rim: 'stealth', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    yuki: { paint: 'white', glow: 'cyan', rim: 'gold', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    raijin: { paint: 'gold', glow: 'amber', rim: 'cyan', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    void: { paint: 'lime', glow: 'lime', rim: 'crimson', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
  }
};

// ============================================================================
// 2. PROCEDURAL WEB AUDIO ENGINE (ENGINE RPM, DRIFT SCREECH, NITRO, SYNTH)
// ============================================================================

class SoundEngine {
  ctx: any = null;
  muted: boolean = false;
  engineOsc: any = null;
  engineSubOsc: any = null;
  engineGain: any = null;
  driftGain: any = null;
  nitroGain: any = null;
  engineFilter: any = null;
  isRunning: boolean = false;
  bgmInterval: any = null;
  step: number = 0;

  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineGain = null;
    this.driftGain = null;
    this.nitroGain = null;
    this.isRunning = false;
    this.bgmInterval = null;
    this.step = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    // Engine main oscillator
    this.engineOsc = this.ctx.createOscillator();
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineSubOsc.type = 'triangle';
    this.engineOsc.frequency.value = 65;
    this.engineSubOsc.frequency.value = 32.5;
    this.engineGain.gain.value = 0.0001;

    // Lowpass filter for warm JDM exhaust tone
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 380;

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    // White noise buffer for tire screech & nitro whoosh
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Bandpass for tire screech
    const screechFilter = this.ctx.createBiquadFilter();
    screechFilter.type = 'bandpass';
    screechFilter.frequency.value = 1450;
    screechFilter.Q.value = 4.5;
    this.driftGain = this.ctx.createGain();
    this.driftGain.gain.value = 0.0001;

    // Lowpass for nitro jet flame
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

  updateDriving(speedRatio, isDrifting, isNitro, active) {
    if (!this.isRunning || !this.ctx || this.muted || !active) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
        this.driftGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
        this.nitroGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      }
      return;
    }

    const now = this.ctx.currentTime;
    // Simulate 6 gears RPM sawtooth wave
    const gearMod = (speedRatio * 5.2) % 1;
    const baseFreq = 58 + speedRatio * 145 + gearMod * 55 + (isNitro ? 35 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.04);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
    this.engineFilter.frequency.setTargetAtTime(300 + speedRatio * 900, now, 0.05);
    this.engineGain.gain.setTargetAtTime(0.055 + speedRatio * 0.045, now, 0.05);

    this.driftGain.gain.setTargetAtTime(isDrifting && speedRatio > 0.15 ? 0.045 : 0.0001, now, 0.05);
    this.nitroGain.gain.setTargetAtTime(isNitro ? 0.09 : 0.0001, now, 0.04);
  }

  playBeep(freq = 520, duration = 0.14, type = 'sine') {
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

  startSynthBass() {
    if (this.bgmInterval) return;
    const notes = [55, 55, 65.41, 55, 73.42, 65.41, 49, 55];
    this.bgmInterval = setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const freq = notes[this.step % notes.length];
      this.step++;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0008, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);
    }, 240);
  }

  stopSynthBass() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const soundEngine = new SoundEngine();

// ============================================================================
// 3. THREE.JS CEL-SHADING & PROCEDURAL ANIME CAR / TRACK BUILDERS
// ============================================================================

let sharedToonGradient = null;
function getToonGradientMap() {
  if (sharedToonGradient) return sharedToonGradient;
  const data = new Uint8Array([
    35, 35, 45, 255,
    110, 115, 135, 255,
    205, 210, 230, 255,
    255, 255, 255, 255,
  ]);
  const texture = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  sharedToonGradient = texture;
  return texture;
}

function createKanjiSignTexture(text, primaryHex, bgHex = '#090718') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 256, 512);

  ctx.strokeStyle = primaryHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 232, 488);

  ctx.shadowColor = primaryHex;
  ctx.shadowBlur = 22;
  ctx.fillStyle = primaryHex;
  ctx.font = '900 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = text.split('');
  const step = 420 / Math.max(1, chars.length);
  chars.forEach((ch, idx) => {
    ctx.fillText(ch, 128, 70 + idx * step);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds an aggressive, multi-part anime cyberpunk drift supercar with:
 * - High-downforce aerodynamic front splitter with corner canards & intercooler
 * - Sculpted sloped hood with dual heat extraction louvers & power bulge
 * - Flared widebody over-fenders with rear brake cooling intake ducts
 * - Swept fastback greenhouse, racing mirrors, and visible cockpit roll-cage & bucket seats
 * - Full-width cyberpunk horizon LED lightbar & dual projector LED headlights
 * - Massive rear ground-effect diffuser with 4 vertical aerodynamic fins
 * - Burnt titanium twin exhaust cannons with hollow blue heat-treated tips
 * - Deep-dish stepped-lip alloy wheels with cross-drilled rotors & Brembo calipers
 * - Inverted-hull anime outline effect & 180-deg orientation (+Z forward, -Z rear)
 */
function buildAnimeCarMesh(carSpec: any, customization: any = {}) {
  const group = new THREE.Group();
  const carBody = new THREE.Group();
  // Rotate the internal model 180 degrees so its front (-Z in model space) faces +Z (the forward driving direction)
  carBody.rotation.y = Math.PI;
  group.add(carBody);

  const toonGrad = getToonGradientMap();

  const paintObj = PAINT_PRESETS.find(p => p.id === (customization.paint || carSpec.defaultPaint)) || PAINT_PRESETS[0];
  const glowObj = UNDERGLOW_PRESETS.find(g => g.id === (customization.glow || carSpec.defaultGlow)) || UNDERGLOW_PRESETS[0];
  const rimObj = RIM_PRESETS.find(r => r.id === (customization.rim || 'chrome')) || RIM_PRESETS[0];
  const hasSpoiler = customization.spoiler !== undefined ? customization.spoiler : true;

  // Base Materials
  const bodyColor = new THREE.Color(paintObj.hex);
  const bodyMat = new THREE.MeshToonMaterial({
    color: bodyColor,
    gradientMap: toonGrad,
  });

  const carbonMat = new THREE.MeshToonMaterial({
    color: new THREE.Color('#0d1117'),
    gradientMap: toonGrad,
  });

  const trimMat = new THREE.MeshToonMaterial({
    color: new THREE.Color('#161b22'),
    gradientMap: toonGrad,
  });

  const glassMat = new THREE.MeshToonMaterial({
    color: new THREE.Color('#08101e'),
    gradientMap: toonGrad,
  });

  const interiorMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#334155'),
  });

  const intercoolerMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#94a3b8'),
  });

  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x05070e,
    side: THREE.BackSide,
  });

  const accentGlowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(paintObj.emissive || paintObj.hex),
  });

  // Body Dimensions based on archetype
  const isHyper = carSpec.bodyStyle === 'hyper' || carSpec.bodyStyle === 'super';
  const isMuscle = carSpec.bodyStyle === 'muscle';
  const isClassic = carSpec.id === 'yuki';

  const bodyW = isHyper ? 2.30 : (isMuscle ? 2.22 : 2.12);
  const bodyH = isHyper ? 0.44 : 0.50;
  const bodyL = isMuscle ? 4.75 : (isHyper ? 4.60 : 4.45);

  // Helper to add outline to any mesh
  const addOutline = (mesh: any, scaleX = 1.045, scaleY = 1.07, scaleZ = 1.035) => {
    const outline = new THREE.Mesh(mesh.geometry, outlineMat);
    outline.position.copy(mesh.position);
    outline.rotation.copy(mesh.rotation);
    outline.scale.set(scaleX, scaleY, scaleZ);
    carBody.add(outline);
  };

  // 1. CHASSIS UNDERFLOOR & MAIN LOWER TORSO
  const lowerChassisGeo = new THREE.BoxGeometry(bodyW * 0.94, bodyH * 0.70, bodyL * 0.90);
  const lowerChassis = new THREE.Mesh(lowerChassisGeo, bodyMat);
  lowerChassis.position.set(0, 0.45, 0.05);
  carBody.add(lowerChassis);
  addOutline(lowerChassis, 1.04, 1.08, 1.03);

  // Waistline upper body ridge
  const upperBodyGeo = new THREE.BoxGeometry(bodyW * 0.88, bodyH * 0.50, bodyL * 0.88);
  const upperBody = new THREE.Mesh(upperBodyGeo, bodyMat);
  upperBody.position.set(0, 0.45 + bodyH * 0.42, 0.02);
  carBody.add(upperBody);

  // 2. SCULPTED SLOPED HOOD & FRONT NOSE CONE
  const hoodLength = bodyL * 0.38;
  const hoodZ = -bodyL * 0.28;
  const hoodGeo = new THREE.BoxGeometry(bodyW * 0.86, bodyH * 0.35, hoodLength);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.set(0, 0.56, hoodZ);
  hood.rotation.x = 0.11;
  carBody.add(hood);
  addOutline(hood, 1.04, 1.12, 1.03);

  // Center Power Bulge
  const bulgeGeo = new THREE.BoxGeometry(bodyW * 0.32, 0.07, hoodLength * 0.78);
  const bulge = new THREE.Mesh(bulgeGeo, bodyMat);
  bulge.position.set(0, 0.62, hoodZ);
  bulge.rotation.x = 0.11;
  carBody.add(bulge);

  // Dual Hood Heat Extraction Vents
  const ventGeo = new THREE.BoxGeometry(bodyW * 0.16, 0.03, hoodLength * 0.40);
  const ventL = new THREE.Mesh(ventGeo, carbonMat);
  ventL.position.set(-bodyW * 0.24, 0.61, hoodZ + 0.1);
  ventL.rotation.x = 0.11;
  const ventR = new THREE.Mesh(ventGeo, carbonMat);
  ventR.position.set(bodyW * 0.24, 0.61, hoodZ + 0.1);
  ventR.rotation.x = 0.11;
  carBody.add(ventL, ventR);

  // 3. FRONT BUMPER, INTERCOOLER & CARBON SPLITTER
  const bumperZ = -bodyL * 0.47;
  const bumperGeo = new THREE.BoxGeometry(bodyW * 0.98, bodyH * 0.65, 0.42);
  const bumper = new THREE.Mesh(bumperGeo, bodyMat);
  bumper.position.set(0, 0.42, bumperZ);
  carBody.add(bumper);
  addOutline(bumper, 1.035, 1.08, 1.04);

  // Front Radiator / Intercooler Mouth
  const mouthGeo = new THREE.BoxGeometry(bodyW * 0.60, 0.22, 0.25);
  const mouth = new THREE.Mesh(mouthGeo, carbonMat);
  mouth.position.set(0, 0.32, bumperZ - 0.12);
  carBody.add(mouth);

  // Silver Intercooler Core Fins
  const icGeo = new THREE.BoxGeometry(bodyW * 0.52, 0.16, 0.06);
  const icMesh = new THREE.Mesh(icGeo, intercoolerMat);
  icMesh.position.set(0, 0.32, bumperZ - 0.18);
  carBody.add(icMesh);

  // Lower Carbon Front Splitter
  const splitterGeo = new THREE.BoxGeometry(bodyW * 1.06, 0.06, 0.80);
  const splitter = new THREE.Mesh(splitterGeo, carbonMat);
  splitter.position.set(0, 0.20, bumperZ - 0.08);
  carBody.add(splitter);

  // Splitter Endplates
  const finGeo = new THREE.BoxGeometry(0.04, 0.16, 0.36);
  const splitFinL = new THREE.Mesh(finGeo, carbonMat);
  splitFinL.position.set(-bodyW * 0.53, 0.26, bumperZ - 0.12);
  const splitFinR = new THREE.Mesh(finGeo, carbonMat);
  splitFinR.position.set(bodyW * 0.53, 0.26, bumperZ - 0.12);
  carBody.add(splitFinL, splitFinR);

  // Corner Canards / Dive Planes
  const canardGeo = new THREE.BoxGeometry(0.28, 0.03, 0.24);
  const canardL = new THREE.Mesh(canardGeo, carbonMat);
  canardL.position.set(-bodyW * 0.48, 0.44, bumperZ - 0.14);
  canardL.rotation.set(-0.25, 0.35, 0.15);
  const canardR = new THREE.Mesh(canardGeo, carbonMat);
  canardR.position.set(bodyW * 0.48, 0.44, bumperZ - 0.14);
  canardR.rotation.set(-0.25, -0.35, -0.15);
  carBody.add(canardL, canardR);

  // 4. WIDEBODY OVER-FENDERS & REAR BRAKE DUCTS
  const frontFenderGeo = new THREE.BoxGeometry(bodyW * 1.08, bodyH * 0.60, 1.25);
  const frontFender = new THREE.Mesh(frontFenderGeo, bodyMat);
  frontFender.position.set(0, 0.46, -1.35);
  carBody.add(frontFender);
  addOutline(frontFender, 1.03, 1.08, 1.03);

  const rearFenderGeo = new THREE.BoxGeometry(bodyW * 1.14, bodyH * 0.65, 1.35);
  const rearFender = new THREE.Mesh(rearFenderGeo, bodyMat);
  rearFender.position.set(0, 0.48, 1.35);
  carBody.add(rearFender);
  addOutline(rearFender, 1.03, 1.08, 1.03);

  // Rear Brake Ducts
  const ductGeo = new THREE.BoxGeometry(0.06, 0.24, 0.35);
  const ductL = new THREE.Mesh(ductGeo, carbonMat);
  ductL.position.set(-bodyW * 0.55, 0.45, 0.62);
  const ductR = new THREE.Mesh(ductGeo, carbonMat);
  ductR.position.set(bodyW * 0.55, 0.45, 0.62);
  carBody.add(ductL, ductR);

  // Side Skirts & Pinstripe
  const skirtGeo = new THREE.BoxGeometry(bodyW * 1.06, 0.08, bodyL * 0.58);
  const skirts = new THREE.Mesh(skirtGeo, carbonMat);
  skirts.position.set(0, 0.22, 0.05);
  carBody.add(skirts);

  const pinstripeGeo = new THREE.BoxGeometry(bodyW * 1.08, 0.03, bodyL * 0.56);
  const pinstripe = new THREE.Mesh(pinstripeGeo, accentGlowMat);
  pinstripe.position.set(0, 0.26, 0.05);
  carBody.add(pinstripe);

  // 5. CABIN GREENHOUSE & RACING COCKPIT
  const cabinW = bodyW * 0.74;
  const cabinH = isHyper ? 0.38 : 0.46;
  const cabinL = isMuscle ? 2.05 : 2.15;
  const cabinZ = isMuscle ? 0.25 : 0.08;

  const cabinGeo = new THREE.BoxGeometry(cabinW, cabinH, cabinL);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.50 + bodyH * 0.72, cabinZ);
  carBody.add(cabin);
  addOutline(cabin, 1.045, 1.07, 1.035);

  // Windshield
  const wsGeo = new THREE.BoxGeometry(cabinW * 0.96, cabinH * 0.90, 0.65);
  const windshield = new THREE.Mesh(wsGeo, glassMat);
  windshield.position.set(0, cabin.position.y - 0.04, cabinZ - cabinL * 0.46);
  windshield.rotation.x = -0.38;
  carBody.add(windshield);

  // Rear Glass
  const rearGlassGeo = new THREE.BoxGeometry(cabinW * 0.92, cabinH * 0.85, 0.75);
  const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
  rearGlass.position.set(0, cabin.position.y - 0.05, cabinZ + cabinL * 0.46);
  rearGlass.rotation.x = 0.32;
  carBody.add(rearGlass);

  // Roof
  const roofGeo = new THREE.BoxGeometry(cabinW * 0.88, 0.06, cabinL * 0.65);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, cabin.position.y + cabinH * 0.49, cabinZ);
  carBody.add(roof);

  // Cockpit Roll Bar & Seat Heads
  const rollBarGeo = new THREE.CylinderGeometry(0.035, 0.035, cabinW * 0.85, 8);
  rollBarGeo.rotateZ(Math.PI / 2);
  const rollBar = new THREE.Mesh(rollBarGeo, interiorMat);
  rollBar.position.set(0, cabin.position.y + 0.08, cabinZ + 0.25);
  carBody.add(rollBar);

  const seatHeadGeo = new THREE.BoxGeometry(0.24, 0.22, 0.16);
  const seatL = new THREE.Mesh(seatHeadGeo, interiorMat);
  seatL.position.set(-cabinW * 0.25, cabin.position.y - 0.02, cabinZ - 0.05);
  const seatR = new THREE.Mesh(seatHeadGeo, interiorMat);
  seatR.position.set(cabinW * 0.25, cabin.position.y - 0.02, cabinZ - 0.05);
  carBody.add(seatL, seatR);

  // A-Pillar Mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.18, 0.08, 0.20);
  const mirrorL = new THREE.Mesh(mirrorGeo, carbonMat);
  mirrorL.position.set(-cabinW * 0.58, cabin.position.y - 0.08, cabinZ - cabinL * 0.35);
  mirrorL.rotation.y = 0.18;
  const mirrorR = new THREE.Mesh(mirrorGeo, carbonMat);
  mirrorR.position.set(cabinW * 0.58, cabin.position.y - 0.08, cabinZ - cabinL * 0.35);
  mirrorR.rotation.y = -0.18;
  carBody.add(mirrorL, mirrorR);

  // Roof Scoop for Super/Hyper/Drift
  if (isHyper || carSpec.id === 'devil' || carSpec.bodyStyle === 'drift') {
    const scoopGeo = new THREE.BoxGeometry(0.38, 0.16, 0.85);
    const scoop = new THREE.Mesh(scoopGeo, carbonMat);
    scoop.position.set(0, cabin.position.y + cabinH * 0.58, cabinZ - 0.05);
    carBody.add(scoop);
  }

  // 6. LED HEADLIGHTS
  if (isClassic) {
    const popupGeo = new THREE.BoxGeometry(0.36, 0.14, 0.32);
    const popL = new THREE.Mesh(popupGeo, bodyMat);
    popL.position.set(-bodyW * 0.32, 0.62, bumperZ + 0.22);
    const popR = new THREE.Mesh(popupGeo, bodyMat);
    popR.position.set(bodyW * 0.32, 0.62, bumperZ + 0.22);
    const popLensGeo = new THREE.BoxGeometry(0.30, 0.10, 0.04);
    const popLensMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lensL = new THREE.Mesh(popLensGeo, popLensMat);
    lensL.position.set(0, 0, -0.16);
    const lensR = new THREE.Mesh(popLensGeo, popLensMat);
    lensR.position.set(0, 0, -0.16);
    popL.add(lensL);
    popR.add(lensR);
    carBody.add(popL, popR);
  } else {
    const headMat = new THREE.MeshBasicMaterial({ color: 0xf0fdf4 });
    const drlMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const headGroupL = new THREE.Group();
    headGroupL.position.set(-bodyW * 0.35, 0.52, bumperZ - 0.06);
    headGroupL.rotation.set(-0.10, 0.16, -0.12);

    const projGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 12);
    projGeo.rotateX(Math.PI / 2);
    const eye1L = new THREE.Mesh(projGeo, headMat);
    eye1L.position.set(-0.10, 0, 0);
    const eye2L = new THREE.Mesh(projGeo, headMat);
    eye2L.position.set(0.08, 0, 0);

    const browGeo = new THREE.BoxGeometry(0.34, 0.035, 0.06);
    const browL = new THREE.Mesh(browGeo, drlMat);
    browL.position.set(0, 0.065, 0.01);
    browL.rotation.z = -0.08;
    headGroupL.add(eye1L, eye2L, browL);

    const headGroupR = new THREE.Group();
    headGroupR.position.set(bodyW * 0.35, 0.52, bumperZ - 0.06);
    headGroupR.rotation.set(-0.10, -0.16, 0.12);

    const eye1R = new THREE.Mesh(projGeo, headMat);
    eye1R.position.set(-0.08, 0, 0);
    const eye2R = new THREE.Mesh(projGeo, headMat);
    eye2R.position.set(0.10, 0, 0);

    const browR = new THREE.Mesh(browGeo, drlMat);
    browR.position.set(0, 0.065, 0.01);
    browR.rotation.z = 0.08;
    headGroupR.add(eye1R, eye2R, browR);

    carBody.add(headGroupL, headGroupR);
  }

  // 7. HORIZON TAILLIGHT BAR & REAR DIFFUSER
  const rearBumperZ = bodyL * 0.48;
  const rearBumperGeo = new THREE.BoxGeometry(bodyW * 0.98, bodyH * 0.65, 0.38);
  const rearBumper = new THREE.Mesh(rearBumperGeo, bodyMat);
  rearBumper.position.set(0, 0.44, rearBumperZ - 0.05);
  carBody.add(rearBumper);
  addOutline(rearBumper, 1.035, 1.08, 1.04);

  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
  const tailGeo = new THREE.BoxGeometry(bodyW * 0.92, 0.10, 0.08);
  const tailBar = new THREE.Mesh(tailGeo, tailMat);
  tailBar.position.set(0, 0.60, rearBumperZ + 0.14);
  carBody.add(tailBar);

  // Upswept Diffuser with 4 fins
  const diffuserGeo = new THREE.BoxGeometry(bodyW * 0.88, 0.14, 0.55);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
  diffuser.position.set(0, 0.22, rearBumperZ - 0.02);
  diffuser.rotation.x = -0.15;
  carBody.add(diffuser);

  const strakeGeo = new THREE.BoxGeometry(0.04, 0.18, 0.48);
  [-0.32, -0.11, 0.11, 0.32].forEach(offset => {
    const strake = new THREE.Mesh(strakeGeo, carbonMat);
    strake.position.set(offset * bodyW, 0.20, rearBumperZ);
    strake.rotation.x = -0.15;
    carBody.add(strake);
  });

  // Dual Burnt Titanium Exhaust Tips
  const pipeOuterGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.38, 16);
  pipeOuterGeo.rotateX(Math.PI / 2);
  const pipeInnerGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.39, 16);
  pipeInnerGeo.rotateX(Math.PI / 2);

  const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const innerMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

  [-0.44, 0.44].forEach(ex => {
    const pipeOuter = new THREE.Mesh(pipeOuterGeo, exhaustMat);
    pipeOuter.position.set(ex, 0.26, rearBumperZ + 0.14);
    const pipeInner = new THREE.Mesh(pipeInnerGeo, innerMat);
    pipeInner.position.set(ex, 0.26, rearBumperZ + 0.145);
    carBody.add(pipeOuter, pipeInner);
  });

  // 8. SWAN-NECK GT WING / RACE SPOILER
  if (hasSpoiler) {
    const wingY = 1.12;
    const wingZ = rearBumperZ - 0.18;

    const strutGeo = new THREE.BoxGeometry(0.05, 0.46, 0.26);
    const strutL = new THREE.Mesh(strutGeo, carbonMat);
    strutL.position.set(-bodyW * 0.32, 0.88, wingZ);
    strutL.rotation.x = -0.15;
    const strutR = new THREE.Mesh(strutGeo, carbonMat);
    strutR.position.set(bodyW * 0.32, 0.88, wingZ);
    strutR.rotation.x = -0.15;

    const bladeGeo = new THREE.BoxGeometry(bodyW * 1.12, 0.07, 0.44);
    const blade = new THREE.Mesh(bladeGeo, bodyMat);
    blade.position.set(0, wingY, wingZ + 0.06);
    blade.rotation.x = 0.16;

    const bladeOutline = new THREE.Mesh(bladeGeo, outlineMat);
    bladeOutline.position.copy(blade.position);
    bladeOutline.rotation.copy(blade.rotation);
    bladeOutline.scale.set(1.03, 1.25, 1.06);

    const endplateGeo = new THREE.BoxGeometry(0.04, 0.26, 0.48);
    const endL = new THREE.Mesh(endplateGeo, carbonMat);
    endL.position.set(-bodyW * 0.56, wingY + 0.02, wingZ + 0.06);
    endL.rotation.x = 0.16;
    const endR = new THREE.Mesh(endplateGeo, carbonMat);
    endR.position.set(bodyW * 0.56, wingY + 0.02, wingZ + 0.06);
    endR.rotation.x = 0.16;

    carBody.add(strutL, strutR, blade, bladeOutline, endL, endR);
  }

  // 9. HIGH-DETAIL DEEP-DISH WHEELS WITH BREMBO CALIPERS
  const tireRadius = 0.38;
  const tireWidth = 0.32;
  const rimRadius = 0.25;

  const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 22);
  tireGeo.rotateZ(Math.PI / 2);

  const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth * 1.02, 12);
  rimGeo.rotateZ(Math.PI / 2);

  const rotorGeo = new THREE.CylinderGeometry(rimRadius * 0.78, rimRadius * 0.78, 0.04, 16);
  rotorGeo.rotateZ(Math.PI / 2);

  const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.12);

  const tireMat = new THREE.MeshToonMaterial({ color: 0x111827, gradientMap: toonGrad });
  const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(rimObj.hex) });
  const rotorMat = new THREE.MeshBasicMaterial({ color: 0xd1d5db });
  const caliperMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const wheelPositions = [
    [-bodyW * 0.50, 0.38, -1.35, true],
    [bodyW * 0.50, 0.38, -1.35, false],
    [-bodyW * 0.54, 0.38, 1.35, true],
    [bodyW * 0.54, 0.38, 1.35, false],
  ];

  const wheels: any[] = [];
  wheelPositions.forEach(([wx, wy, wz, isLeft]) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx as number, wy as number, wz as number);

    const tire = new THREE.Mesh(tireGeo, tireMat);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.x = (isLeft ? 0.05 : -0.05);

    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(isLeft ? 0.06 : -0.06, 0.10, 0);

    wGroup.add(tire, rim, rotor, caliper);
    carBody.add(wGroup);
    wheels.push(wGroup);
  });

  // 10. NEON UNDERGLOW PLANE
  if (glowObj.id !== 'none') {
    const glowGeo = new THREE.PlaneGeometry(bodyW * 1.40, bodyL * 1.15);
    glowGeo.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(glowObj.hex),
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowPlane = new THREE.Mesh(glowGeo, glowMat);
    glowPlane.position.y = 0.06;
    carBody.add(glowPlane);
  }

  // 11. DUAL NITRO BOOST FLAMES
  const flameGeo = new THREE.ConeGeometry(0.20, 1.60, 12);
  flameGeo.rotateX(Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.90,
    blending: THREE.AdditiveBlending,
  });
  const flameL = new THREE.Mesh(flameGeo, flameMat);
  flameL.position.set(-0.44, 0.26, rearBumperZ + 0.85);
  const flameR = new THREE.Mesh(flameGeo, flameMat);
  flameR.position.set(0.44, 0.26, rearBumperZ + 0.85);
  flameL.visible = false;
  flameR.visible = false;
  carBody.add(flameL, flameR);

  group.userData = { wheels, flameL, flameR, tailMat, carBody };
  return group;
}

/**
 * Generates closed CatmullRom spline, flat ribbon road geometry, neon barriers,
 * start/finish gantry, and themed environment props (Tokyo skyscrapers, Akina sakura, Coastal bridges).
 */
function buildTrackEnvironment(scene, trackConfig) {
  const pts = trackConfig.controlPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  const segments = 520;
  const roadHalfWidth = 13.5;

  const frames = [];
  let totalLength = 0;
  let prevPt = curve.getPointAt(0);

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const p = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const normal = new THREE.Vector3().crossVectors(right, tangent).normalize();

    if (i > 0) totalLength += p.distanceTo(prevPt);
    prevPt = p.clone();
    frames.push({ u, p, tangent, right, normal, dist: totalLength });
  }

  // Build Road Ribbon Geometry
  const roadPositions = [];
  const roadColors = [];
  const roadIndices = [];

  const barrierLPositions = [];
  const barrierRPositions = [];
  const barrierIndices = [];

  const cRoad = new THREE.Color(trackConfig.theme.roadColor);
  const cEdge = new THREE.Color(trackConfig.theme.shoulderColor);
  const cCenter = new THREE.Color(trackConfig.theme.barrierColor);

  for (let i = 0; i <= segments; i++) {
    const f = frames[i];
    // 4 vertices across road width: Left Edge, Left Lane, Right Lane, Right Edge
    const vL2 = f.p.clone().addScaledVector(f.right, -roadHalfWidth);
    const vL1 = f.p.clone().addScaledVector(f.right, -roadHalfWidth * 0.86);
    const vR1 = f.p.clone().addScaledVector(f.right, roadHalfWidth * 0.86);
    const vR2 = f.p.clone().addScaledVector(f.right, roadHalfWidth);

    [vL2, vL1, vR1, vR2].forEach((v, idx) => {
      roadPositions.push(v.x, v.y + 0.05, v.z);
      const isStripe = (idx === 0 || idx === 3);
      const col = isStripe ? (i % 4 < 2 ? cEdge : new THREE.Color('#ffffff')) : (i % 6 === 0 && idx === 1 ? cCenter : cRoad);
      roadColors.push(col.r, col.g, col.b);
    });

    // Barrier walls
    const bLBot = f.p.clone().addScaledVector(f.right, -(roadHalfWidth + 0.4));
    const bLTop = bLBot.clone().add(new THREE.Vector3(0, 1.35, 0));
    barrierLPositions.push(bLBot.x, bLBot.y, bLBot.z, bLTop.x, bLTop.y, bLTop.z);

    const bRBot = f.p.clone().addScaledVector(f.right, roadHalfWidth + 0.4);
    const bRTop = bRBot.clone().add(new THREE.Vector3(0, 1.35, 0));
    barrierRPositions.push(bRBot.x, bRBot.y, bRBot.z, bRTop.x, bRTop.y, bRTop.z);

    if (i < segments) {
      const base = i * 4;
      for (let k = 0; k < 3; k++) {
        roadIndices.push(base + k, base + k + 1, base + k + 4);
        roadIndices.push(base + k + 1, base + k + 5, base + k + 4);
      }
      const bBase = i * 2;
      barrierIndices.push(bBase, bBase + 1, bBase + 2, bBase + 1, bBase + 3, bBase + 2);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(roadColors, 3));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: trackConfig.sceneryType === 'city' ? 0.22 : 0.55,
    metalness: trackConfig.sceneryType === 'city' ? 0.45 : 0.15,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  scene.add(roadMesh);

  // Neon Guardrails
  const barrierMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(trackConfig.theme.barrierColor),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.52,
  });

  const bGeoL = new THREE.BufferGeometry();
  bGeoL.setAttribute('position', new THREE.Float32BufferAttribute(barrierLPositions, 3));
  bGeoL.setIndex(barrierIndices);
  scene.add(new THREE.Mesh(bGeoL, barrierMat));

  const bGeoR = new THREE.BufferGeometry();
  bGeoR.setAttribute('position', new THREE.Float32BufferAttribute(barrierRPositions, 3));
  bGeoR.setIndex(barrierIndices);
  scene.add(new THREE.Mesh(bGeoR, barrierMat));

  // Ground / Ocean Plane
  const groundGeo = new THREE.PlaneGeometry(3600, 3600);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshToonMaterial({
    color: new THREE.Color(trackConfig.theme.groundColor),
    gradientMap: getToonGradientMap(),
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.y = -3.0;
  scene.add(groundMesh);

  // Start / Finish Gantry Banner
  const f0 = frames[0];
  const gantryGroup = new THREE.Group();
  gantryGroup.position.copy(f0.p);
  gantryGroup.lookAt(f0.p.clone().add(f0.tangent));

  const pillarGeo = new THREE.BoxGeometry(1.1, 10, 1.1);
  const pillarMat = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: getToonGradientMap() });
  const pL = new THREE.Mesh(pillarGeo, pillarMat);
  pL.position.set(-roadHalfWidth - 0.8, 5, 0);
  const pR = new THREE.Mesh(pillarGeo, pillarMat);
  pR.position.set(roadHalfWidth + 0.8, 5, 0);

  const archGeo = new THREE.BoxGeometry((roadHalfWidth + 1.5) * 2, 2.2, 1.4);
  const archMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(trackConfig.theme.shoulderColor) });
  const arch = new THREE.Mesh(archGeo, archMat);
  arch.position.set(0, 9.5, 0);
  gantryGroup.add(pL, pR, arch);
  scene.add(gantryGroup);

  // Scenery Props Generation along Track
  const toonGrad = getToonGradientMap();
  const kanjiWords = ['疾風', '東京', '峠道', '最速', '未来', '無敵', 'ドリフト', '雷神'];
  const neonColors = ['#00f0ff', '#ff007f', '#a855f7', '#fbbf24', '#39ff14'];

  for (let i = 8; i < segments - 8; i += 9) {
    const f = frames[i];
    const side = (i % 18 === 0) ? 1 : -1;

    if (trackConfig.sceneryType === 'city') {
      // Cyberpunk Skyscrapers + Glowing Kanji Signs + Overhead Neon Arches
      const bW = 14 + (i % 5) * 4;
      const bH = 38 + (i % 7) * 18;
      const bD = 14 + (i % 4) * 4;
      const bGeo = new THREE.BoxGeometry(bW, bH, bD);
      const bMat = new THREE.MeshToonMaterial({
        color: new THREE.Color(i % 3 === 0 ? '#0d1326' : '#151934'),
        gradientMap: toonGrad,
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      const distOut = roadHalfWidth + 16 + (i % 3) * 8;
      const pos = f.p.clone().addScaledVector(f.right, side * distOut);
      bMesh.position.set(pos.x, pos.y + bH * 0.45 - 6, pos.z);
      scene.add(bMesh);

      // Vertical Kanji Neon Sign facing the road
      const signColor = neonColors[i % neonColors.length];
      const signTex = createKanjiSignTexture(kanjiWords[i % kanjiWords.length], signColor);
      const signGeo = new THREE.PlaneGeometry(5.5, 13.5);
      const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
      const signMesh = new THREE.Mesh(signGeo, signMat);
      const signPos = f.p.clone().addScaledVector(f.right, side * (roadHalfWidth + 4.8));
      signMesh.position.set(signPos.x, f.p.y + 9.5, signPos.z);
      signMesh.lookAt(f.p.x, f.p.y + 9.5, f.p.z);
      scene.add(signMesh);

      // Overhead Neon Highway Portal every 36 segments
      if (i % 36 === 0) {
        const portalGeo = new THREE.TorusGeometry(roadHalfWidth + 1.2, 0.35, 8, 24, Math.PI);
        const portalMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(signColor) });
        const portal = new THREE.Mesh(portalGeo, portalMat);
        portal.position.copy(f.p);
        portal.lookAt(f.p.clone().add(f.tangent));
        scene.add(portal);
      }
    } else if (trackConfig.sceneryType === 'mountain') {
      // Mount Akina Sakura Trees & Canyon Peaks
      const trunkGeo = new THREE.CylinderGeometry(0.45, 0.7, 4.5, 7);
      const trunkMat = new THREE.MeshToonMaterial({ color: 0x3e2723, gradientMap: toonGrad });
      const crownGeo = new THREE.DodecahedronGeometry(3.8 + (i % 3), 1);
      const crownMat = new THREE.MeshToonMaterial({
        color: i % 3 === 0 ? 0xff80ab : 0xf48fb1,
        gradientMap: toonGrad,
      });

      const treePos = f.p.clone().addScaledVector(f.right, side * (roadHalfWidth + 6.5));
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(treePos.x, treePos.y + 2.2, treePos.z);
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(treePos.x, treePos.y + 5.8, treePos.z);
      scene.add(trunk, crown);

      // Opposite side canyon boulder
      if (i % 18 === 0) {
        const rockGeo = new THREE.DodecahedronGeometry(12 + (i % 5) * 3, 0);
        const rockMat = new THREE.MeshToonMaterial({ color: 0x2a1e3f, gradientMap: toonGrad });
        const rockPos = f.p.clone().addScaledVector(f.right, -side * (roadHalfWidth + 22));
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(rockPos.x, rockPos.y + 6, rockPos.z);
        scene.add(rock);
      }
    } else {
      // Coastal Highway Suspension Towers & Synthwave Palms
      if (i % 27 === 0) {
        const towerGeo = new THREE.BoxGeometry(1.8, 28, 1.8);
        const towerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const tL = new THREE.Mesh(towerGeo, towerMat);
        const pLPos = f.p.clone().addScaledVector(f.right, -(roadHalfWidth + 2.2));
        tL.position.set(pLPos.x, pLPos.y + 12, pLPos.z);

        const tR = new THREE.Mesh(towerGeo, towerMat);
        const pRPos = f.p.clone().addScaledVector(f.right, roadHalfWidth + 2.2);
        tR.position.set(pRPos.x, pRPos.y + 12, pRPos.z);

        const crossBeam = new THREE.Mesh(new THREE.BoxGeometry((roadHalfWidth + 3) * 2, 1.4, 1.4), towerMat);
        const cPos = f.p.clone();
        crossBeam.position.set(cPos.x, cPos.y + 23, cPos.z);
        crossBeam.lookAt(f.p.clone().add(f.tangent));
        scene.add(tL, tR, crossBeam);
      } else {
        // Neon Light Pylon
        const pylonGeo = new THREE.CylinderGeometry(0.25, 0.25, 9, 6);
        const pylonMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x38bdf8 : 0xf43f5e });
        const pylonPos = f.p.clone().addScaledVector(f.right, side * (roadHalfWidth + 1.5));
        const pylon = new THREE.Mesh(pylonGeo, pylonMat);
        pylon.position.set(pylonPos.x, pylonPos.y + 4.5, pylonPos.z);
        scene.add(pylon);
      }
    }
  }

  return { frames, totalLength, roadHalfWidth };
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================

function formatRaceTime(seconds) {
  if (!seconds || seconds < 0 || !isFinite(seconds)) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

function getEffectiveCarStats(carId, customizations) {
  const car = VEHICLES.find(v => v.id === carId) || VEHICLES[0];
  const cust = customizations[carId] || INITIAL_SAVE.customizations[carId];
  const upg = cust?.upgrades || { engine: 0, turbo: 0, brakes: 0, tires: 0 };
  return {
    speed: Math.min(100, car.baseStats.speed + upg.engine * 3),
    accel: Math.min(100, car.baseStats.accel + upg.turbo * 3),
    handling: Math.min(100, car.baseStats.handling + upg.brakes * 3),
    drift: Math.min(100, car.baseStats.drift + upg.tires * 3),
  };
}

// ============================================================================
// 5. UNDERGROUND GARAGE 3D TURNTABLE VIEWPORT
// ============================================================================

function GarageTurntable({ carSpec, customization }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070814');
    scene.fog = new THREE.FogExp2('#070814', 0.035);

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(4.8, 2.3, 5.6);
    camera.lookAt(0, 0.65, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Underground Garage Lighting
    const ambient = new THREE.AmbientLight(0xc4b5fd, 1.1);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    keyLight.position.set(6, 10, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff007f, 1.4);
    rimLight.position.set(-6, 5, -6);
    scene.add(rimLight);

    // Neon Turntable Platform
    const platGroup = new THREE.Group();
    const discGeo = new THREE.CylinderGeometry(3.4, 3.6, 0.18, 48);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x111526, metalness: 0.7, roughness: 0.25 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -0.09;
    platGroup.add(disc);

    const ringGeo = new THREE.RingGeometry(3.25, 3.42, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.01;
    platGroup.add(ring);

    // Background Neon Garage Arch
    const archGeo = new THREE.TorusGeometry(5.2, 0.08, 8, 40, Math.PI);
    const archMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, 0, -4.5);
    scene.add(arch);

    const carMesh = buildAnimeCarMesh(carSpec, customization);
    platGroup.add(carMesh);
    scene.add(platGroup);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      platGroup.rotation.y += 0.0085;
      carMesh.userData.wheels.forEach(w => {
        w.rotation.x -= 0.04;
      });
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [carSpec, customization]);

  return <div ref={mountRef} className="w-full h-full min-h-[300px] rounded-xl overflow-hidden" />;
}

// ============================================================================
// 6. MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Persistent Save State
  const [saveData, setSaveData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...INITIAL_SAVE, ...parsed, customizations: { ...INITIAL_SAVE.customizations, ...(parsed.customizations || {}) } };
      }
    } catch (e) {
      // Fallback to default save
    }
    return INITIAL_SAVE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      // Ignore storage quota errors
    }
  }, [saveData]);

  // Navigation & Game Configuration State
  const [screen, setScreen] = useState('menu'); // 'menu' | 'garage' | 'career' | 'race_setup' | 'racing' | 'results'
  const [garageTab, setGarageTab] = useState('vehicles'); // 'vehicles' | 'customize' | 'upgrades'
  const [gameMode, setGameMode] = useState('quick'); // 'quick' | 'career' | 'time_attack' | 'drift' | 'championship'
  const [selectedTrackId, setSelectedTrackId] = useState('tokyo');
  const [difficulty, setDifficulty] = useState('normal'); // 'easy' | 'normal' | 'hard'
  const [activeCareerStage, setActiveCareerStage] = useState(null);
  const [championshipState, setChampionshipState] = useState({ active: false, round: 0, standings: {} });
  const [muted, setMuted] = useState(false);
  const [cameraMode, setCameraMode] = useState(0); // 0: Dynamic Chase, 1: Far Chase, 2: Hood/Bumper
  const [showControlsModal, setShowControlsModal] = useState(false);

  // Live Race HUD State
  const [hud, setHud] = useState<any>({
    speedKph: 0,
    rpmRatio: 0,
    gear: 1,
    lap: 1,
    totalLaps: 3,
    position: 1,
    totalRacers: 6,
    lapTime: 0,
    bestLapTime: null,
    totalTime: 0,
    nitro: 100,
    isNitro: false,
    isDrifting: false,
    currentDriftScore: 0,
    driftMultiplier: 1,
    totalDriftScore: 0,
    countdown: 3, // 3, 2, 1, 0 ('GO!'), -1 (racing)
    rivalCallout: null,
    minimapCars: [],
    sectorBanner: null,
  });

  const [raceResult, setRaceResult] = useState(null);

  // Refs for real-time 60fps Three.js loop
  const raceCanvasRef = useRef(null);
  const inputRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  });
  const cameraModeRef = useRef(0);
  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  const currentCarSpec = useMemo(
    () => VEHICLES.find(v => v.id === saveData.selectedCar) || VEHICLES[0],
    [saveData.selectedCar]
  );
  const currentCarCust = saveData.customizations[saveData.selectedCar] || INITIAL_SAVE.customizations.akira;
  const currentStats = useMemo(
    () => getEffectiveCarStats(saveData.selectedCar, saveData.customizations),
    [saveData.selectedCar, saveData.customizations]
  );
  const currentTrackSpec = useMemo(
    () => TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0],
    [selectedTrackId]
  );

  // Audio Toggle
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.muted = next;
    if (!next) soundEngine.playBeep(660, 0.1);
  };

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') inputRef.current.up = true;
      if (k === 's' || e.key === 'ArrowDown') inputRef.current.down = true;
      if (k === 'a' || e.key === 'ArrowLeft') inputRef.current.left = true;
      if (k === 'd' || e.key === 'ArrowRight') inputRef.current.right = true;
      if (e.code === 'Space') {
        inputRef.current.drift = true;
        if (screen === 'racing') e.preventDefault();
      }
      if (e.key === 'Shift') inputRef.current.nitro = true;
      if (k === 'c' && screen === 'racing') {
        setCameraMode(prev => (prev + 1) % 3);
      }
    };

    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') inputRef.current.up = false;
      if (k === 's' || e.key === 'ArrowDown') inputRef.current.down = false;
      if (k === 'a' || e.key === 'ArrowLeft') inputRef.current.left = false;
      if (k === 'd' || e.key === 'ArrowRight') inputRef.current.right = false;
      if (e.code === 'Space') inputRef.current.drift = false;
      if (e.key === 'Shift') inputRef.current.nitro = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [screen]);

  // Start Race Handler
  const launchRace = useCallback((opts: any = {}) => {
    soundEngine.resume();
    soundEngine.playBeep(780, 0.16, 'triangle');
    soundEngine.startSynthBass();

    const mode = opts.mode || gameMode;
    const trackId = opts.trackId || selectedTrackId;
    const diff = opts.difficulty || difficulty;
    const careerStage = opts.careerStage || null;

    setGameMode(mode);
    setSelectedTrackId(trackId);
    setDifficulty(diff);
    setActiveCareerStage(careerStage);
    setRaceResult(null);
    setScreen('racing');
  }, [gameMode, selectedTrackId, difficulty]);

  // ============================================================================
  // 7. 3D RACE ENGINE LOOP (SPLINE PHYSICS, DRIFTING, NITRO, AI, PARTICLES)
  // ============================================================================

  useEffect(() => {
    if (screen !== 'racing') {
      soundEngine.updateDriving(0, false, false, false);
      soundEngine.stopSynthBass();
      return;
    }

    const container = raceCanvasRef.current;
    if (!container) return;

    const trackConfig = TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0];
    const totalLaps = gameMode === 'drift' ? 2 : 3;
    const isSolo = gameMode === 'time_attack' || gameMode === 'drift';

    // 1. Setup Three.js Scene, Sky & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(trackConfig.theme.skyTop);
    scene.fog = new THREE.FogExp2(trackConfig.theme.fogColor, 0.0042);

    const camera = new THREE.PerspectiveCamera(62, container.clientWidth / container.clientHeight, 0.1, 950);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambLight = new THREE.AmbientLight(new THREE.Color(trackConfig.theme.ambientLight), 1.25);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(new THREE.Color(trackConfig.theme.dirLight), 1.65);
    dirLight.position.set(120, 240, 100);
    scene.add(dirLight);

    // 3. Build Track Geometry & Scenery
    const { frames, totalLength, roadHalfWidth } = buildTrackEnvironment(scene, trackConfig);

    // Helper to sample interpolated frame at normalized spline coordinate u in [0, 1)
    const sampleSplineFrame = (uNorm) => {
      const wrapped = ((uNorm % 1) + 1) % 1;
      const exactIdx = wrapped * (frames.length - 1);
      const idx0 = Math.floor(exactIdx);
      const idx1 = (idx0 + 1) % (frames.length - 1);
      const frac = exactIdx - idx0;

      const f0 = frames[idx0];
      const f1 = frames[idx1];
      const p = new THREE.Vector3().lerpVectors(f0.p, f1.p, frac);
      const tangent = new THREE.Vector3().lerpVectors(f0.tangent, f1.tangent, frac).normalize();
      const right = new THREE.Vector3().lerpVectors(f0.right, f1.right, frac).normalize();
      const normal = new THREE.Vector3().lerpVectors(f0.normal, f1.normal, frac).normalize();
      return { p, tangent, right, normal };
    };

    // 4. Create Player Vehicle & Physics State
    const playerMesh = buildAnimeCarMesh(currentCarSpec, currentCarCust);
    scene.add(playerMesh);

    const maxSpeedUnits = 64 + (currentStats.speed / 100) * 38; // ~230 to 365 KPH display
    const accelRate = 28 + (currentStats.accel / 100) * 26;
    const handlingFactor = 0.85 + (currentStats.handling / 100) * 0.55;
    const driftBonusFactor = 1.0 + (currentStats.drift / 100) * 0.65;

    const player = {
      id: 'player',
      name: 'YOU',
      isPlayer: true,
      mesh: playerMesh,
      s: 0.002,
      lap: 1,
      lateral: isSolo ? 0 : -3.2,
      lateralVel: 0,
      speed: 0,
      steerAngle: 0,
      driftAngle: 0,
      isDrifting: false,
      isNitro: false,
      nitro: 100,
      currentDriftScore: 0,
      driftMultiplier: 1,
      totalDriftScore: 0,
      driftComboTimer: 0,
      lapStartTime: 0,
      bestLapTime: null,
      finished: false,
      finishTime: 0,
      shakeIntensity: 0,
    };

    // 5. Create 5 AI Rivals
    const diffMult = difficulty === 'easy' ? 0.85 : difficulty === 'hard' ? 1.01 : 0.93;
    const aiRacers = [];

    if (!isSolo) {
      AI_RIVALS.forEach((rival, idx) => {
        const rSpec = VEHICLES.find(v => v.id === rival.carId) || VEHICLES[0];
        const rMesh = buildAnimeCarMesh(rSpec, { paint: rival.paint, glow: rival.glow, spoiler: true });
        scene.add(rMesh);

        aiRacers.push({
          ...rival,
          isPlayer: false,
          mesh: rMesh,
          s: 0.008 + idx * 0.006,
          lap: 1,
          lateral: idx % 2 === 0 ? 3.2 : -3.2,
          targetLateral: rival.lanePref,
          laneTimer: 1.5 + idx * 0.7,
          speed: 0,
          baseMaxSpeed: maxSpeedUnits * rival.skillOffset * diffMult,
          finished: false,
          finishTime: 0,
        });
      });
    }

    const allRacers = [player, ...aiRacers];

    // 6. Particle Systems: Drift Tire Smoke, Collision/Drift Sparks, and Falling Sakura/Rain
    const particlePool = [];
    const smokeGeo = new THREE.DodecahedronGeometry(0.38, 0);
    const sparkGeo = new THREE.BoxGeometry(0.14, 0.14, 0.45);

    const spawnParticle = (pos, vel, colorHex, scale, life, isSpark = false) => {
      if (particlePool.length > 140) return;
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(isSpark ? sparkGeo : smokeGeo, mat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(scale);
      scene.add(mesh);
      particlePool.push({ mesh, vel: vel.clone(), life, maxLife: life, isSpark });
    };

    // Ambient Weather Particles (Rain in Tokyo, Sakura Petals in Akina, Sea Spray in Coastal)
    const weatherCount = 260;
    const weatherGeo = new THREE.BufferGeometry();
    const weatherPos = new Float32Array(weatherCount * 3);
    for (let i = 0; i < weatherCount * 3; i++) {
      weatherPos[i] = (Math.random() - 0.5) * 140;
    }
    weatherGeo.setAttribute('position', new THREE.BufferAttribute(weatherPos, 3));
    const weatherMat = new THREE.PointsMaterial({
      color: trackConfig.sceneryType === 'mountain' ? 0xff9ec6 : 0x7dd3fc,
      size: trackConfig.sceneryType === 'mountain' ? 0.85 : 0.45,
      transparent: true,
      opacity: 0.75,
    });
    const weatherPoints = new THREE.Points(weatherGeo, weatherMat);
    scene.add(weatherPoints);

    // Skid Mark Ribbons Pool
    const skidMarks = [];
    const skidGeo = new THREE.PlaneGeometry(0.35, 1.4);
    skidGeo.rotateX(-Math.PI / 2);
    const skidMat = new THREE.MeshBasicMaterial({
      color: 0x050508,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    // 7. Race Timing & Countdown State
    let clock = new THREE.Clock();
    let elapsedRaceTime = 0;
    let countdownTimer = 3.4;
    let lastBeepSecond = 4;
    let hudUpdateCounter = 0;
    let calloutCooldown = 4.0;
    let activeCallout = null;
    let animFrameId = null;

    // Position all cars on starting grid initially
    allRacers.forEach(r => {
      const f = sampleSplineFrame(r.s);
      const worldPos = f.p.clone().addScaledVector(f.right, r.lateral);
      r.mesh.position.copy(worldPos);
      const lookTarget = worldPos.clone().add(f.tangent);
      r.mesh.lookAt(lookTarget);
    });

    // Main 60FPS Simulation & Render Loop
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      // A. Countdown Sequence
      if (countdownTimer > 0) {
        countdownTimer -= dt;
        const sec = Math.ceil(countdownTimer);
        if (sec < lastBeepSecond && sec >= 1) {
          lastBeepSecond = sec;
          soundEngine.playBeep(480, 0.14, 'square');
        } else if (countdownTimer <= 0.4 && lastBeepSecond === 1) {
          lastBeepSecond = 0;
          soundEngine.playBeep(960, 0.32, 'sawtooth');
        }

        // Dramatic sweeping intro camera around player car
        const introAngle = countdownTimer * 0.85;
        const pPos = player.mesh.position;
        camera.position.set(
          pPos.x + Math.sin(introAngle) * 8.5,
          pPos.y + 2.6 + countdownTimer * 0.5,
          pPos.z + Math.cos(introAngle) * 8.5
        );
        camera.lookAt(pPos.x, pPos.y + 0.8, pPos.z);

        const cdValue = countdownTimer > 0.45 ? Math.ceil(countdownTimer - 0.4) : 0;
        setHud(prev => (prev.countdown !== cdValue ? { ...prev, countdown: cdValue } : prev));
        renderer.render(scene, camera);
        return;
      }

      elapsedRaceTime += dt;
      const inp = inputRef.current;

      // B. Player Driving Physics
      if (!player.finished) {
        const isBraking = inp.down && player.speed > 0.8;
        const isReversing = player.speed < -0.5;

        // Dynamic brake light response
        if (player.mesh.userData.tailMat) {
          if (isBraking) {
            player.mesh.userData.tailMat.color.setHex(0xff2244);
          } else {
            player.mesh.userData.tailMat.color.setHex(0xff0044);
          }
        }

        // 1. Throttle, Braking & Reverse
        if (inp.up) {
          if (isReversing) {
            // Braking out of reverse back towards 0
            player.speed += accelRate * 2.2 * dt;
          } else {
            // Forward progressive acceleration with smooth torque curve
            const effectiveTop = player.isNitro ? maxSpeedUnits * 1.25 : maxSpeedUnits;
            const speedRatio = Math.max(0, player.speed / effectiveTop);
            const torqueCurve = Math.max(0.22, 1.0 - Math.pow(speedRatio, 1.5) * 0.78);
            player.speed += accelRate * torqueCurve * dt;
          }
        } else if (inp.down) {
          if (player.speed > 0.8) {
            // High-authority responsive braking
            const brakePower = accelRate * 2.4;
            player.speed = Math.max(0, player.speed - brakePower * dt);
          } else {
            // Smooth controlled reverse gear
            player.speed = Math.max(-22, player.speed - accelRate * 0.65 * dt);
          }
        } else {
          // Natural aerodynamic drag and rolling friction
          if (Math.abs(player.speed) > 0.05) {
            player.speed *= Math.pow(0.988, dt * 60);
            if (Math.abs(player.speed) < 0.25) player.speed = 0;
          } else {
            player.speed = 0;
          }
        }

        // 2. Nitro Boost Activation (only allowed when driving forward at speed)
        if (inp.nitro && player.nitro > 4 && player.speed > 16) {
          player.isNitro = true;
          player.nitro = Math.max(0, player.nitro - 28 * dt);
          player.speed += accelRate * 0.9 * dt;
        } else {
          player.isNitro = false;
          player.nitro = Math.min(100, player.nitro + 4.5 * dt);
        }

        const effectiveTopSpeed = player.isNitro ? maxSpeedUnits * 1.25 : maxSpeedUnits;
        if (player.speed > effectiveTopSpeed) {
          player.speed = THREE.MathUtils.lerp(player.speed, effectiveTopSpeed, dt * 4);
        }

        // 3. Steering & Handbrake Drift Mechanics
        const steerInput = (inp.left ? -1 : 0) + (inp.right ? 1 : 0);
        const speedMag = Math.abs(player.speed);
        const speedAuthority = Math.min(1.0, speedMag / 5.0);
        const speedNorm = Math.min(1.0, speedMag / maxSpeedUnits);
        const highSpeedStability = 1.0 - speedNorm * 0.20;

        // Drift state: ONLY triggered when player holds handbrake (drift) AND steers at speed
        const wantsDrift = inp.drift && speedMag > 15 && steerInput !== 0;
        if (wantsDrift) {
          player.isDrifting = true;
        } else if (!inp.drift || speedMag < 10) {
          player.isDrifting = false;
        }

        // Steering input and lateral positioning
        if (steerInput === 0) {
          player.lateralVel = 0;
          player.steerAngle = THREE.MathUtils.lerp(player.steerAngle, 0, dt * 25);
          if (Math.abs(player.steerAngle) < 0.005) player.steerAngle = 0;
        } else {
          const targetSteer = steerInput * 0.42 * highSpeedStability;
          player.steerAngle = THREE.MathUtils.lerp(player.steerAngle, targetSteer, dt * 18);

          const lateralRate = (19 + (currentStats.handling / 100) * 10) * speedAuthority * highSpeedStability * (player.isDrifting ? 1.4 : 1.0);
          const moveDir = player.speed >= 0 ? 1.0 : -0.8;
          player.lateralVel = steerInput * lateralRate * moveDir;
          player.lateral += player.lateralVel * dt;
        }

        // Drift visual yaw angle: ONLY present when handbrake drifting
        let targetDriftAngle = 0;
        if (player.isDrifting && speedMag > 15 && steerInput !== 0) {
          targetDriftAngle = -steerInput * 0.36;
        }
        player.driftAngle = THREE.MathUtils.lerp(player.driftAngle, targetDriftAngle, dt * 14);
        if (Math.abs(player.driftAngle) < 0.005) {
          player.driftAngle = 0;
        }

        if (player.isDrifting && speedMag > 15) {
          player.driftComboTimer = 1.6;
          const ptsGain = Math.floor(speedMag * 4.2 * driftBonusFactor * player.driftMultiplier * dt);
          player.currentDriftScore += ptsGain;
          player.nitro = Math.min(100, player.nitro + 11 * dt);

          if (player.currentDriftScore > 2500) player.driftMultiplier = 4;
          else if (player.currentDriftScore > 1200) player.driftMultiplier = 3;
          else if (player.currentDriftScore > 450) player.driftMultiplier = 2;
        } else if (player.currentDriftScore > 0) {
          player.driftComboTimer -= dt;
          if (player.driftComboTimer <= 0) {
            player.totalDriftScore += player.currentDriftScore;
            player.currentDriftScore = 0;
            player.driftMultiplier = 1;
          }
        }

        // Advance along Track Spline
        const ds = (player.speed * dt) / totalLength;
        const prevS = player.s;
        player.s += ds;

        // Lap Completion Detection (only when driving forward across the line)
        if (player.speed > 0 && Math.floor(player.s) > Math.floor(prevS) && player.s >= 1.0) {
          const completedLapTime = elapsedRaceTime - player.lapStartTime;
          player.lapStartTime = elapsedRaceTime;
          if (!player.bestLapTime || completedLapTime < player.bestLapTime) {
            player.bestLapTime = completedLapTime;
          }
          soundEngine.playBeep(880, 0.22, 'triangle');

          if (player.lap >= totalLaps) {
            player.totalDriftScore += player.currentDriftScore;
            player.currentDriftScore = 0;
            player.finished = true;
            player.finishTime = elapsedRaceTime;
          } else {
            player.lap += 1;
          }
        }

        // Track Barrier Collision Check
        const maxLat = roadHalfWidth - 1.35;
        if (Math.abs(player.lateral) > maxLat) {
          player.lateral = Math.sign(player.lateral) * maxLat;
          player.lateralVel = 0;
          player.speed *= 0.88;
          player.shakeIntensity = 0.35;
          // Bank drift points on light tap or lose small fraction
          player.currentDriftScore = Math.floor(player.currentDriftScore * 0.7);
          soundEngine.playCollision();

          // Spawn orange/cyan barrier sparks
          for (let i = 0; i < 6; i++) {
            const sparkVel = new THREE.Vector3(
              (Math.random() - 0.5) * 8,
              2 + Math.random() * 5,
              (Math.random() - 0.5) * 8
            );
            spawnParticle(player.mesh.position.clone().add(new THREE.Vector3(0, 0.6, 0)), sparkVel, i % 2 === 0 ? '#ff9900' : '#00f0ff', 1.0, 0.3, true);
          }
        }
      }

      // Update Player 3D Transform, Wheels, Nitro Flames & Drift Smoke
      const pFrame = sampleSplineFrame(player.s);
      const pWorldPos = pFrame.p.clone().addScaledVector(pFrame.right, player.lateral);
      player.mesh.position.copy(pWorldPos);

      // Decoupled heading: strict track tangent when driving straight, smooth nose-in when turning
      const forwardHeading = pFrame.tangent.clone();
      if (Math.abs(player.steerAngle) > 0.005 && Math.abs(player.speed) > 0.8) {
        const moveSign = player.speed >= 0 ? 1.0 : -0.8;
        forwardHeading.addScaledVector(pFrame.right, player.steerAngle * 0.28 * moveSign).normalize();
      }
      const lookAheadPos = pWorldPos.clone().add(forwardHeading);
      player.mesh.lookAt(lookAheadPos);
      if (player.driftAngle !== 0) {
        player.mesh.rotateY(player.driftAngle);
      }

      // Spin Wheels & Visual Steering on Front Wheels
      player.mesh.userData.wheels.forEach(w => {
        w.rotation.x -= player.speed * dt * 0.9;
      });
      if (player.mesh.userData.wheels && player.mesh.userData.wheels.length >= 2) {
        const visualTurn = player.steerAngle * 0.65;
        player.mesh.userData.wheels[0].rotation.y = visualTurn;
        player.mesh.userData.wheels[1].rotation.y = visualTurn;
      }

      player.mesh.userData.flameL.visible = player.isNitro;
      player.mesh.userData.flameR.visible = player.isNitro;
      if (player.isNitro) {
        const flicker = 0.8 + Math.random() * 0.55;
        player.mesh.userData.flameL.scale.set(1, 1, flicker);
        player.mesh.userData.flameR.scale.set(1, 1, flicker);
      }

      // Spawn Drift Tire Smoke & Skid Marks
      if (player.isDrifting && Math.abs(player.speed) > 18) {
        const rearOffset = pFrame.tangent.clone().multiplyScalar(-1.8);
        const tireL = pWorldPos.clone().add(rearOffset).addScaledVector(pFrame.right, -0.85);
        const tireR = pWorldPos.clone().add(rearOffset).addScaledVector(pFrame.right, 0.85);

        spawnParticle(tireL, new THREE.Vector3(0, 1.4, 0), '#e2e8f0', 0.95, 0.45, false);
        spawnParticle(tireR, new THREE.Vector3(0, 1.4, 0), '#e2e8f0', 0.95, 0.45, false);

        if (Math.random() < 0.45) {
          spawnParticle(tireL, new THREE.Vector3((Math.random() - 0.5) * 5, 2.5, (Math.random() - 0.5) * 5), '#fbbf24', 0.8, 0.25, true);
        }

        // Add Skid Mark Plane
        const skid = new THREE.Mesh(skidGeo, skidMat);
        skid.position.copy(tireL).add(new THREE.Vector3(0, 0.08, 0));
        skid.lookAt(tireL.clone().add(pFrame.tangent));
        scene.add(skid);
        skidMarks.push(skid);
        if (skidMarks.length > 90) {
          const old = skidMarks.shift();
          scene.remove(old);
        }
      }

      // C. AI Rivals Update & Car-to-Car Collisions
      calloutCooldown = Math.max(0, calloutCooldown - dt);

      aiRacers.forEach(ai => {
        if (ai.finished) return;

        // Rubber-banding relative to player progress
        const progressDiff = player.s - ai.s;
        let rubberBand = 1.0;
        if (progressDiff > 0.04) rubberBand = 1.12; // AI catches up slightly when behind
        else if (progressDiff < -0.05) rubberBand = 0.91; // AI eases slightly when far ahead

        const targetSpeed = ai.baseMaxSpeed * rubberBand;
        ai.speed = THREE.MathUtils.lerp(ai.speed, targetSpeed, dt * 1.8);

        // Lane weaving & obstacle avoidance
        ai.laneTimer -= dt;
        if (ai.laneTimer <= 0) {
          ai.laneTimer = 2.0 + Math.random() * 2.5;
          ai.targetLateral = (Math.random() - 0.5) * (roadHalfWidth * 1.35);
        }
        ai.lateral = THREE.MathUtils.lerp(ai.lateral, ai.targetLateral, dt * 2.2);

        ai.s += (ai.speed * dt) / totalLength;
        if (ai.s >= totalLaps) {
          ai.finished = true;
          ai.finishTime = elapsedRaceTime;
        } else {
          ai.lap = Math.min(totalLaps, Math.floor(ai.s) + 1);
        }

        const aiFrame = sampleSplineFrame(ai.s);
        const aiWorldPos = aiFrame.p.clone().addScaledVector(aiFrame.right, ai.lateral);
        ai.mesh.position.copy(aiWorldPos);
        ai.mesh.lookAt(aiWorldPos.clone().add(aiFrame.tangent));
        ai.mesh.userData.wheels.forEach(w => {
          w.rotation.x -= ai.speed * dt * 0.9;
        });

        // Car-to-Car Collision with Player
        const distToPlayer = aiWorldPos.distanceTo(pWorldPos);
        if (distToPlayer < 3.2) {
          const pushDir = Math.sign(player.lateral - ai.lateral) || 1;
          const maxLatBoundary = roadHalfWidth - 1.35;
          player.lateral = THREE.MathUtils.clamp(player.lateral + pushDir * 0.4, -maxLatBoundary, maxLatBoundary);
          ai.lateral = THREE.MathUtils.clamp(ai.lateral - pushDir * 0.7, -maxLatBoundary, maxLatBoundary);
          player.lateralVel = 0;
          player.speed *= 0.95;
          player.shakeIntensity = 0.25;
          soundEngine.playCollision();

          spawnParticle(
            pWorldPos.clone().lerp(aiWorldPos, 0.5).add(new THREE.Vector3(0, 0.7, 0)),
            new THREE.Vector3((Math.random() - 0.5) * 6, 3, (Math.random() - 0.5) * 6),
            '#00f0ff',
            1.1,
            0.25,
            true
          );

          if (calloutCooldown <= 0) {
            calloutCooldown = 7.5;
            activeCallout = { name: ai.name, kanji: ai.kanji, quote: ai.quote };
          }
        }
      });

      // D. Update Particle Pool & Weather
      for (let i = particlePool.length - 1; i >= 0; i--) {
        const pt = particlePool[i];
        pt.life -= dt;
        if (pt.life <= 0) {
          scene.remove(pt.mesh);
          pt.mesh.material.dispose();
          particlePool.splice(i, 1);
        } else {
          pt.mesh.position.addScaledVector(pt.vel, dt);
          pt.mesh.material.opacity = (pt.life / pt.maxLife) * 0.8;
          if (!pt.isSpark) {
            pt.mesh.scale.addScalar(dt * 1.8);
          }
        }
      }

      // Keep weather particles centered around player
      weatherPoints.position.set(pWorldPos.x, pWorldPos.y + 12, pWorldPos.z);
      weatherPoints.rotation.y += dt * 0.15;

      // E. Dynamic Chase / Far / Hood Camera Update
      const camMode = cameraModeRef.current;
      const targetFov = player.isNitro ? 78 : 62 + (player.speed / maxSpeedUnits) * 8;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 6);
      camera.updateProjectionMatrix();

      player.shakeIntensity = Math.max(0, player.shakeIntensity - dt * 1.8);
      const shakeVec = new THREE.Vector3(
        (Math.random() - 0.5) * player.shakeIntensity,
        (Math.random() - 0.5) * player.shakeIntensity,
        0
      );

      if (camMode === 2) {
        // Hood / Bumper Camera
        const hoodPos = pWorldPos.clone()
          .addScaledVector(pFrame.tangent, 0.9)
          .add(new THREE.Vector3(0, 1.35, 0));
        camera.position.copy(hoodPos).add(shakeVec);
        camera.lookAt(pWorldPos.clone().addScaledVector(pFrame.tangent, 25));
      } else {
        // Dynamic Chase (0) or Far Chase (1)
        const distBack = camMode === 1 ? 10.2 : 6.8;
        const heightUp = camMode === 1 ? 3.8 : 2.55;
        const desiredCamPos = pWorldPos.clone()
          .addScaledVector(pFrame.tangent, -distBack)
          .add(new THREE.Vector3(0, heightUp, 0))
          .addScaledVector(pFrame.right, -player.driftAngle * 2.2);

        camera.position.lerp(desiredCamPos, dt * 10.5);
        camera.position.add(shakeVec);

        const lookTarget = pWorldPos.clone()
          .addScaledVector(pFrame.tangent, 9.5)
          .add(new THREE.Vector3(0, 0.9, 0));
        camera.lookAt(lookTarget);
      }

      // F. Update Web Audio Synthesizer
      const speedRatio = Math.min(1, Math.abs(player.speed) / maxSpeedUnits);
      soundEngine.updateDriving(speedRatio, player.isDrifting, player.isNitro, !player.finished);

      // G. Check Race Finish & Sync React HUD
      if (player.finished) {
        const sorted = [...allRacers].sort((a, b) => b.s - a.s);
        const playerRank = sorted.findIndex(r => r.isPlayer) + 1;
        const totalDrift = player.totalDriftScore;

        // Calculate Rewards
        const baseCr = playerRank === 1 ? 2200 : playerRank === 2 ? 1400 : playerRank === 3 ? 900 : 450;
        const driftBonusCr = Math.floor(totalDrift * 0.12);
        const earnedCr = baseCr + driftBonusCr;
        const earnedRep = playerRank === 1 ? 300 : playerRank <= 3 ? 160 : 75;

        // Update Save Data
        setSaveData(prev => {
          const nextBestTimes = { ...prev.bestTimes };
          if (player.bestLapTime && (!nextBestTimes[selectedTrackId] || player.bestLapTime < nextBestTimes[selectedTrackId])) {
            nextBestTimes[selectedTrackId] = player.bestLapTime;
          }
          const nextBestDrifts = { ...prev.bestDriftScores };
          if (!nextBestDrifts[selectedTrackId] || totalDrift > nextBestDrifts[selectedTrackId]) {
            nextBestDrifts[selectedTrackId] = totalDrift;
          }
          const nextCompleted = [...prev.completedCareer];
          let stageBonusCr = 0;
          let stageBonusRep = 0;

          if (gameMode === 'career' && activeCareerStage) {
            const passed = activeCareerStage.mode === 'drift'
              ? totalDrift >= (activeCareerStage.driftTarget || 4500)
              : playerRank === 1;
            if (passed && !nextCompleted.includes(activeCareerStage.id)) {
              nextCompleted.push(activeCareerStage.id);
              stageBonusCr = activeCareerStage.rewardCr;
              stageBonusRep = activeCareerStage.rewardRep;
            }
          }

          return {
            ...prev,
            credits: prev.credits + earnedCr + stageBonusCr,
            rep: prev.rep + earnedRep + stageBonusRep,
            bestTimes: nextBestTimes,
            bestDriftScores: nextBestDrifts,
            completedCareer: nextCompleted,
          };
        });

        setRaceResult({
          rank: playerRank,
          totalTime: player.finishTime,
          bestLap: player.bestLapTime || player.finishTime / totalLaps,
          driftScore: totalDrift,
          earnedCr,
          earnedRep,
          standings: sorted.map((r, i) => ({
            rank: i + 1,
            name: r.name,
            kanji: r.kanji || 'プレイヤー',
            isPlayer: r.isPlayer,
            score: gameMode === 'drift' ? (r.isPlayer ? totalDrift : Math.floor(3800 - i * 550)) : null,
          })),
        });
        setScreen('results');
        return;
      }

      hudUpdateCounter++;
      if (hudUpdateCounter % 3 === 0) {
        const sorted = [...allRacers].sort((a, b) => b.s - a.s);
        const pos = sorted.findIndex(r => r.isPlayer) + 1;
        const kph = Math.round(Math.abs(player.speed) * 3.55);
        const gear = player.speed < -0.5 ? 'R' : kph < 45 ? 1 : kph < 95 ? 2 : kph < 150 ? 3 : kph < 210 ? 4 : kph < 275 ? 5 : 6;
        const rpmRatio = Math.min(1, ((kph % 55) / 55) * 0.75 + speedRatio * 0.25);

        const minimapCars = allRacers.map(r => {
          const mf = sampleSplineFrame(r.s);
          return {
            id: r.id,
            isPlayer: r.isPlayer,
            x: mf.p.x,
            z: mf.p.z,
          };
        });

        setHud({
          speedKph: kph,
          rpmRatio,
          gear,
          lap: player.lap,
          totalLaps,
          position: pos,
          totalRacers: allRacers.length,
          lapTime: elapsedRaceTime - player.lapStartTime,
          bestLapTime: player.bestLapTime,
          totalTime: elapsedRaceTime,
          nitro: Math.round(player.nitro),
          isNitro: player.isNitro,
          isDrifting: player.isDrifting,
          currentDriftScore: player.currentDriftScore,
          driftMultiplier: player.driftMultiplier,
          totalDriftScore: player.totalDriftScore,
          countdown: -1,
          rivalCallout: activeCallout,
          minimapCars,
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      renderer.dispose();
    };
  }, [screen, selectedTrackId, gameMode, difficulty, currentCarSpec, currentCarCust, currentStats, activeCareerStage]);

  // ============================================================================
  // 8. GARAGE CUSTOMIZATION & UPGRADE HANDLERS
  // ============================================================================

  const buyOrSelectCar = (car) => {
    soundEngine.playBeep(640, 0.12);
    if (saveData.unlockedCars.includes(car.id)) {
      setSaveData(prev => ({ ...prev, selectedCar: car.id }));
    } else if (saveData.credits >= car.cost) {
      setSaveData(prev => ({
        ...prev,
        credits: prev.credits - car.cost,
        unlockedCars: [...prev.unlockedCars, car.id],
        selectedCar: car.id,
      }));
      soundEngine.playBeep(920, 0.22, 'triangle');
    }
  };

  const updateCarVisual = (key, value) => {
    soundEngine.playBeep(720, 0.08);
    setSaveData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [prev.selectedCar]: {
          ...prev.customizations[prev.selectedCar],
          [key]: value,
        },
      },
    }));
  };

  const purchaseUpgrade = (upgType) => {
    const currentLevel = currentCarCust.upgrades[upgType.id] || 0;
    if (currentLevel >= 4) return;
    const cost = upgType.baseCost * (currentLevel + 1);
    if (saveData.credits < cost) return;

    soundEngine.playBeep(980, 0.18, 'triangle');
    setSaveData(prev => ({
      ...prev,
      credits: prev.credits - cost,
      customizations: {
        ...prev.customizations,
        [prev.selectedCar]: {
          ...prev.customizations[prev.selectedCar],
          upgrades: {
            ...prev.customizations[prev.selectedCar].upgrades,
            [upgType.id]: currentLevel + 1,
          },
        },
      },
    }));
  };

  // ============================================================================
  // 9. MINIMAP SVG PATH HELPER
  // ============================================================================

  const minimapData = useMemo(() => {
    const pts = currentTrackSpec.controlPoints;
    const xs = pts.map(p => p[0]);
    const zs = pts.map(p => p[2]);
    const minX = Math.min(...xs) - 70;
    const maxX = Math.max(...xs) + 70;
    const minZ = Math.min(...zs) - 70;
    const maxZ = Math.max(...zs) + 70;
    const w = maxX - minX || 1;
    const h = maxZ - minZ || 1;

    const toSvg = (x, z) => ({
      cx: ((x - minX) / w) * 140 + 10,
      cy: ((z - minZ) / h) * 140 + 10,
    });

    const pathCoords = pts.map(([x, , z]) => toSvg(x, z));
    const d = pathCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.cx.toFixed(1)} ${pt.cy.toFixed(1)}`).join(' ') + ' Z';
    return { d, toSvg };
  }, [currentTrackSpec]);

  // ============================================================================
  // 10. UI RENDERING (ANIME CYBERPUNK STYLING, GARAGE, CAREER, RACE HUD)
  // ============================================================================

  return (
    <div className="relative w-full h-screen bg-[#060714] text-white overflow-hidden select-none font-sans">
      {/* TOP PERSISTENT HEADER BAR (Hidden during active racing) */}
      {screen !== 'racing' && (
        <header className="relative z-30 flex flex-wrap items-center justify-between px-4 md:px-8 py-3 bg-[#090b1f]/90 border-b border-cyan-500/30 backdrop-blur-md">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setScreen('menu')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 via-fuchsia-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-rose-500/30 -skew-x-12">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-black italic tracking-wider bg-gradient-to-r from-white via-cyan-300 to-rose-400 bg-clip-text text-transparent">
                  NEON DRIFT
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300">
                  影ドリフト
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
                Own The Streets. Defy The Limits.
              </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <nav className="flex items-center gap-2 my-1">
            {[
              { id: 'menu', label: 'MAIN HUB' },
              { id: 'garage', label: 'GARAGE' },
              { id: 'career', label: 'CAREER' },
              { id: 'race_setup', label: 'RACE MODES' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playBeep(580, 0.08);
                  setScreen(tab.id);
                }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-extrabold italic tracking-wider transition-all -skew-x-12 ${
                  screen === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Player Credits, Reputation & Audio Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-amber-400/40">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-400">REP</span>
              <span className="text-sm font-black text-amber-300">{saveData.rep.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-cyan-400/40">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-black text-cyan-300">{saveData.credits.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-cyan-400">CR</span>
            </div>

            <button
              onClick={() => setShowControlsModal(true)}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition"
              title="Driving Controls"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-rose-400 text-slate-300 hover:text-rose-300 transition"
              title={muted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </header>
      )}

      {/* ==================================================================== */}
      {/* SCREEN 1: MAIN MENU HUB                                              */}
      {/* ==================================================================== */}
      {screen === 'menu' && (
        <div className="relative w-full h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 overflow-y-auto">
          {/* Left Column: Hero Title, Active Vehicle Showcase & Quick Launch */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-gradient-to-br from-slate-900/90 via-[#0d102b]/90 to-slate-950 rounded-2xl border border-cyan-500/30 p-5 md:p-6 relative overflow-hidden shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 z-10">
              <div>
                <span className="text-xs font-extrabold tracking-widest uppercase px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  ACTIVE MACHINE // {currentCarSpec.classTag}
                </span>
                <h1 className="text-3xl md:text-4xl font-black italic tracking-wide mt-2 text-white">
                  {currentCarSpec.name}{' '}
                  <span className="text-lg font-bold text-rose-400 not-italic ml-1">{currentCarSpec.kanji}</span>
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">{currentCarSpec.description}</p>
              </div>

              <button
                onClick={() => setScreen('garage')}
                className="px-4 py-2 rounded-lg bg-fuchsia-600/30 hover:bg-fuchsia-600/50 border border-fuchsia-400/60 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
              >
                <Wrench className="w-4 h-4 text-fuchsia-300" /> Customize in Garage
              </button>
            </div>

            {/* Live 3D Turntable Preview right on Main Menu */}
            <div className="my-3 h-64 md:h-80 w-full relative rounded-xl overflow-hidden border border-slate-800">
              <GarageTurntable carSpec={currentCarSpec} customization={currentCarCust} />
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap justify-between items-center pointer-events-none bg-slate-950/75 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-800">
                {[
                  { label: 'SPEED', val: currentStats.speed, col: 'bg-cyan-400' },
                  { label: 'ACCEL', val: currentStats.accel, col: 'bg-rose-500' },
                  { label: 'HANDLING', val: currentStats.handling, col: 'bg-amber-400' },
                  { label: 'DRIFT', val: currentStats.drift, col: 'bg-emerald-400' },
                ].map(st => (
                  <div key={st.label} className="w-28">
                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                      <span>{st.label}</span>
                      <span>{st.val}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                      <div className={`h-full ${st.col}`} style={{ width: `${st.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 z-10">
              <button
                onClick={() => launchRace({ mode: 'quick', trackId: selectedTrackId, difficulty })}
                className="py-4 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:brightness-110 text-white font-black italic text-lg tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-rose-600/30 transition -skew-x-6"
              >
                <Play className="w-6 h-6 fill-white" /> INSTANT STREET RACE
              </button>
              <button
                onClick={() => setScreen('career')}
                className="py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black italic text-lg tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/30 transition -skew-x-6"
              >
                <Trophy className="w-6 h-6" /> ENTER CAREER LEAGUE
              </button>
            </div>
          </div>

          {/* Right Column: Mode Cards & Track Selector */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {/* Quick Circuit Selection */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black italic uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <Compass className="w-4 h-4" /> SELECT CIRCUIT ENVIRONMENT
                </h2>
                <span className="text-[11px] text-slate-400">3 CEL-SHADED WORLDS</span>
              </div>

              <div className="space-y-2.5">
                {TRACKS.map(trk => {
                  const active = selectedTrackId === trk.id;
                  return (
                    <div
                      key={trk.id}
                      onClick={() => {
                        soundEngine.playBeep(620, 0.08);
                        setSelectedTrackId(trk.id);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        active
                          ? 'bg-gradient-to-r from-cyan-950/80 to-fuchsia-950/60 border-cyan-400 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black italic text-sm text-white">{trk.name}</span>
                          <span className="text-xs font-bold text-rose-400">{trk.kanji}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{trk.subtitle}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-cyan-300 font-bold">
                          <span>LENGTH: {trk.lengthKm}</span>
                          {saveData.bestTimes[trk.id] && (
                            <span>BEST LAP: {formatRaceTime(saveData.bestTimes[trk.id])}</span>
                          )}
                          {saveData.bestDriftScores[trk.id] && (
                            <span>BEST DRIFT: {saveData.bestDriftScores[trk.id].toLocaleString()} PTS</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${active ? 'text-cyan-400' : 'text-slate-600'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5 Game Modes Grid */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex-1 flex flex-col justify-between">
              <h2 className="text-sm font-black italic uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4" /> ALL 5 RACING MODES
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'quick', title: 'QUICK RACE', desc: '3-Lap Battle vs 5 AI Rivals', icon: Flag, color: 'border-cyan-500/50' },
                  { id: 'drift', title: 'DRIFT CHALLENGE', desc: '2 Laps Max Drift Combo Score', icon: Flame, color: 'border-rose-500/50' },
                  { id: 'time_attack', title: 'TIME ATTACK', desc: 'Solo Hot-Lap Record Hunt', icon: Timer, color: 'border-amber-500/50' },
                  { id: 'championship', title: 'CHAMPIONSHIP CUP', desc: '3-Track Grand Prix Standings', icon: Crown, color: 'border-purple-500/50' },
                ].map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (m.id === 'championship') {
                          setChampionshipState({ active: true, round: 0, standings: {} });
                          launchRace({ mode: 'championship', trackId: TRACKS[0].id, difficulty });
                        } else {
                          launchRace({ mode: m.id, trackId: selectedTrackId, difficulty });
                        }
                      }}
                      className={`p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border ${m.color} text-left transition group`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black italic text-xs text-white group-hover:text-cyan-300">
                          {m.title}
                        </span>
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{m.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* AI Difficulty Switcher */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">AI Rival Difficulty:</span>
                <div className="flex gap-1.5">
                  {['easy', 'normal', 'hard'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-3 py-1 rounded text-xs font-extrabold uppercase transition ${
                        difficulty === d
                          ? 'bg-rose-500 text-white shadow shadow-rose-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SCREEN 2: UNDERGROUND GARAGE (6 CARS, PAINT/GLOW/RIMS, 4 UPGRADES)   */}
      {/* ==================================================================== */}
      {screen === 'garage' && (
        <div className="w-full h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 overflow-y-auto">
          {/* Left 7 Cols: Interactive 3D Turntable + Car Stats */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 relative">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {currentCarSpec.classTag}
                  </span>
                  <span className="text-sm font-bold text-rose-400">{currentCarSpec.kanji}</span>
                </div>
                <h2 className="text-3xl font-black italic mt-1">{currentCarSpec.name}</h2>
                <p className="text-xs text-slate-400">{currentCarSpec.subtitle}</p>
              </div>

              <div className="flex gap-2">
                {[
                  { id: 'vehicles', label: '1. VEHICLES (6)', icon: Flag },
                  { id: 'customize', label: '2. STYLING', icon: Palette },
                  { id: 'upgrades', label: '3. TUNING', icon: Sliders },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setGarageTab(t.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-black italic flex items-center gap-1.5 transition ${
                        garageTab === t.id
                          ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/30'
                          : 'bg-slate-950 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="my-4 flex-1 min-h-[280px] rounded-xl overflow-hidden border border-slate-800 relative">
              <GarageTurntable carSpec={currentCarSpec} customization={currentCarCust} />
            </div>

            {/* Performance Telemetry Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/90 p-4 rounded-xl border border-slate-800">
              {[
                { label: 'TOP SPEED', val: currentStats.speed, color: 'from-cyan-400 to-blue-500' },
                { label: 'ACCELERATION', val: currentStats.accel, color: 'from-rose-500 to-orange-500' },
                { label: 'HANDLING GRIP', val: currentStats.handling, color: 'from-amber-400 to-yellow-500' },
                { label: 'DRIFT ANGLE', val: currentStats.drift, color: 'from-emerald-400 to-teal-500' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-xs font-extrabold mb-1">
                    <span className="text-slate-400">{stat.label}</span>
                    <span className="text-white">{stat.val} / 100</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-300`}
                      style={{ width: `${stat.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Garage Sub-Panels */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between overflow-y-auto">
            {garageTab === 'vehicles' && (
              <div className="space-y-3">
                <h3 className="text-sm font-black italic uppercase tracking-wider text-cyan-300">
                  UNDERGROUND COLLECTION (6 ORIGINAL MACHINES)
                </h3>
                {VEHICLES.map(car => {
                  const unlocked = saveData.unlockedCars.includes(car.id);
                  const selected = saveData.selectedCar === car.id;
                  return (
                    <div
                      key={car.id}
                      onClick={() => buyOrSelectCar(car)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        selected
                          ? 'bg-gradient-to-r from-cyan-950/90 to-slate-900 border-cyan-400 shadow-lg'
                          : unlocked
                          ? 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                          : 'bg-slate-950/40 border-slate-800/60 opacity-90 hover:border-rose-500/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black italic text-base text-white">{car.name}</span>
                          <span className="text-xs font-bold text-rose-400">{car.kanji}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                            {car.classTag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{car.subtitle}</p>
                        <div className="flex gap-3 mt-1.5 text-[10px] font-bold text-slate-300">
                          <span>SPD {car.baseStats.speed}</span>
                          <span>ACC {car.baseStats.accel}</span>
                          <span>HND {car.baseStats.handling}</span>
                          <span>DRF {car.baseStats.drift}</span>
                        </div>
                      </div>

                      <div>
                        {selected ? (
                          <span className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1">
                            <Check className="w-4 h-4" /> EQUIPPED
                          </span>
                        ) : unlocked ? (
                          <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs">
                            SELECT
                          </span>
                        ) : (
                          <span
                            className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 ${
                              saveData.credits >= car.cost
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5" /> {car.cost.toLocaleString()} CR
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {garageTab === 'customize' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300 mb-2.5">
                    CEL-SHADED BODY PAINT
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PAINT_PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => updateCarVisual('paint', p.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition ${
                          currentCarCust.paint === p.id ? 'border-white bg-slate-800' : 'border-slate-800 bg-slate-950'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border border-white/40 shrink-0" style={{ backgroundColor: p.hex }} />
                        <span className="text-xs font-bold truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 mb-2.5">
                    NEON CHASSIS UNDERGLOW
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {UNDERGLOW_PRESETS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => updateCarVisual('glow', g.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition ${
                          currentCarCust.glow === g.id ? 'border-cyan-400 bg-slate-800' : 'border-slate-800 bg-slate-950'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border border-white/40 shrink-0" style={{ backgroundColor: g.hex }} />
                        <span className="text-xs font-bold truncate">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 mb-2.5">
                    ALLOY WHEEL RIMS
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {RIM_PRESETS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => updateCarVisual('rim', r.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition ${
                          currentCarCust.rim === r.id ? 'border-amber-400 bg-slate-800' : 'border-slate-800 bg-slate-950'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border border-white/40 shrink-0" style={{ backgroundColor: r.hex }} />
                        <span className="text-xs font-bold truncate">{r.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-white">AERO GT WING SPOILER</h4>
                    <p className="text-[11px] text-slate-400">Toggle rear downforce carbon GT wing</p>
                  </div>
                  <button
                    onClick={() => updateCarVisual('spoiler', !currentCarCust.spoiler)}
                    className={`px-4 py-2 rounded-lg font-black text-xs transition ${
                      currentCarCust.spoiler ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {currentCarCust.spoiler ? 'INSTALLED' : 'REMOVED'}
                  </button>
                </div>
              </div>
            )}

            {garageTab === 'upgrades' && (
              <div className="space-y-3">
                <h3 className="text-sm font-black italic uppercase tracking-wider text-amber-300">
                  PERFORMANCE TUNING SHOP
                </h3>
                {UPGRADE_TYPES.map(upg => {
                  const Icon = upg.icon;
                  const lvl = currentCarCust.upgrades[upg.id] || 0;
                  const isMax = lvl >= 4;
                  const cost = upg.baseCost * (lvl + 1);
                  return (
                    <div key={upg.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <span className="font-black text-sm text-white">{upg.name}</span>
                          <span className="text-xs font-bold text-cyan-400">STAGE {lvl}/4</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{upg.desc}</p>
                        <div className="flex gap-1.5 mt-2">
                          {[1, 2, 3, 4].map(step => (
                            <span
                              key={step}
                              className={`w-8 h-2 rounded-sm ${step <= lvl ? 'bg-cyan-400' : 'bg-slate-800'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        disabled={isMax || saveData.credits < cost}
                        onClick={() => purchaseUpgrade(upg)}
                        className={`px-4 py-2.5 rounded-lg font-black text-xs transition ${
                          isMax
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : saveData.credits >= cost
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? 'MAXED' : `${cost.toLocaleString()} CR`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => launchRace({ mode: 'quick', trackId: selectedTrackId, difficulty })}
              className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 font-black italic text-base tracking-wider text-white shadow-lg shadow-rose-500/25"
            >
              TEST DRIVE ON {currentTrackSpec.name}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SCREEN 3: CAREER LEAGUE PROGRESSION                                  */}
      {/* ==================================================================== */}
      {screen === 'career' && (
        <div className="w-full h-[calc(100vh-64px)] p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-rose-400">
                  STREET LEGEND PROGRESSION
                </span>
                <h1 className="text-3xl font-black italic">NEON DRIFT CAREER SERIES</h1>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
                COMPLETED STAGES: <span className="text-cyan-400 font-black">{saveData.completedCareer.length} / {CAREER_STAGES.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {CAREER_STAGES.map(stage => {
                const isCompleted = saveData.completedCareer.includes(stage.id);
                const isUnlocked = saveData.rep >= stage.reqRep;
                const trk = TRACKS.find(t => t.id === stage.trackId);

                return (
                  <div
                    key={stage.id}
                    className={`p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-950/50 to-slate-900 border-emerald-500/50'
                        : isUnlocked
                        ? 'bg-slate-900/90 border-cyan-500/40 hover:border-cyan-400'
                        : 'bg-slate-950/60 border-slate-800 opacity-65'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          RIVAL BOSS: {stage.boss}
                        </span>
                        <span className="text-xs font-bold text-cyan-300">
                          {trk?.name} ({trk?.kanji})
                        </span>
                        {isCompleted && (
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> CLEARED
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black italic mt-1.5">{stage.title}</h3>
                      <p className="text-xs text-slate-300 mt-0.5">{stage.subtitle}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs font-bold">
                        <span className="text-amber-300">REWARD: +{stage.rewardCr.toLocaleString()} CR</span>
                        <span className="text-cyan-300">+{stage.rewardRep} REP</span>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <button
                          onClick={() =>
                            launchRace({
                              mode: 'career',
                              trackId: stage.trackId,
                              difficulty: stage.difficulty,
                              careerStage: stage,
                            })
                          }
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black italic text-sm tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                        >
                          <Play className="w-4 h-4 fill-slate-950" /> CHALLENGE STAGE
                        </button>
                      ) : (
                        <div className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs flex items-center gap-2">
                          <Lock className="w-4 h-4" /> REQUIRES {stage.reqRep} REP
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SCREEN 4: CUSTOM RACE & RIVAL ROSTER SETUP                           */}
      {/* ==================================================================== */}
      {screen === 'race_setup' && (
        <div className="w-full h-[calc(100vh-64px)] p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-xl font-black italic text-cyan-300">CUSTOM EVENT CONFIGURATION</h2>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-2">SELECT GAME MODE</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'quick', name: 'Quick Race (3 Laps)' },
                    { id: 'drift', name: 'Drift Challenge (2 Laps)' },
                    { id: 'time_attack', name: 'Time Attack (Solo)' },
                    { id: 'championship', name: '3-Track Championship' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setGameMode(m.id)}
                      className={`p-3 rounded-xl border text-left font-black italic text-xs transition ${
                        gameMode === m.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-2">SELECT CIRCUIT</label>
                <div className="grid grid-cols-1 gap-2">
                  {TRACKS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrackId(t.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                        selectedTrackId === t.id
                          ? 'bg-rose-500/20 border-rose-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="font-black italic text-sm">{t.name}</span>
                      <span className="text-xs font-bold text-rose-300">{t.kanji}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => launchRace({ mode: gameMode, trackId: selectedTrackId, difficulty })}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-600 to-cyan-500 font-black italic text-lg tracking-wider shadow-xl"
              >
                LAUNCH EVENT NOW
              </button>
            </div>

            {/* AI Rivals Dossier */}
            <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-black italic uppercase tracking-wider text-rose-400 mb-3">
                5 RIVAL DRIVERS ON THE GRID
              </h3>
              <div className="space-y-3">
                {AI_RIVALS.map(r => (
                  <div key={r.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-black italic text-xs text-white">{r.name}</span>
                      <span className="text-xs font-bold text-cyan-400">{r.kanji}</span>
                    </div>
                    <div className="text-[10px] font-bold text-rose-400 mt-0.5">
                      STYLE: {r.personality} // MACHINE: {r.carId.toUpperCase()}
                    </div>
                    <p className="text-[11px] italic text-slate-400 mt-1">"{r.quote}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SCREEN 5: ACTIVE 3D RACING + ANIME SPEED LINES + HUD + TOUCH PAD     */}
      {/* ==================================================================== */}
      {screen === 'racing' && (
        <div className="relative w-full h-screen overflow-hidden">
          {/* 3D WebGL Viewport */}
          <div ref={raceCanvasRef} className="w-full h-full" />

          {/* ANIME RADIAL SPEED LINES OVERLAY (Triggers at High Speed or Nitro) */}
          {(hud.isNitro || hud.speedKph > 220) && (
            <div
              className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-150"
              style={{
                opacity: hud.isNitro ? 0.55 : 0.25,
                background:
                  'repeating-conic-gradient(from 0deg, rgba(0, 240, 255, 0.0) 0deg 4deg, rgba(255, 255, 255, 0.22) 4deg 4.6deg, rgba(0, 240, 255, 0.0) 4.6deg 9deg)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 46%, black 85%)',
                maskImage: 'radial-gradient(circle, transparent 46%, black 85%)',
              }}
            />
          )}

          {/* TOP-LEFT HUD: POSITION, LAP & TIMERS */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-start gap-3 pointer-events-none">
            <div className="bg-slate-950/85 border-2 border-cyan-400/70 rounded-xl px-4 py-2.5 -skew-x-12 shadow-lg backdrop-blur-md">
              <div className="text-[10px] font-black uppercase text-cyan-300">POSITION</div>
              <div className="text-3xl font-black italic text-white leading-none">
                {hud.position}
                <span className="text-base text-slate-400">/{hud.totalRacers}</span>
              </div>
            </div>

            <div className="bg-slate-950/85 border-2 border-rose-500/70 rounded-xl px-4 py-2.5 -skew-x-12 shadow-lg backdrop-blur-md">
              <div className="text-[10px] font-black uppercase text-rose-300">LAP</div>
              <div className="text-3xl font-black italic text-white leading-none">
                {hud.lap}
                <span className="text-base text-slate-400">/{hud.totalLaps}</span>
              </div>
            </div>

            <div className="bg-slate-950/85 border border-slate-700 rounded-xl px-4 py-2 -skew-x-12 backdrop-blur-md">
              <div className="text-[10px] font-bold text-slate-400">
                LAP TIME: <span className="text-white font-mono">{formatRaceTime(hud.lapTime)}</span>
              </div>
              <div className="text-[10px] font-bold text-cyan-300">
                BEST LAP: <span className="font-mono">{hud.bestLapTime ? formatRaceTime(hud.bestLapTime) : '--:--.--'}</span>
              </div>
            </div>
          </div>

          {/* TOP-CENTER: ACTIVE DRIFT COMBO COUNTER & RIVAL CALLOUT */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
            {(hud.isDrifting || hud.currentDriftScore > 0) && (
              <div className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-600/90 via-fuchsia-600/90 to-amber-500/90 border-2 border-white shadow-2xl -skew-x-12 animate-pulse">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-200">
                    KAGE DRIFT COMBO x{hud.driftMultiplier}
                  </span>
                </div>
                <div className="text-3xl font-black italic text-white text-center">
                  +{hud.currentDriftScore.toLocaleString()} PTS
                </div>
              </div>
            )}

            {hud.totalDriftScore > 0 && (
              <div className="mt-1 px-3 py-0.5 rounded bg-slate-950/80 border border-rose-500/40 text-[11px] font-black text-rose-300">
                BANKED DRIFT: {hud.totalDriftScore.toLocaleString()} PTS
              </div>
            )}

            {hud.rivalCallout && (
              <div className="mt-2 px-4 py-2 rounded-xl bg-slate-950/90 border-l-4 border-cyan-400 text-xs max-w-xs shadow-lg">
                <div className="font-black text-cyan-300">
                  {hud.rivalCallout.name} <span className="text-rose-400">{hud.rivalCallout.kanji}</span>
                </div>
                <div className="italic text-slate-200 text-[11px]">"{hud.rivalCallout.quote}"</div>
              </div>
            )}
          </div>

          {/* TOP-RIGHT: INTERACTIVE MINIMAP + CAMERA & EXIT BUTTONS */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCameraMode(prev => (prev + 1) % 3)}
                className="px-3 py-1.5 rounded-lg bg-slate-950/85 border border-slate-700 hover:border-cyan-400 text-xs font-bold flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                {cameraMode === 0 ? 'CHASE CAM' : cameraMode === 1 ? 'FAR CAM' : 'HOOD CAM'} (C)
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-xs font-black"
              >
                EXIT
              </button>
            </div>

            {/* Circuit Minimap SVG */}
            <div className="w-36 h-36 bg-slate-950/80 border border-cyan-500/40 rounded-xl p-1.5 backdrop-blur-md pointer-events-none">
              <svg viewBox="0 0 160 160" className="w-full h-full">
                <path d={minimapData.d} fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                <path d={minimapData.d} fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
                {hud.minimapCars.map(mc => {
                  const pt = minimapData.toSvg(mc.x, mc.z);
                  return (
                    <circle
                      key={mc.id}
                      cx={pt.cx}
                      cy={pt.cy}
                      r={mc.isPlayer ? 5.5 : 3.8}
                      fill={mc.isPlayer ? '#ff0055' : '#fbbf24'}
                      stroke="#ffffff"
                      strokeWidth={mc.isPlayer ? 1.5 : 0.5}
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* CENTER SCREEN 3-2-1-GO! ANIME COUNTDOWN */}
          {hud.countdown >= 0 && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div className="text-center -skew-x-12">
                <div className="text-xs font-black tracking-[0.35em] text-cyan-300 uppercase mb-1">
                  {currentTrackSpec.name} // {currentTrackSpec.kanji}
                </div>
                <div className="text-7xl md:text-9xl font-black italic bg-gradient-to-b from-white via-cyan-300 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(0,240,255,0.8)]">
                  {hud.countdown === 0 ? 'GO!!' : hud.countdown}
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM-RIGHT: ANIME DIGITAL TACHOMETER, RPM BAR, GEAR & N2O BOOST */}
          <div className="absolute bottom-4 right-4 z-20 bg-slate-950/88 border-2 border-cyan-400/60 rounded-2xl p-4 w-64 md:w-72 -skew-x-12 backdrop-blur-md pointer-events-none shadow-2xl">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase block">GEAR</span>
                <span className="text-4xl font-black italic text-rose-400 leading-none">{hud.gear}</span>
              </div>
              <div className="text-right">
                <span className="text-5xl font-black italic text-white leading-none tracking-tight">
                  {hud.speedKph}
                </span>
                <span className="text-xs font-black text-cyan-400 ml-1.5">KPH</span>
              </div>
            </div>

            {/* RPM Rev Bar */}
            <div className="mt-2.5">
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, hud.rpmRatio * 100)}%` }}
                />
              </div>
            </div>

            {/* N2O Nitro Gauge */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                <span className="text-cyan-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-cyan-300" /> N₂O HYPER BOOST (SHIFT)
                </span>
                <span className="text-white">{hud.nitro}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/40">
                <div
                  className={`h-full transition-all duration-75 ${
                    hud.isNitro ? 'bg-fuchsia-400 animate-pulse' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${hud.nitro}%` }}
                />
              </div>
            </div>
          </div>

          {/* Left Thumb: Steering Paddles */}
          <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 z-30 flex items-center gap-2 sm:gap-3 pointer-events-auto">
            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.left = true; }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.left = false; }}
              onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.left = false; }}
              onMouseDown={() => (inputRef.current.left = true)}
              onMouseUp={() => (inputRef.current.left = false)}
              onMouseLeave={() => (inputRef.current.left = false)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-900/85 border-2 border-cyan-400/70 active:bg-cyan-400 active:text-slate-950 text-cyan-300 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-2xl backdrop-blur-md active:scale-95 transition-transform cursor-pointer select-none"
              aria-label="Steer Left"
            >
              ◀
            </button>

            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.right = true; }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.right = false; }}
              onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.right = false; }}
              onMouseDown={() => (inputRef.current.right = true)}
              onMouseUp={() => (inputRef.current.right = false)}
              onMouseLeave={() => (inputRef.current.right = false)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-900/85 border-2 border-cyan-400/70 active:bg-cyan-400 active:text-slate-950 text-cyan-300 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-2xl backdrop-blur-md active:scale-95 transition-transform cursor-pointer select-none"
              aria-label="Steer Right"
            >
              ▶
            </button>
          </div>

          {/* Right Thumb: Driving Action Pedals (Gas, Brake, Drift, Nitro) */}
          <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-30 flex items-end gap-1.5 sm:gap-2.5 pointer-events-auto">
            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.drift = true; }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.drift = false; }}
              onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.drift = false; }}
              onMouseDown={() => (inputRef.current.drift = true)}
              onMouseUp={() => (inputRef.current.drift = false)}
              onMouseLeave={() => (inputRef.current.drift = false)}
              className="w-13 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-amber-500/85 border-2 border-amber-300 active:bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-black italic text-[10px] sm:text-xs uppercase shadow-xl backdrop-blur-md active:scale-95 transition-transform cursor-pointer select-none"
              aria-label="Drift"
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current mb-0.5" />
              DRIFT
            </button>

            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.nitro = true; }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.nitro = false; }}
              onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.nitro = false; }}
              onMouseDown={() => (inputRef.current.nitro = true)}
              onMouseUp={() => (inputRef.current.nitro = false)}
              onMouseLeave={() => (inputRef.current.nitro = false)}
              className="w-13 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-cyan-400/90 border-2 border-white active:bg-fuchsia-500 text-slate-950 flex flex-col items-center justify-center font-black italic text-[10px] sm:text-xs uppercase shadow-xl backdrop-blur-md active:scale-95 transition-transform cursor-pointer select-none"
              aria-label="Nitro Boost"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current mb-0.5" />
              N₂O
            </button>

            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.down = true; }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.down = false; }}
              onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.down = false; }}
              onMouseDown={() => (inputRef.current.down = true)}
              onMouseUp={() => (inputRef.current.down = false)}
              onMouseLeave={() => (inputRef.current.down = false)}
              className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl sm:rounded-2xl bg-rose-600/85 border-2 border-rose-300 active:bg-rose-500 text-white flex flex-col items-center justify-center font-black text-[10px] sm:text-xs uppercase shadow-xl backdrop-blur-md active:scale-95 transition-transform cursor-pointer select-none"
              aria-label="Brake or Reverse"
            >
              <span className="text-xs sm:text-sm">▼</span>
              <span>BRK</span>
            </button>

            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.up = true; }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.up = false; }}
              onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current.up = false; }}
              onMouseDown={() => (inputRef.current.up = true)}
              onMouseUp={() => (inputRef.current.up = false)}
              onMouseLeave={() => (inputRef.current.up = false)}
              className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl sm:rounded-3xl bg-emerald-500/90 border-2 border-emerald-200 active:bg-emerald-400 text-slate-950 flex flex-col items-center justify-center font-black italic text-xs sm:text-sm uppercase shadow-2xl backdrop-blur-md active:scale-95 transition-transform cursor-pointer select-none"
              aria-label="Accelerate"
            >
              <span className="text-base sm:text-xl">▲</span>
              <span>GAS</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SCREEN 6: POST-RACE VICTORY & TELEMETRY RESULTS                      */}
      {/* ==================================================================== */}
      {screen === 'results' && raceResult && (
        <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900/95 border-2 border-cyan-400/60 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                EVENT COMPLETE // {currentTrackSpec.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-black italic mt-1 bg-gradient-to-r from-white via-cyan-300 to-rose-400 bg-clip-text text-transparent">
                {raceResult.rank === 1 ? '1ST PLACE VICTORY!' : `FINISHED #${raceResult.rank}`}
              </h1>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400">TOTAL TIME</div>
                <div className="text-base font-black text-white mt-0.5">{formatRaceTime(raceResult.totalTime)}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400">BEST LAP</div>
                <div className="text-base font-black text-cyan-300 mt-0.5">{formatRaceTime(raceResult.bestLap)}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400">DRIFT SCORE</div>
                <div className="text-base font-black text-rose-400 mt-0.5">{raceResult.driftScore.toLocaleString()} PTS</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-400/40 text-center">
                <div className="text-[10px] font-bold text-amber-300">EARNED PAYOUT</div>
                <div className="text-base font-black text-amber-300 mt-0.5">+{raceResult.earnedCr.toLocaleString()} CR</div>
              </div>
            </div>

            {/* Standings Table */}
            <div className="space-y-2 mb-6">
              {raceResult.standings.map(st => (
                <div
                  key={st.name}
                  className={`px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold ${
                    st.isPlayer
                      ? 'bg-gradient-to-r from-cyan-500/30 to-rose-500/30 border border-cyan-400 text-white'
                      : 'bg-slate-950/70 border border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black italic text-cyan-300">#{st.rank}</span>
                    <span className="font-black">{st.name}</span>
                    <span className="text-rose-400">{st.kanji}</span>
                  </div>
                  {st.score !== null && <span>{st.score.toLocaleString()} DRIFT PTS</span>}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => launchRace({ mode: gameMode, trackId: selectedTrackId, difficulty, careerStage: activeCareerStage })}
                className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-black italic text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> REMATCH
              </button>
              <button
                onClick={() => setScreen('garage')}
                className="flex-1 py-3.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 font-black italic text-sm flex items-center justify-center gap-2"
              >
                <Wrench className="w-4 h-4" /> UPGRADE IN GARAGE
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black italic text-sm flex items-center justify-center gap-2"
              >
                MAIN HUB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CONTROLS MODAL                                                       */}
      {/* ==================================================================== */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-400 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black italic text-cyan-300">DRIVING CONTROLS</h3>
              <button onClick={() => setShowControlsModal(false)} className="text-xs font-bold text-slate-400 hover:text-white">
                CLOSE ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['W / ↑', 'Accelerate Throttle'],
                ['S / ↓', 'Carbon Brakes / Reverse'],
                ['A / D or ← / →', 'Speed-Sensitive Steering'],
                ['SPACEBAR', 'Hold while steering to Initiate Kage Drift'],
                ['SHIFT', 'Ignite N₂O Hyper Boost'],
                ['C', 'Cycle Chase / Far / Hood Camera'],
              ].map(([k, desc]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-800">
                  <span className="font-black text-rose-400">{k}</span>
                  <span className="text-slate-200">{desc}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs uppercase"
            >
              GOT IT — LET'S RACE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}