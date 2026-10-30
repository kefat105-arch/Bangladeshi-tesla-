/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Flame,
  ArrowUp,
  ShieldAlert,
  Megaphone,
  Smartphone,
  Eye,
  Key,
} from 'lucide-react';
import { VehicleStage, VEHICLE_CONFIGS } from '../types/game';

interface OnFootControlsProps {
  onMove: (moveX: number, moveZ: number) => void;
  onSprintToggle: (isSprinting: boolean) => void;
  onSneakToggle: (isSneaking: boolean) => void;
  onJump: () => void;
  onGesture: () => void;
  onOpenPhone: () => void;
  onResetCamera: () => void;
  nearbyVehicle: { stage: VehicleStage; x: number; z: number } | null;
  onEnterVehicle: (stage: VehicleStage) => void;
}

export const OnFootControls: React.FC<OnFootControlsProps> = ({
  onMove,
  onSprintToggle,
  onSneakToggle,
  onJump,
  onGesture,
  onOpenPhone,
  onResetCamera,
  nearbyVehicle,
  onEnterVehicle,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);
  const [isSneaking, setIsSneaking] = useState(false);

  const touchIdRef = useRef<number | null>(null);

  const handleJoystickStart = (clientX: number, clientY: number, identifier: number | null) => {
    touchIdRef.current = identifier;
    setJoystickActive(true);
    updateKnob(clientX, clientY);
  };

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width * 0.42;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });

    // Normalized move vector (-1 to 1)
    // -dy is forward (+Z), dx is right (+X)
    const normX = dx / maxRadius;
    const normZ = -dy / maxRadius;
    onMove(normX, normZ);
  }, [onMove]);

  const handleJoystickEnd = useCallback(() => {
    touchIdRef.current = null;
    setJoystickActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  // Touch handlers on joystick container
  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    handleJoystickStart(touch.clientX, touch.clientY, touch.identifier);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!joystickActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        updateKnob(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        handleJoystickEnd();
        break;
      }
    }
  };

  // Mouse handlers for desktop testing
  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleJoystickStart(e.clientX, e.clientY, null);
    const onMouseMove = (ev: MouseEvent) => {
      updateKnob(ev.clientX, ev.clientY);
    };
    const onMouseUp = () => {
      handleJoystickEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const toggleSprint = () => {
    const next = !isSprinting;
    setIsSprinting(next);
    if (next && isSneaking) {
      setIsSneaking(false);
      onSneakToggle(false);
    }
    onSprintToggle(next);
  };

  const toggleSneak = () => {
    const next = !isSneaking;
    setIsSneaking(next);
    if (next && isSprinting) {
      setIsSprinting(false);
      onSprintToggle(false);
    }
    onSneakToggle(next);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30">
      {/* 360 Camera Prompt for on-foot mode */}
      <div className="absolute top-16 right-4 sm:right-8 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-emerald-500/60 text-xs text-emerald-300 font-bold select-none pointer-events-none shadow-lg">
        <Eye className="w-4 h-4 text-emerald-400" />
        <span>৩৬০° ক্যামেরা চালু (Drag right side to look around)</span>
      </div>

      {/* Persistent Smartphone Summon button on right flank */}
      <div className="absolute right-3 sm:right-6 bottom-36 pointer-events-auto flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onOpenPhone}
          aria-label="Open Smartphone Garage"
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 active:scale-90 text-white shadow-2xl border-2 border-purple-300/80 flex flex-col items-center justify-center transition group hover:shadow-purple-500/50"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-slate-900 animate-pulse" />
          <Smartphone className="w-6 h-6 text-white" />
          <span className="text-[9px] font-black uppercase tracking-tight text-purple-100">গ্যারেজ</span>
        </button>

        <button
          type="button"
          onClick={onResetCamera}
          title="Reset Camera Behind Character"
          className="w-10 h-10 rounded-xl bg-slate-900/80 active:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center shadow-md active:scale-90 transition"
        >
          <Eye className="w-4 h-4 text-sky-400" />
        </button>
      </div>

      {/* Enter Vehicle Notification Banner (When standing near a spawned vehicle) */}
      {nearbyVehicle && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-32 pointer-events-auto animate-bounce z-40">
          <button
            type="button"
            onClick={() => onEnterVehicle(nearbyVehicle.stage)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-2xl border-2 border-emerald-300 active:scale-95 transition"
          >
            <Key className="w-6 h-6 text-amber-200" />
            <div className="text-left">
              <div className="text-xs text-emerald-100 font-semibold">গাড়িতে উঠুন / চাপুন</div>
              <div className="text-sm font-black">{VEHICLE_CONFIGS[nearbyVehicle.stage]?.name.toUpperCase()}</div>
            </div>
          </button>
        </div>
      )}

      {/* Bottom On-Foot Control HUD */}
      <div className="absolute inset-x-0 bottom-3 px-3 sm:px-8 flex justify-between items-end">
        {/* Left Side: Analog Pedestrian Movement Joystick */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div
            ref={joystickRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            onMouseDown={onMouseDown}
            className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-950/70 border-2 border-slate-700/80 backdrop-blur-md shadow-2xl flex items-center justify-center touch-none select-none active:border-emerald-400"
          >
            {/* Crosshair guide lines */}
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] bg-slate-700/50" />
            <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-[1px] bg-slate-700/50" />

            {/* Directional labels in Bengali & English */}
            <span className="absolute top-1 text-[9px] font-black text-slate-400">সামনে (W)</span>
            <span className="absolute bottom-1 text-[9px] font-black text-slate-400">পেছনে (S)</span>
            <span className="absolute left-1 text-[9px] font-black text-slate-400">বামে</span>
            <span className="absolute right-1 text-[9px] font-black text-slate-400">ডানে</span>

            {/* Draggable thumb knob */}
            <div
              className={`w-14 h-14 rounded-full border-2 shadow-xl flex items-center justify-center transition-transform ${
                joystickActive
                  ? 'bg-emerald-500 border-white scale-105'
                  : 'bg-slate-800 border-slate-500'
              }`}
              style={{
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                transition: joystickActive ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <div className="w-4 h-4 rounded-full bg-white/60" />
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-wider">
            হাঁটুন / জয়স্টিক
          </span>
        </div>

        {/* Right Side: Natural Pedestrian Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          {/* Sneak / Cautious Walk Toggle */}
          <button
            type="button"
            onClick={toggleSneak}
            aria-label="Sneak / Careful Walk"
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl active:scale-90 transition ${
              isSneaking
                ? 'bg-amber-600 border-amber-300 text-white'
                : 'bg-slate-900/85 border-slate-700 text-amber-300'
            }`}
          >
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">সাবধানে</span>
          </button>

          {/* Vocal Call / Wave Gesture */}
          <button
            type="button"
            onClick={onGesture}
            aria-label="Call out / Wave"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600/90 active:bg-indigo-500 border-2 border-indigo-300 text-white flex flex-col items-center justify-center shadow-xl active:scale-90 transition"
          >
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">ডাক দিন</span>
          </button>

          {/* Sprint / Run Toggle */}
          <button
            type="button"
            onClick={toggleSprint}
            aria-label="Sprint / Run"
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl active:scale-90 transition ${
              isSprinting
                ? 'bg-rose-600 border-rose-300 text-white'
                : 'bg-slate-900/85 border-slate-700 text-rose-400'
            }`}
          >
            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">দৌড়ান</span>
          </button>

          {/* Jump Button */}
          <button
            type="button"
            onClick={onJump}
            aria-label="Jump"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 active:from-sky-500 active:to-cyan-400 border-2 border-sky-300 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition"
          >
            <ArrowUp className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-100 mt-0.5">
              লাফান
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
