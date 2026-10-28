/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Volume2, ShieldCheck, Zap, Gauge, Sparkles } from 'lucide-react';
import { VehicleStage, VEHICLE_CONFIGS, VEHICLE_STAGES } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface GarageModalProps {
  onClose: () => void;
  unlockedVehicles: VehicleStage[];
}

export const GarageModal: React.FC<GarageModalProps> = ({ onClose, unlockedVehicles }) => {
  const [selectedStage, setSelectedStage] = useState<VehicleStage>('skateboard');
  const vehicle = VEHICLE_CONFIGS[selectedStage];

  const handleTestHorn = (stage: VehicleStage) => {
    soundManager.playHorn(stage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">VEHICLE PROGRESSION LOCKER</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Collect in-game 3D vehicle pickups along the road to unlock and upgrade each stage!
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4 overflow-y-auto pr-1">
          {/* Left Column: Stage Selector List */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Progression Stages (1 → 6)
            </span>
            {VEHICLE_STAGES.map((stageId, idx) => {
              const cfg = VEHICLE_CONFIGS[stageId];
              const isSelected = selectedStage === stageId;
              const isUnlocked = unlockedVehicles.includes(stageId);

              return (
                <button
                  key={stageId}
                  onClick={() => setSelectedStage(stageId)}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-sky-600/30 border-sky-400 text-white shadow-lg'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-xs font-black flex items-center justify-center text-slate-300">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm leading-tight">{cfg.name}</div>
                      <div className="text-xs text-slate-400">{cfg.bengaliName}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUnlocked && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-600/50 px-2 py-0.5 rounded-full font-bold">
                        UNLOCKED
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Vehicle Detail Card */}
          <div className="md:col-span-7 bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              {/* Vehicle Title & Bengali Name */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ backgroundColor: `${vehicle.primaryColor}25`, color: vehicle.primaryColor }}>
                    {vehicle.tagline}
                  </div>
                  <h3 className="text-2xl font-black text-white">{vehicle.name}</h3>
                  <div className="text-sm font-semibold text-sky-400">{vehicle.bengaliName}</div>
                </div>

                <button
                  onClick={() => handleTestHorn(selectedStage)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded-xl text-xs font-bold transition shadow"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>TEST HORN</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                {vehicle.description}
              </p>

              {/* Stats Meters */}
              <div className="mt-5 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-sky-400" /> Top Speed</span>
                    <span className="tabular-nums font-bold text-sky-400">{Math.floor(vehicle.maxSpeed * 3.6)} km/h</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-400 h-full rounded-full"
                      style={{ width: `${(vehicle.maxSpeed / 46) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Acceleration & Agility</span>
                    <span className="tabular-nums font-bold text-amber-400">{vehicle.acceleration} pts</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${(vehicle.acceleration / 18) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Vehicle Scale / Armor</span>
                    <span className="tabular-nums font-bold text-emerald-400">{vehicle.width}m × {vehicle.length}m</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${(vehicle.length / 6.5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Special Ability Pill */}
              <div className="mt-5 p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs">
                <span className="font-bold text-amber-400">Special Ability: </span>
                {selectedStage === 'skateboard' && 'Latch onto rear bumper of CNGs for high-speed towing + crouch slide under barriers!'}
                {selectedStage === 'bicycle' && 'Crisp urban weaving with rapid bunny hops and classic bell chimes.'}
                {selectedStage === 'motorcycle' && 'Aerodynamic highway drafting with blisteringly high top speed and sharp banking.'}
                {selectedStage === 'autorickshaw' && 'Rugged 3-wheel turning radius, durable chassis, and classic 2-stroke sputter.'}
                {selectedStage === 'cng' && 'Heavy traffic threading with protective green wire cage and high torque.'}
                {selectedStage === 'bus' && 'Massive lane presence that pushes through oncoming breezes with thunderous air horns!'}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 text-center">
              Milestone to spawn next vehicle pickup: <strong className="text-slate-200">{vehicle.requiredMilestone}m</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
