import {
  Vehicle,
  PresetColor,
  LiveryPreset,
  FlameColor,
  UpgradeType,
  TrackConfig,
  AIRival,
  CareerStage,
  DailyRewardDay,
  CrateTier,
  BattlePassTier,
  Mission,
  SaveData
} from '../types/game';

export const STORAGE_KEY = 'NEON_DRIFT_SAVE_V3_F2P';

export const PAINT_PRESETS: PresetColor[] = [
  { id: 'crimson', name: 'Cyber Crimson', hex: '#ff1e56', emissive: '#ff0040' },
  { id: 'cyan', name: 'Neo Tokyo Cyan', hex: '#00f0ff', emissive: '#00c8ff' },
  { id: 'white', name: 'Akina White', hex: '#f4f6fb', emissive: '#38bdf8' },
  { id: 'purple', name: 'Midnight Purple', hex: '#8b5cf6', emissive: '#d946ef' },
  { id: 'gold', name: 'Raijin Gold', hex: '#fbbf24', emissive: '#f59e0b' },
  { id: 'lime', name: 'Acid Lime', hex: '#a3e635', emissive: '#4ade80' },
  { id: 'matte_black', name: 'Stealth Shadow', hex: '#18181b', emissive: '#27272a', tokenCost: 50 },
  { id: 'sakura_pink', name: 'Sakura Petal', hex: '#f472b6', emissive: '#fb7185', tokenCost: 75 },
];

export const UNDERGLOW_PRESETS: PresetColor[] = [
  { id: 'cyan', name: 'Cyber Cyan', hex: '#00f5ff' },
  { id: 'magenta', name: 'Tokyo Pink', hex: '#ff007f' },
  { id: 'lime', name: 'Nitro Lime', hex: '#39ff14' },
  { id: 'amber', name: 'Solar Gold', hex: '#ffaa00' },
  { id: 'violet', name: 'Phantom Violet', hex: '#a855f7' },
  { id: 'electric_blue', name: 'Tsunami Blue', hex: '#2563eb', tokenCost: 40 },
  { id: 'none', name: 'Off', hex: '#000000' },
];

export const RIM_PRESETS: PresetColor[] = [
  { id: 'chrome', name: 'Alloy Silver', hex: '#e2e8f0' },
  { id: 'gold', name: 'Work Gold', hex: '#facc15' },
  { id: 'cyan', name: 'Neon Rim Cyan', hex: '#00f0ff' },
  { id: 'crimson', name: 'Redline Racing', hex: '#fb7185' },
  { id: 'stealth', name: 'Carbon Matte', hex: '#334155' },
  { id: 'titanium', name: 'Burnt Titanium', hex: '#6366f1', tokenCost: 45 },
];

export const LIVERY_PRESETS: LiveryPreset[] = [
  { id: 'none', name: 'Pure Clean Body', subtitle: 'Factory OEM Finish', type: 'none', rarity: 'Common', tokenCost: 0 },
  { id: 'stripes', name: 'Twin Cyber Stripes', subtitle: 'Dual high-contrast neon center racing bands', type: 'stripes', rarity: 'Common', tokenCost: 30 },
  { id: 'kansei', name: 'Kansei Dorifuto', subtitle: 'Kanji graphics & Touge speed stickers', type: 'kansei', rarity: 'Rare', tokenCost: 60 },
  { id: 'grid', name: 'Synthwave Matrix', subtitle: '80s retro cyber grid lines across rear quarter', type: 'grid', rarity: 'Rare', tokenCost: 80 },
  { id: 'police', name: 'Tokyo Interceptor', subtitle: 'Kanji Highway Patrol livery with strobe accents', type: 'police', rarity: 'Epic', tokenCost: 120 },
  { id: 'sakura', name: 'Sakura Blossom', subtitle: 'Floating cherry blossom petals across the hood', type: 'sakura', rarity: 'Legendary', tokenCost: 180 },
];

export const FLAME_PRESETS: FlameColor[] = [
  { id: 'cyan', name: 'Cyber Blue Plasma', hex: '#00f0ff', tokenCost: 0 },
  { id: 'pink', name: 'Tokyo Neon Pink', hex: '#ff007f', tokenCost: 35 },
  { id: 'green', name: 'Emerald Nitro Burst', hex: '#39ff14', tokenCost: 50 },
  { id: 'orange', name: 'Solar Flare Heat', hex: '#ff5500', tokenCost: 50 },
  { id: 'purple', name: 'Void Violet Beam', hex: '#a855f7', tokenCost: 70 },
];

export const UPGRADE_TYPES: UpgradeType[] = [
  { id: 'engine', name: 'Engine Block', stat: 'speed', baseCost: 800, desc: '+3 Top Speed per stage' },
  { id: 'turbo', name: 'Twin Turbo', stat: 'accel', baseCost: 800, desc: '+3 Acceleration & N2O power' },
  { id: 'brakes', name: 'Carbon Brakes', stat: 'handling', baseCost: 700, desc: '+3 Cornering & Braking grip' },
  { id: 'tires', name: 'Drift Compound', stat: 'drift', baseCost: 750, desc: '+3 Drift control & multiplier' }
];

export const VEHICLES: Vehicle[] = [
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
    id: 'shinobi',
    name: 'SHINOBI GT',
    subtitle: 'Day 7 Login / Underground Ninja Special',
    kanji: '忍 SHINOBI',
    classTag: 'S-CLASS NINJA',
    cost: 0,
    tokenCost: 250,
    baseStats: { speed: 93, accel: 92, handling: 89, drift: 91 },
    defaultPaint: 'matte_black',
    defaultGlow: 'lime',
    bodyStyle: 'tuner',
    description: 'Midnight stealth weapon equipped with active titanium aero diffusers and instant twin-boost response.'
  },
  {
    id: 'devil',
    name: 'CYBER DEVIL S-1',
    subtitle: 'Season 1 Pass Tier 20 Exclusive',
    kanji: '悪魔 DEVIL',
    classTag: 'X-CLASS VIP',
    cost: 0,
    tokenCost: 400,
    isVipExclusive: true,
    baseStats: { speed: 97, accel: 95, handling: 91, drift: 92 },
    defaultPaint: 'crimson',
    defaultGlow: 'magenta',
    bodyStyle: 'super',
    description: 'Street Pass final tier prototype with dark chrome accents and twin plasma turbine exhaust.'
  },
  {
    id: 'void',
    name: 'VOID ZERO',
    subtitle: 'Endgame Anime Hypercar',
    kanji: '零式 VOID',
    classTag: 'X-CLASS HYPER',
    cost: 25000,
    tokenCost: 500,
    baseStats: { speed: 99, accel: 96, handling: 92, drift: 90 },
    defaultPaint: 'lime',
    defaultGlow: 'lime',
    bodyStyle: 'hyper',
    description: 'Experimental zero-gravity Ground Effect hyper-machine. The undisputed apex of NEON DRIFT.'
  }
];

export const TRACKS: TrackConfig[] = [
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

export const AI_RIVALS: AIRival[] = [
  { id: 'r1', name: 'KENJI "KAGE" SATO', kanji: '佐藤 影', carId: 'raijin', paint: 'crimson', glow: 'cyan', personality: 'Apex Hunter', skillOffset: 0.98, lanePref: -3.5, quote: 'You think your tires can hold my line in the neon rain?' },
  { id: 'r2', name: 'REINA TAKAHASHI', kanji: '高橋 玲奈', carId: 'yuki', paint: 'white', glow: 'magenta', personality: 'Touge Queen', skillOffset: 0.95, lanePref: 3.2, quote: 'Show me a real four-wheel drift on the outside hairpin!' },
  { id: 'r3', name: 'DAIKI "BLITZ" MORI', kanji: '森 大輝', carId: 'shadow', paint: 'purple', glow: 'violet', personality: 'Wangan Demon', skillOffset: 0.92, lanePref: -1.8, quote: 'Once my twin-turbos spool on the straight, you are history.' },
  { id: 'r4', name: 'SORA HAYASHI', kanji: '林 空', carId: 'kaze', paint: 'cyan', glow: 'lime', personality: 'Late Braker', skillOffset: 0.89, lanePref: 2.0, quote: 'Braking is optional when you trust the downforce!' },
  { id: 'r5', name: 'RYUJI KUROSAWA', kanji: '黒沢 竜二', carId: 'void', paint: 'gold', glow: 'amber', personality: 'Cyber Boss', skillOffset: 1.01, lanePref: 0.8, quote: 'Welcome to Neon Drift. Try to keep my taillights in sight.' }
];

export const CAREER_STAGES: CareerStage[] = [
  { id: 1, title: 'STAGE 01 // ROOKIE IGNITION', subtitle: 'Shibuya Midnight Sprint', trackId: 'tokyo', mode: 'race', difficulty: 'easy', rewardCr: 2000, rewardRep: 250, rewardTokens: 25, reqRep: 0, boss: 'SORA HAYASHI' },
  { id: 2, title: 'STAGE 02 // SAKURA SLIDE', subtitle: 'Akina Touge Drift Trial (Target: 4,500 PTS)', trackId: 'akina', mode: 'drift', driftTarget: 4500, difficulty: 'normal', rewardCr: 3000, rewardRep: 400, rewardTokens: 40, reqRep: 200, boss: 'REINA TAKAHASHI' },
  { id: 3, title: 'STAGE 03 // BAYSHORE SONIC', subtitle: 'Wangan 300KPH Showdown', trackId: 'coastal', mode: 'race', difficulty: 'normal', rewardCr: 4500, rewardRep: 650, rewardTokens: 60, reqRep: 500, boss: 'DAIKI "BLITZ" MORI' },
  { id: 4, title: 'STAGE 04 // CYBER RAIN DUEL', subtitle: 'Tokyo Neon Pro Circuit', trackId: 'tokyo', mode: 'race', difficulty: 'hard', rewardCr: 6500, rewardRep: 1000, rewardTokens: 80, reqRep: 1000, boss: 'KENJI "KAGE" SATO' },
  { id: 5, title: 'STAGE 05 // EMPEROR OF AKINA', subtitle: 'Grand Touge Final Championship', trackId: 'akina', mode: 'race', difficulty: 'hard', rewardCr: 12000, rewardRep: 2000, rewardTokens: 150, reqRep: 1800, boss: 'RYUJI KUROSAWA' }
];

// F2P 7-Day Login Calendar
export const DAILY_REWARDS: DailyRewardDay[] = [
  { day: 1, title: 'Day 1: Rookie Bonus', type: 'credits', amount: 2500, desc: '+2,500 Credits to start tuning your starter car.' },
  { day: 2, title: 'Day 2: Neon Supply', type: 'tokens', amount: 50, desc: '+50 Neon Tokens for premium crates & cosmetics.' },
  { day: 3, title: 'Day 3: Tokyo Glow', type: 'cosmetic', rewardId: 'magenta', desc: 'Unlock Exclusive "Tokyo Pink" Neon Underglow.' },
  { day: 4, title: 'Day 4: Turbo Jackpot', type: 'credits', amount: 6000, desc: '+6,000 Credits to supercharge your engine!' },
  { day: 5, title: 'Day 5: Syndicate Stash', type: 'tokens', amount: 100, desc: '+100 Neon Tokens.' },
  { day: 6, title: 'Day 6: Kansei Decal', type: 'cosmetic', rewardId: 'kansei', desc: 'Unlock Rare "Kansei Dorifuto" Touge Livery.' },
  { day: 7, title: 'Day 7: SHINOBI GT UNLOCK!', type: 'car', rewardId: 'shinobi', amount: 150, desc: 'CLAIM S-CLASS "SHINOBI GT" + 150 Neon Tokens!' },
];

// F2P Underground Crates (Gacha)
export const CRATE_TIERS: CrateTier[] = [
  { id: 'common', name: 'STREET TUNER CRATE', kanji: '街頭補給箱', desc: 'Contains tuning credits, basic rims & common colors. Free every 4 hours!', costCr: 1500, freeIntervalHours: 4, color: '#38bdf8' },
  { id: 'rare', name: 'NEON SYNDICATE CRATE', kanji: '電脳闇箱', desc: 'High chance of rare neon underglows, performance blueprints, and token jackpots.', costTokens: 60, color: '#a855f7' },
  { id: 'epic', name: 'MIDNIGHT CYBER CRATE', kanji: '夜行伝説箱', desc: 'Guaranteed Epic or Legendary loot! Exclusive anime hypercars, plasma flames & mythic liveries.', costTokens: 160, color: '#fbbf24' }
];

// 20-Tier Season 1 Battle Pass
export const BATTLE_PASS_TIERS: BattlePassTier[] = [
  { tier: 1, reqXp: 100, freeReward: { title: '1,000 CR', type: 'credits', amount: 1000 }, vipReward: { title: '50 Tokens', type: 'tokens', amount: 50 } },
  { tier: 2, reqXp: 250, freeReward: { title: '20 Tokens', type: 'tokens', amount: 20 }, vipReward: { title: 'Tsunami Blue Glow', type: 'cosmetic', id: 'electric_blue' } },
  { tier: 3, reqXp: 450, freeReward: { title: '2,000 CR', type: 'credits', amount: 2000 }, vipReward: { title: 'Twin Cyber Stripes', type: 'cosmetic', id: 'stripes' } },
  { tier: 4, reqXp: 700, freeReward: { title: 'Alloy Silver Rims', type: 'cosmetic', id: 'chrome' }, vipReward: { title: '40 Tokens', type: 'tokens', amount: 40 } },
  { tier: 5, reqXp: 1000, freeReward: { title: '3,000 CR', type: 'credits', amount: 3000 }, vipReward: { title: 'Emerald Nitro Flame', type: 'cosmetic', id: 'green' } },
  { tier: 6, reqXp: 1350, freeReward: { title: '35 Tokens', type: 'tokens', amount: 35 }, vipReward: { title: 'Burnt Titanium Rims', type: 'cosmetic', id: 'titanium' } },
  { tier: 7, reqXp: 1750, freeReward: { title: '4,000 CR', type: 'credits', amount: 4000 }, vipReward: { title: '60 Tokens', type: 'tokens', amount: 60 } },
  { tier: 8, reqXp: 2200, freeReward: { title: 'Acid Lime Paint', type: 'cosmetic', id: 'lime' }, vipReward: { title: 'Synthwave Matrix Livery', type: 'cosmetic', id: 'grid' } },
  { tier: 9, reqXp: 2700, freeReward: { title: '5,000 CR', type: 'credits', amount: 5000 }, vipReward: { title: '75 Tokens', type: 'tokens', amount: 75 } },
  { tier: 10, reqXp: 3300, freeReward: { title: '50 Tokens', type: 'tokens', amount: 50 }, vipReward: { title: 'Solar Flare Exhaust', type: 'cosmetic', id: 'orange' } },
  { tier: 11, reqXp: 3950, freeReward: { title: '6,000 CR', type: 'credits', amount: 6000 }, vipReward: { title: 'Stealth Shadow Paint', type: 'cosmetic', id: 'matte_black' } },
  { tier: 12, reqXp: 4650, freeReward: { title: '60 Tokens', type: 'tokens', amount: 60 }, vipReward: { title: 'Tokyo Interceptor Livery', type: 'cosmetic', id: 'police' } },
  { tier: 13, reqXp: 5400, freeReward: { title: '7,000 CR', type: 'credits', amount: 7000 }, vipReward: { title: '100 Tokens', type: 'tokens', amount: 100 } },
  { tier: 14, reqXp: 6200, freeReward: { title: '75 Tokens', type: 'tokens', amount: 75 }, vipReward: { title: 'Void Violet Flame', type: 'cosmetic', id: 'purple' } },
  { tier: 15, reqXp: 7100, freeReward: { title: '8,000 CR', type: 'credits', amount: 8000 }, vipReward: { title: 'Sakura Petal Paint', type: 'cosmetic', id: 'sakura_pink' } },
  { tier: 16, reqXp: 8100, freeReward: { title: '90 Tokens', type: 'tokens', amount: 90 }, vipReward: { title: '120 Tokens', type: 'tokens', amount: 120 } },
  { tier: 17, reqXp: 9200, freeReward: { title: '10,000 CR', type: 'credits', amount: 10000 }, vipReward: { title: 'Sakura Blossom Livery', type: 'cosmetic', id: 'sakura' } },
  { tier: 18, reqXp: 10400, freeReward: { title: '120 Tokens', type: 'tokens', amount: 120 }, vipReward: { title: '150 Tokens', type: 'tokens', amount: 150 } },
  { tier: 19, reqXp: 11800, freeReward: { title: '15,000 CR', type: 'credits', amount: 15000 }, vipReward: { title: '200 Tokens', type: 'tokens', amount: 200 } },
  { tier: 20, reqXp: 13500, freeReward: { title: '250 Tokens', type: 'tokens', amount: 250 }, vipReward: { title: 'MYTHIC CAR: CYBER DEVIL S-1', type: 'car', id: 'devil' } },
];

export const MISSIONS_LIST: Omit<Mission, 'current' | 'claimed'>[] = [
  // Daily Bounties
  { id: 'daily_drift', title: 'TOUGE DRIFT MASTER', desc: 'Score 12,000 cumulative drift points in any mode', target: 12000, rewardCr: 2500, rewardTokens: 25, rewardXp: 180, isDaily: true },
  { id: 'daily_speed', title: 'SONIC WANGAN', desc: 'Reach 275+ KPH speed during active racing', target: 275, rewardCr: 2000, rewardTokens: 20, rewardXp: 150, isDaily: true },
  { id: 'daily_nitro', title: 'NITRO MANIAC', desc: 'Burn 45 total seconds of hyper nitro boost', target: 45, rewardCr: 2200, rewardTokens: 20, rewardXp: 160, isDaily: true },
  { id: 'daily_wins', title: 'PODIUM DOMINATOR', desc: 'Win 1st place in 2 races', target: 2, rewardCr: 3500, rewardTokens: 35, rewardXp: 220, isDaily: true },
  // Lifetime Achievements
  { id: 'life_drift_100k', title: 'DRIFT GOD OF AKINA', desc: 'Reach 100,000 total lifetime drift points', target: 100000, rewardCr: 15000, rewardTokens: 150, rewardXp: 1000, isDaily: false },
  { id: 'life_wins_10', title: 'STREET APEX CHAMPION', desc: 'Win 10 total races across any game mode', target: 10, rewardCr: 12000, rewardTokens: 120, rewardXp: 850, isDaily: false },
  { id: 'life_speed_340', title: 'BREAKING THE SOUND BARRIER', desc: 'Hit 330+ KPH top speed with full upgrade & nitro', target: 330, rewardCr: 10000, rewardTokens: 100, rewardXp: 700, isDaily: false },
  { id: 'life_crates_5', title: 'UNDERGROUND COLLECTOR', desc: 'Open 5 lucky underground crates', target: 5, rewardCr: 8000, rewardTokens: 80, rewardXp: 500, isDaily: false },
];

export const INITIAL_SAVE: SaveData = {
  credits: 4000,
  tokens: 150,
  rep: 150,
  level: 1,
  xp: 0,
  selectedCar: 'akira',
  unlockedCars: ['akira'],
  unlockedPaints: ['crimson', 'cyan', 'white', 'purple', 'gold', 'lime'],
  unlockedGlows: ['cyan', 'magenta', 'lime', 'amber', 'violet', 'none'],
  unlockedRims: ['chrome', 'gold', 'cyan', 'crimson', 'stealth'],
  unlockedLiveries: ['none', 'stripes'],
  unlockedFlames: ['cyan'],
  completedCareer: [],
  bestTimes: {},
  bestDriftScores: {},
  customizations: {
    akira: { paint: 'crimson', glow: 'cyan', rim: 'chrome', livery: 'none', flameColor: 'cyan', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    kaze: { paint: 'cyan', glow: 'magenta', rim: 'gold', livery: 'none', flameColor: 'cyan', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    shadow: { paint: 'purple', glow: 'violet', rim: 'stealth', livery: 'none', flameColor: 'cyan', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    yuki: { paint: 'white', glow: 'cyan', rim: 'gold', livery: 'none', flameColor: 'cyan', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    raijin: { paint: 'gold', glow: 'amber', rim: 'cyan', livery: 'none', flameColor: 'cyan', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
    shinobi: { paint: 'matte_black', glow: 'lime', rim: 'stealth', livery: 'none', flameColor: 'green', spoiler: true, upgrades: { engine: 1, turbo: 1, brakes: 1, tires: 1 } },
    devil: { paint: 'crimson', glow: 'magenta', rim: 'titanium', livery: 'grid', flameColor: 'pink', spoiler: true, upgrades: { engine: 2, turbo: 2, brakes: 2, tires: 2 } },
    void: { paint: 'lime', glow: 'lime', rim: 'crimson', livery: 'none', flameColor: 'purple', spoiler: true, upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0 } },
  },
  lastDailyClaimTimestamp: 0,
  dailyStreak: 0,
  lastFreeCrateTimestamp: 0,
  cratesOpened: 0,
  passXp: 120,
  claimedFreePassTiers: [],
  claimedVipPassTiers: [],
  hasVipPass: false,
  missions: {
    daily_drift: { current: 0, claimed: false },
    daily_speed: { current: 0, claimed: false },
    daily_nitro: { current: 0, claimed: false },
    daily_wins: { current: 0, claimed: false },
    life_drift_100k: { current: 0, claimed: false },
    life_wins_10: { current: 0, claimed: false },
    life_speed_340: { current: 0, claimed: false },
    life_crates_5: { current: 0, claimed: false },
  },
  lifetimeStats: {
    racesWon: 0,
    totalDriftPoints: 0,
    totalSpeedKphRecord: 0,
    totalNitroUsedSec: 0,
  }
};

