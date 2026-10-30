/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

class TextureFactory {
  private textures: Map<string, THREE.CanvasTexture> = new Map();
  private maxAnisotropy = 4;

  public setMaxAnisotropy(val: number) {
    this.maxAnisotropy = Math.max(1, Math.min(val, 16));
    this.textures.forEach((tex) => {
      tex.anisotropy = this.maxAnisotropy;
      tex.needsUpdate = true;
    });
  }

  // --- Road Surface Texture with authentic markings ---
  public getRoadTexture(): THREE.CanvasTexture {
    if (this.textures.has('road')) return this.textures.get('road')!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Asphalt dark base
    ctx.fillStyle = '#1e2124';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle asphalt grain (fast batch)
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const alpha = Math.random() * 0.08;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Outer edge curbs
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 24, 512);
    ctx.fillRect(512 - 24, 0, 24, 512);

    // Solid side safety lines
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(32, 0, 8, 512);
    ctx.fillRect(512 - 40, 0, 8, 512);

    // Central double yellow divider lines
    ctx.fillStyle = '#eab308';
    ctx.fillRect(252, 0, 5, 512);
    ctx.fillRect(259, 0, 5, 512);

    // Dashed lane dividers for 4 lanes
    ctx.fillStyle = '#f1f5f9';
    const dashLength = 32;
    const gapLength = 32;
    for (let y = 0; y < 512; y += dashLength + gapLength) {
      ctx.fillRect(140, y, 6, dashLength);
      ctx.fillRect(366, y, 6, dashLength);
    }

    // Occasional weathered manhole
    ctx.fillStyle = '#17191c';
    ctx.beginPath();
    ctx.arc(190, 256, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;

    this.textures.set('road', texture);
    return texture;
  }

  // --- Bangladeshi Taka Gold Coin Texture ---
  public getCoinTexture(): THREE.CanvasTexture {
    if (this.textures.has('coin')) return this.textures.get('coin')!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Outer coin ring
    const grad = ctx.createRadialGradient(128, 128, 30, 128, 128, 124);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.5, '#eab308');
    grad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    // Inner bevel ring
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 105, 0, Math.PI * 2);
    ctx.stroke();

    // Bengali Taka symbol "৳"
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('৳', 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    this.textures.set('coin', texture);
    return texture;
  }

  // --- Authentic Bengali Signboard Textures ---
  public getSignboardTexture(text: string, subtext: string, bgColor: string, textColor: string): THREE.CanvasTexture {
    const key = `sign_${text}_${bgColor}`;
    if (this.textures.has(key)) return this.textures.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    // Board background with border
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 160);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 148);

    // Main Bengali text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 56);

    // English/Sub text
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(subtext, 256, 112);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    this.textures.set(key, texture);
    return texture;
  }

  // --- Truck Art / Rickshaw Art Colorful Pattern ---
  public getRickshawArtTexture(primaryColor: string): THREE.CanvasTexture {
    const key = `rickshaw_art_${primaryColor}`;
    if (this.textures.has(key)) return this.textures.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Background base
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, 256, 256);

    // Classic Rickshaw Art radial starburst and floral petals
    ctx.save();
    ctx.translate(128, 128);
    const petals = 12;
    for (let i = 0; i < petals; i++) {
      ctx.rotate((Math.PI * 2) / petals);
      ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#ec4899';
      ctx.beginPath();
      ctx.ellipse(0, 48, 14, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Center lotus / medallion
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Border trim triangles
    for (let x = 0; x < 256; x += 32) {
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 16, 18);
      ctx.lineTo(x + 32, 0);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, 256);
      ctx.lineTo(x + 16, 238);
      ctx.lineTo(x + 32, 256);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    this.textures.set(key, texture);
    return texture;
  }

  // --- Bus Destination Placard ---
  public getBusDestinationTexture(title: string, route: string): THREE.CanvasTexture {
    const key = `bus_dest_${title}`;
    if (this.textures.has(key)) return this.textures.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Radiant yellow banner
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 120);

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 44);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(route, 256, 92);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    this.textures.set(key, texture);
    return texture;
  }

  // --- Vehicle Upgrade Pickup Beacon Hologram Ring ---
  public getPickupBeaconTexture(): THREE.CanvasTexture {
    if (this.textures.has('pickup_beacon')) return this.textures.get('pickup_beacon')!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
    grad.addColorStop(0.4, 'rgba(129, 140, 248, 0.7)');
    grad.addColorStop(0.8, 'rgba(236, 72, 153, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 90, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('pickup_beacon', texture);
    return texture;
  }

  // --- Building Windows Facade ---
  public getBuildingFacadeTexture(style: 'modern' | 'old_brick' | 'shop'): THREE.CanvasTexture {
    const key = `facade_${style}`;
    if (this.textures.has(key)) return this.textures.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    if (style === 'old_brick') {
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(0, 0, 256, 512);

      // Brick rows
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2;
      for (let y = 0; y < 512; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = style === 'modern' ? '#334155' : '#475569';
      ctx.fillRect(0, 0, 256, 512);
    }

    // Windows grid
    for (let y = 30; y < 480; y += 64) {
      for (let x = 20; x < 240; x += 55) {
        const lit = Math.random() > 0.4;
        ctx.fillStyle = lit ? '#fef08a' : '#1e293b';
        ctx.fillRect(x, y, 35, 42);

        // Window frame
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 35, 42);

        // Window dividers
        ctx.beginPath();
        ctx.moveTo(x + 17, y);
        ctx.lineTo(x + 17, y + 42);
        ctx.moveTo(x, y + 21);
        ctx.lineTo(x + 35, y + 21);
        ctx.stroke();

        // AC unit under window occasionally
        if (Math.random() > 0.6) {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(x + 4, y + 43, 27, 10);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 4, y + 43, 27, 10);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.set(key, texture);
    return texture;
  }

  // --- Rural Herringbone Brick Road Texture ---
  public getBrickRoadTexture(): THREE.CanvasTexture {
    if (this.textures.has('brick_road')) return this.textures.get('brick_road')!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Earthy reddish brick background
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 512, 512);

    // Herringbone 45-degree brick patterns
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 24) {
      for (let x = 0; x < 512; x += 48) {
        ctx.fillStyle = ((x + y) / 24) % 2 === 0 ? '#dc2626' : '#991b1b';
        ctx.fillRect(x, y, 46, 22);
        ctx.strokeRect(x, y, 46, 22);
      }
    }

    // Dirt edges on sides
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 28, 512);
    ctx.fillRect(512 - 28, 0, 28, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    this.textures.set('brick_road', texture);
    return texture;
  }

  // --- Grand Prix Racetrack with Red/White Curbs ---
  public getRaceTrackTexture(): THREE.CanvasTexture {
    if (this.textures.has('racetrack')) return this.textures.get('racetrack')!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Ultra dark smooth racing asphalt
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle tire rubber marks (skidlines)
    ctx.fillStyle = '#030712';
    for (let i = 0; i < 400; i++) {
      const x = 120 + Math.random() * 272;
      const y = Math.random() * 512;
      ctx.fillRect(x, y, 8, 20);
    }

    // High contrast red & white racing apex curbing along both sides
    const curbW = 32;
    const blockH = 40;
    for (let y = 0; y < 512; y += blockH) {
      const isRed = (y / blockH) % 2 === 0;
      ctx.fillStyle = isRed ? '#ef4444' : '#f8fafc';
      ctx.fillRect(0, y, curbW, blockH);
      ctx.fillRect(512 - curbW, y, curbW, blockH);
    }

    // Racing center dashed guide line
    ctx.fillStyle = '#facc15';
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(254, y, 4, 36);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    this.textures.set('racetrack', texture);
    return texture;
  }

  // --- Golden Beach Sand Texture ---
  public getSandTexture(): THREE.CanvasTexture {
    if (this.textures.has('sand')) return this.textures.get('sand')!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, 256, 256);

    // Warm sand grain
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(234, 179, 8, 0.4)' : 'rgba(202, 138, 4, 0.3)';
      ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.set('sand', texture);
    return texture;
  }
}

export const textureFactory = new TextureFactory();

