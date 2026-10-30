/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Volume2, ShieldCheck, Zap, Gauge, Sparkles, Car } from 'lucide-react';
import { VehicleStage, VEHICLE_CONFIGS, VEHICLE_STAGES } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface GarageModalProps {
  onClose: () => void;
  unlockedVehicles: VehicleStage[];
  onSelectVehicle?: (stage: VehicleStage) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({ onClose, unlockedVehicles, onSelectVehicle }) => {
  const [selectedStage, setSelectedStage] = useState<VehicleStage>('skateboard');
  const vehicle = VEHICLE_CONFIGS[selectedStage];

  const handleTestHorn = (stage: VehicleStage) => {
    soundManager.playHorn(stage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm select-none pointer-events-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-2xl font-black tracking-tight">VEHICLE SHOWROOM & GARAGE</h2>
            </div>
            <p className="text-xs text-slate-400">
              12 fully modeled 3D vehicles with distinct physics, sounds, and handling
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 my-3 overflow-y-auto pr-1 flex-1">
          {/* Left Column: 12 Vehicles List */}
          <div className="md:col-span-5 flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[55vh] md:max-h-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Select Vehicle (12 Available)
            </span>
            {VEHICLE_STAGES.map((stageId, idx) => {
              const cfg = VEHICLE_CONFIGS[stageId];
              const isSelected = selectedStage === stageId;

              return (
                <button
                  key={stageId}
                  onClick={() => setSelectedStage(stageId)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-sky-600/30 border-sky-400 text-white shadow-lg'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-xs font-black flex items-center justify-center text-slate-300">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs sm:text-sm leading-tight">{cfg.name}</div>
                      <div className="text-[11px] text-slate-400">{cfg.bengaliName}</div>
                    </div>
                  </div>

                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: cfg.primaryColor }}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Vehicle Detail Card */}
          <div className="md:col-span-7 bg-slate-800/50 border border-slate-700/70 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div>
              {/* Title & Bengali Name */}
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ backgroundColor: `${vehicle.primaryColor}25`, color: vehicle.primaryColor }}
                  >
                    {vehicle.tagline}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{vehicle.name}</h3>
                  <div className="text-xs sm:text-sm font-semibold text-sky-400">{vehicle.bengaliName}</div>
                </div>

                <button
                  onClick={() => handleTestHorn(selectedStage)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded-xl text-xs font-bold transition shadow"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>HORN</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                {vehicle.description}
              </p>

              {/* Stats Meters */}
              <div className="mt-4 space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-sky-400" /> Top Speed
                    </span>
                    <span className="tabular-nums font-bold text-sky-400">
                      {Math.floor(vehicle.maxSpeed * 3.6)} km/h
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-400 h-full rounded-full"
                      style={{ width: `${(vehicle.maxSpeed / 54) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Acceleration & Agility
                    </span>
                    <span className="tabular-nums font-bold text-amber-400">{vehicle.acceleration} pts</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${(vehicle.acceleration / 26) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Dimensions
                    </span>
                    <span className="tabular-nums font-bold text-emerald-400">
                      {vehicle.width}m W × {vehicle.length}m L ({vehicle.seatCount} Seat{vehicle.seatCount > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${(vehicle.length / 6.5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Select / Spawn Action Button */}
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Turn Speed: <strong className="text-slate-200">{vehicle.turnSpeed}</strong>
              </span>

              {onSelectVehicle && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectVehicle(selectedStage);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center gap-1.5"
                >
                  <Car className="w-4 h-4" />
                  <span>DRIVE THIS VEHICLE</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
