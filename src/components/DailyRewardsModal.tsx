import React from 'react';
import { Calendar, Check, Gift, Crown, Zap, Sparkles, X } from 'lucide-react';
import { DAILY_REWARDS } from '../data/gameData';
import { soundEngine } from '../audio/SoundEngine';

interface DailyRewardsModalProps {
  streak: number;
  lastClaimTimestamp: number;
  onClaim: () => void;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  streak,
  lastClaimTimestamp,
  onClaim,
  onClose,
}) => {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const timeSinceLastClaim = now - lastClaimTimestamp;
  const canClaim = timeSinceLastClaim >= ONE_DAY_MS || lastClaimTimestamp === 0;

  // Next claimable day is streak + 1 (cycling 1..7)
  const nextDay = (streak % 7) + 1;

  const handleClaimClick = () => {
    soundEngine.playLevelUp();
    onClaim();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-3xl w-full max-h-[92vh] overflow-y-auto bg-[#0a0d24] border-2 border-cyan-400/60 rounded-3xl p-5 md:p-8 shadow-2xl relative">
        {/* Neon Background Accents */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg -skew-x-12">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black italic tracking-wide text-white">7-DAY STREET STREAK</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                  DAY {Math.min(streak, 7)} / 7
                </span>
              </div>
              <p className="text-xs text-cyan-300/80">Log in every 24 hours to unlock exclusive tuning parts & the S-Class SHINOBI GT!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 my-6">
          {DAILY_REWARDS.map(item => {
            const isClaimed = streak >= item.day;
            const isCurrent = item.day === nextDay && canClaim;
            const isUpcoming = item.day > streak && !isCurrent;
            const isDay7 = item.day === 7;

            return (
              <div
                key={item.day}
                className={`relative p-3.5 rounded-2xl flex flex-col items-center text-center transition-all border ${isClaimed
                  ? 'bg-slate-950/60 border-slate-800 opacity-70'
                  : isCurrent
                    ? 'bg-gradient-to-b from-cyan-500/30 to-purple-600/30 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                    : isDay7
                      ? 'bg-gradient-to-b from-amber-500/20 to-rose-600/20 border-amber-400/50'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
              >
                {/* Header Tag */}
                <span className={`text-[10px] font-black tracking-wider uppercase mb-2 ${isDay7 ? 'text-amber-400 font-extrabold' : 'text-slate-400'}`}>
                  DAY {item.day}
                </span>

                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center my-1 ${isDay7
                  ? 'bg-gradient-to-br from-amber-400 to-rose-500 text-slate-950 shadow-md'
                  : item.type === 'tokens'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : item.type === 'cosmetic'
                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}>
                  {isClaimed ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : isDay7 ? (
                    <Crown className="w-6 h-6 animate-bounce" />
                  ) : item.type === 'tokens' ? (
                    <Zap className="w-5 h-5" />
                  ) : item.type === 'cosmetic' ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <Gift className="w-5 h-5" />
                  )}
                </div>

                {/* Amount / Reward Name */}
                <div className="mt-2 min-h-[38px] flex flex-col justify-center">
                  <div className="text-xs font-black text-white leading-tight">
                    {item.amount ? (
                      item.type === 'credits' ? `+${item.amount.toLocaleString()} CR` : `+${item.amount} NT`
                    ) : (
                      item.title.split(': ')[1] || item.title
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-2 text-[9px] font-black uppercase">
                  {isClaimed ? (
                    <span className="text-emerald-400">CLAIMED</span>
                  ) : isCurrent ? (
                    <span className="text-cyan-300 animate-pulse">READY!</span>
                  ) : (
                    <span className="text-slate-500">LOCKED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button & Timer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-cyan-500/20">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            {canClaim ? (
              <span className="text-cyan-300 font-bold">✨ Day {nextDay} reward is ready to be collected right now!</span>
            ) : (
              <span>Next daily drop available in approximately {Math.ceil((ONE_DAY_MS - timeSinceLastClaim) / (1000 * 60 * 60))} hours.</span>
            )}
          </div>

          <button
            onClick={handleClaimClick}
            disabled={!canClaim}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black italic text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl transition-all -skew-x-6 ${canClaim
              ? 'bg-gradient-to-r from-cyan-400 via-rose-500 to-amber-400 text-slate-950 hover:brightness-110 shadow-rose-500/30 cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
          >
            <Gift className="w-4 h-4" />
            {canClaim ? `CLAIM DAY ${nextDay} REWARD` : 'ALREADY CLAIMED TODAY'}
          </button>
        </div>
      </div>
    </div>
  );
};

