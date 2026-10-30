/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Users, Globe, Flame, Shield, Play, Check, ChevronRight, User, Signal } from 'lucide-react';
import { GameMode, VersusMatchFormat } from '../types/game';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: GameMode;
  onSelectMode: (mode: GameMode, versusFormat?: VersusMatchFormat) => void;
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  multiplayerStatus: { status: string; ping: number };
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  gameMode,
  onSelectMode,
  playerName,
  onUpdatePlayerName,
  multiplayerStatus,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<VersusMatchFormat>('1v1');
  const [tempName, setTempName] = useState(playerName);

  if (!isOpen) return null;

  const handleNameBlur = () => {
    if (tempName.trim()) {
      onUpdatePlayerName(tempName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                ONLINE MULTIPLAYER & MODES
              </h2>
              <p className="text-xs text-slate-400">
                Play Offline Endless Runner or join Online Free Roam and Versus Races
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server & Player Profile Banner */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Racer Call-sign:</span>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameBlur}
              maxLength={18}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Signal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Render Server:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE ({multiplayerStatus.ping}ms)
            </span>
          </div>
        </div>

        {/* Modes Options */}
        <div className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto">
          {/* 1. Offline Endless Runner */}
          <div
            onClick={() => {
              onSelectMode('runner');
              onClose();
            }}
            className={`cursor-pointer p-4 rounded-2xl border transition flex items-center justify-between ${
              gameMode === 'runner'
                ? 'bg-slate-800 border-sky-400 ring-2 ring-sky-500/30'
                : 'bg-slate-850 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 mt-0.5">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">OFFLINE MAIN ENDLESS RUNNER</span>
                  {gameMode === 'runner' && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-500 text-slate-950 font-bold text-[10px]">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  The classic 3D arcade runner. Starts from the overhead start line banner. Steer, jump, slide, collect
                  coins, and upgrade vehicles. If you crash, Game Over restarts from the beginning!
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
          </div>

          {/* 2. Online Free Roam */}
          <div
            onClick={() => {
              onSelectMode('freeroam');
              onClose();
            }}
            className={`cursor-pointer p-4 rounded-2xl border transition flex items-center justify-between ${
              gameMode === 'freeroam'
                ? 'bg-slate-800 border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-slate-850 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mt-0.5">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">ONLINE FREE ROAM EXPLORATION</span>
                  {gameMode === 'freeroam' && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-bold text-[10px]">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Freely explore roads together. Walk on foot, drive spawned cars, stop anywhere, and see other players in
                  real-time. Collisions respawn you safely at your last saved checkpoint!
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
          </div>

          {/* 3. Online Versus Competition */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 mt-0.5">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">ONLINE VERSUS COMPETITION</span>
                  {gameMode === 'versus' && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-bold text-[10px]">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Head-to-head multiplayer race! Starts together at the starting line with synchronized countdown.
                  Checkpoints and finish line placements tracked through the server.
                </p>
              </div>
            </div>

            {/* Match Format Selector */}
            <div className="pt-2 border-t border-slate-750 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400">Select Match Format:</span>
              <div className="grid grid-cols-4 gap-2">
                {(['1v1', '2v2', '3v3', '4v4'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`py-2 rounded-xl text-xs font-black transition ${
                      selectedFormat === fmt
                        ? 'bg-rose-600 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectMode('versus', selectedFormat);
                  onClose();
                }}
                className="w-full py-3 mt-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:opacity-95 active:scale-98 transition"
              >
                <Flame className="w-4 h-4 text-amber-200" />
                <span>START {selectedFormat.toUpperCase()} VERSUS MATCH</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
