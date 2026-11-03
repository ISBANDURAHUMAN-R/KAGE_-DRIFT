import React, { useState } from 'react';
import { Package, Sparkles, Zap, RotateCcw, X, Check, Award } from 'lucide-react';
import { CRATE_TIERS } from '../data/gameData';
import { CrateTier, CrateLootItem } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface CrateModalProps {
    credits: number;
    tokens: number;
    lastFreeCrateTimestamp: number;
    onOpenCrate: (tier: CrateTier, isFree: boolean) => CrateLootItem | null;
    onClose: () => void;
}

export const CrateModal: React.FC<CrateModalProps> = ({
    credits,
    tokens,
    lastFreeCrateTimestamp,
    onOpenCrate,
    onClose,
}) => {
    const [opening, setOpening] = useState(false);
    const [lootResult, setLootResult] = useState<CrateLootItem | null>(null);
    const [activeTier, setActiveTier] = useState<CrateTier | null>(null);

    const now = Date.now();
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    const timeSinceFree = now - lastFreeCrateTimestamp;
    const isFreeCommonAvailable = timeSinceFree >= FOUR_HOURS_MS || lastFreeCrateTimestamp === 0;

    const triggerOpen = (tier: CrateTier) => {
        const isFree = tier.id === 'common' && isFreeCommonAvailable;
        if (!isFree) {
            if (tier.costCr && credits < tier.costCr) return;
            if (tier.costTokens && tokens < tier.costTokens) return;
        }

        soundEngine.playBeep(700, 0.15, 'sawtooth');
        setActiveTier(tier);
        setOpening(true);
        setLootResult(null);

        // Dramatic unbox shake timing
        setTimeout(() => {
            const loot = onOpenCrate(tier, isFree);
            if (loot) {
                soundEngine.playUnboxFanfare(loot.rarity);
                setLootResult(loot);
            }
            setOpening(false);
        }, 1600);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-3xl w-full max-h-[92vh] overflow-y-auto bg-[#090b1f] border-2 border-cyan-400/50 rounded-3xl p-5 md:p-8 shadow-2xl relative">
                {/* Glow backdrop */}
                <div className="absolute top-0 right-1/4 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-cyan-500/30">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg -skew-x-12">
                            <Package className="w-6 h-6 text-slate-950" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black italic tracking-wide text-white">UNDERGROUND LUCKY CRATES</h2>
                                <span className="text-xs px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 font-bold">
                                    GACHA VAULT
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">Unlock high-tier performance blueprints, rare anime liveries & token jackpots!</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Loot Reveal Screen */}
                {lootResult ? (
                    <div className="my-8 flex flex-col items-center text-center animate-fade-in">
                        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400 mb-1">
                            CRATE UNLOCKED!
                        </div>
                        <div className={`text-3xl md:text-4xl font-black italic mb-4 ${lootResult.rarity === 'Legendary'
                            ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                            : lootResult.rarity === 'Epic'
                                ? 'text-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]'
                                : lootResult.rarity === 'Rare'
                                    ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]'
                                    : 'text-slate-200'
                            }`}>
                            {lootResult.rarity.toUpperCase()} DROP!
                        </div>

                        {/* Item Card */}
                        <div className="max-w-sm w-full p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-400/60 shadow-2xl relative my-3">
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center my-2 shadow-inner">
                                <Sparkles className="w-10 h-10 text-cyan-300 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black text-white mt-2">{lootResult.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">{lootResult.desc}</p>
                        </div>

                        <button
                            onClick={() => {
                                soundEngine.playBeep(800, 0.1);
                                setLootResult(null);
                            }}
                            className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black italic text-sm tracking-wider uppercase shadow-lg shadow-cyan-400/30 cursor-pointer"
                        >
                            COLLECT & OPEN MORE
                        </button>
                    </div>
                ) : opening ? (
                    /* Crate Opening Animation */
                    <div className="my-14 flex flex-col items-center justify-center text-center">
                        <div className="relative w-28 h-28 flex items-center justify-center animate-bounce">
                            <div className="absolute inset-0 bg-cyan-400/30 rounded-3xl blur-xl animate-pulse" />
                            <Package className="w-20 h-20 text-cyan-300 relative z-10" />
                        </div>
                        <div className="text-xl font-black italic text-cyan-300 tracking-wider mt-6 animate-pulse">
                            DECRYPTING UNDERGROUND VAULT...
                        </div>
                    </div>
                ) : (
                    /* 3 Crate Tiers Grid */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                        {CRATE_TIERS.map(tier => {
                            const isFree = tier.id === 'common' && isFreeCommonAvailable;
                            const canAfford = isFree || (tier.costCr ? credits >= tier.costCr : tier.costTokens ? tokens >= tier.costTokens : false);

                            return (
                                <div
                                    key={tier.id}
                                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400/60 flex flex-col justify-between transition-all group hover:scale-[1.02]"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-slate-400 tracking-wider">{tier.kanji}</span>
                                            {isFree && (
                                                <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/50 text-[10px] font-black animate-pulse">
                                                    FREE AVAILABLE!
                                                </span>
                                            )}
                                        </div>

                                        <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center mx-auto my-3 border border-slate-800 group-hover:border-cyan-400/40">
                                            <Package className="w-8 h-8" style={{ color: tier.color }} />
                                        </div>

                                        <h3 className="text-base font-black italic text-white text-center">{tier.name}</h3>
                                        <p className="text-xs text-slate-400 text-center mt-1 min-h-[48px]">{tier.desc}</p>
                                    </div>

                                    <button
                                        onClick={() => triggerOpen(tier)}
                                        disabled={!canAfford}
                                        className={`mt-4 w-full py-3 rounded-xl font-black italic text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${isFree
                                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:brightness-110 shadow-emerald-400/30'
                                            : canAfford
                                                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-cyan-400/30'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                            }`}
                                    >
                                        {isFree ? (
                                            'CLAIM FREE CRATE'
                                        ) : tier.costCr ? (
                                            `${tier.costCr.toLocaleString()} CR`
                                        ) : (
                                            <span className="flex items-center gap-1 text-amber-300">
                                                <Zap className="w-3.5 h-3.5" /> {tier.costTokens} NT
                                            </span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

