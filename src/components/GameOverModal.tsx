/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Home, Award, Coins, Flame, Zap } from 'lucide-react';
import { GameScoreState, VehicleStage, VEHICLE_CONFIGS } from '../types/game';

interface GameOverModalProps {
  scoreState: GameScoreState;
  vehicleStage: VehicleStage;
  crashReason: string;
  isNewRecord: boolean;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  scoreState,
  vehicleStage,
  crashReason,
  isNewRecord,
  onRestart,
  onHome,
}) => {
  const currentVehicleConfig = VEHICLE_CONFIGS[vehicleStage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center text-white">
        {/* Record Badge */}
        {isNewRecord && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>NEW HIGH SCORE!</span>
          </div>
        )}

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
          RIDE CONCLUDED
        </h2>
        <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">
          {crashReason || 'Crash on the highway!'}
        </p>

        {/* Big Score Callout */}
        <div className="my-6 w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Score
          </div>
          <div className="text-4xl sm:text-5xl font-black text-sky-400 tabular-nums">
            {scoreState.currentScore}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 text-left">
          <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Distance</div>
            <div className="text-lg font-black text-amber-300 tabular-nums">
              {scoreState.distance}m
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" /> Taka Earned
            </div>
            <div className="text-lg font-black text-amber-400 tabular-nums">
              ৳{scoreState.coinsCollected}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> Near Misses
            </div>
            <div className="text-lg font-black text-orange-300 tabular-nums">
              {scoreState.nearMisses}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Vehicle Reached
            </div>
            <div className="text-sm font-black text-slate-200 truncate">
              {currentVehicleConfig.name}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RIDE AGAIN</span>
          </button>

          <button
            onClick={onHome}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-bold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU / GARAGE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
