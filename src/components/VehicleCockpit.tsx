/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Volume2,
  LogOut,
  Zap,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  Bell,
  Smartphone,
} from 'lucide-react';
import { VehicleStage, VEHICLE_CONFIGS } from '../types/game';
import { soundManager } from '../audio/soundManager';

export type VehicleGear = 'P' | 'R' | 'N' | 'D';

interface VehicleCockpitProps {
  currentVehicle: VehicleStage;
  onSteer: (direction: number) => void; // -1 (full left) to +1 (full right)
  onAccelerate: (isGasActive: boolean) => void;
  onBrake: (isBrakeActive: boolean) => void;
  onGearChange: (gear: VehicleGear) => void;
  onHorn: () => void;
  onJump: () => void;
  onSlide: () => void;
  onAction: () => void;
  onExitVehicle: () => void;
  onOpenPhone: () => void;
  canSlide: boolean;
  canSkitch: boolean;
}

export const VehicleCockpit: React.FC<VehicleCockpitProps> = ({
  currentVehicle,
  onSteer,
  onAccelerate,
  onBrake,
  onGearChange,
  onHorn,
  onJump,
  onSlide,
  onAction,
  onExitVehicle,
  onOpenPhone,
  canSlide,
  canSkitch,
}) => {
  // Driving States
  const [currentGear, setCurrentGear] = useState<VehicleGear>('D');
  const [steerAngle, setSteerAngle] = useState(0); // in degrees (-90 to +90)
  const [isGasPressed, setIsGasPressed] = useState(false);
  const [isBrakePressed, setIsBrakePressed] = useState(false);
  const [isHandbrakeOn, setIsHandbrakeOn] = useState(false);

  // Steering Wheel Drag Refs
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDraggingWheel = useRef(false);
  const dragCenterRef = useRef({ x: 0, y: 0 });
  const startDragAngleRef = useRef(0);
  const wheelAngleRef = useRef(0);

  const vehicleConfig = VEHICLE_CONFIGS[currentVehicle];
  const isCarOrBusOrCng = currentVehicle === 'cng' || currentVehicle === 'bus' || (currentVehicle as string).includes('car') || (currentVehicle as string).includes('truck');
  const isMotorcycle = currentVehicle === 'sports_motorcycle';
  const isBicycle = currentVehicle === 'bicycle';
  const isSkateboard = currentVehicle === 'skateboard';

  // Smooth wheel spring return when not dragging
  useEffect(() => {
    let animId: number;
    const springUpdate = () => {
      if (!isDraggingWheel.current && Math.abs(wheelAngleRef.current) > 0.5) {
        wheelAngleRef.current *= 0.82;
        if (Math.abs(wheelAngleRef.current) < 0.5) {
          wheelAngleRef.current = 0;
        }
        setSteerAngle(wheelAngleRef.current);
        onSteer(wheelAngleRef.current / 90);
      }
      animId = requestAnimationFrame(springUpdate);
    };
    animId = requestAnimationFrame(springUpdate);
    return () => cancelAnimationFrame(animId);
  }, [onSteer]);

  // --- CIRCULAR STEERING WHEEL DRAG LOGIC ---
  const handleWheelStart = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    dragCenterRef.current = { x: cx, y: cy };

    const initialAngle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    startDragAngleRef.current = initialAngle - wheelAngleRef.current;
    isDraggingWheel.current = true;
  };

  const handleWheelMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingWheel.current) return;
    const { x: cx, y: cy } = dragCenterRef.current;
    const currentAngle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    let delta = currentAngle - startDragAngleRef.current;

    // Normalize delta between -180 and 180
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;

    // Clamp wheel rotation to ±110 degrees
    const clampedAngle = Math.max(-110, Math.min(110, delta));
    wheelAngleRef.current = clampedAngle;
    setSteerAngle(clampedAngle);
    onSteer(clampedAngle / 90);
  }, [onSteer]);

  const handleWheelEnd = useCallback(() => {
    isDraggingWheel.current = false;
  }, []);

  // Wheel Touch Events
  const onWheelTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    handleWheelStart(touch.clientX, touch.clientY);
  };

  const onWheelTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingWheel.current) return;
    const touch = e.touches[0];
    handleWheelMove(touch.clientX, touch.clientY);
  };

  const onWheelTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    handleWheelEnd();
  };

  // Wheel Mouse Events
  const onWheelMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleWheelStart(e.clientX, e.clientY);
    const onMouseMove = (ev: MouseEvent) => handleWheelMove(ev.clientX, ev.clientY);
    const onMouseUp = () => {
      handleWheelEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Button Steer Step
  const stepSteer = (direction: -1 | 0 | 1) => {
    if (direction === 0) {
      wheelAngleRef.current = 0;
    } else {
      wheelAngleRef.current = Math.max(-90, Math.min(90, wheelAngleRef.current + direction * 45));
    }
    setSteerAngle(wheelAngleRef.current);
    onSteer(wheelAngleRef.current / 90);
  };

  // Gear Shift Handler
  const handleSetGear = (gear: VehicleGear) => {
    setCurrentGear(gear);
    soundManager.playGearShift(gear);
    onGearChange(gear);
  };

  // Gas Pedal Handlers
  const handleGasDown = () => {
    setIsGasPressed(true);
    onAccelerate(true);
  };
  const handleGasUp = () => {
    setIsGasPressed(false);
    onAccelerate(false);
  };

  // Brake Pedal Handlers
  const handleBrakeDown = () => {
    setIsBrakePressed(true);
    soundManager.playBrakePedal();
    onBrake(true);
  };
  const handleBrakeUp = () => {
    setIsBrakePressed(false);
    onBrake(false);
  };

  // Bicycle cadence tap
  const handleBicyclePedal = () => {
    soundManager.playCadencePedal();
    onAccelerate(true);
    setTimeout(() => onAccelerate(false), 220);
  };

  // Skateboard kick push
  const handleSkatePush = () => {
    soundManager.playSkatePush();
    onAccelerate(true);
    setTimeout(() => onAccelerate(false), 300);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30">
      {/* Top Center: Exit Vehicle Button (গাড়ি থেকে নামুন) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-auto">
        <button
          type="button"
          onClick={onExitVehicle}
          className="px-4 py-2 rounded-2xl bg-rose-600/90 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 border-2 border-rose-300 shadow-2xl active:scale-95 transition"
        >
          <LogOut className="w-4 h-4 text-rose-100" />
          <span>গাড়ি থেকে নামুন (EXIT VEHICLE)</span>
        </button>
      </div>

      {/* Floating Smartphone Summon button on right flank */}
      <div className="absolute right-3 sm:right-6 bottom-36 pointer-events-auto flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onOpenPhone}
          aria-label="Open Smartphone Garage"
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 active:scale-90 text-white shadow-2xl border-2 border-purple-300/80 flex flex-col items-center justify-center transition group hover:shadow-purple-500/50"
        >
          <Smartphone className="w-6 h-6 text-white" />
          <span className="text-[9px] font-black uppercase tracking-tight text-purple-100">ফোন</span>
        </button>
      </div>

      {/* Bottom Cockpit Interface */}
      <div className="absolute inset-x-0 bottom-3 px-3 sm:px-8 flex justify-between items-end">
        {/* ================= LEFT SIDE: STEERING CONTROL ================= */}
        <div className="pointer-events-auto flex flex-col items-center">
          {/* For Cars / CNG / Bus: Interactive Circular Steering Wheel */}
          {(isCarOrBusOrCng || (!isMotorcycle && !isBicycle && !isSkateboard)) && (
            <div className="flex flex-col items-center">
              <div
                ref={wheelRef}
                onTouchStart={onWheelTouchStart}
                onTouchMove={onWheelTouchMove}
                onTouchEnd={onWheelTouchEnd}
                onTouchCancel={onWheelTouchEnd}
                onMouseDown={onWheelMouseDown}
                className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-900/90 border-4 border-slate-700 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-transform"
                style={{
                  transform: `rotate(${steerAngle}deg)`,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7), inset 0 2px 8px rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Steering Wheel Rim Grip Texture */}
                <div className="absolute inset-2 rounded-full border-4 border-amber-600/40 pointer-events-none" />

                {/* 3 Spokes */}
                <div className="absolute w-full h-4 bg-slate-800 border-y border-slate-600 top-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute h-full w-4 bg-slate-800 border-x border-slate-600 left-1/2 -translate-x-1/2 top-1/2 pointer-events-none" />

                {/* Center Horn Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHorn();
                  }}
                  className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 border-2 border-yellow-200 active:scale-95 text-slate-950 font-black text-[10px] uppercase shadow-lg flex flex-col items-center justify-center transition"
                >
                  <Volume2 className="w-5 h-5 text-slate-950" />
                  <span>হর্ন</span>
                </button>
              </div>

              {/* Sub-label & Quick Tap Steer Buttons */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); stepSteer(-1); }}
                  onMouseDown={() => stepSteer(-1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-sky-300 font-bold text-xs border border-slate-600 active:scale-90"
                >
                  ◀ বামে
                </button>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
                  গোল স্টিয়ারিং
                </span>
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); stepSteer(1); }}
                  onMouseDown={() => stepSteer(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-sky-300 font-bold text-xs border border-slate-600 active:scale-90"
                >
                  ডানে ▶
                </button>
              </div>
            </div>
          )}

          {/* For Motorcycle / Bike: Handlebar Steer */}
          {isMotorcycle && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); onSteer(-1); }}
                  onTouchEnd={(e) => { e.preventDefault(); onSteer(0); }}
                  onMouseDown={() => onSteer(-1)}
                  onMouseUp={() => onSteer(0)}
                  className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-red-500 text-red-300 font-black text-xs flex flex-col items-center justify-center active:bg-red-600 active:text-white shadow-xl"
                >
                  ◀ বামে
                  <span className="text-[9px] text-slate-400">হ্যান্ডেল</span>
                </button>
                <button
                  type="button"
                  onClick={onHorn}
                  className="w-12 h-12 rounded-full bg-amber-500 border-2 border-amber-200 text-slate-900 flex items-center justify-center shadow-lg active:scale-90"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); onSteer(1); }}
                  onTouchEnd={(e) => { e.preventDefault(); onSteer(0); }}
                  onMouseDown={() => onSteer(1)}
                  onMouseUp={() => onSteer(0)}
                  className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-red-500 text-red-300 font-black text-xs flex flex-col items-center justify-center active:bg-red-600 active:text-white shadow-xl"
                >
                  ডানে ▶
                  <span className="text-[9px] text-slate-400">হ্যান্ডেল</span>
                </button>
              </div>
              <span className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-wider">
                বাইক হ্যান্ডেলবার
              </span>
            </div>
          )}

          {/* For Bicycle: Handlebars & Bell */}
          {isBicycle && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); onSteer(-1); }}
                  onTouchEnd={(e) => { e.preventDefault(); onSteer(0); }}
                  onMouseDown={() => onSteer(-1)}
                  onMouseUp={() => onSteer(0)}
                  className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-emerald-500 text-emerald-300 font-black text-xs flex flex-col items-center justify-center active:bg-emerald-600 active:text-white shadow-xl"
                >
                  ◀ বামে
                </button>
                <button
                  type="button"
                  onClick={() => soundManager.playBicycleBell()}
                  className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-200 to-amber-100 border-2 border-white text-slate-900 flex flex-col items-center justify-center shadow-lg active:scale-90"
                >
                  <Bell className="w-5 h-5 text-amber-700" />
                  <span className="text-[8px] font-black">ঘণ্টি</span>
                </button>
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); onSteer(1); }}
                  onTouchEnd={(e) => { e.preventDefault(); onSteer(0); }}
                  onMouseDown={() => onSteer(1)}
                  onMouseUp={() => onSteer(0)}
                  className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-emerald-500 text-emerald-300 font-black text-xs flex flex-col items-center justify-center active:bg-emerald-600 active:text-white shadow-xl"
                >
                  ডানে ▶
                </button>
              </div>
              <span className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-wider">
                সাইকেল হ্যান্ডেলবার
              </span>
            </div>
          )}

          {/* For Skateboard: Carve Steer */}
          {isSkateboard && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); onSteer(-1); }}
                  onTouchEnd={(e) => { e.preventDefault(); onSteer(0); }}
                  onMouseDown={() => onSteer(-1)}
                  onMouseUp={() => onSteer(0)}
                  className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-sky-500 text-sky-300 font-black text-xs flex flex-col items-center justify-center active:bg-sky-600 active:text-white shadow-xl"
                >
                  ◀ কার্ভ
                </button>
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); onAction(); }}
                  onClick={onAction}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg active:scale-90 ${
                    canSkitch ? 'bg-emerald-600 border-emerald-200 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); onSteer(1); }}
                  onTouchEnd={(e) => { e.preventDefault(); onSteer(0); }}
                  onMouseDown={() => onSteer(1)}
                  onMouseUp={() => onSteer(0)}
                  className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-sky-500 text-sky-300 font-black text-xs flex flex-col items-center justify-center active:bg-sky-600 active:text-white shadow-xl"
                >
                  কার্ভ ▶
                </button>
              </div>
              <span className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-wider">
                স্কেট কার্ভিং
              </span>
            </div>
          )}
        </div>

        {/* ================= CENTER: GEAR SHIFTER (PRND) ================= */}
        {isCarOrBusOrCng && (
          <div className="pointer-events-auto flex flex-col items-center bg-slate-950/80 p-2 rounded-2xl border-2 border-slate-700/80 shadow-2xl backdrop-blur-md mb-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
              গিয়ার বক্স
            </span>
            <div className="flex items-center gap-1">
              {(['P', 'R', 'N', 'D'] as VehicleGear[]).map((gear) => (
                <button
                  key={gear}
                  type="button"
                  onClick={() => handleSetGear(gear)}
                  className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center transition active:scale-90 border-2 ${
                    currentGear === gear
                      ? gear === 'D'
                        ? 'bg-emerald-600 border-emerald-300 text-white shadow-lg shadow-emerald-500/50'
                        : gear === 'R'
                        ? 'bg-rose-600 border-rose-300 text-white shadow-lg shadow-rose-500/50'
                        : 'bg-amber-600 border-amber-300 text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {gear}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= RIGHT SIDE: GAS & BRAKE PEDALS ================= */}
        <div className="pointer-events-auto flex items-end gap-3 sm:gap-4">
          {/* Bicycle Specific: Cadence Pedal Pump */}
          {isBicycle && (
            <button
              type="button"
              onTouchStart={(e) => { e.preventDefault(); handleBicyclePedal(); }}
              onClick={handleBicyclePedal}
              className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 active:from-emerald-500 active:to-teal-400 border-2 border-emerald-200 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 transition"
            >
              <RotateCcw className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-[11px] font-black uppercase tracking-wider mt-1 text-emerald-100">
                প্যাডেল
              </span>
              <span className="text-[8px] text-emerald-200">TAP TO PEDAL</span>
            </button>
          )}

          {/* Skateboard Specific: Kick Push & Ollie Jump */}
          {isSkateboard && (
            <>
              <button
                type="button"
                onTouchStart={(e) => { e.preventDefault(); handleSkatePush(); }}
                onClick={handleSkatePush}
                className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 active:from-amber-500 active:to-yellow-400 border-2 border-amber-200 text-slate-950 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition"
              >
                <Sparkles className="w-6 h-6 text-slate-950" />
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">ধাক্কা দিন</span>
                <span className="text-[8px] text-slate-900 font-bold">PUSH</span>
              </button>

              <button
                type="button"
                onTouchStart={(e) => { e.preventDefault(); onJump(); }}
                onClick={onJump}
                className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 active:from-sky-500 active:to-cyan-400 border-2 border-sky-200 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 transition"
              >
                <ArrowUp className="w-7 h-7 text-white" />
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">অলি লাফ</span>
                <span className="text-[8px] text-sky-200">OLLIE</span>
              </button>
            </>
          )}

          {/* Realistic Brake Pedal ("ব্রেক ধরার বাটন") */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onTouchStart={(e) => { e.preventDefault(); handleBrakeDown(); }}
              onTouchEnd={(e) => { e.preventDefault(); handleBrakeUp(); }}
              onMouseDown={handleBrakeDown}
              onMouseUp={handleBrakeUp}
              onMouseLeave={handleBrakeUp}
              aria-label="Brake Pedal"
              className={`w-16 h-20 sm:w-20 sm:h-24 rounded-2xl border-4 flex flex-col items-center justify-center shadow-2xl transition active:scale-95 ${
                isBrakePressed
                  ? 'bg-rose-700 border-rose-300 text-white shadow-rose-600/60'
                  : 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-600 text-rose-400'
              }`}
              style={{
                boxShadow: isBrakePressed ? '0 0 20px rgba(225, 29, 72, 0.6)' : undefined,
              }}
            >
              {/* Rubber Tread Lines on Brake Pedal */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mb-1" />
              <div className="w-10 h-1 bg-slate-700 rounded-full mb-1" />
              <div className="w-10 h-1 bg-slate-700 rounded-full mb-1" />
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-300">
                ব্রেক
              </span>
              <span className="text-[8px] font-bold text-slate-400">BRAKE</span>
            </button>
          </div>

          {/* Realistic Accelerator Gas Pedal */}
          {!isBicycle && (
            <div className="flex flex-col items-center">
              <button
                type="button"
                onTouchStart={(e) => { e.preventDefault(); handleGasDown(); }}
                onTouchEnd={(e) => { e.preventDefault(); handleGasUp(); }}
                onMouseDown={handleGasDown}
                onMouseUp={handleGasUp}
                onMouseLeave={handleGasUp}
                aria-label="Gas / Accelerator Pedal"
                className={`w-14 h-24 sm:w-16 sm:h-28 rounded-2xl border-4 flex flex-col items-center justify-center shadow-2xl transition active:scale-95 ${
                  isGasPressed
                    ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-600/60'
                    : 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-600 text-emerald-400'
                }`}
                style={{
                  boxShadow: isGasPressed ? '0 0 20px rgba(16, 185, 129, 0.6)' : undefined,
                }}
              >
                {/* Vertical Grip Grooves on Gas Pedal */}
                <div className="flex gap-1 mb-2">
                  <div className="w-1 h-8 bg-slate-700 rounded-full" />
                  <div className="w-1 h-8 bg-slate-700 rounded-full" />
                  <div className="w-1 h-8 bg-slate-700 rounded-full" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                  গতি
                </span>
                <span className="text-[8px] font-bold text-slate-400">GAS</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
