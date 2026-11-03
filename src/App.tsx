import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Trophy, Zap, Flame, Shield, Volume2, VolumeX, Play,
  Check, Award, Gauge, Sparkles, RotateCcw, Camera,
  Wrench, Palette, Crown, HelpCircle, Package, Calendar,
  Target, Music, ArrowUpRight, ChevronRight, Lock
} from 'lucide-react';

import {
  STORAGE_KEY,
  VEHICLES,
  TRACKS,
  AI_RIVALS,
  CAREER_STAGES,
  PAINT_PRESETS,
  UNDERGLOW_PRESETS,
  RIM_PRESETS,
  LIVERY_PRESETS,
  FLAME_PRESETS,
  UPGRADE_TYPES,
  DAILY_REWARDS,
  CRATE_TIERS,
  BATTLE_PASS_TIERS,
  MISSIONS_LIST,
  INITIAL_SAVE,
} from './data/gameData';

import {
  Vehicle,
  TrackConfig,
  SaveData,
  CrateTier,
  CrateLootItem,
  CarCustomization,
} from './types/game';

import { soundEngine } from './audio/SoundEngine';
import { buildAnimeCarMesh } from './graphics/carBuilder';
import { buildTrackEnvironment, SplineFrame } from './graphics/trackBuilder';
import { GarageTurntable } from './components/GarageTurntable';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { CrateModal } from './components/CrateModal';
import { StreetPassModal } from './components/StreetPassModal';
import { MissionsModal } from './components/MissionsModal';
import { ControlsModal } from './components/ControlsModal';

function formatRaceTime(seconds: number): string {
  if (!seconds || seconds < 0 || !isFinite(seconds)) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

function getEffectiveCarStats(carId: string, customizations: Record<string, CarCustomization>) {
  const car = VEHICLES.find(v => v.id === carId) || VEHICLES[0];
  const cust = customizations[carId] || INITIAL_SAVE.customizations.akira;
  const upg = cust?.upgrades || { engine: 0, turbo: 0, brakes: 0, tires: 0 };
  return {
    speed: Math.min(100, car.baseStats.speed + upg.engine * 3),
    accel: Math.min(100, car.baseStats.accel + upg.turbo * 3),
    handling: Math.min(100, car.baseStats.handling + upg.brakes * 3),
    drift: Math.min(100, car.baseStats.drift + upg.tires * 3),
  };
}

export default function App() {
  // Persistent Save State
  const [saveData, setSaveData] = useState<SaveData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...INITIAL_SAVE,
          ...parsed,
          customizations: { ...INITIAL_SAVE.customizations, ...(parsed.customizations || {}) },
          missions: { ...INITIAL_SAVE.missions, ...(parsed.missions || {}) },
          lifetimeStats: { ...INITIAL_SAVE.lifetimeStats, ...(parsed.lifetimeStats || {}) },
        };
      }
    } catch (e) {
      // Fallback
    }
    return INITIAL_SAVE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      // Storage error
    }
  }, [saveData]);

  // Navigation & Screen State
  const [screen, setScreen] = useState<'menu' | 'garage' | 'career' | 'race_setup' | 'racing' | 'results'>('menu');
  const [garageTab, setGarageTab] = useState<'vehicles' | 'customize' | 'upgrades'>('vehicles');
  const [gameMode, setGameMode] = useState<'quick' | 'career' | 'time_attack' | 'drift'>('quick');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('tokyo');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [activeCareerStage, setActiveCareerStage] = useState<any>(null);
  const [muted, setMuted] = useState(false);
  const [cameraMode, setCameraMode] = useState(0); // 0: Dynamic, 1: Far, 2: Hood
  const [musicTrack, setMusicTrack] = useState(0); // 0: Synthwave, 1: Eurobeat, 2: Wangan

  // F2P Modals State
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showCrateModal, setShowCrateModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showControlsModal, setShowControlsModal] = useState(false);

  // Live Race HUD State
  const [hud, setHud] = useState({
    speedKph: 0,
    rpmRatio: 0,
    gear: '1' as string | number,
    lap: 1,
    totalLaps: 3,
    position: 1,
    totalRacers: 6,
    lapTime: 0,
    bestLapTime: null as number | null,
    totalTime: 0,
    nitro: 100,
    isNitro: false,
    isDrifting: false,
    currentDriftScore: 0,
    driftMultiplier: 1,
    totalDriftScore: 0,
    countdown: 3,
    rivalCallout: null as any,
    minimapCars: [] as { id: string; isPlayer: boolean; x: number; z: number }[],
  });

  const [raceResult, setRaceResult] = useState<any>(null);

  // Input ref
  const raceCanvasRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
    reset: false,
  });

  // Mobile orientation detection
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return false;
  });

  useEffect(() => {
    const handleOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Global mobile audio unlocker on first touch/click
  useEffect(() => {
    const unlockAudio = () => {
      soundEngine.resume();
    };
    window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
    window.addEventListener('click', unlockAudio, { passive: true, once: true });
    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

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
    const onKeyDown = (e: KeyboardEvent) => {
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
      if (k === 'r' && screen === 'racing') inputRef.current.reset = true;
      if (k === 'c' && screen === 'racing') {
        setCameraMode(prev => (prev + 1) % 3);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
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
    soundEngine.startSynthMusic(musicTrack);

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
  }, [gameMode, selectedTrackId, difficulty, musicTrack]);

  // ============================================================================
  // F2P CLAIM HANDLERS (Daily Rewards, Crates, Battle Pass, Missions)
  // ============================================================================

  const handleClaimDaily = () => {
    const nextDay = (saveData.dailyStreak % 7) + 1;
    const rewardItem = DAILY_REWARDS.find(r => r.day === nextDay) || DAILY_REWARDS[0];

    setSaveData(prev => {
      let crBonus = rewardItem.amount && rewardItem.type === 'credits' ? rewardItem.amount : 0;
      let tokenBonus = rewardItem.amount && rewardItem.type === 'tokens' ? rewardItem.amount : 0;
      const nextCars = [...prev.unlockedCars];
      const nextGlows = [...prev.unlockedGlows];
      const nextLiveries = [...prev.unlockedLiveries];

      if (rewardItem.type === 'car' && rewardItem.rewardId && !nextCars.includes(rewardItem.rewardId)) {
        nextCars.push(rewardItem.rewardId);
      }
      if (rewardItem.type === 'cosmetic' && rewardItem.rewardId) {
        if (!nextGlows.includes(rewardItem.rewardId)) nextGlows.push(rewardItem.rewardId);
        if (!nextLiveries.includes(rewardItem.rewardId)) nextLiveries.push(rewardItem.rewardId);
      }

      return {
        ...prev,
        credits: prev.credits + crBonus,
        tokens: prev.tokens + tokenBonus,
        dailyStreak: prev.dailyStreak + 1,
        lastDailyClaimTimestamp: Date.now(),
        unlockedCars: nextCars,
        unlockedGlows: nextGlows,
        unlockedLiveries: nextLiveries,
      };
    });
  };

  const handleOpenCrate = (tier: CrateTier, isFree: boolean): CrateLootItem | null => {
    // Generate drop item based on tier
    let loot: CrateLootItem;
    if (tier.id === 'epic') {
      const rand = Math.random();
      if (rand < 0.25 && !saveData.unlockedCars.includes('shinobi')) {
        loot = { id: 'car_shinobi', name: 'S-CLASS SHINOBI GT', type: 'car', rarity: 'Legendary', targetId: 'shinobi', desc: 'Legendary Ninja Touge Coupe added to your garage!' };
      } else if (rand < 0.5) {
        loot = { id: 'flame_purple', name: 'Void Violet Exhaust Flame', type: 'paint', rarity: 'Epic', targetId: 'purple', desc: 'Mythic purple plasma jet flame unlocked!' };
      } else {
        loot = { id: 'cr_jackpot', name: '18,000 CR JACKPOT!', type: 'credits', rarity: 'Epic', amount: 18000, desc: 'Huge credit jackpot deposited to your street bank!' };
      }
    } else if (tier.id === 'rare') {
      const rand = Math.random();
      if (rand < 0.4) {
        loot = { id: 'tok_stash', name: '75 Neon Tokens', type: 'tokens', rarity: 'Rare', amount: 75, desc: 'Premium neon tokens stash unlocked!' };
      } else {
        loot = { id: 'rim_titanium', name: 'Burnt Titanium Rims', type: 'rim', rarity: 'Rare', targetId: 'titanium', desc: 'Rare burnt titanium alloy rims unlocked!' };
      }
    } else {
      loot = { id: 'cr_common', name: '2,500 Tuning Credits', type: 'credits', rarity: 'Common', amount: 2500, desc: 'Standard tuning credits deposited.' };
    }

    setSaveData(prev => {
      let nextCr = prev.credits - (isFree ? 0 : tier.costCr || 0);
      let nextTok = prev.tokens - (isFree ? 0 : tier.costTokens || 0);

      if (loot.type === 'credits' && loot.amount) nextCr += loot.amount;
      if (loot.type === 'tokens' && loot.amount) nextTok += loot.amount;

      const nextCars = [...prev.unlockedCars];
      const nextRims = [...prev.unlockedRims];
      const nextFlames = [...prev.unlockedFlames];

      if (loot.type === 'car' && loot.targetId && !nextCars.includes(loot.targetId)) nextCars.push(loot.targetId);
      if (loot.type === 'rim' && loot.targetId && !nextRims.includes(loot.targetId)) nextRims.push(loot.targetId);
      if (loot.targetId && FLAME_PRESETS.some(f => f.id === loot.targetId) && !nextFlames.includes(loot.targetId)) nextFlames.push(loot.targetId);

      // Update crate mission
      const nextMissions = { ...prev.missions };
      if (nextMissions.life_crates_5) {
        nextMissions.life_crates_5 = { ...nextMissions.life_crates_5, current: nextMissions.life_crates_5.current + 1 };
      }

      return {
        ...prev,
        credits: nextCr,
        tokens: nextTok,
        cratesOpened: prev.cratesOpened + 1,
        lastFreeCrateTimestamp: isFree ? Date.now() : prev.lastFreeCrateTimestamp,
        unlockedCars: nextCars,
        unlockedRims: nextRims,
        unlockedFlames: nextFlames,
        missions: nextMissions,
      };
    });

    return loot;
  };

  const handleClaimPassTier = (tierNum: number, isVip: boolean) => {
    const tierData = BATTLE_PASS_TIERS.find(t => t.tier === tierNum);
    if (!tierData) return;

    const reward = isVip ? tierData.vipReward : tierData.freeReward;

    setSaveData(prev => {
      let cr = prev.credits;
      let tok = prev.tokens;
      const nextCars = [...prev.unlockedCars];
      const nextGlows = [...prev.unlockedGlows];
      const nextLiveries = [...prev.unlockedLiveries];

      if (reward.type === 'credits' && reward.amount) cr += reward.amount;
      if (reward.type === 'tokens' && reward.amount) tok += reward.amount;
      if (reward.type === 'car' && reward.id && !nextCars.includes(reward.id)) nextCars.push(reward.id);
      if (reward.type === 'cosmetic' && reward.id) {
        if (!nextGlows.includes(reward.id)) nextGlows.push(reward.id);
        if (!nextLiveries.includes(reward.id)) nextLiveries.push(reward.id);
      }

      return {
        ...prev,
        credits: cr,
        tokens: tok,
        unlockedCars: nextCars,
        unlockedGlows: nextGlows,
        unlockedLiveries: nextLiveries,
        claimedFreePassTiers: isVip ? prev.claimedFreePassTiers : [...prev.claimedFreePassTiers, tierNum],
        claimedVipPassTiers: isVip ? [...prev.claimedVipPassTiers, tierNum] : prev.claimedVipPassTiers,
      };
    });
  };

  const handleBuyVipPass = () => {
    setSaveData(prev => ({
      ...prev,
      tokens: prev.tokens - 300,
      hasVipPass: true,
    }));
  };

  const handleClaimMission = (id: string, rewardCr: number, rewardTokens: number, rewardXp: number) => {
    setSaveData(prev => {
      const nextMissions = {
        ...prev.missions,
        [id]: { ...(prev.missions[id] || { current: 0 }), claimed: true },
      };

      const newXp = prev.xp + rewardXp;
      const levelUp = newXp >= prev.level * 450;

      return {
        ...prev,
        credits: prev.credits + rewardCr,
        tokens: prev.tokens + rewardTokens,
        xp: levelUp ? newXp - prev.level * 450 : newXp,
        level: levelUp ? prev.level + 1 : prev.level,
        passXp: prev.passXp + rewardXp,
        missions: nextMissions,
      };
    });
  };

  // ============================================================================
  // 3D RACE ENGINE LOOP (SPLINE PHYSICS, DRIFTING, NITRO, AI, PARTICLES)
  // ============================================================================

  useEffect(() => {
    if (screen !== 'racing') {
      soundEngine.updateDriving(0, false, false, false);
      soundEngine.stopSynthMusic();
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

    const sampleSplineFrame = (uNorm: number): SplineFrame => {
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
      return { u: uNorm, p, tangent, right, normal, dist: f0.dist };
    };

    // 4. Create Player Vehicle & Physics State
    const playerMesh = buildAnimeCarMesh(currentCarSpec, currentCarCust);
    scene.add(playerMesh);

    const maxSpeedUnits = 64 + (currentStats.speed / 100) * 38;
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
      lateral: 0,
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
      bestLapTime: null as number | null,
      finished: false,
      finishTime: 0,
      shakeIntensity: 0,
    };

    // 5. Create 5 AI Rivals
    const diffMult = difficulty === 'easy' ? 0.85 : difficulty === 'hard' ? 1.01 : 0.93;
    const aiRacers: any[] = [];

    if (!isSolo) {
      AI_RIVALS.forEach((rival, idx) => {
        const rSpec = VEHICLES.find(v => v.id === rival.carId) || VEHICLES[0];
        const rMesh = buildAnimeCarMesh(rSpec, { paint: rival.paint, glow: rival.glow, spoiler: true });
        scene.add(rMesh);

        aiRacers.push({
          ...rival,
          isPlayer: false,
          mesh: rMesh,
          s: 0.022 + idx * 0.015,
          lap: 1,
          lateral: idx % 2 === 0 ? 3.8 : -3.8,
          targetLateral: idx % 2 === 0 ? 3.5 : -3.5,
          laneTimer: 2.5 + idx * 0.8,
          speed: 0,
          baseMaxSpeed: maxSpeedUnits * rival.skillOffset * diffMult,
          finished: false,
          finishTime: 0,
        });
      });
    }

    const allRacers = [player, ...aiRacers];

    // 6. Particles & Weather
    const particlePool: any[] = [];
    const smokeGeo = new THREE.DodecahedronGeometry(0.38, 0);
    const sparkGeo = new THREE.BoxGeometry(0.14, 0.14, 0.45);

    const spawnParticle = (pos: THREE.Vector3, vel: THREE.Vector3, colorHex: string, scale: number, life: number, isSpark = false) => {
      if (particlePool.length > 140) return;
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(isSpark ? sparkGeo : smokeGeo, mat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(scale);
      scene.add(mesh);
      particlePool.push({ mesh, vel: vel.clone(), life, maxLife: life, isSpark });
    };

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

    const skidMarks: THREE.Mesh[] = [];
    const skidGeo = new THREE.PlaneGeometry(0.35, 1.4);
    skidGeo.rotateX(-Math.PI / 2);
    const skidMat = new THREE.MeshBasicMaterial({ color: 0x050508, transparent: true, opacity: 0.55, depthWrite: false });

    // 7. Race Timing & Countdown
    let clock = new THREE.Clock();
    let elapsedRaceTime = 0;
    let countdownTimer = 3.4;
    let lastBeepSecond = 4;
    let hudUpdateCounter = 0;
    let calloutCooldown = 4.0;
    let activeCallout: any = null;
    let animFrameId: number;

    allRacers.forEach(r => {
      const f = sampleSplineFrame(r.s);
      const worldPos = f.p.clone().addScaledVector(f.right, r.lateral);
      r.mesh.position.copy(worldPos);
      const lookTarget = worldPos.clone().add(f.tangent);
      r.mesh.lookAt(lookTarget);
    });

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

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

      // Reset Player to Track Centerline
      if (inp.reset) {
        inp.reset = false;
        player.lateral = 0;
        player.lateralVel = 0;
        player.steerAngle = 0;
        player.driftAngle = 0;
        player.speed = Math.max(0, player.speed * 0.4);
        soundEngine.playBeep(440, 0.12, 'triangle');
      }

      // Player Driving Physics
      if (!player.finished) {
        const isBraking = inp.down && player.speed > 0.8;
        const isReversing = player.speed < -0.5;

        if (player.mesh.userData.tailMat) {
          if (isBraking) {
            player.mesh.userData.tailMat.color.setHex(0xff2244);
          } else {
            player.mesh.userData.tailMat.color.setHex(0xff0044);
          }
        }

        if (inp.up) {
          if (isReversing) {
            player.speed += accelRate * 2.2 * dt;
          } else {
            const effectiveTop = player.isNitro ? maxSpeedUnits * 1.25 : maxSpeedUnits;
            const speedRatio = Math.max(0, player.speed / effectiveTop);
            const torqueCurve = Math.max(0.22, 1.0 - Math.pow(speedRatio, 1.5) * 0.78);
            player.speed += accelRate * torqueCurve * dt;
          }
        } else if (inp.down) {
          if (player.speed > 0.8) {
            const brakePower = accelRate * 2.4;
            player.speed = Math.max(0, player.speed - brakePower * dt);
          } else {
            player.speed = Math.max(-22, player.speed - accelRate * 0.65 * dt);
          }
        } else {
          if (Math.abs(player.speed) > 0.05) {
            player.speed *= Math.pow(0.988, dt * 60);
            if (Math.abs(player.speed) < 0.25) player.speed = 0;
          } else {
            player.speed = 0;
          }
        }

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

        const ds = (player.speed * dt) / totalLength;
        const prevS = player.s;
        player.s += ds;

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

        const maxLat = roadHalfWidth - 1.35;
        if (Math.abs(player.lateral) > maxLat) {
          player.lateral = Math.sign(player.lateral) * maxLat;
          player.lateralVel = 0;
          player.speed *= 0.88;
          player.shakeIntensity = 0.35;
          player.currentDriftScore = Math.floor(player.currentDriftScore * 0.7);
          soundEngine.playCollision();

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

      // Update Player 3D Transform & Forward Alignment
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

      player.mesh.userData.wheels?.forEach((w: THREE.Group) => {
        w.rotation.x -= player.speed * dt * 0.9;
      });
      if (player.mesh.userData.wheels && player.mesh.userData.wheels.length >= 2) {
        const visualTurn = player.steerAngle * 0.65;
        player.mesh.userData.wheels[0].rotation.y = visualTurn;
        player.mesh.userData.wheels[1].rotation.y = visualTurn;
      }

      if (player.mesh.userData.flameL) player.mesh.userData.flameL.visible = player.isNitro;
      if (player.mesh.userData.flameR) player.mesh.userData.flameR.visible = player.isNitro;
      if (player.isNitro && player.mesh.userData.flameL) {
        const flicker = 0.8 + Math.random() * 0.55;
        player.mesh.userData.flameL.scale.set(1, 1, flicker);
        player.mesh.userData.flameR.scale.set(1, 1, flicker);
      }

      if (player.isDrifting && Math.abs(player.speed) > 18) {
        const rearOffset = pFrame.tangent.clone().multiplyScalar(-1.8);
        const tireL = pWorldPos.clone().add(rearOffset).addScaledVector(pFrame.right, -0.85);
        const tireR = pWorldPos.clone().add(rearOffset).addScaledVector(pFrame.right, 0.85);

        spawnParticle(tireL, new THREE.Vector3(0, 1.4, 0), '#e2e8f0', 0.95, 0.45, false);
        spawnParticle(tireR, new THREE.Vector3(0, 1.4, 0), '#e2e8f0', 0.95, 0.45, false);

        if (Math.random() < 0.45) {
          spawnParticle(tireL, new THREE.Vector3((Math.random() - 0.5) * 5, 2.5, (Math.random() - 0.5) * 5), '#fbbf24', 0.8, 0.25, true);
        }

        const skid = new THREE.Mesh(skidGeo, skidMat);
        skid.position.copy(tireL).add(new THREE.Vector3(0, 0.08, 0));
        skid.lookAt(tireL.clone().add(pFrame.tangent));
        scene.add(skid);
        skidMarks.push(skid);
        if (skidMarks.length > 90) {
          const old = skidMarks.shift();
          if (old) scene.remove(old);
        }
      }

      // AI Rivals Update
      calloutCooldown = Math.max(0, calloutCooldown - dt);

      aiRacers.forEach(ai => {
        if (ai.finished) return;

        const progressDiff = player.s - ai.s;
        let rubberBand = 1.0;
        if (progressDiff > 0.04) rubberBand = 1.12;
        else if (progressDiff < -0.05) rubberBand = 0.91;

        const targetSpeed = ai.baseMaxSpeed * rubberBand;
        ai.speed = THREE.MathUtils.lerp(ai.speed, targetSpeed, dt * 1.8);

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
        ai.mesh.userData.wheels?.forEach((w: THREE.Group) => {
          w.rotation.x -= ai.speed * dt * 0.9;
        });

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

      // Update Particles
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

      weatherPoints.position.set(pWorldPos.x, pWorldPos.y + 12, pWorldPos.z);
      weatherPoints.rotation.y += dt * 0.15;

      // Dynamic Camera
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
        const hoodPos = pWorldPos.clone()
          .addScaledVector(pFrame.tangent, 0.9)
          .add(new THREE.Vector3(0, 1.35, 0));
        camera.position.copy(hoodPos).add(shakeVec);
        camera.lookAt(pWorldPos.clone().addScaledVector(pFrame.tangent, 25));
      } else {
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

      const speedRatio = Math.min(1, Math.abs(player.speed) / maxSpeedUnits);
      soundEngine.updateDriving(speedRatio, player.isDrifting, player.isNitro, !player.finished);

      // Finish Race Check
      if (player.finished) {
        const sorted = [...allRacers].sort((a, b) => b.s - a.s);
        const playerRank = sorted.findIndex(r => r.isPlayer) + 1;
        const totalDrift = player.totalDriftScore;

        const baseCr = playerRank === 1 ? 2600 : playerRank === 2 ? 1600 : playerRank === 3 ? 1000 : 500;
        const driftBonusCr = Math.floor(totalDrift * 0.14);
        const earnedCr = baseCr + driftBonusCr;
        const earnedRep = playerRank === 1 ? 350 : playerRank <= 3 ? 180 : 80;
        const earnedTokens = playerRank === 1 ? 15 : playerRank <= 3 ? 8 : 2;
        const earnedXp = Math.floor(120 + totalDrift * 0.02 + (playerRank === 1 ? 150 : 50));

        setSaveData(prev => {
          const nextTimes = { ...prev.bestTimes };
          if (player.bestLapTime && (!nextTimes[selectedTrackId] || player.bestLapTime < nextTimes[selectedTrackId])) {
            nextTimes[selectedTrackId] = player.bestLapTime;
          }
          const nextDrifts = { ...prev.bestDriftScores };
          if (!nextDrifts[selectedTrackId] || totalDrift > nextDrifts[selectedTrackId]) {
            nextDrifts[selectedTrackId] = totalDrift;
          }
          const nextCompleted = [...prev.completedCareer];
          let stageBonusCr = 0;
          let stageBonusRep = 0;
          let stageBonusTokens = 0;

          if (gameMode === 'career' && activeCareerStage) {
            const passed = activeCareerStage.mode === 'drift'
              ? totalDrift >= (activeCareerStage.driftTarget || 4500)
              : playerRank === 1;
            if (passed && !nextCompleted.includes(activeCareerStage.id)) {
              nextCompleted.push(activeCareerStage.id);
              stageBonusCr = activeCareerStage.rewardCr;
              stageBonusRep = activeCareerStage.rewardRep;
              stageBonusTokens = activeCareerStage.rewardTokens;
            }
          }

          // Mission progress tracking
          const nextMissions = { ...prev.missions };
          if (nextMissions.daily_drift) nextMissions.daily_drift.current += totalDrift;
          if (nextMissions.life_drift_100k) nextMissions.life_drift_100k.current += totalDrift;
          if (playerRank === 1) {
            if (nextMissions.daily_wins) nextMissions.daily_wins.current += 1;
            if (nextMissions.life_wins_10) nextMissions.life_wins_10.current += 1;
          }

          const newXp = prev.xp + earnedXp;
          const levelUp = newXp >= prev.level * 450;

          return {
            ...prev,
            credits: prev.credits + earnedCr + stageBonusCr,
            rep: prev.rep + earnedRep + stageBonusRep,
            tokens: prev.tokens + earnedTokens + stageBonusTokens,
            xp: levelUp ? newXp - prev.level * 450 : newXp,
            level: levelUp ? prev.level + 1 : prev.level,
            passXp: prev.passXp + Math.floor(earnedXp * 0.9),
            bestTimes: nextTimes,
            bestDriftScores: nextDrifts,
            completedCareer: nextCompleted,
            missions: nextMissions,
            lifetimeStats: {
              ...prev.lifetimeStats,
              racesWon: playerRank === 1 ? prev.lifetimeStats.racesWon + 1 : prev.lifetimeStats.racesWon,
              totalDriftPoints: prev.lifetimeStats.totalDriftPoints + totalDrift,
            }
          };
        });

        setRaceResult({
          rank: playerRank,
          totalTime: player.finishTime,
          bestLap: player.bestLapTime || player.finishTime / totalLaps,
          driftScore: totalDrift,
          earnedCr,
          earnedTokens,
          earnedXp,
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
          return { id: r.id, isPlayer: r.isPlayer, x: mf.p.x, z: mf.p.z };
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

  // Minimap SVG data
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

    const toSvg = (x: number, z: number) => ({
      cx: ((x - minX) / w) * 140 + 10,
      cy: ((z - minZ) / h) * 140 + 10,
    });

    const pathCoords = pts.map(([x, , z]) => toSvg(x, z));
    const d = pathCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.cx.toFixed(1)} ${pt.cy.toFixed(1)}`).join(' ') + ' Z';
    return { d, toSvg };
  }, [currentTrackSpec]);

  return (
    <div className="relative w-full h-screen h-[100dvh] bg-[#050611] text-white overflow-hidden select-none font-sans">
      {/* PERSISTENT HEADER (Hidden during active 3D racing) */}
      {screen !== 'racing' && (
        <header className="relative z-30 flex flex-wrap items-center justify-between px-3 md:px-8 py-2 bg-[#080a1c]/95 border-b border-cyan-500/30 backdrop-blur-md gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => setScreen('menu')}>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-rose-500 via-fuchsia-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-rose-500/30 -skew-x-12">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="text-lg md:text-2xl font-black italic tracking-wider bg-gradient-to-r from-white via-cyan-300 to-rose-400 bg-clip-text text-transparent">
                  KAGE DRIFT
                </span>
                <span className="text-[9px] md:text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300">
                  F2P
                </span>
              </div>
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.25em] text-cyan-400/80 hidden sm:block">
                Neo Tokyo Street Apex
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
            {[
              { id: 'menu', label: 'HUB' },
              { id: 'garage', label: 'GARAGE' },
              { id: 'career', label: 'CAREER' },
              { id: 'race_setup', label: 'MODES' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playBeep(580, 0.08);
                  setScreen(tab.id as any);
                }}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-black italic tracking-wider transition-all -skew-x-6 whitespace-nowrap ${
                  screen === tab.id
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-400/30'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* F2P Currencies, Pass, Modals & Audio */}
          <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
            {/* Street Pass Pill */}
            <button
              onClick={() => setShowPassModal(true)}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-400/50 hover:border-amber-300 transition -skew-x-6 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[9px] sm:text-[10px] font-black text-amber-300">LV.{Math.floor(saveData.passXp / 675) + 1}</span>
            </button>

            {/* Daily Streak Pill */}
            <button
              onClick={() => setShowDailyModal(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-400/40 hover:border-cyan-300 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[9px] sm:text-[10px] font-black text-cyan-300">D{saveData.dailyStreak % 7 + 1}</span>
            </button>

            {/* Lucky Crate Pill */}
            <button
              onClick={() => setShowCrateModal(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 border border-fuchsia-400/40 hover:border-fuchsia-300 transition cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-[9px] sm:text-[10px] font-black text-fuchsia-300 hidden sm:inline">CRATES</span>
            </button>

            {/* Bounties Pill */}
            <button
              onClick={() => setShowMissionsModal(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 border border-emerald-400/40 hover:border-emerald-300 transition cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9px] sm:text-[10px] font-black text-emerald-300 hidden sm:inline">BOUNTIES</span>
            </button>

            {/* Credits & Neon Tokens */}
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-950 border border-cyan-500/40">
              <span className="text-[11px] sm:text-xs font-black text-white">{saveData.credits.toLocaleString()}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-cyan-400">CR</span>
            </div>

            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-400/50">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] sm:text-xs font-black text-amber-300">{saveData.tokens.toLocaleString()}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-amber-400">NT</span>
            </div>

            {/* Controls Info */}
            <button
              onClick={() => setShowControlsModal(true)}
              className="p-1 sm:p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              title="Controls"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Audio Mute */}
            <button
              onClick={toggleMute}
              className="p-1 sm:p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              title="Audio"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />}
            </button>
          </div>
        </header>
      )}

      {/* SCREEN 1: MAIN MENU HUB */}
      {screen === 'menu' && (
        <div className="w-full h-[calc(100vh-64px)] overflow-y-auto p-4 md:p-8 flex flex-col justify-between">
          {/* Hero Banner */}
          <div className="max-w-4xl mx-auto w-full my-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> SEASON 1: CYBER TOKYO NIGHTS IS LIVE
            </div>

            <h1 className="text-5xl md:text-7xl font-black italic tracking-wider bg-gradient-to-r from-white via-cyan-300 to-rose-400 bg-clip-text text-transparent">
              OWN THE STREETS. DEFY THE LIMITS.
            </h1>

            <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto">
              Master tight touge hairpins, high-speed wangan highways, and neon-drenched metropolis circuits with authentic anime physics and deep custom tuning.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => launchRace({ mode: 'quick', trackId: 'tokyo', difficulty: 'normal' })}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-600 to-cyan-400 text-white font-black italic text-base tracking-wider uppercase shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all -skew-x-6 cursor-pointer flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" /> QUICK STREET RACE
              </button>

              <button
                onClick={() => setScreen('garage')}
                className="px-7 py-4 rounded-2xl bg-slate-900/90 border-2 border-cyan-400/50 hover:border-cyan-300 text-white font-black italic text-base tracking-wider uppercase hover:scale-105 active:scale-95 transition-all -skew-x-6 cursor-pointer flex items-center gap-2"
              >
                <Wrench className="w-5 h-5 text-cyan-400" /> TUNING GARAGE
              </button>

              <button
                onClick={() => setScreen('career')}
                className="px-7 py-4 rounded-2xl bg-slate-900/90 border-2 border-amber-400/50 hover:border-amber-300 text-white font-black italic text-base tracking-wider uppercase hover:scale-105 active:scale-95 transition-all -skew-x-6 cursor-pointer flex items-center gap-2"
              >
                <Crown className="w-5 h-5 text-amber-400" /> CAREER LEAGUE
              </button>
            </div>
          </div>

          {/* Quick F2P Feature Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto w-full pt-6">
            <div
              onClick={() => setShowDailyModal(true)}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-400/50 cursor-pointer flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-7 h-7 text-cyan-400 group-hover:scale-110 transition" />
                <div>
                  <div className="text-xs font-black text-white">DAILY 7-DAY STREAK</div>
                  <div className="text-[10px] text-slate-400">Claim Free Day {saveData.dailyStreak % 7 + 1} Rewards</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300" />
            </div>

            <div
              onClick={() => setShowCrateModal(true)}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-fuchsia-400/50 cursor-pointer flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <Package className="w-7 h-7 text-fuchsia-400 group-hover:scale-110 transition" />
                <div>
                  <div className="text-xs font-black text-white">UNDERGROUND CRATES</div>
                  <div className="text-[10px] text-slate-400">Open Lucky Gacha Vaults</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-fuchsia-300" />
            </div>

            <div
              onClick={() => setShowPassModal(true)}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-400/50 cursor-pointer flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <Crown className="w-7 h-7 text-amber-400 group-hover:scale-110 transition" />
                <div>
                  <div className="text-xs font-black text-white">SEASON 1 STREET PASS</div>
                  <div className="text-[10px] text-slate-400">Tier 20 Mythic CYBER DEVIL S-1</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300" />
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: GARAGE */}
      {screen === 'garage' && (
        <div className="w-full h-[calc(100vh-64px)] p-4 md:p-8 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* 3D Turntable Viewport */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 rounded-2xl overflow-hidden relative">
              <GarageTurntable carSpec={currentCarSpec} customization={currentCarCust} />
              <div className="absolute top-4 left-4 z-10">
                <span className="text-xs font-black px-2.5 py-1 rounded bg-slate-950/80 border border-cyan-400/50 text-cyan-300">
                  {currentCarSpec.classTag}
                </span>
                <h2 className="text-3xl font-black italic text-white mt-1">{currentCarSpec.name}</h2>
                <p className="text-xs text-slate-400">{currentCarSpec.subtitle}</p>
              </div>
            </div>

            {/* Performance Stats Bar */}
            <div className="grid grid-cols-4 gap-3 mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              {[
                { label: 'TOP SPEED', val: currentStats.speed, max: 100, color: 'bg-rose-500' },
                { label: 'ACCEL', val: currentStats.accel, max: 100, color: 'bg-cyan-400' },
                { label: 'HANDLING', val: currentStats.handling, max: 100, color: 'bg-emerald-400' },
                { label: 'DRIFT', val: currentStats.drift, max: 100, color: 'bg-amber-400' },
              ].map(st => (
                <div key={st.label}>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1">
                    <span>{st.label}</span>
                    <span className="text-white">{st.val}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full ${st.color}`} style={{ width: `${st.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Garage Control Side Panel */}
          <div className="w-full md:w-96 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-4 overflow-y-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'vehicles', label: 'CARS' },
                { id: 'customize', label: 'STYLING' },
                { id: 'upgrades', label: 'TUNING' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setGarageTab(t.id as any)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black italic tracking-wider uppercase transition ${
                    garageTab === t.id
                      ? 'bg-cyan-400 text-slate-950 shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Vehicles Roster */}
            {garageTab === 'vehicles' && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {VEHICLES.map(v => {
                  const isUnlocked = saveData.unlockedCars.includes(v.id);
                  const isSelected = saveData.selectedCar === v.id;
                  const canBuy = !isUnlocked && ((v.tokenCost && saveData.tokens >= v.tokenCost) || (v.cost > 0 && saveData.credits >= v.cost));

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (isUnlocked) setSaveData(prev => ({ ...prev, selectedCar: v.id }));
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-md'
                          : isUnlocked
                          ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-800/50 opacity-75'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{v.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">{v.classTag}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{v.subtitle}</div>
                      </div>

                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-400 text-slate-950 font-black text-[10px] uppercase">EQUIPPED</span>
                      ) : isUnlocked ? (
                        <button className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-black text-[10px] uppercase">SELECT</button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canBuy) {
                              soundEngine.playLevelUp();
                              setSaveData(prev => ({
                                ...prev,
                                credits: v.cost ? prev.credits - v.cost : prev.credits,
                                tokens: v.tokenCost ? prev.tokens - v.tokenCost : prev.tokens,
                                unlockedCars: [...prev.unlockedCars, v.id],
                                selectedCar: v.id,
                              }));
                            }
                          }}
                          disabled={!canBuy}
                          className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase ${
                            canBuy
                              ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {v.tokenCost ? `${v.tokenCost} NT` : `${v.cost.toLocaleString()} CR`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Visual Customizer */}
            {garageTab === 'customize' && (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {/* Paint Presets */}
                <div>
                  <div className="text-xs font-black text-slate-300 uppercase mb-2">Paint Finish</div>
                  <div className="flex flex-wrap gap-2">
                    {PAINT_PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSaveData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              [prev.selectedCar]: { ...prev.customizations[prev.selectedCar], paint: p.id }
                            }
                          }));
                        }}
                        className={`w-8 h-8 rounded-lg border-2 transition ${
                          currentCarCust.paint === p.id ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Underglow Presets */}
                <div>
                  <div className="text-xs font-black text-slate-300 uppercase mb-2">Neon Underglow</div>
                  <div className="flex flex-wrap gap-2">
                    {UNDERGLOW_PRESETS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setSaveData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              [prev.selectedCar]: { ...prev.customizations[prev.selectedCar], glow: g.id }
                            }
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition ${
                          currentCarCust.glow === g.id
                            ? 'bg-cyan-400 text-slate-950 border-white'
                            : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Livery Presets */}
                <div>
                  <div className="text-xs font-black text-slate-300 uppercase mb-2">Custom Liveries</div>
                  <div className="space-y-2">
                    {LIVERY_PRESETS.map(liv => (
                      <button
                        key={liv.id}
                        onClick={() => {
                          setSaveData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              [prev.selectedCar]: { ...prev.customizations[prev.selectedCar], livery: liv.id }
                            }
                          }));
                        }}
                        className={`w-full p-2 rounded-xl text-left border flex items-center justify-between transition ${
                          currentCarCust.livery === liv.id
                            ? 'bg-fuchsia-500/20 border-fuchsia-400 text-white'
                            : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{liv.name}</div>
                          <div className="text-[9px] text-slate-400">{liv.subtitle}</div>
                        </div>
                        {currentCarCust.livery === liv.id && <Check className="w-4 h-4 text-fuchsia-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exhaust Flame Color */}
                <div>
                  <div className="text-xs font-black text-slate-300 uppercase mb-2">Nitrous Flame Color</div>
                  <div className="flex flex-wrap gap-2">
                    {FLAME_PRESETS.map(fl => (
                      <button
                        key={fl.id}
                        onClick={() => {
                          setSaveData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              [prev.selectedCar]: { ...prev.customizations[prev.selectedCar], flameColor: fl.id }
                            }
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition ${
                          currentCarCust.flameColor === fl.id
                            ? 'border-white text-white shadow-lg'
                            : 'border-slate-800 text-slate-400'
                        }`}
                        style={{ backgroundColor: currentCarCust.flameColor === fl.id ? fl.hex : '#0f172a' }}
                      >
                        {fl.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Performance Upgrades */}
            {garageTab === 'upgrades' && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {UPGRADE_TYPES.map(u => {
                  const level = currentCarCust.upgrades[u.id] || 0;
                  const cost = u.baseCost * (level + 1);
                  const canAfford = level < 4 && saveData.credits >= cost;

                  return (
                    <div key={u.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-white">{u.name} (LV.{level}/4)</div>
                        <div className="text-[10px] text-slate-400">{u.desc}</div>
                      </div>

                      {level >= 4 ? (
                        <span className="text-[10px] font-black text-amber-400 uppercase">MAXED</span>
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              soundEngine.playLevelUp();
                              setSaveData(prev => ({
                                ...prev,
                                credits: prev.credits - cost,
                                customizations: {
                                  ...prev.customizations,
                                  [prev.selectedCar]: {
                                    ...prev.customizations[prev.selectedCar],
                                    upgrades: {
                                      ...prev.customizations[prev.selectedCar].upgrades,
                                      [u.id]: level + 1,
                                    }
                                  }
                                }
                              }));
                            }
                          }}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase ${
                            canAfford
                              ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 cursor-pointer shadow'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {cost.toLocaleString()} CR
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 3: CAREER LEAGUE */}
      {screen === 'career' && (
        <div className="w-full h-[calc(100vh-64px)] p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <h2 className="text-3xl font-black italic text-white">UNDERGROUND CAREER LEAGUE</h2>
              <p className="text-xs text-slate-400">Defeat Tokyo's top 5 street bosses to unlock legendary cars and payouts.</p>
            </div>

            <div className="space-y-4">
              {CAREER_STAGES.map(stage => {
                const isCompleted = saveData.completedCareer.includes(stage.id);
                const isLocked = saveData.rep < stage.reqRep;

                return (
                  <div
                    key={stage.id}
                    className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                      isCompleted
                        ? 'bg-slate-900/60 border-emerald-500/40'
                        : isLocked
                        ? 'bg-slate-950/40 border-slate-800 opacity-60'
                        : 'bg-slate-900 border-cyan-400/50 shadow-lg'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-400">{stage.title}</span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-black">
                            CLEARED
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-white mt-0.5">{stage.subtitle}</h3>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                        <span>Boss: <strong className="text-amber-300">{stage.boss}</strong></span>
                        <span>Track: <strong className="text-cyan-300">{stage.trackId.toUpperCase()}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-xs font-black text-amber-300">+{stage.rewardCr.toLocaleString()} CR</div>
                        <div className="text-[10px] text-cyan-300">+{stage.rewardTokens} NT • +{stage.rewardRep} REP</div>
                      </div>

                      <button
                        onClick={() => {
                          if (!isLocked) {
                            launchRace({
                              mode: stage.mode,
                              trackId: stage.trackId,
                              difficulty: stage.difficulty,
                              careerStage: stage,
                            });
                          }
                        }}
                        disabled={isLocked}
                        className={`px-6 py-2.5 rounded-xl font-black italic text-xs uppercase tracking-wider transition ${
                          isLocked
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-rose-500 to-cyan-400 text-white hover:brightness-110 shadow-lg cursor-pointer -skew-x-6'
                        }`}
                      >
                        {isLocked ? `REQ: ${stage.reqRep} REP` : isCompleted ? 'REPLAY' : 'CHALLENGE BOSS'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 4: RACE SETUP */}
      {screen === 'race_setup' && (
        <div className="w-full h-[calc(100vh-64px)] p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-black italic text-white">CUSTOM RACE MODES</h2>
              <p className="text-xs text-slate-400">Select circuit, game rules, and AI difficulty.</p>
            </div>

            {/* Track Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TRACKS.map(tr => (
                <div
                  key={tr.id}
                  onClick={() => setSelectedTrackId(tr.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    selectedTrackId === tr.id
                      ? 'bg-gradient-to-b from-cyan-500/20 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-400/20'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-rose-400 uppercase">{tr.kanji}</span>
                    <span className="text-[10px] font-bold text-slate-400">{tr.lengthKm}</span>
                  </div>
                  <h3 className="text-base font-black italic text-white">{tr.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{tr.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Mode & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase">GAME MODE</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'quick', label: 'Circuit Race' },
                    { id: 'drift', label: 'Drift Trial' },
                    { id: 'time_attack', label: 'Time Attack' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setGameMode(m.id as any)}
                      className={`py-2 rounded-xl text-xs font-black uppercase transition ${
                        gameMode === m.id ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase">AI DIFFICULTY</span>
                <div className="grid grid-cols-3 gap-2">
                  {['easy', 'normal', 'hard'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d as any)}
                      className={`py-2 rounded-xl text-xs font-black uppercase transition ${
                        difficulty === d ? 'bg-rose-500 text-white font-black' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => launchRace({ mode: gameMode, trackId: selectedTrackId, difficulty })}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-600 to-cyan-400 text-white font-black italic text-lg tracking-wider uppercase shadow-xl shadow-rose-500/30 cursor-pointer -skew-x-6"
            >
              IGNITE RACE NOW
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: ACTIVE RACING & HUD */}
      {screen === 'racing' && (
        <div className="relative w-full h-full overflow-hidden select-none touch-none">
          <div ref={raceCanvasRef} className="w-full h-full" />

          {/* Countdown Display */}
          {hud.countdown >= 0 && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <span className="text-8xl md:text-9xl font-black italic tracking-wider text-rose-400 drop-shadow-[0_0_35px_rgba(255,30,86,0.9)] animate-ping">
                {hud.countdown === 0 ? 'GO!' : hud.countdown}
              </span>
            </div>
          )}

          {/* Portrait Advisory Banner on Mobile */}
          {isPortrait && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/80 backdrop-blur-md flex items-center gap-2 text-xs font-bold text-amber-300 shadow-xl pointer-events-auto">
              <span>🔄 Rotate phone to landscape for best arcade experience</span>
              <button onClick={() => setIsPortrait(false)} className="text-slate-400 hover:text-white ml-1 font-black">✕</button>
            </div>
          )}

          {/* Top Race Telemetry Bar & Action Buttons */}
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 flex justify-between items-start pointer-events-none">
            {/* Position & Laps */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900/90 border border-cyan-400/50 backdrop-blur-md">
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">POS</div>
                <div className="text-xl sm:text-2xl font-black italic text-cyan-300 leading-none">
                  #{hud.position} <span className="text-xs text-slate-400 font-normal">/ {hud.totalRacers}</span>
                </div>
              </div>

              <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900/90 border border-cyan-400/50 backdrop-blur-md">
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">LAP</div>
                <div className="text-xl sm:text-2xl font-black italic text-white leading-none">
                  {hud.lap} <span className="text-xs text-slate-400 font-normal">/ {hud.totalLaps}</span>
                </div>
              </div>
            </div>

            {/* Lap Time & Mobile Quick Actions */}
            <div className="flex items-start gap-2">
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900/90 border border-cyan-400/50 backdrop-blur-md text-right">
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">TIME</div>
                <div className="text-base sm:text-xl font-black text-white leading-none">{formatRaceTime(hud.lapTime)}</div>
                {hud.bestLapTime && (
                  <div className="text-[9px] sm:text-[10px] font-bold text-amber-300 mt-0.5">BEST: {formatRaceTime(hud.bestLapTime)}</div>
                )}
              </div>

              {/* Quick Action Buttons (Cam, Reset, Exit) */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  onClick={() => setCameraMode(prev => (prev + 1) % 3)}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 border border-cyan-400/60 active:bg-cyan-400 active:text-slate-950 text-cyan-300 font-black text-xs uppercase shadow-lg backdrop-blur-md flex items-center gap-1"
                  title="Switch Camera View"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">CAM</span>
                </button>

                <button
                  onClick={() => { inputRef.current.reset = true; }}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 border border-amber-400/60 active:bg-amber-400 active:text-slate-950 text-amber-300 font-black text-xs uppercase shadow-lg backdrop-blur-md flex items-center gap-1"
                  title="Reset Car"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">RESET</span>
                </button>

                <button
                  onClick={() => setScreen('menu')}
                  className="px-2.5 py-2 rounded-xl bg-slate-900/90 border border-rose-500/60 active:bg-rose-500 text-rose-300 font-black text-xs uppercase shadow-lg backdrop-blur-md"
                  title="Exit Race"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Center Drift Score Combo Banner */}
          {hud.currentDriftScore > 0 && (
            <div className="absolute top-18 sm:top-20 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none animate-pulse">
              <div className="text-2xl sm:text-5xl font-black italic bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-400 bg-clip-text text-transparent">
                +{hud.currentDriftScore.toLocaleString()} PTS
              </div>
              <div className="text-[10px] sm:text-sm font-black italic text-cyan-300 uppercase tracking-widest">
                DRIFT COMBO x{hud.driftMultiplier}
              </div>
            </div>
          )}

          {/* Minimap SVG (Top-Right under telemetry bar to never block thumb controls) */}
          <div className="absolute top-18 sm:top-20 right-3 sm:right-4 z-20 w-24 h-24 sm:w-32 sm:h-32 bg-slate-950/80 border border-cyan-400/40 rounded-2xl p-1 pointer-events-none backdrop-blur-md shadow-lg">
            <svg viewBox="0 0 160 160" className="w-full h-full">
              <path d={minimapData.d} fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
              {hud.minimapCars.map(c => {
                const coord = minimapData.toSvg(c.x, c.z);
                return (
                  <circle
                    key={c.id}
                    cx={coord.cx}
                    cy={coord.cy}
                    r={c.isPlayer ? 5 : 3.5}
                    fill={c.isPlayer ? '#00f0ff' : '#ff007f'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>

          {/* Digital Tachometer & Nitrous Gauge (Centered Bottom - Clean between thumbs) */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-900/85 border border-cyan-400/50 backdrop-blur-md flex items-center gap-3 sm:gap-5 shadow-2xl">
              <div>
                <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-none">KPH</div>
                <div className="text-2xl sm:text-4xl font-black italic text-cyan-300 leading-none">{hud.speedKph}</div>
              </div>
              <div>
                <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-none">GEAR</div>
                <div className="text-xl sm:text-3xl font-black italic text-rose-400 leading-none">{hud.gear}</div>
              </div>

              {/* Nitro Bar */}
              <div className="w-16 sm:w-24">
                <div className="flex justify-between text-[8px] sm:text-[9px] font-black uppercase text-slate-400 mb-0.5">
                  <span>N₂O</span>
                  <span className={hud.isNitro ? 'text-cyan-300 animate-pulse' : 'text-slate-300'}>{hud.nitro}%</span>
                </div>
                <div className="w-full h-1 sm:h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full ${hud.isNitro ? 'bg-fuchsia-400 animate-pulse' : 'bg-cyan-400'} transition-all`}
                    style={{ width: `${hud.nitro}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* ERGONOMIC MOBILE TOUCH CONTROLS (TWO-THUMB CONSOLE GAMEPAD)      */}
          {/* ================================================================ */}
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
            {/* Drift Button */}
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

            {/* Nitro Boost Button */}
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

            {/* Brake / Reverse Pedal */}
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

            {/* Accelerate / Gas Pedal */}
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

      {/* SCREEN 6: RACE RESULTS */}
      {screen === 'results' && raceResult && (
        <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900/95 border-2 border-cyan-400/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                EVENT COMPLETE // {currentTrackSpec.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-black italic mt-1 bg-gradient-to-r from-white via-cyan-300 to-rose-400 bg-clip-text text-transparent">
                {raceResult.rank === 1 ? '1ST PLACE VICTORY!' : `FINISHED #${raceResult.rank}`}
              </h1>
            </div>

            {/* Rewards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400">TOTAL TIME</div>
                <div className="text-base font-black text-white mt-0.5">{formatRaceTime(raceResult.totalTime)}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400">DRIFT SCORE</div>
                <div className="text-base font-black text-rose-400 mt-0.5">{raceResult.driftScore.toLocaleString()} PTS</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-400/40 text-center">
                <div className="text-[10px] font-bold text-cyan-300">CREDITS EARNED</div>
                <div className="text-base font-black text-cyan-300 mt-0.5">+{raceResult.earnedCr.toLocaleString()} CR</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-400/40 text-center">
                <div className="text-[10px] font-bold text-amber-300">TOKENS & XP</div>
                <div className="text-base font-black text-amber-300 mt-0.5">+{raceResult.earnedTokens} NT • +{raceResult.earnedXp} XP</div>
              </div>
            </div>

            {/* Standings Table */}
            <div className="space-y-2">
              {raceResult.standings.map((st: any) => (
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

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => launchRace({ mode: gameMode, trackId: selectedTrackId, difficulty, careerStage: activeCareerStage })}
                className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-black italic text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> REMATCH
              </button>
              <button
                onClick={() => setScreen('garage')}
                className="flex-1 py-3.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 font-black italic text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wrench className="w-4 h-4" /> UPGRADE IN GARAGE
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black italic text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                MAIN HUB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F2P Modals */}
      {showDailyModal && (
        <DailyRewardsModal
          streak={saveData.dailyStreak}
          lastClaimTimestamp={saveData.lastDailyClaimTimestamp}
          onClaim={handleClaimDaily}
          onClose={() => setShowDailyModal(false)}
        />
      )}

      {showCrateModal && (
        <CrateModal
          credits={saveData.credits}
          tokens={saveData.tokens}
          lastFreeCrateTimestamp={saveData.lastFreeCrateTimestamp}
          onOpenCrate={handleOpenCrate}
          onClose={() => setShowCrateModal(false)}
        />
      )}

      {showPassModal && (
        <StreetPassModal
          passXp={saveData.passXp}
          hasVipPass={saveData.hasVipPass}
          tokens={saveData.tokens}
          claimedFreeTiers={saveData.claimedFreePassTiers}
          claimedVipTiers={saveData.claimedVipPassTiers}
          onClaimTier={handleClaimPassTier}
          onBuyVipPass={handleBuyVipPass}
          onClose={() => setShowPassModal(false)}
        />
      )}

      {showMissionsModal && (
        <MissionsModal
          missionsData={saveData.missions}
          onClaimMission={handleClaimMission}
          onClose={() => setShowMissionsModal(false)}
        />
      )}

      {showControlsModal && (
        <ControlsModal onClose={() => setShowControlsModal(false)} />
      )}
    </div>
  );
}

