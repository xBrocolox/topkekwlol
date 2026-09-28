'use strict';
/* ==========================================================================
   VERMILION REQUIEM — util.js
   Constants, seeded RNG, colour math, tweens, easing.
   ========================================================================== */

const W = 480, H = 270, TS = 16;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const sign = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

class RNG {
  constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  next() {
    let t = (this.s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
}
const R = new RNG((Date.now() ^ 0x5bd1e995) >>> 0);

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/* ---- colour ---- */
function hex2rgb(h) {
  if (h[0] === '#') h = h.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgb2hex = (r, g, b) =>
  '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
function mixc(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}
/* amt>0 lightens toward white, amt<0 darkens toward a cool black */
function shadeC(c, amt) {
  return amt >= 0 ? mixc(c, '#ffffff', amt) : mixc(c, '#0a0614', -amt);
}
const rgba = (c, a) => { const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`; };

/* ---- easing ---- */
const Ease = {
  lin: t => t,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  inout: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  bounce: t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

/* ---- tweens: `await Tw.add(sec, p => ...)` works anywhere ---- */
const Tw = {
  list: [],
  add(dur, fn, ease = Ease.lin) {
    return new Promise(res => this.list.push({ t: 0, dur: Math.max(dur, 0.0001), fn, ease, res }));
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const a = this.list[i];
      a.t += dt;
      const p = clamp(a.t / a.dur, 0, 1);
      try { a.fn(a.ease(p), p); } catch (e) { console.error(e); }
      if (p >= 1) { this.list.splice(i, 1); a.res(); }
    }
  },
  clear() { this.list.length = 0; },
};
const wait = s => Tw.add(s, () => {});

/* ---- tiny event/flag helpers ---- */
function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
