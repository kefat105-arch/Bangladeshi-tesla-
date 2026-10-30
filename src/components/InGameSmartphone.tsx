/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Car,
  MapPin,
  Users,
  Compass,
  ArrowRight,
  Shield,
  Wifi,
  Battery,
  Smartphone,
  Gauge,
  Zap,
  RotateCcw,
  Volume2,
  Check,
  ChevronRight,
  Play,
  Flame,
} from 'lucide-react';
import {
  VehicleStage,
  VEHICLE_CONFIGS,
  VEHICLE_STAGES,
  BiomeType,
  BIOME_CONFIGS,
  GameMode,
  VersusMatchFormat,
  SavedCheckpoint,
} from '../types/game';

interface InGameSmartphoneProps {
  isOpen: boolean;
  onClose: () => void;
  currentVehicle: VehicleStage;
  isDriving: boolean;
  onSpawnVehicle: (stage: VehicleStage) => void;
  onSelectMap: (mapId: BiomeType) => void;
  selectedMap: BiomeType | null;
  gameMode: GameMode;
  onSelectGameMode: (mode: GameMode, versusFormat?: VersusMatchFormat) => void;
  lastSavedCheckpoint: SavedCheckpoint | null;
  onSaveCheckpoint: () => void;
  multiplayerStatus: { status: string; ping: number };
}

export const InGameSmartphone: React.FC<InGameSmartphoneProps> = ({
  isOpen,
  onClose,
  currentVehicle,
  isDriving,
  onSpawnVehicle,
  onSelectMap,
  selectedMap,
  gameMode,
  onSelectGameMode,
  lastSavedCheckpoint,
  onSaveCheckpoint,
  multiplayerStatus,
}) => {
  const [currentApp, setCurrentApp] = useState<'home' | 'garage' | 'maps' | 'multiplayer' | 'checkpoint'>('garage');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'two_wheeler' | 'car' | 'traditional' | 'heavy'>('all');
  const [selectedVersusFormat, setSelectedVersusFormat] = useState<VersusMatchFormat>('1v1');

  if (!isOpen) return null;

  const allVehicles = VEHICLE_STAGES.map((id) => VEHICLE_CONFIGS[id]);
  const filteredVehicles = selectedCategory === 'all'
    ? allVehicles
    : allVehicles.filter((v) => v.category === selectedCategory);

  const allMaps = Object.values(BIOME_CONFIGS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      {/* Smartphone Device Frame */}
      <div className="relative w-full max-w-[390px] h-[92vh] max-h-[760px] bg-slate-900 text-white rounded-[44px] shadow-2xl border-4 border-slate-700/80 flex flex-col overflow-hidden ring-8 ring-black/40">
        {/* Dynamic Island / Camera Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Status Bar */}
        <div className="pt-2 px-6 pb-1 flex justify-between items-center text-[11px] font-semibold text-slate-300 z-30 select-none">
          <span>10:45</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-emerald-400 font-bold">5G</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <div className="flex items-center gap-0.5">
              <span>98%</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Phone Content Screen */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => (currentApp === 'home' ? onClose() : setCurrentApp('home'))}
              className="text-xs font-bold text-sky-400 flex items-center gap-1 active:opacity-70"
            >
              {currentApp === 'home' ? '✕ CLOSE' : '‹ APPS'}
            </button>
            <span className="text-xs font-black tracking-wider uppercase text-slate-200">
              {currentApp === 'home' && 'BANGLA OS 18'}
              {currentApp === 'garage' && 'DESHI GARAGE APP'}
              {currentApp === 'maps' && 'EXPLORE MAPS'}
              {currentApp === 'multiplayer' && 'MULTIPLAYER'}
              {currentApp === 'checkpoint' && 'GPS & SAVE'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full bg-slate-800 text-slate-400 active:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* HOME SCREEN APP ICONS */}
          {currentApp === 'home' && (
            <div className="flex-1 flex flex-col justify-between py-4">
              <div className="grid grid-cols-4 gap-4 pt-4">
                {/* Garage App */}
                <button
                  type="button"
                  onClick={() => setCurrentApp('garage')}
                  className="flex flex-col items-center gap-1.5 group active:scale-95 transition"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center shadow-lg border border-amber-400/40">
                    <Car className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">Garage</span>
                </button>

                {/* Maps App */}
                <button
                  type="button"
                  onClick={() => setCurrentApp('maps')}
                  className="flex flex-col items-center gap-1.5 group active:scale-95 transition"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg border border-emerald-400/40">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">Maps</span>
                </button>

                {/* Multiplayer App */}
                <button
                  type="button"
                  onClick={() => setCurrentApp('multiplayer')}
                  className="flex flex-col items-center gap-1.5 group active:scale-95 transition"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg border border-sky-400/40">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">Multiplayer</span>
                </button>

                {/* Checkpoint Save App */}
                <button
                  type="button"
                  onClick={() => setCurrentApp('checkpoint')}
                  className="flex flex-col items-center gap-1.5 group active:scale-95 transition"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg border border-purple-400/40">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">Save GPS</span>
                </button>
              </div>

              {/* Status Card at bottom of home screen */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 mt-auto">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Current Ride</span>
                  <span className="font-bold text-emerald-400">{VEHICLE_CONFIGS[currentVehicle]?.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Driving Status</span>
                  <span className={`font-bold ${isDriving ? 'text-sky-400' : 'text-amber-400'}`}>
                    {isDriving ? 'Behind the Wheel' : 'On Foot / Walking'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 1. GARAGE APP (VEHICLE DELIVERY & SPAWNING) */}
          {currentApp === 'garage' && (
            <div className="flex-1 flex flex-col gap-2">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {(['all', 'two_wheeler', 'car', 'traditional', 'heavy'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'all' && 'All Vehicles'}
                    {cat === 'two_wheeler' && 'Bikes & Cycles'}
                    {cat === 'car' && 'Cars & SUVs'}
                    {cat === 'traditional' && 'CNG / Rickshaw'}
                    {cat === 'heavy' && 'Heavy Bus'}
                  </button>
                ))}
              </div>

              {/* Vehicle List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {filteredVehicles.map((v) => {
                  const isCurrent = currentVehicle === v.id && isDriving;
                  return (
                    <div
                      key={v.id}
                      className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md flex flex-col gap-2 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-white">{v.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                              {v.bengaliName}
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-400 font-medium">{v.tagline}</p>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: v.primaryColor }}
                        />
                      </div>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] py-1 bg-slate-900/60 rounded-xl px-2">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Gauge className="w-3 h-3 text-sky-400" />
                          <span>{Math.round(v.maxSpeed * 3.6)} km/h</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Accel: {v.acceleration}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300">
                          <RotateCcw className="w-3 h-3 text-emerald-400" />
                          <span>Turn: {v.turnSpeed}</span>
                        </div>
                      </div>

                      {/* Spawn / Drive Action Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onSpawnVehicle(v.id);
                          onClose();
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg ${
                          isCurrent
                            ? 'bg-slate-700 text-slate-300 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>{isCurrent ? 'CURRENTLY DRIVING' : 'CALL & SPAWN VEHICLE'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. MAP EXPLORER APP */}
          {currentApp === 'maps' && (
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5">
              <p className="text-[11px] text-slate-400">
                Select your road environment. All roads generate procedurally without falling or gaps:
              </p>
              {allMaps.map((map) => {
                const isSelected = selectedMap === map.id;
                return (
                  <button
                    key={map.id}
                    type="button"
                    onClick={() => {
                      onSelectMap(map.id);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex flex-col gap-1 transition active:scale-98 ${
                      isSelected
                        ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-500/30'
                        : 'bg-slate-800/80 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{map.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-sky-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-amber-400">{map.bengaliName}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-2">{map.description}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. MULTIPLAYER LOBBY APP */}
          {currentApp === 'multiplayer' && (
            <div className="flex-1 flex flex-col gap-3 py-1">
              {/* Server Status Header */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Render Server Status</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    CONNECTED (Ping {multiplayerStatus.ping}ms)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Real-time synchronization for Free Roam and Versus Competition.
                </p>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-300">Choose Online Mode</span>

                {/* Free Roam */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectGameMode('freeroam');
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                    gameMode === 'freeroam'
                      ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black text-white block">ONLINE FREE ROAM</span>
                    <span className="text-[10px] text-slate-400">
                      Explore together, walk, run, drive any vehicle, stop anywhere.
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>

                {/* Versus Competition */}
                <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col gap-2">
                  <span className="text-xs font-black text-white">VERSUS RACE COMPETITION</span>
                  <span className="text-[10px] text-slate-400">
                    Synchronized race countdown, start line, and checkpoint placements!
                  </span>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {(['1v1', '2v2', '3v3', '4v4'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setSelectedVersusFormat(fmt)}
                        className={`py-1.5 rounded-xl text-xs font-black transition ${
                          selectedVersusFormat === fmt
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-650'
                        }`}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectGameMode('versus', selectedVersusFormat);
                      onClose();
                    }}
                    className="w-full py-2 mt-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                  >
                    <Flame className="w-4 h-4 text-amber-200" />
                    <span>START {selectedVersusFormat.toUpperCase()} RACE</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. GPS & CHECKPOINT SAVE APP */}
          {currentApp === 'checkpoint' && (
            <div className="flex-1 flex flex-col justify-between py-2">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700">
                  <span className="text-xs font-black text-white block mb-1">AUTOMATIC CHECKPOINT GATES</span>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Checkpoints appear every 350 meters along the road. When passed, your progress is automatically
                    saved. In Online Free Roam and Versus, collisions respawn you at your last saved checkpoint!
                  </p>
                </div>

                {lastSavedCheckpoint ? (
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-300 font-bold">Last Saved Checkpoint</span>
                      <span className="font-mono text-emerald-400">#{lastSavedCheckpoint.checkpointId}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 text-[11px]">
                      <span>Saved Distance</span>
                      <span className="font-bold">{lastSavedCheckpoint.distance} meters</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 text-[11px]">
                      <span>Vehicle</span>
                      <span className="font-bold">{VEHICLE_CONFIGS[lastSavedCheckpoint.vehicle]?.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-center text-xs text-slate-400">
                    No checkpoint passed yet in current run.
                  </div>
                )}
              </div>

              {/* Manual Save Button */}
              <button
                type="button"
                onClick={() => {
                  onSaveCheckpoint();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
              >
                <Shield className="w-4 h-4 text-purple-200" />
                <span>SAVE CHECKPOINT NOW 💾</span>
              </button>
            </div>
          )}
        </div>

        {/* Home Screen Indicator Bar */}
        <div className="py-2 flex justify-center bg-slate-950 z-30">
          <button
            type="button"
            onClick={() => setCurrentApp('home')}
            className="w-32 h-1 bg-slate-500 hover:bg-slate-300 rounded-full transition"
            aria-label="Home bar"
          />
        </div>
      </div>
    </div>
  );
};
