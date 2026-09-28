'use strict';
/* ==========================================================================
   VERMILION REQUIEM — fx.js
   Battle effects on the hi-res layer: additive slashes, beams, rings, sparks,
   ink drips that splatter onto a persistent paint layer.
   ========================================================================== */

const FX = {
  list: [], paintC: null, paintX: null,

  reset() {
    this.list.length = 0;
    if (!this.paintC) { [this.paintC, this.paintX] = mkCanvas(W, H); }
    this.paintX.clearRect(0, 0, W, H);
  },

  add(o) { o.t = 0; this.list.push(o); return o; },

  text(x, y, txt, col = '#fff', size = 12, o = {}) {
    return this.add(Object.assign({ type: 'text', x, y, txt, col, size, vy: -26, life: 0.95 }, o));
  },

  splat(x, y, col, n = 1, spread = 14) {
    const c = this.paintX;
    for (let k = 0; k < n; k++) {
      const px = Math.round(x + R.range(-spread, spread)), py = Math.round(y + R.range(-spread * 0.4, spread * 0.4));
      const r = R.int(1, 4);
      c.fillStyle = col; c.globalAlpha = R.range(0.55, 0.9);
      c.fillRect(px - r, py, r * 2, 1 + (r > 2 ? 1 : 0)); c.fillRect(px - 1, py - 1, 2, 2 + r);
      if (R.chance(0.5)) c.fillRect(px + R.int(-6, 6), py + R.int(-2, 2), 1, 1);
    }
    c.globalAlpha = 1;
  },

  sparks(x, y, col, n = 10, spd = 90, life = 0.45, size = 1.6) {
    const ps = [];
    for (let i = 0; i < n; i++) { const a = R.range(0, TAU), s = R.range(spd * 0.3, spd); ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, g: 120 }); }
    return this.add({ type: 'sparks', ps, col, life, size });
  },

  ink(x, y, col = '#e0384e', n = 10) {
    const ps = [];
    for (let i = 0; i < n; i++) { const a = R.range(-Math.PI, 0), s = R.range(30, 120); ps.push({ x, y, vx: Math.cos(a) * s * 0.8, vy: Math.sin(a) * s, g: 300, landed: false }); }
    return this.add({ type: 'ink', ps, col, life: 1.4, floor: y + 18 });
  },

  /* per-animation presets. (x0,y0)=attacker, (x1,y1)=target, col=element colour */
  preset(anim, x0, y0, x1, y1, col, big = false) {
    const ang = Math.atan2(y1 - y0, x1 - x0);
    switch (anim) {
      case 'slash':
        this.add({ type: 'slash', x: x1, y: y1, ang: ang + R.range(-0.9, 0.9), len: 26, col, life: 0.26 });
        this.sparks(x1, y1, col, 8, 90);
        break;
      case 'cleave':
        this.add({ type: 'slash', x: x1, y: y1, ang: -0.6, len: 40, col, life: 0.34, w: 5 });
        this.add({ type: 'slash', x: x1, y: y1, ang: 0.6, len: 34, col: '#fff', life: 0.3, w: 3 });
        this.sparks(x1, y1, col, 16, 130); Gfx.doShake(4);
        break;
      case 'pierce':
        this.add({ type: 'beam', x0, y0, x1, y1, col, life: 0.22, w: 4 });
        this.add({ type: 'ring', x: x1, y: y1, r: 4, r1: 26, col, life: 0.3 });
        this.sparks(x1, y1, col, 10, 100);
        break;
      case 'spin':
        for (let i = 0; i < 3; i++) this.add({ type: 'slash', x: x1, y: y1, ang: i * 2.09 + R.range(0, 1), len: 28, col, life: 0.3, w: 3, delay: i * 0.05 });
        this.add({ type: 'ring', x: x1, y: y1, r: 6, r1: 34, col, life: 0.35 });
        break;
      case 'shot':
        this.add({ type: 'ring', x: x0, y: y0, r: 2, r1: 12, col: '#ffe9a0', life: 0.12 });
        this.add({ type: 'beam', x0, y0, x1, y1, col: '#ffe9a0', life: 0.1, w: 1.6 });
        this.add({ type: 'ring', x: x1, y: y1, r: 2, r1: 15, col, life: 0.2 });
        this.sparks(x1, y1, col, 8, 100);
        break;
      case 'blast':
        this.add({ type: 'ring', x: x1, y: y1, r: 4, r1: 46, col, life: 0.45, w: 4 });
        this.add({ type: 'rays', x: x1, y: y1, n: 10, r: 40, col, life: 0.4 });
        this.sparks(x1, y1, col, 22, 150, 0.6, 2); Gfx.doShake(5);
        break;
      case 'burst':
        this.add({ type: 'rays', x: x1, y: y1, n: 14, r: 44, col, life: 0.45 });
        this.add({ type: 'ring', x: x1, y: y1, r: 4, r1: 36, col, life: 0.4 });
        this.add({ type: 'pillar', x: x1, y: y1, col, life: 0.45 });
        break;
      case 'beam':
        this.add({ type: 'beam', x0, y0, x1, y1, col, life: 0.34, w: 7 });
        this.add({ type: 'ring', x: x1, y: y1, r: 4, r1: 28, col, life: 0.3 });
        this.sparks(x1, y1, col, 12, 110);
        break;
      case 'ink':
        this.add({ type: 'ring', x: x1, y: y1, r: 4, r1: 30, col, life: 0.35 });
        this.ink(x1, y1 - 20, col, 12); this.sparks(x1, y1, col, 10, 80);
        break;
      case 'heal':
        this.add({ type: 'pillar', x: x1, y: y1, col: '#80ffb0', life: 0.7 });
        for (let i = 0; i < 12; i++) this.add({ type: 'mote', x: x1 + R.range(-14, 14), y: y1 + R.range(-6, 6), vy: R.range(-40, -14), col: '#a8ffc8', life: R.range(0.5, 0.9) });
        break;
      case 'buff':
        this.add({ type: 'ring', x: x1, y: y1, r: 20, r1: 6, col, life: 0.5, w: 2 });
        for (let i = 0; i < 8; i++) this.add({ type: 'mote', x: x1 + R.range(-12, 12), y: y1 + R.range(-4, 6), vy: R.range(-30, -10), col, life: R.range(0.4, 0.8) });
        break;
      default:
        this.sparks(x1, y1, col, 8, 90);
    }
  },

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      if (f.delay > 0) { f.delay -= dt; continue; }
      f.t += dt;
      if (f.type === 'text') { f.y += f.vy * dt; f.vy *= Math.pow(0.02, dt); }
      if (f.type === 'sparks' || f.type === 'ink') {
        for (const p of f.ps) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
          if (f.type === 'ink' && !p.landed && p.y >= f.floor) { p.landed = true; p.vx = p.vy = p.g = 0; this.splat(p.x, p.y, f.col, 1, 2); }
        }
      }
      if (f.type === 'mote') { f.y += f.vy * dt; f.x += Math.sin(f.t * 8) * 0.3; }
      if (f.t >= f.life) this.list.splice(i, 1);
    }
  },

  draw() {
    for (const f of this.list) {
      if (f.delay > 0) continue;
      const p = clamp(f.t / f.life, 0, 1);
      switch (f.type) {
        case 'text': {
          const pop = f.t < 0.12 ? 1 + (1 - f.t / 0.12) * 0.6 : 1;
          const a = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
          U.globalAlpha = a;
          U.font = `900 ${f.size * pop}px ${UI.fT}`; U.textAlign = 'center'; U.lineJoin = 'round';
          U.strokeStyle = '#120a1c'; U.lineWidth = 2.6; U.strokeText(f.txt, f.x, f.y);
          U.fillStyle = f.col; U.fillText(f.txt, f.x, f.y);
          U.globalAlpha = 1; break;
        }
        case 'slash': {
          U.save(); U.globalCompositeOperation = 'lighter'; U.translate(f.x, f.y); U.rotate(f.ang);
          const a0 = -1.0, a1 = -1.0 + 2.0 * Ease.out(Math.min(1, p * 1.6)), fade = 1 - p;
          U.lineCap = 'round';
          U.strokeStyle = rgba(f.col, 0.9 * fade); U.lineWidth = (f.w || 3) * (1 - p * 0.5);
          U.beginPath(); U.arc(-f.len * 0.4, 0, f.len, a0, a1); U.stroke();
          U.strokeStyle = `rgba(255,255,255,${0.9 * fade})`; U.lineWidth = Math.max(1, (f.w || 3) * 0.4);
          U.beginPath(); U.arc(-f.len * 0.4, 0, f.len, a0 + 0.1, a1); U.stroke();
          U.restore(); break;
        }
        case 'beam': {
          U.save(); U.globalCompositeOperation = 'lighter'; U.lineCap = 'round';
          const a = 1 - p;
          U.strokeStyle = rgba(f.col, 0.55 * a); U.lineWidth = f.w * 2 * (1 - p * 0.4); U.beginPath(); U.moveTo(f.x0, f.y0); U.lineTo(f.x1, f.y1); U.stroke();
          U.strokeStyle = `rgba(255,255,255,${0.95 * a})`; U.lineWidth = f.w * 0.7; U.beginPath(); U.moveTo(f.x0, f.y0); U.lineTo(f.x1, f.y1); U.stroke();
          U.restore(); break;
        }
        case 'ring': {
          const r = lerp(f.r, f.r1, Ease.out(p));
          U.save(); U.globalCompositeOperation = 'lighter'; U.strokeStyle = rgba(f.col, 0.9 * (1 - p)); U.lineWidth = (f.w || 2) * (1 - p * 0.6);
          U.beginPath(); U.arc(f.x, f.y, r, 0, TAU); U.stroke(); U.restore(); break;
        }
        case 'rays': {
          U.save(); U.globalCompositeOperation = 'lighter'; U.translate(f.x, f.y); U.strokeStyle = rgba(f.col, 0.9 * (1 - p)); U.lineWidth = 1.5;
          for (let i = 0; i < f.n; i++) { const a = i / f.n * TAU + f.t * 2, r0 = f.r * 0.15 + f.r * 0.5 * p, r1 = f.r * (0.3 + 0.7 * Ease.out(p)); U.beginPath(); U.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); U.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); U.stroke(); }
          U.restore(); break;
        }
        case 'pillar': {
          U.save(); U.globalCompositeOperation = 'lighter';
          const g = U.createLinearGradient(0, f.y - 90, 0, f.y + 6); g.addColorStop(0, rgba(f.col, 0)); g.addColorStop(1, rgba(f.col, 0.75 * (1 - p)));
          U.fillStyle = g; const w = 14 * (1 - p * 0.7); U.fillRect(f.x - w / 2, f.y - 90, w, 96); U.restore(); break;
        }
        case 'sparks': {
          U.save(); U.globalCompositeOperation = 'lighter'; U.globalAlpha = 1 - p; U.fillStyle = f.col;
          for (const q of f.ps) U.fillRect(q.x - f.size / 2, q.y - f.size / 2, f.size, f.size);
          U.fillStyle = '#fff'; for (let i = 0; i < f.ps.length; i += 3) U.fillRect(f.ps[i].x - 0.5, f.ps[i].y - 0.5, 1, 1);
          U.restore(); break;
        }
        case 'ink': {
          U.fillStyle = f.col; U.globalAlpha = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1;
          for (const q of f.ps) if (!q.landed) U.fillRect(q.x - 1, q.y - 1, 2, 3);
          U.globalAlpha = 1; break;
        }
        case 'mote': {
          U.save(); U.globalCompositeOperation = 'lighter'; U.globalAlpha = 1 - p; U.fillStyle = f.col; U.fillRect(f.x, f.y, 2, 2); U.restore(); break;
        }
      }
    }
  },
};
