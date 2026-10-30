/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, ShieldCheck, MapPin } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSaveCheckpoint?: () => void;
  onOpenMaps?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  isMuted,
  onToggleMute,
  onSaveCheckpoint,
  onOpenMaps,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center text-white">
        <h2 className="text-2xl font-black tracking-tight mb-1">RIDE PAUSED</h2>
        <p className="text-xs text-slate-400 mb-5">Dhaka streets await your return</p>

        <div className="flex flex-col w-full gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME RIDE</span>
          </button>

          {onSaveCheckpoint && (
            <button
              onClick={() => {
                onSaveCheckpoint();
              }}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-purple-500/60 shadow-lg transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-purple-200" />
              <span>SAVE CHECKPOINT MANUALLY 💾</span>
            </button>
          )}

          {onOpenMaps && (
            <button
              onClick={onOpenMaps}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>CHANGE MAP / BIOME</span>
            </button>
          )}

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>RESTART RUN</span>
          </button>

          <button
            onClick={onHome}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-sky-400" />
            <span>MAIN MENU</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-semibold text-xs rounded-xl border border-slate-700/60 transition flex items-center justify-center gap-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
