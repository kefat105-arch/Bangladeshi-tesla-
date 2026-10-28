/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VehicleStage } from '../types/game';

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundVolume = 0.8;
  private musicVolume = 0.5;
  private isMuted = false;
  private isMusicPlaying = false;
  private musicTimer: number | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private rollNoiseNode: AudioNode | null = null;
  private rollGain: GainNode | null = null;
  private currentVehicle: VehicleStage = 'skateboard';

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumes(sound: number, music: number) {
    this.soundVolume = Math.max(0, Math.min(1, sound));
    this.musicVolume = Math.max(0, Math.min(1, music));
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(this.soundVolume * 0.25, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      if (this.rollGain && this.ctx) {
        this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- Engine & Motion continuous sounds ---
  public startEngine(vehicle: VehicleStage) {
    this.initContext();
    if (!this.ctx) return;
    this.stopEngine();
    this.currentVehicle = vehicle;

    if (this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      if (vehicle === 'skateboard') {
        // Continuous rolling rumble: filtered noise
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320, now);
        filter.Q.setValueAtTime(2.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.soundVolume * 0.12, now);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        whiteNoise.start();

        this.rollNoiseNode = whiteNoise;
        this.rollGain = gain;
      } else {
        // Motorized or bicycle continuous sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        if (vehicle === 'bicycle') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(70, now);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(280, now);
          gain.gain.setValueAtTime(this.soundVolume * 0.08, now);
        } else if (vehicle === 'motorcycle') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(85, now);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(650, now);
          gain.gain.setValueAtTime(this.soundVolume * 0.22, now);
        } else if (vehicle === 'autorickshaw') {
          // 2-stroke sputter
          osc.type = 'square';
          osc.frequency.setValueAtTime(55, now);
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(450, now);
          gain.gain.setValueAtTime(this.soundVolume * 0.18, now);
        } else if (vehicle === 'cng') {
          // CNG peppy buzz
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(110, now);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(700, now);
          gain.gain.setValueAtTime(this.soundVolume * 0.2, now);
        } else {
          // Bus heavy diesel drone
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(42, now);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(350, now);
          gain.gain.setValueAtTime(this.soundVolume * 0.28, now);
        }

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();

        this.engineOsc = osc;
        this.engineFilter = filter;
        this.engineGain = gain;
      }
    } catch {
      // Audio fallback safe
    }
  }

  public updateEnginePitch(speedRatio: number) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const s = Math.max(0.5, Math.min(2.0, speedRatio));

    if (this.currentVehicle === 'skateboard' && this.rollGain) {
      this.rollGain.gain.setValueAtTime(this.soundVolume * 0.12 * s, now);
    } else if (this.engineOsc && this.engineFilter) {
      let baseFreq = 80;
      if (this.currentVehicle === 'bicycle') baseFreq = 70;
      else if (this.currentVehicle === 'motorcycle') baseFreq = 90;
      else if (this.currentVehicle === 'autorickshaw') baseFreq = 60;
      else if (this.currentVehicle === 'cng') baseFreq = 110;
      else if (this.currentVehicle === 'bus') baseFreq = 44;

      this.engineOsc.frequency.setTargetAtTime(baseFreq * (0.8 + s * 0.4), now, 0.05);
    }
  }

  public stopEngine() {
    if (this.engineOsc) {
      try { this.engineOsc.stop(); } catch {}
      this.engineOsc.disconnect();
      this.engineOsc = null;
    }
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
    if (this.rollNoiseNode) {
      try { (this.rollNoiseNode as AudioScheduledSourceNode).stop(); } catch {}
      this.rollNoiseNode.disconnect();
      this.rollNoiseNode = null;
    }
    if (this.rollGain) {
      this.rollGain.disconnect();
      this.rollGain = null;
    }
  }

  // --- Sound Effects ---

  public playCoin() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Arpeggiated shimmer
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(this.soundVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playJump() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Ollie pop / jump whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);

    gain.gain.setValueAtTime(this.soundVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSlide() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Asphalt scrape
    const bufferSize = this.ctx.sampleRate * 0.25;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.soundVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  public playHorn(vehicle: VehicleStage) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (vehicle === 'bicycle') {
      // Classic metal ding-dong
      [1400, 1850].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(this.soundVolume * 0.35, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.25);
      });
    } else if (vehicle === 'bus') {
      // Pneumatic dual-tone Dhaka air horn
      [220, 277].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(this.soundVolume * 0.45, now);
        gain.gain.linearRampToValueAtTime(this.soundVolume * 0.45, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      });
    } else {
      // Standard rickshaw/motorcycle horn
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(this.soundVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  public playVehicleUpgrade() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Radiant brass triumphant fanfare (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(this.soundVolume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });

    // Sub bass impact
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.4);
    subGain.gain.setValueAtTime(this.soundVolume * 0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.4);
  }

  public playSkitchLatch() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Metallic latch hook sound + spark
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.1);
    gain.gain.setValueAtTime(this.soundVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSkitchRelease() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Slingshot whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
    gain.gain.setValueAtTime(this.soundVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playNearMiss() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Doppler whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.2);
    gain.gain.setValueAtTime(this.soundVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playCrash() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Heavy crash impact
    const bufferSize = this.ctx.sampleRate * 0.6;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.soundVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    this.stopEngine();
  }

  public playSlap() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Arcade smack
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
    gain.gain.setValueAtTime(this.soundVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // --- Procedural Rhythmic Street Music ---
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.initContext();
    this.playMusicBar();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playMusicBar() {
    if (!this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx || this.isMuted || this.musicVolume <= 0.01) {
      this.musicTimer = window.setTimeout(() => this.playMusicBar(), 1800);
      return;
    }

    const bpm = 126;
    const beatDuration = 60 / bpm; // ~0.476 sec
    const now = this.ctx.currentTime;

    // 4-beat folk groove (Dhol & Tabla rhythmic synth pattern)
    // Pentatonic notes in D minor (D4, F4, G4, A4, C5)
    const melodyPattern = [293.66, 349.23, 392.0, 440.0, 523.25, 440.0, 392.0, 349.23];
    const drumAccents = [1, 0.5, 0.9, 0.6];

    for (let step = 0; step < 8; step++) {
      const stepTime = now + (step * beatDuration) / 2;
      const freq = melodyPattern[step % melodyPattern.length];

      // Subtle marimba-style bell pluck
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, stepTime);
      gain.gain.setValueAtTime(this.musicVolume * 0.12, stepTime);
      gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(stepTime);
      osc.stop(stepTime + 0.18);

      // Low beat on main steps
      if (step % 2 === 0) {
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kick.type = 'triangle';
        kick.frequency.setValueAtTime(110, stepTime);
        kick.frequency.exponentialRampToValueAtTime(45, stepTime + 0.12);
        const accent = drumAccents[Math.floor(step / 2) % drumAccents.length];
        kickGain.gain.setValueAtTime(this.musicVolume * 0.16 * accent, stepTime);
        kickGain.gain.exponentialRampToValueAtTime(0.01, stepTime + 0.14);
        kick.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kick.start(stepTime);
        kick.stop(stepTime + 0.14);
      }
    }

    // Schedule next bar (4 beats)
    this.musicTimer = window.setTimeout(() => {
      this.playMusicBar();
    }, beatDuration * 4 * 1000);
  }
}

export const soundManager = new SoundManager();
