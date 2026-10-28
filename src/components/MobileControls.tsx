/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap, Volume2 } from 'lucide-react';

interface MobileControlsProps {
  onSteer: (direction: -1 | 0 | 1) => void;
  onJump: () => void;
  onSlide: () => void;
  onAction: () => void;
  onHorn: () => void;
  canSlide: boolean;
  canSkitch: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onSteer,
  onJump,
  onSlide,
  onAction,
  onHorn,
  canSlide,
  canSkitch,
}) => {
  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none select-none z-30 px-3 sm:px-8 flex justify-between items-end">
      {/* Left Steering Pad (Left & Right) */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onTouchStart={(e) => { e.preventDefault(); onSteer(-1); }}
          onTouchEnd={(e) => { e.preventDefault(); onSteer(0); }}
          onMouseDown={() => onSteer(-1)}
          onMouseUp={() => onSteer(0)}
          onMouseLeave={() => onSteer(0)}
          aria-label="Steer Left"
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/85 active:bg-sky-600 active:scale-95 text-white rounded-2xl border-2 border-slate-700/80 active:border-sky-300 shadow-xl flex items-center justify-center transition"
        >
          <ArrowLeft className="w-8 h-8 sm:w-10 sm:h-10 text-sky-400" />
        </button>

        <button
          type="button"
          onTouchStart={(e) => { e.preventDefault(); onSteer(1); }}
          onTouchEnd={(e) => { e.preventDefault(); onSteer(0); }}
          onMouseDown={() => onSteer(1)}
          onMouseUp={() => onSteer(0)}
          onMouseLeave={() => onSteer(0)}
          aria-label="Steer Right"
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/85 active:bg-sky-600 active:scale-95 text-white rounded-2xl border-2 border-slate-700/80 active:border-sky-300 shadow-xl flex items-center justify-center transition"
        >
          <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 text-sky-400" />
        </button>
      </div>

      {/* Right Action Pad (Jump, Slide, Action/Skitch, Horn) */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Contextual Action / Skitch / Slap button */}
        <button
          type="button"
          onTouchStart={(e) => { e.preventDefault(); onAction(); }}
          onClick={onAction}
          aria-label="Action"
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 shadow-xl flex flex-col items-center justify-center transition active:scale-90 ${
            canSkitch
              ? 'bg-emerald-600/90 active:bg-emerald-500 border-emerald-300 text-white'
              : 'bg-amber-600/90 active:bg-amber-500 border-amber-300 text-white'
          }`}
        >
          <Zap className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-tight">
            {canSkitch ? 'SKITCH' : 'SLAP'}
          </span>
        </button>

        {/* Slide / Crouch Button (if skateboard or capable vehicle) */}
        {canSlide && (
          <button
            type="button"
            onTouchStart={(e) => { e.preventDefault(); onSlide(); }}
            onClick={onSlide}
            aria-label="Slide or Crouch"
            className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900/85 active:bg-indigo-600 active:scale-90 text-white rounded-2xl border-2 border-slate-700/80 active:border-indigo-300 shadow-xl flex flex-col items-center justify-center transition"
          >
            <ArrowDown className="w-6 h-6 text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-tight text-indigo-200">SLIDE</span>
          </button>
        )}

        {/* Jump / Ollie Button */}
        <button
          type="button"
          onTouchStart={(e) => { e.preventDefault(); onJump(); }}
          onClick={onJump}
          aria-label="Jump or Ollie"
          className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-600/90 active:bg-sky-500 active:scale-90 text-white rounded-2xl border-2 border-sky-300 shadow-xl flex flex-col items-center justify-center transition"
        >
          <ArrowUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-100">JUMP</span>
        </button>
      </div>
    </div>
  );
};
