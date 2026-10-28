/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sparkles, Zap, Shield, HelpCircle, ArrowRight } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl sm:text-2xl font-black">HOW TO PLAY</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Guide Body */}
        <div className="space-y-4 my-4 overflow-y-auto pr-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Rule 1: Vehicle Pickups & Progression */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-base mb-1.5">
              <Sparkles className="w-5 h-5" />
              <span>1. Physical Vehicle Pickups (Not Automatic!)</span>
            </div>
            <p>
              You start on a skateboard. When you travel far enough, a glowing 3D vehicle pickup will appear ahead on the road.
              <strong> You must steer into and collect the pickup</strong> to trigger the transformation!
            </p>
            <div className="mt-2 text-xs font-semibold text-slate-400 bg-slate-900/80 p-2 rounded-lg flex items-center gap-1.5">
              <span>Progression:</span>
              <span className="text-amber-400 font-bold">Skateboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="text-cyan-400 font-bold">Bicycle</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="text-rose-400 font-bold">Motorcycle</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="text-yellow-400 font-bold">Auto-Rickshaw</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="text-emerald-400 font-bold">CNG</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="text-blue-400 font-bold">Local Bus</span>
            </div>
          </div>

          {/* Rule 2: Skitching Behind CNGs */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-600/40">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base mb-1.5">
              <Zap className="w-5 h-5" />
              <span>2. The Skitch Tow Mechanic (Skateboard Only)</span>
            </div>
            <p>
              When riding a skateboard directly behind a moving green CNG or Auto-rickshaw, tap the <strong>SKITCH</strong> button (or Spacebar).
              Your skater will latch onto the rear bumper for high-speed towing and a massive 2.5x score multiplier! Tap jump to slingshot off safely.
            </p>
          </div>

          {/* Rule 3: Mobile Touch Gestures & Desktop Controls */}
          <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-600/40">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-base mb-1.5">
              <Shield className="w-5 h-5" />
              <span>3. Touchscreen Gestures & Desktop Controls</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Steer (Drag ◄ ► / A & D):</strong> Move your finger left or right across the screen for smooth steering without clumsy buttons.</li>
              <li><strong>Jump (Swipe ▲ / W / Up):</strong> Clear low barriers, road curbs, and fruit crates. You can even hop onto car roofs!</li>
              <li><strong>Slide (Swipe ▼ / S / Down):</strong> Crouch down to slide under high overhanging bamboo poles and low wires.</li>
              <li><strong>Skitch & Slap (Tap / Space / E):</strong> Latch onto CNG bumpers or bump nearby traffic cars and obstacles away.</li>
              <li><strong>Near-Misses:</strong> Weave close to passing traffic to trigger speed boosts and combo multipliers.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold rounded-2xl transition shadow-lg"
        >
          GOT IT, LET'S RIDE!
        </button>
      </div>
    </div>
  );
};
