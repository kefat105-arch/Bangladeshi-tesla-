/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Check, MapPin, Compass, Navigation } from 'lucide-react';
import { BiomeType, BIOME_CONFIGS } from '../types/game';

interface MapSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMap: BiomeType | null;
  onSelectMap: (mapId: BiomeType | null) => void;
}

export const MapSelectModal: React.FC<MapSelectModalProps> = ({
  isOpen,
  onClose,
  selectedMap,
  onSelectMap,
}) => {
  if (!isOpen) return null;

  const maps = Object.values(BIOME_CONFIGS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                SELECT MAP & ROAD ENVIRONMENT
              </h2>
              <p className="text-xs text-slate-400">
                Choose from 9 authentic Bangladesh regions or dynamic procedural endless transitions
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

        {/* Endless Dynamic Mode Option */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-sm font-black text-amber-400 block">DYNAMIC ENDLESS WORLD</span>
            <span className="text-xs text-slate-300">
              Seamlessly shifts across all districts, bridges, and highways every 150 meters
            </span>
          </div>
          <button
            onClick={() => {
              onSelectMap(null);
              onClose();
            }}
            className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition ${
              selectedMap === null
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {selectedMap === null ? '✓ SELECTED' : 'CHOOSE DYNAMIC'}
          </button>
        </div>

        {/* 9 Map Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {maps.map((map) => {
            const isSelected = selectedMap === map.id;
            return (
              <div
                key={map.id}
                onClick={() => {
                  onSelectMap(map.id);
                  onClose();
                }}
                className={`group cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-400 ring-2 ring-emerald-500/30 shadow-xl'
                    : 'bg-slate-850/80 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                {/* Background preview banner gradient */}
                <div
                  className={`absolute inset-0 opacity-15 bg-gradient-to-br ${map.previewGradient} pointer-events-none`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white group-hover:text-emerald-300 transition">
                      {map.name}
                    </span>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-emerald-500 text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-amber-400 mb-1">{map.bengaliName}</div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1.5">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    <span>{map.location}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {map.description}
                  </p>
                </div>

                <div className="relative z-10 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="capitalize text-slate-400">Road: {map.roadType}</span>
                  <span className={`font-black uppercase tracking-wider ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {isSelected ? 'ACTIVE MAP' : 'SELECT MAP →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
