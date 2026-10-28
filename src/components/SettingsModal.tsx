/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Volume2, Music, Monitor, RotateCcw, Sliders, Compass } from 'lucide-react';
import { GameSettings } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  onClose,
}) => {
  const handleSoundChange = (val: number) => {
    onUpdateSettings({ soundVolume: val });
    soundManager.setVolumes(val, settings.musicVolume);
  };

  const handleMusicChange = (val: number) => {
    onUpdateSettings({ musicVolume: val });
    soundManager.setVolumes(settings.soundVolume, val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 flex flex-col text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-xl font-black">GAME SETTINGS</h2>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-4">
          {/* Touch Gesture Sensitivity */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-400" /> Touch Steering Sensitivity
              </span>
              <span className="tabular-nums font-bold text-sky-400">{settings.touchSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.touchSensitivity}
              onChange={(e) => onUpdateSettings({ touchSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Precise (0.5x)</span>
              <span>Fast (2.0x)</span>
            </div>
          </div>

          {/* Minimap Radar Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Compass className="w-4 h-4 text-emerald-400" /> In-Game Radar Minimap
            </span>
            <button
              onClick={() => onUpdateSettings({ showMinimap: !settings.showMinimap })}
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition border ${
                settings.showMinimap
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {settings.showMinimap ? 'SHOWN' : 'HIDDEN'}
            </button>
          </div>

          {/* Sound FX Volume */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-400" /> Sound FX Volume
              </span>
              <span className="tabular-nums">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => handleSoundChange(parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-amber-400" /> Bangla Street Beat Music
              </span>
              <span className="tabular-nums">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Graphics Quality */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1.5">
              <Monitor className="w-4 h-4 text-emerald-400" /> Visual Quality
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition border ${
                    settings.graphicsQuality === q
                      ? 'bg-sky-600 border-sky-400 text-white shadow'
                      : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Save Data */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (window.confirm('Reset all saved high scores, banked coins, and unlocked progression?')) {
                  onResetData();
                }
              }}
              className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET SAVED PROGRESSION</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold rounded-2xl transition shadow-lg text-sm"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};
