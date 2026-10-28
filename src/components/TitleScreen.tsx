/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Sparkles, HelpCircle, Settings, Award } from 'lucide-react';
import { PlayerStats, VEHICLE_CONFIGS } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  onStart: () => void;
  onOpenGarage: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  stats: PlayerStats;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenGarage,
  onOpenHowToPlay,
  onOpenSettings,
  stats,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between items-center p-6 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 text-white select-none">
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

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto max-w-2xl px-4">
        {/* Bengali Subtitle Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 shadow-lg">
          <span className="text-rose-500 text-base">●</span>
          <span>বাংলাদেশ রোড ট্রাভেলার্স</span>
          <span className="text-xs text-emerald-400/80 font-normal">| DHAKA TO HIGHWAY</span>
        </div>

        {/* Bespoke SVG Title Lockup */}
        <div className="w-full max-w-md sm:max-w-xl my-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
          <svg viewBox="0 0 600 130" className="w-full h-auto">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
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
        <p className="text-sm sm:text-base text-slate-300 font-medium max-w-md mt-1 mb-6 leading-relaxed">
          Skate through Dhaka streets, latch onto green CNGs, dodge bustling traffic, and collect vehicle drops to rule the highway!
        </p>

        {/* Primary Start CTA Button */}
        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-4 bg-gradient-to-r from-sky-500 via-indigo-600 to-amber-500 hover:from-sky-400 hover:to-amber-400 active:scale-95 text-white font-black text-lg sm:text-2xl rounded-2xl shadow-2xl shadow-sky-500/40 border-2 border-white/20 transition-all duration-200 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform" />
          <span>START RIDE</span>
        </button>

        {/* Secondary Action Row: Garage, Rules, Settings */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onOpenGarage}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-md text-xs sm:text-sm font-bold transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>GARAGE (6 VEHICLES)</span>
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-md text-xs sm:text-sm font-bold transition"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>HOW TO PLAY</span>
          </button>

          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 shadow-md transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flat Control-Hint Line required by game craft directives */}
      <div className="w-full text-center text-xs text-slate-400/90 font-semibold tracking-wide">
        <span className="hidden sm:inline">A/D Steer · W Jump / Ollie · S Slide · Space/E Skitch/Slap · H Horn</span>
        <span className="sm:hidden">Drag finger to steer · Swipe ▲ Jump · Swipe ▼ Slide · Tap Skitch</span>
      </div>
    </div>
  );
};
