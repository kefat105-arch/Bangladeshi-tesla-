/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Zap,
  Volume2,
  Smartphone,
  Eye,
  LogOut,
  Key,
} from 'lucide-react';
import { VehicleStage, VEHICLE_CONFIGS } from '../types/game';

interface MobileControlsProps {
  onSteer: (direction: -1 | 0 | 1) => void;
  onJump: () => void;
  onSlide: () => void;
  onAction: () => void;
  onHorn: () => void;
  onResetCamera: () => void;
  onOpenPhone: () => void;
  canSlide: boolean;
  canSkitch: boolean;
  isDriving: boolean;
  currentVehicle: VehicleStage;
  nearbyVehicle: { stage: VehicleStage; x: number; z: number } | null;
  onEnterVehicle: (stage: VehicleStage) => void;
  onExitVehicle: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onSteer,
  onJump,
  onSlide,
  onAction,
  onHorn,
  onResetCamera,
  onOpenPhone,
  canSlide,
  canSkitch,
  isDriving,
  currentVehicle,
  nearbyVehicle,
  onEnterVehicle,
  onExitVehicle,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30">
      {/* Visual Subtitle for 360 Camera Drag Area on right half of screen */}
      <div className="absolute top-16 right-4 sm:right-8 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-sm border border-slate-700/60 text-[10px] text-slate-300 font-medium select-none pointer-events-none">
        <Eye className="w-3.5 h-3.5 text-sky-400" />
        <span>Drag right side for 360° camera</span>
      </div>

      {/* Floating Smartphone HUD Icon (Persistent on right flank) */}
      <div className="absolute right-3 sm:right-6 bottom-28 sm:bottom-32 pointer-events-auto flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onOpenPhone}
          aria-label="Open Smartphone Garage"
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 active:scale-90 text-white shadow-2xl border-2 border-purple-300/80 flex flex-col items-center justify-center transition group hover:shadow-purple-500/50"
        >
          {/* Notification Badge */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-slate-900 animate-pulse" />
          <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          <span className="text-[9px] font-black uppercase tracking-tight text-purple-100">PHONE</span>
        </button>

        {/* 360 Camera Center / Reset Button */}
        <button
          type="button"
          onClick={onResetCamera}
          title="Reset Camera Behind Player (Key: C)"
          className="w-10 h-10 rounded-xl bg-slate-900/80 active:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center shadow-md active:scale-90 transition"
        >
          <Eye className="w-4 h-4 text-sky-400" />
        </button>
      </div>

      {/* Enter Vehicle Prompt (When walking and standing near a spawned vehicle) */}
      {nearbyVehicle && !isDriving && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-28 pointer-events-auto animate-bounce">
          <button
            type="button"
            onClick={() => onEnterVehicle(nearbyVehicle.stage)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-2xl border-2 border-emerald-300 active:scale-95 transition"
          >
            <Key className="w-5 h-5 text-amber-200" />
            <span>ENTER / DRIVE {VEHICLE_CONFIGS[nearbyVehicle.stage]?.name.toUpperCase()}</span>
          </button>
        </div>
      )}

      {/* Bottom Controls Row: Left Steering Pad vs Right Action Pad */}
      <div className="absolute inset-x-0 bottom-4 px-3 sm:px-8 flex justify-between items-end">
        {/* Left Side: Movement / Steering Pad */}
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

        {/* Right Side Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Exit Vehicle Button (When driving any vehicle) */}
          {isDriving && (
            <button
              type="button"
              onClick={onExitVehicle}
              aria-label="Exit Vehicle"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-600/90 active:bg-rose-500 border-2 border-rose-300 text-white shadow-xl flex flex-col items-center justify-center transition active:scale-90"
            >
              <LogOut className="w-5 h-5 text-rose-100" />
              <span className="text-[9px] font-black uppercase tracking-tight text-white">EXIT</span>
            </button>
          )}

          {/* Contextual Action / Skitch / Slap */}
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
            <Zap className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-tight">
              {canSkitch ? 'SKITCH' : 'ACTION'}
            </span>
          </button>

          {/* Slide / Crouch / Brake Button */}
          {canSlide && (
            <button
              type="button"
              onTouchStart={(e) => { e.preventDefault(); onSlide(); }}
              onClick={onSlide}
              aria-label="Slide or Brake"
              className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900/85 active:bg-indigo-600 active:scale-90 text-white rounded-2xl border-2 border-slate-700/80 active:border-indigo-300 shadow-xl flex flex-col items-center justify-center transition"
            >
              <ArrowDown className="w-5 h-5 text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-tight text-indigo-200">BRAKE</span>
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
            <ArrowUp className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-100">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
