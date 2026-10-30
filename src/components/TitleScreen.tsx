/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Sparkles, HelpCircle, Settings, Award, MapPin, Users, Globe } from 'lucide-react';
import { PlayerStats, VEHICLE_CONFIGS } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  onStart: () => void;
  onOpenGarage: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onOpenMaps: () => void;
  onOpenMultiplayer: () => void;
  stats: PlayerStats;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenGarage,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenMaps,
  onOpenMultiplayer,
  stats,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between items-center p-4 sm:p-6 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 text-white select-none pointer-events-auto">
      {/* Top Bar: Banked Coins, Install PWA, & Best Record */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-700/80 shadow-md">
          <span className="text-amber-400 font-extrabold text-base">৳</span>
          <span className="font-black text-amber-300 tabular-nums">{stats.coins}</span>
          <span className="text-slate-400 text-xs hidden sm:inline">TAKA BANKED</span>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-700/80 shadow-md">
          <Award className="w-4 h-4 text-sky-400" />
          <span className="text-slate-400 text-xs hidden sm:inline">BEST:</span>
          <span className="font-black text-sky-300 tabular-nums">{stats.bestScore} PTS</span>
          <span className="text-slate-500 font-bold hidden sm:inline">({stats.bestDistance}m)</span>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto max-w-2xl px-4">
        {/* Bengali Subtitle Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 shadow-lg">
          <span className="text-rose-500 text-base">●</span>
          <span>বাংলাদেশ রোড ট্রাভেলার্স</span>
          <span className="text-xs text-emerald-400/80 font-normal">| 360° CAMERA & MULTIPLAYER</span>
        </div>

        {/* Bespoke SVG Title Lockup */}
        <div className="w-full max-w-md sm:max-w-xl my-1 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
          <svg viewBox="0 0 600 130" className="w-full h-auto">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="58"
              textAnchor="middle"
              fill="url(#titleGrad)"
              fontSize="48"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              letterSpacing="2"
            >
              ENDLESS RIDE
            </text>
            <text
              x="50%"
              y="110"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="44"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              letterSpacing="4"
              stroke="#0f172a"
              strokeWidth="4"
              paintOrder="stroke"
            >
              BANGLADESH
            </text>
          </svg>
        </div>

        {/* Tagline */}
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mt-1 mb-5 leading-relaxed">
          Ride 12 authentic vehicles across 9 iconic Bangladesh regions! Free 360° camera, in-game smartphone garage,
          automatic checkpoints, and real-time online multiplayer.
        </p>

        {/* Primary Start CTA Buttons: Offline Runner & Online Modes */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
          <button
            onClick={onStart}
            className="w-full sm:w-auto flex-1 group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-amber-500 hover:from-sky-400 hover:to-amber-400 active:scale-95 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-sky-500/40 border-2 border-white/20 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white text-white group-hover:scale-110 transition-transform" />
            <span>START ENDLESS RUN</span>
          </button>

          <button
            onClick={onOpenMultiplayer}
            className="w-full sm:w-auto flex-1 group inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-emerald-300 hover:text-white font-black text-sm sm:text-base rounded-2xl shadow-xl border-2 border-emerald-500/50 transition cursor-pointer"
          >
            <Globe className="w-5 h-5 text-emerald-400" />
            <span>ONLINE LOBBY</span>
          </button>
        </div>

        {/* Secondary Action Row: Garage, Maps, Rules, Settings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 w-full max-w-md">
          <button
            onClick={onOpenGarage}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-md text-xs font-bold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>GARAGE (12)</span>
          </button>

          <button
            onClick={onOpenMaps}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-md text-xs font-bold transition"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>MAPS (9)</span>
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-md text-xs font-bold transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>CONTROLS</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-md text-xs font-bold transition"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>SETTINGS</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-slate-500 font-medium text-center">
        <span>Endless Ride Bangladesh v3.0 • Mobile-First 3D • Render Multiplayer Connected</span>
      </div>
    </div>
  );
};
