export type BodyStyle = 'coupe' | 'tuner' | 'muscle' | 'drift' | 'super' | 'hyper';

export interface Vehicle {
  id: string;
  name: string;
  subtitle: string;
  kanji: string;
  classTag: string;
  cost: number;
  tokenCost?: number; // Premium NT price or null for credit purchase
  baseStats: {
    speed: number;
    accel: number;
    handling: number;
    drift: number;
  };
  defaultPaint: string;
  defaultGlow: string;
  bodyStyle: BodyStyle;
  description: string;
  isVipExclusive?: boolean;
}

export interface PresetColor {
  id: string;
  name: string;
  hex: string;
  emissive?: string;
  tokenCost?: number;
}

export interface LiveryPreset {
  id: string;
  name: string;
  subtitle: string;
  type: 'none' | 'stripes' | 'kansei' | 'police' | 'sakura' | 'grid';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  tokenCost: number;
}

export interface FlameColor {
  id: string;
  name: string;
  hex: string;
  tokenCost: number;
}

export interface UpgradeType {
  id: 'engine' | 'turbo' | 'brakes' | 'tires';
  name: string;
  stat: 'speed' | 'accel' | 'handling' | 'drift';
  baseCost: number;
  desc: string;
}

export interface TrackTheme {
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  roadColor: string;
  shoulderColor: string;
  barrierColor: string;
  groundColor: string;
  ambientLight: string;
  dirLight: string;
}

export interface TrackConfig {
  id: string;
  name: string;
  kanji: string;
  subtitle: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'FAST';
  lengthKm: string;
  theme: TrackTheme;
  controlPoints: [number, number, number][];
  sceneryType: 'city' | 'mountain' | 'coastal';
}

export interface AIRival {
  id: string;
  name: string;
  kanji: string;
  carId: string;
  paint: string;
  glow: string;
  personality: string;
  skillOffset: number;
  lanePref: number;
  quote: string;
}

export interface CareerStage {
  id: number;
  title: string;
  subtitle: string;
  trackId: string;
  mode: 'race' | 'drift' | 'outrun';
  difficulty: 'easy' | 'normal' | 'hard';
  rewardCr: number;
  rewardRep: number;
  rewardTokens: number;
  reqRep: number;
  boss: string;
  driftTarget?: number;
}

export interface DailyRewardDay {
  day: number;
  title: string;
  type: 'credits' | 'tokens' | 'cosmetic' | 'car';
  amount?: number;
  rewardId?: string;
  desc: string;
}

export interface CrateTier {
  id: 'common' | 'rare' | 'epic';
  name: string;
  kanji: string;
  desc: string;
  costCr?: number;
  costTokens?: number;
  freeIntervalHours?: number; // free timer e.g. 4 hrs
  color: string;
}

export interface CrateLootItem {
  id: string;
  name: string;
  type: 'credits' | 'tokens' | 'paint' | 'glow' | 'rim' | 'livery' | 'car';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  amount?: number;
  targetId?: string;
  desc: string;
}

export interface BattlePassTier {
  tier: number;
  reqXp: number;
  freeReward: {
    title: string;
    type: 'credits' | 'tokens' | 'cosmetic';
    amount?: number;
    id?: string;
  };
  vipReward: {
    title: string;
    type: 'credits' | 'tokens' | 'cosmetic' | 'car';
    amount?: number;
    id?: string;
  };
}

export interface Mission {
  id: string;
  title: string;
  desc: string;
  target: number;
  current: number;
  rewardCr: number;
  rewardTokens: number;
  rewardXp: number;
  isDaily: boolean;
  claimed: boolean;
}

export interface CarCustomization {
  paint: string;
  glow: string;
  rim: string;
  livery: string;
  flameColor: string;
  spoiler: boolean;
  upgrades: {
    engine: number;
    turbo: number;
    brakes: number;
    tires: number;
  };
}

export interface SaveData {
  credits: number;
  tokens: number;
  rep: number;
  level: number;
  xp: number;
  selectedCar: string;
  unlockedCars: string[];
  unlockedPaints: string[];
  unlockedGlows: string[];
  unlockedRims: string[];
  unlockedLiveries: string[];
  unlockedFlames: string[];
  completedCareer: number[];
  bestTimes: Record<string, number>;
  bestDriftScores: Record<string, number>;
  customizations: Record<string, CarCustomization>;
  // F2P Systems
  lastDailyClaimTimestamp: number;
  dailyStreak: number;
  lastFreeCrateTimestamp: number;
  cratesOpened: number;
  passXp: number;
  claimedFreePassTiers: number[];
  claimedVipPassTiers: number[];
  hasVipPass: boolean;
  missions: Record<string, { current: number; claimed: boolean }>;
  lifetimeStats: {
    racesWon: number;
    totalDriftPoints: number;
    totalSpeedKphRecord: number;
    totalNitroUsedSec: number;
  };
}

