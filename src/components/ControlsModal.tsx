import React, { useState } from 'react';
import { HelpCircle, Smartphone, Keyboard, X } from 'lucide-react';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'touch' | 'keyboard'>('touch');

  const keyboardControls = [
    { key: 'W / ↑', action: 'Gas Throttle', detail: 'Accelerate forward with smooth torque curve' },
    { key: 'S / ↓', action: 'Brake / Reverse', detail: 'Active carbon braking, shifts into reverse when stopped' },
    { key: 'A / D or ← / →', action: 'Steering', detail: 'Speed-sensitive steering with front wheel alignment' },
    { key: 'SPACEBAR', action: 'Kage Drift', detail: 'Hold while steering into corners to initiate drift slide' },
    { key: 'SHIFT', action: 'N₂O Hyper Boost', detail: 'Consumes nitrous for high acceleration & speed boost' },
    { key: 'R', action: 'Reset Car', detail: 'Centers vehicle back onto the track centerline' },
    { key: 'C', action: 'Change Camera', detail: 'Cycles Dynamic Chase, Far Chase, and Hood/Bumper view' },
  ];

  const touchControls = [
    { button: '◀ / ▶', zone: 'Left Thumb', action: 'Steering', detail: 'Tap or hold to steer left or right smoothly' },
    { button: '▲ GAS', zone: 'Right Thumb', action: 'Accelerate', detail: 'Hold to accelerate up to top speed' },
    { button: '▼ BRK', zone: 'Right Thumb', action: 'Brake / Reverse', detail: 'Tap to brake, hold when stopped to reverse' },
    { button: 'DRIFT', zone: 'Right Thumb', action: 'Handbrake Slide', detail: 'Hold while turning to rack up drift combos' },
    { button: 'N₂O', zone: 'Right Thumb', action: 'Nitro Boost', detail: 'Unleashes high-velocity nitrous boost flames' },
    { button: 'CAM / RESET', zone: 'Top Bar', action: 'Quick Actions', detail: 'Switch camera angle or center car if off-track' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-md w-full max-h-[92vh] overflow-y-auto bg-[#0a0d24] border-2 border-cyan-400/60 rounded-3xl p-5 sm:p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-black">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black italic text-white">CONTROLS GUIDE</h3>
              <p className="text-xs text-slate-400">Works on all phones, tablets & desktop browsers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 my-4">
          <button
            onClick={() => setTab('touch')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition ${
              tab === 'touch' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Phone Touch
          </button>
          <button
            onClick={() => setTab('keyboard')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition ${
              tab === 'keyboard' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Keyboard / PC
          </button>
        </div>

        {/* Control List */}
        <div className="space-y-2.5 my-4">
          {tab === 'touch' ? (
            touchControls.map(item => (
              <div key={item.button} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">{item.action}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{item.zone}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{item.detail}</div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 font-black text-xs">
                  {item.button}
                </span>
              </div>
            ))
          ) : (
            keyboardControls.map(item => (
              <div key={item.key} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <div className="text-xs font-black text-white">{item.action}</div>
                  <div className="text-[10px] text-slate-400">{item.detail}</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black text-xs">
                  {item.key}
                </span>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black italic text-xs uppercase tracking-wider shadow-lg shadow-cyan-400/30 cursor-pointer"
        >
          GOT IT — LET'S RACE
        </button>
      </div>
    </div>
  );
};
