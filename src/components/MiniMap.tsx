/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MinimapEntity } from '../types/game';
import { Compass, Eye, EyeOff } from 'lucide-react';

interface MiniMapProps {
  entities: MinimapEntity[];
  biomeName: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({ entities, biomeName }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto p-1.5 bg-slate-900/85 hover:bg-slate-800 text-sky-400 rounded-xl border border-slate-700/80 shadow-md flex items-center gap-1 text-[11px] font-bold"
        title="Show Radar"
      >
        <Compass className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">RADAR</span>
      </button>
    );
  }

  // Radar dimensions
  const mapWidth = 100;
  const mapHeight = 110;
  // World bounds in radar: X from -6 to +6m, Z from -10 to +80m
  const worldZRange = 90;
  const worldXRange = 14;

  const toScreenX = (worldX: number) => {
    return mapWidth / 2 + (worldX / worldXRange) * (mapWidth * 0.75);
  };

  const toScreenY = (worldZ: number) => {
    // Player is at z=0, positioned at Y = 85 (near bottom)
    const normalized = (worldZ + 10) / worldZRange;
    return mapHeight - normalized * mapHeight;
  };

  return (
    <div className="relative pointer-events-auto bg-slate-950/85 border border-slate-700/80 rounded-2xl shadow-xl p-2 select-none flex flex-col items-center">
      {/* Header bar with Biome Name & Collapse Toggle */}
      <div className="flex items-center justify-between w-full mb-1 text-[9px] font-bold text-slate-400 px-0.5">
        <span className="truncate max-w-[70px] text-sky-300 font-extrabold">{biomeName}</span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-slate-400 hover:text-white"
          title="Minimize Radar"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>

      {/* SVG Radar Display */}
      <svg width={mapWidth} height={mapHeight} className="overflow-hidden rounded-xl bg-slate-900/90 border border-slate-800">
        <defs>
          <linearGradient id="radarGrid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Road lane stripes */}
        <rect x="0" y="0" width={mapWidth} height={mapHeight} fill="url(#radarGrid)" />

        {/* Road Boundaries */}
        <line x1={mapWidth * 0.15} y1="0" x2={mapWidth * 0.15} y2={mapHeight} stroke="#334155" strokeWidth="1.5" />
        <line x1={mapWidth * 0.85} y1="0" x2={mapWidth * 0.85} y2={mapHeight} stroke="#334155" strokeWidth="1.5" />

        {/* Center Dash Line */}
        <line
          x1={mapWidth / 2}
          y1="0"
          x2={mapWidth / 2}
          y2={mapHeight}
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Dynamic World Entities */}
        {entities.map((e) => {
          const sx = toScreenX(e.x);
          const sy = toScreenY(e.z);

          if (e.type === 'pickup') {
            // Radiant pulsing next vehicle pickup star
            return (
              <g key={e.id} transform={`translate(${sx}, ${sy})`}>
                <circle r="6" fill="#38bdf8" opacity="0.4" />
                <circle r="3.5" fill="#facc15" stroke="#ffffff" strokeWidth="1" />
              </g>
            );
          }

          if (e.type === 'obstacle') {
            return (
              <rect
                key={e.id}
                x={sx - 3}
                y={sy - 1.5}
                width="6"
                height="3"
                fill="#f43f5e"
                rx="1"
              />
            );
          }

          // Traffic vehicles
          const color = e.type === 'cng' ? '#10b981' : e.type === 'bus' ? '#3b82f6' : '#f59e0b';
          const h = e.type === 'bus' ? 7 : 4;
          return (
            <rect
              key={e.id}
              x={sx - 2}
              y={sy - h / 2}
              width="4"
              height={h}
              fill={color}
              rx="1"
            />
          );
        })}

        {/* Hero Player Marker (triangle pointing forward) */}
        <polygon
          points={`${mapWidth / 2},${mapHeight - 16} ${mapWidth / 2 - 4},${mapHeight - 8} ${mapWidth / 2 + 4},${mapHeight - 8}`}
          fill="#38bdf8"
          stroke="#ffffff"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
