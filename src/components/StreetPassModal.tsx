import React from 'react';
import { Crown, Check, Zap, Sparkles, X, Lock } from 'lucide-react';
import { BATTLE_PASS_TIERS } from '../data/gameData';
import { soundEngine } from '../audio/SoundEngine';

interface StreetPassModalProps {
  passXp: number;
  hasVipPass: boolean;
  tokens: number;
  claimedFreeTiers: number[];
  claimedVipTiers: number[];
  onClaimTier: (tier: number, isVip: boolean) => void;
  onBuyVipPass: () => void;
  onClose: () => void;
}

export const StreetPassModal: React.FC<StreetPassModalProps> = ({
  passXp,
  hasVipPass,
  tokens,
  claimedFreeTiers,
  claimedVipTiers,
  onClaimTier,
  onBuyVipPass,
  onClose,
}) => {
  const VIP_PASS_COST = 300; // 300 Neon Tokens

  const handleBuyVip = () => {
    if (tokens < VIP_PASS_COST || hasVipPass) return;
    soundEngine.playLevelUp();
    onBuyVipPass();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-4xl w-full h-[90vh] bg-[#090b1f] border-2 border-amber-400/60 rounded-3xl p-6 md:p-8 shadow-2xl relative flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shadow-lg -skew-x-12">
              <Crown className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black italic tracking-wide text-white">SEASON 1: TOKYO NIGHTS STREET PASS</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                  PASS XP: {passXp.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">Earn Season XP from races & drift combos to climb all 20 tiers!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIP Status Banner */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-cyan-500/20 border border-amber-400/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              VIP
            </div>
            <div>
              <div className="text-sm font-black text-white">
                {hasVipPass ? 'VIP STREET PASS ACTIVE' : 'UPGRADE TO VIP STREET PASS'}
              </div>
              <div className="text-xs text-slate-300">
                {hasVipPass
                  ? 'Double rewards unlocked! Tier 20 rewards include the Mythic CYBER DEVIL S-1.'
                  : `Unlock all gold VIP rewards across 20 tiers for only ${VIP_PASS_COST} Neon Tokens.`}
              </div>
            </div>
          </div>

          {!hasVipPass && (
            <button
              onClick={handleBuyVip}
              disabled={tokens < VIP_PASS_COST}
              className={`px-5 py-2.5 rounded-xl font-black italic text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg transition ${
                tokens >= VIP_PASS_COST
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 hover:brightness-110 shadow-amber-400/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4" /> UNLOCK VIP ({VIP_PASS_COST} NT)
            </button>
          )}
        </div>

        {/* Tiers List (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {BATTLE_PASS_TIERS.map(t => {
            const isUnlocked = passXp >= t.reqXp;
            const freeClaimed = claimedFreeTiers.includes(t.tier);
            const vipClaimed = claimedVipTiers.includes(t.tier);

            return (
              <div
                key={t.tier}
                className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                  isUnlocked
                    ? 'bg-slate-900/90 border-cyan-400/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                }`}
              >
                {/* Tier Number & Req XP */}
                <div className="flex items-center gap-4 min-w-[130px]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-lg ${
                    t.tier === 20 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40' : 'bg-slate-800 text-cyan-300'
                  }`}>
                    #{t.tier}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">TIER {t.tier}</div>
                    <div className="text-[10px] text-slate-400">{t.reqXp.toLocaleString()} XP</div>
                  </div>
                </div>

                {/* Free Reward */}
                <div className="flex-1 flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">FREE</span>
                    <span className="text-xs font-bold text-white">{t.freeReward.title}</span>
                  </div>
                  <button
                    onClick={() => {
                      soundEngine.playBeep(880, 0.1);
                      onClaimTier(t.tier, false);
                    }}
                    disabled={!isUnlocked || freeClaimed}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                      freeClaimed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                        : isUnlocked
                        ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {freeClaimed ? <Check className="w-3.5 h-3.5" /> : isUnlocked ? 'CLAIM' : 'LOCKED'}
                  </button>
                </div>

                {/* VIP Reward */}
                <div className="flex-1 flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-400/30 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase">VIP</span>
                    <span className="text-xs font-bold text-amber-200">{t.vipReward.title}</span>
                  </div>
                  <button
                    onClick={() => {
                      soundEngine.playBeep(920, 0.1);
                      onClaimTier(t.tier, true);
                    }}
                    disabled={!isUnlocked || !hasVipPass || vipClaimed}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                      vipClaimed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                        : isUnlocked && hasVipPass
                        ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 hover:brightness-110 shadow cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed flex items-center gap-1'
                    }`}
                  >
                    {vipClaimed ? <Check className="w-3.5 h-3.5" /> : isUnlocked && hasVipPass ? 'CLAIM VIP' : <Lock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

