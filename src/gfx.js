'use strict';
/* ==========================================================================
   VERMILION REQUIEM — gfx.js
   Display pipeline + pixel-art toolkit + external asset override loader.

   Two layers are composed every frame:
     L  — a 480x270 "low" canvas. World, sprites, backdrops: pixel-perfect.
     U  — the hi-res display canvas, drawn in 480x270 game units.
          HUD, text, glows and particles: crisp at any resolution.
   ========================================================================== */

let L = null;   // low-res 2d context (world)
let U = null;   // hi-res 2d context (UI), scaled to game units

const Gfx = {
  canvas: null, low: null, k: 2, shake: 0, shakeT: 0, flash: 0, flashCol: '#fff',
  fade: 0, fadeCol: '#000', vignette: 0.55,

  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.low = document.createElement('canvas');
    this.low.width = W; this.low.height = H;
    L = this.low.getContext('2d');
    L.imageSmoothingEnabled = false;
    U = this.ctx;
    addEventListener('resize', () => this.resize());
    this.resize();
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth, vh = window.innerHeight;
    const fit = Math.min(vw / W, vh / H);
    const f = fit * dpr;
    let k = Math.floor(f);
    // integer scaling keeps pixels perfectly crisp; but if it would waste a lot of the screen
    // (phones, odd window sizes) use the fractional fit instead.
    if (k < 1 || f - k >= 0.4) k = Math.round(f * 100) / 100;
    k = Math.max(k, 0.5);
    this.k = k;
    this.canvas.width = Math.round(W * k);
    this.canvas.height = Math.round(H * k);
    this.canvas.style.width = (W * k / dpr) + 'px';
    this.canvas.style.height = (H * k / dpr) + 'px';
  },

  /* start of frame: clear world layer */
  begin() {
    L.setTransform(1, 0, 0, 1, 0, 0);
    L.globalAlpha = 1;
    L.globalCompositeOperation = 'source-over';
    L.fillStyle = '#000';
    L.fillRect(0, 0, W, H);
  },

  /* blit world layer, then leave U scaled to game units for the UI pass */
  present() {
    const c = this.ctx, k = this.k;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000';
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    let sx = 0, sy = 0;
    if (this.shake > 0.1) { sx = (Math.random() - 0.5) * this.shake * 2; sy = (Math.random() - 0.5) * this.shake * 2; }
    c.drawImage(this.low, Math.round(sx * k), Math.round(sy * k), Math.round(W * k), Math.round(H * k));
    c.setTransform(k, 0, 0, k, 0, 0);
    c.imageSmoothingEnabled = true;
    c.textBaseline = 'alphabetic';
  },

  /* screen-space post effects (after UI) */
  post() {
    const c = this.ctx;
    if (this.vignette > 0) {
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(6,2,14,${this.vignette})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    if (this.flash > 0.01) {
      c.globalAlpha = clamp(this.flash, 0, 1); c.fillStyle = this.flashCol; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    }
    if (this.fade > 0.001) {
      c.globalAlpha = clamp(this.fade, 0, 1); c.fillStyle = this.fadeCol; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    }
  },

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 40);
    this.flash = Math.max(0, this.flash - dt * 2.4);
  },
  doShake(n) { this.shake = Math.max(this.shake, n); },
  doFlash(col = '#fff', a = 0.8) { this.flashCol = col; this.flash = a; },
  fadeTo(v, sec = 0.5, col) {
    if (col) this.fadeCol = col;
    const from = this.fade;
    return Tw.add(sec, p => { this.fade = lerp(from, v, p); });
  },
};

/* ==========================================================================
   Pix — a tiny pixel-art painter over an offscreen canvas.
   Every primitive snaps to whole pixels. `sym` mirrors across the vertical
   centre axis (for creatures), which makes symmetric monsters trivial.
   ========================================================================== */
class Pix {
  constructor(w, h, pad = 1) {
    this.w = w; this.h = h; this.pad = pad;
    this.c = document.createElement('canvas');
    this.c.width = w + pad * 2; this.c.height = h + pad * 2;
    this.x = this.c.getContext('2d', { willReadFrequently: true });
    this.x.imageSmoothingEnabled = false;
    this.sym = false;
  }
  _p(x, y, c) { this.x.fillStyle = c; this.x.fillRect(x + this.pad, y + this.pad, 1, 1); }
  p(x, y, c) { x = Math.round(x); y = Math.round(y); this._p(x, y, c); if (this.sym) this._p(this.w - 1 - x, y, c); }
  r(x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    this.x.fillStyle = c;
    this.x.fillRect(x + this.pad, y + this.pad, w, h);
    if (this.sym) this.x.fillRect(this.w - x - w + this.pad, y + this.pad, w, h);
  }
  ell(cx, cy, rx, ry, c) {
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.p(x, y, c);
    }
  }
  line(x0, y0, x1, y1, c, th = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (th <= 1) this.p(x0, y0, c); else this.r(x0 - (th >> 1), y0 - (th >> 1), th, th, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  poly(pts, c) {
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (const [x, y] of pts) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
    for (let y = Math.floor(miny); y <= Math.ceil(maxy); y++) for (let x = Math.floor(minx); x <= Math.ceil(maxx); x++) {
      let inside = false;
      const px = x + 0.5, py = y + 0.5;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) this.p(x, y, c);
    }
  }
  /* pixel-art dither fill of a rect region masked to existing alpha */
  noise(seed, density, col, region) {
    const rng = new RNG(seed);
    const img = this.x.getImageData(0, 0, this.c.width, this.c.height);
    const [r, g, b] = hex2rgb(col);
    const [rx0, ry0, rx1, ry1] = region || [0, 0, this.c.width, this.c.height];
    for (let y = ry0; y < ry1; y++) for (let x = rx0; x < rx1; x++) {
      const i = (y * this.c.width + x) * 4;
      if (img.data[i + 3] > 0 && rng.next() < density) { img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; }
    }
    this.x.putImageData(img, 0, 0);
  }
  /* rim-light + outline: the trick that makes procedural sprites read as art */
  finish(o = {}) {
    const outline = o.outline === undefined ? '#150d1f' : o.outline;
    const hi = o.hi === undefined ? 0.22 : o.hi;
    const lo = o.lo === undefined ? 0.3 : o.lo;
    const cw = this.c.width, ch = this.c.height;
    const img = this.x.getImageData(0, 0, cw, ch);
    const d = img.data;
    const out = new Uint8ClampedArray(d);
    const A = (x, y) => (x < 0 || y < 0 || x >= cw || y >= ch ? 0 : d[(y * cw + x) * 4 + 3]);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4;
      if (d[i + 3] < 128) continue;
      let amt = 0;
      if (A(x, y - 1) < 128 || A(x - 1, y) < 128) amt = hi;
      else if (A(x, y + 1) < 128 || A(x + 1, y) < 128) amt = -lo;
      else if (o.vshade) amt = -o.vshade * (y / ch);
      if (amt) {
        const c = shadeC(rgb2hex(d[i], d[i + 1], d[i + 2]), amt);
        const [r, g, b] = hex2rgb(c);
        out[i] = r; out[i + 1] = g; out[i + 2] = b;
      }
    }
    if (outline) {
      const [or, og, ob] = hex2rgb(outline);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const i = (y * cw + x) * 4;
        if (d[i + 3] >= 128) continue;
        if (A(x, y - 1) >= 128 || A(x, y + 1) >= 128 || A(x - 1, y) >= 128 || A(x + 1, y) >= 128) {
          out[i] = or; out[i + 1] = og; out[i + 2] = ob; out[i + 3] = 255;
        }
      }
    }
    img.data.set(out);
    this.x.putImageData(img, 0, 0);
    return this.c;
  }
}

function mkCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  return [c, x];
}
function flipH(src) {
  const [c, x] = mkCanvas(src.width, src.height);
  x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
  return c;
}
function tint(src, col, a) {
  const [c, x] = mkCanvas(src.width, src.height);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.globalAlpha = a; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return c;
}
/* white silhouette (for hit flashes) */
function silhouette(src, col = '#fff') { return tint(src, col, 1); }

/* ==========================================================================
   Assets — optional external art. Drop PNGs into assets/ai/ with the
   documented names and they replace the procedural version automatically.
   ========================================================================== */
const Assets = {
  img: {}, base: 'assets/ai/', loaded: 0,
  keys() { return (typeof window !== 'undefined' && window.VR_ASSETS) || []; },
  load() {
    const keys = this.keys();
    return Promise.all(keys.map(k => new Promise(res => {
      const i = new Image();
      i.onload = () => {
        // sprites: knock out a flat background if the image has no transparency
        this.img[k] = /^(battle|enemy)_/.test(k) ? this.cutout(i) : i; this.loaded++; res();
      };
      i.onerror = () => { console.warn('asset failed to load: ' + k); res(); };
      i.src = this.base + k + '.png';
    })));
  },
  /* Flood-fill from the corners removing pixels close to the corner colour. */
  cutout(im) {
    try {
      const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, w, h), px = d.data;
      const at = (i) => i * 4;
      if ([0, w - 1, (h - 1) * w, h * w - 1].some(i => px[at(i) + 3] < 250)) return c; // already has transparency
      const cs = [0, w - 1, (h - 1) * w, h * w - 1].map(i => [px[at(i)], px[at(i) + 1], px[at(i) + 2]]);
      const ref = cs[0], tol = 46;
      const near = (i) => Math.abs(px[at(i)] - ref[0]) + Math.abs(px[at(i) + 1] - ref[1]) + Math.abs(px[at(i) + 2] - ref[2]) < tol * 3 / 1.6;
      const seen = new Uint8Array(w * h), stack = [0, w - 1, (h - 1) * w, h * w - 1];
      while (stack.length) {
        const i = stack.pop(); if (seen[i] || !near(i)) continue;
        seen[i] = 1; px[at(i) + 3] = 0;
        const xx = i % w, yy = (i / w) | 0;
        if (xx > 0) stack.push(i - 1); if (xx < w - 1) stack.push(i + 1); if (yy > 0) stack.push(i - w); if (yy < h - 1) stack.push(i + w);
      }
      x.putImageData(d, 0, 0);
      return c;
    } catch (e) { return im; }
  },
  has(k) { return !!this.img[k]; },
  /* smooth-downscale an external image to a target box, preserving aspect */
  fit(k, w, h, mode = 'contain') {
    const im = this.img[k]; if (!im) return null;
    const s = mode === 'cover' ? Math.max(w / im.width, h / im.height) : Math.min(w / im.width, h / im.height);
    const cw = mode === 'cover' ? w : Math.max(1, Math.round(im.width * s));
    const ch = mode === 'cover' ? h : Math.max(1, Math.round(im.height * s));
    const [c, x] = mkCanvas(cw, ch);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    if (mode === 'cover') x.drawImage(im, (w - im.width * s) / 2, (h - im.height * s) / 2, im.width * s, im.height * s);
    else x.drawImage(im, 0, 0, cw, ch);
    return c;
  },
};
