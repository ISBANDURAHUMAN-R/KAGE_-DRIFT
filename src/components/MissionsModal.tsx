import React, { useState } from 'react';
import { Target, Trophy, Check, Zap, X } from 'lucide-react';
import { MISSIONS_LIST } from '../data/gameData';
import { soundEngine } from '../audio/SoundEngine';

interface MissionsModalProps {
  missionsData: Record<string, { current: number; claimed: boolean }>;
  onClaimMission: (id: string, rewardCr: number, rewardTokens: number, rewardXp: number) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missionsData,
  onClaimMission,
  onClose,
}) => {
  const [tab, setTab] = useState<'daily' | 'lifetime'>('daily');

  const filtered = MISSIONS_LIST.filter(m => (tab === 'daily' ? m.isDaily : !m.isDaily));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-3xl w-full h-[85vh] bg-[#090b1f] border-2 border-cyan-400/50 rounded-3xl p-6 md:p-8 shadow-2xl relative flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg -skew-x-12">
              <Target className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black italic tracking-wide text-white">BOUNTIES & ACHIEVEMENTS</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-bold">
                  REWARDS VAULT
                </span>
              </div>
              <p className="text-xs text-slate-400">Complete racing challenges to collect credits, tokens and level XP.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 my-4">
          <button
            onClick={() => setTab('daily')}
            className={`flex-1 py-2.5 rounded-xl font-black italic text-xs tracking-wider uppercase transition ${
              tab === 'daily'
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            DAILY BOUNTIES
          </button>
          <button
            onClick={() => setTab('lifetime')}
            className={`flex-1 py-2.5 rounded-xl font-black italic text-xs tracking-wider uppercase transition ${
              tab === 'lifetime'
                ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 shadow-md shadow-amber-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            LIFETIME ACHIEVEMENTS
          </button>
        </div>

        {/* Missions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {filtered.map(m => {
            const state = missionsData[m.id] || { current: 0, claimed: false };
            const progress = Math.min(state.current, m.target);
            const percent = Math.min(100, Math.round((progress / m.target) * 100));
            const isCompleted = state.current >= m.target;
            const isClaimed = state.claimed;

            return (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-cyan-300" />
                    <h4 className="text-sm font-black text-white">{m.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{m.desc}</p>

                  {/* Progress Bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {progress.toLocaleString()} / {m.target.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                </div>

                {/* Rewards & Claim Button */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-xs font-black text-white">+{m.rewardCr.toLocaleString()} CR</div>
                    <div className="text-[10px] font-bold text-cyan-300 flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" /> +{m.rewardTokens} NT
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playLevelUp();
                      onClaimMission(m.id, m.rewardCr, m.rewardTokens, m.rewardXp);
                    }}
                    disabled={!isCompleted || isClaimed}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
                      isClaimed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                        : isCompleted
                        ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-400/30 cursor-pointer animate-pulse'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {isClaimed ? (
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> CLAIMED</span>
                    ) : isCompleted ? (
                      'CLAIM'
                    ) : (
                      'IN PROGRESS'
                    )}
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

