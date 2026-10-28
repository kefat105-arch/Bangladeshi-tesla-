/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VehicleStage, VEHICLE_CONFIGS, VEHICLE_STAGES, GameScoreState, MinimapEntity } from '../types/game';
import { Gauge, Coins, Flame, Volume2, VolumeX, Pause, Compass, Zap } from 'lucide-react';
import { MiniMap } from './MiniMap';

interface GameHUDProps {
  scoreState: GameScoreState;
  currentVehicle: VehicleStage;
  pickupTarget: VehicleStage | null;
  pickupDistance: number | null;
  skitchStatus: { active: boolean; label?: string };
  floatingNotice: { text: string; subtext?: string; type?: string } | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onHorn: () => void;
  onAction: () => void;
  minimapEntities: MinimapEntity[];
  currentBiomeName: string;
  showMinimap: boolean;
  showGestureTutorial: boolean;
  canSkitch: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  scoreState,
  currentVehicle,
  pickupTarget,
  pickupDistance,
  skitchStatus,
  floatingNotice,
  isMuted,
  onToggleMute,
  onPause,
  onHorn,
  onAction,
  minimapEntities,
  currentBiomeName,
  showMinimap,
  showGestureTutorial,
  canSkitch,
}) => {
  const currentConfig = VEHICLE_CONFIGS[currentVehicle];
  const currentIdx = VEHICLE_STAGES.indexOf(currentVehicle);
  const nextIdx = (currentIdx + 1) % VEHICLE_STAGES.length;
  const nextConfig = VEHICLE_CONFIGS[VEHICLE_STAGES[nextIdx]];

  const stageReq = currentConfig.requiredMilestone;
  const currentStageDist = scoreState.distance % stageReq;
  const progressPct = Math.min(100, Math.floor((currentStageDist / stageReq) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 z-20">
      {/* Top Header Cluster */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Left: Speedometer, Distance & Current Vehicle */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
            <Gauge className="w-4 h-4 text-sky-400" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-white">
                {scoreState.speedKmh}
              </span>
              <span className="text-[10px] text-sky-300 font-semibold uppercase">km/h</span>
            </div>
            <div className="h-3.5 w-px bg-slate-700 mx-1" />
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold tabular-nums text-amber-300">
                {scoreState.distance}
              </span>
              <span className="text-[10px] text-amber-200/80 font-semibold uppercase">m</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/85 text-white px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentConfig.primaryColor }}
            />
            <span className="font-bold text-slate-100">{currentConfig.name}</span>
            <span className="text-slate-400 text-[10px]">({currentConfig.bengaliName})</span>
          </div>
        </div>

        {/* Center: Sleek Compact Top Notification Pill */}
        <div className="flex flex-col items-center flex-1 max-w-[240px] sm:max-w-xs">
          {floatingNotice ? (
            <div
              className={`px-3.5 py-1.5 rounded-xl shadow-xl border text-center transition-all duration-300 ${
                floatingNotice.type === 'pickup'
                  ? 'bg-sky-600/95 border-sky-300 text-white animate-bounce'
                  : floatingNotice.type === 'skitch'
                  ? 'bg-emerald-600/95 border-emerald-300 text-white'
                  : floatingNotice.type === 'slap'
                  ? 'bg-amber-500/95 border-amber-200 text-slate-950 font-black'
                  : 'bg-slate-900/90 border-slate-700 text-amber-300'
              }`}
            >
              <div className="text-xs sm:text-sm font-black tracking-wide leading-tight">
                {floatingNotice.text}
              </div>
              {floatingNotice.subtext && (
                <div className="text-[10px] font-semibold opacity-90">{floatingNotice.subtext}</div>
              )}
            </div>
          ) : pickupTarget ? (
            <div className="bg-sky-600/95 text-white px-3 py-1 rounded-xl border border-sky-300 shadow-lg text-center animate-pulse">
              <div className="text-[9px] font-black uppercase text-sky-200">
                ⚡ PICKUP IN SIGHT! ⚡
              </div>
              <div className="text-[11px] font-black text-white">
                STEER TO COLLECT: {VEHICLE_CONFIGS[pickupTarget].name}
              </div>
            </div>
          ) : (
            <div className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-2.5 py-1 shadow-md">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300 mb-0.5">
                <span>NEXT: {nextConfig.name}</span>
                <span className="tabular-nums text-sky-400 font-bold">{progressPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Skitch Status Indicator */}
          {skitchStatus.active && (
            <div className="mt-1.5 bg-emerald-600/95 text-white px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-md text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
              <span>🪝 SKITCH TOWING!</span>
              <span className="text-emerald-200">2.5x PTS</span>
            </div>
          )}
          {!skitchStatus.active && skitchStatus.label && (
            <div className="mt-1.5 bg-amber-500/95 text-slate-950 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-md text-[10px] font-bold">
              {skitchStatus.label}
            </div>
          )}
        </div>

        {/* Right: Banked Taka, Score & Minimap / System Buttons */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
            <div className="flex items-center gap-1 text-amber-400 font-bold tabular-nums text-base sm:text-lg">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>৳{scoreState.coinsCollected}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-700 mx-1" />
            <div className="text-lg sm:text-xl font-black tabular-nums text-white">
              {scoreState.currentScore}
            </div>
          </div>

          {/* Multiplier & Quick Action Controls */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {scoreState.multiplier > 1.0 && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded-lg text-[11px] font-black shadow-md">
                <Flame className="w-3 h-3" />
                <span>{scoreState.multiplier.toFixed(1)}x</span>
              </div>
            )}

            <button
              onClick={onHorn}
              aria-label="Horn"
              className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700 transition active:scale-95 text-xs font-bold px-2"
              title="Honk Horn"
            >
              📢
            </button>
            <button
              onClick={onToggleMute}
              aria-label="Toggle Sound"
              className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition active:scale-95"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={onPause}
              aria-label="Pause Game"
              className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition active:scale-95"
            >
              <Pause className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>

          {/* Radar Minimap */}
          {showMinimap && (
            <div className="mt-1">
              <MiniMap entities={minimapEntities} biomeName={currentBiomeName} />
            </div>
          )}
        </div>
      </div>

      {/* Center: First-Time Touch Gesture Tutorial Prompt */}
      {showGestureTutorial && (
        <div className="flex flex-col items-center justify-center my-auto">
          <div className="bg-slate-950/90 border border-sky-400/60 rounded-2xl p-3.5 shadow-2xl max-w-sm text-center text-white backdrop-blur-sm">
            <div className="text-xs font-black uppercase text-sky-400 tracking-wider mb-1 flex items-center justify-center gap-1.5">
              <span>DIRECT TOUCH GESTURES</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 mt-2 text-left">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-300">Drag ◄ ►</span>
                <div>Steer anywhere on screen</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-300">Swipe ▲</span>
                <div>Jump / Ollie stunt</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-indigo-300">Swipe ▼</span>
                <div>Crouch / Duck / Slide</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-300">Tap / Double-tap</span>
                <div>Skitch CNG / Slap / Horn</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (for one-tap Skitch / Slap access without clutter) */}
      <div className="flex justify-end p-2 pointer-events-auto">
        <button
          onClick={onAction}
          className={`px-4 py-2.5 rounded-2xl border shadow-xl flex items-center gap-2 text-xs font-black transition active:scale-90 ${
            canSkitch
              ? 'bg-emerald-600/90 active:bg-emerald-500 border-emerald-300 text-white'
              : 'bg-slate-900/85 active:bg-amber-600 border-slate-700 text-amber-400'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{canSkitch ? 'SKITCH' : 'ACTION / SLAP'}</span>
        </button>
      </div>
    </div>
  );
};
