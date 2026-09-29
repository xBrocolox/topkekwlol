'use strict';
/* ==========================================================================
   VERMILION REQUIEM — ui.js
   Belle-Époque UI kit drawn on the hi-res layer (game units): panels, text,
   bars, dialogue with portraits, list menus, toasts and title banners.
   ========================================================================== */

const UI = {
  fT: '"Cinzel", "Trajan Pro", "Times New Roman", serif',
  fB: '"Cormorant Garamond", "Palatino Linotype", Georgia, serif',
  fM: '"Share Tech Mono", "Courier New", monospace',
  ink: '#f4ecda', gold: '#e8c868', red: '#e0384e', dim: '#9a90a8', vio: '#a878e8', cy: '#30e2d2', green: '#7ae0a0',
  t: 0,

  panel(x, y, w, h, o = {}) {
    const a = o.a === undefined ? 0.93 : o.a;
    const g = U.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, o.top || `rgba(30,20,58,${a})`); g.addColorStop(1, o.bot || `rgba(10,6,24,${a})`);
    U.fillStyle = g; U.fillRect(x, y, w, h);
    const bc = o.border || '#c9a24a', ic = o.inner || '#7a1a2c';
    U.strokeStyle = bc; U.lineWidth = 1; U.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    U.strokeStyle = ic; U.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    U.fillStyle = bc;
    for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
      U.beginPath(); U.moveTo(cx, cy - 3); U.lineTo(cx + 3, cy); U.lineTo(cx, cy + 3); U.lineTo(cx - 3, cy); U.closePath(); U.fill();
    }
  },

  text(str, x, y, o = {}) {
    const size = o.size || 9;
    U.font = `${o.weight || 700} ${size}px ${o.font || this.fB}`;
    U.textAlign = o.align || 'left';
    U.textBaseline = 'alphabetic';
    if (o.alpha !== undefined) U.globalAlpha = o.alpha;
    if (o.shadow !== false) { U.fillStyle = o.shadowCol || 'rgba(6,2,14,0.9)'; U.fillText(str, x + 0.6, y + 0.6); }
    U.fillStyle = o.col || this.ink;
    U.fillText(str, x, y);
    if (o.alpha !== undefined) U.globalAlpha = 1;
  },
  title(str, x, y, size = 14, col = this.gold, align = 'left') { this.text(str, x, y, { size, col, font: this.fT, align, weight: 700 }); },
  mono(str, x, y, o = {}) { this.text(str, x, y, Object.assign({ font: this.fM, weight: 400, size: 8 }, o)); },

  measure(str, size = 9, font = this.fB, weight = 700) { U.font = `${weight} ${size}px ${font}`; return U.measureText(str).width; },
  wrap(str, maxW, size = 10, font = this.fB) {
    U.font = `700 ${size}px ${font}`;
    const out = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const w of para.split(' ')) {
        const t = line ? line + ' ' + w : w;
        if (U.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  },

  bar(x, y, w, h, pct, col, bg = 'rgba(0,0,0,0.6)', o = {}) {
    U.fillStyle = bg; U.fillRect(x, y, w, h);
    pct = clamp(pct, 0, 1);
    if (o.grad) { const g = U.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, o.grad); g.addColorStop(1, col); U.fillStyle = g; } else U.fillStyle = col;
    U.fillRect(x, y, w * pct, h);
    U.fillStyle = 'rgba(255,255,255,0.22)'; U.fillRect(x, y, w * pct, Math.max(1, h * 0.35));
    U.strokeStyle = o.border || 'rgba(232,200,104,0.55)'; U.lineWidth = 0.6; U.strokeRect(x + 0.3, y + 0.3, w - 0.6, h - 0.6);
  },

  /* soft additive glow */
  glow(x, y, r, col, a = 0.6) {
    const g = U.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    const prev = U.globalCompositeOperation; U.globalCompositeOperation = 'lighter';
    U.fillStyle = g; U.fillRect(x - r, y - r, r * 2, r * 2); U.globalCompositeOperation = prev;
  },

  icon(kind, x, y, s = 6, col = '#fff') {
    U.fillStyle = col; U.strokeStyle = col; U.lineWidth = 1;
    if (kind === 'diamond') { U.beginPath(); U.moveTo(x, y - s); U.lineTo(x + s, y); U.lineTo(x, y + s); U.lineTo(x - s, y); U.closePath(); U.fill(); }
    if (kind === 'arrow') { U.beginPath(); U.moveTo(x - s, y - s); U.lineTo(x + s, y); U.lineTo(x - s, y + s); U.closePath(); U.fill(); }
  },

  tick(dt) { this.t += dt; },
};

/* ------------------------------------------------------------------------
   Toasts & banners
   ------------------------------------------------------------------------ */
const Toast = {
  list: [],
  add(msg, col = UI.gold) { this.list.push({ msg, col, t: 0 }); if (this.list.length > 3) this.list.shift(); },
  update(dt) { for (const t of this.list) t.t += dt; this.list = this.list.filter(t => t.t < 3.2); },
  draw() {
    let y = 20;
    for (const t of this.list) {
      const a = t.t < 0.25 ? t.t / 0.25 : t.t > 2.7 ? (3.2 - t.t) / 0.5 : 1;
      const w = UI.measure(t.msg, 10) + 24;
      U.globalAlpha = clamp(a, 0, 1);
      UI.panel(W / 2 - w / 2, y - 10, w, 18, { a: 0.9 });
      UI.text(t.msg, W / 2, y + 3, { size: 10, col: t.col, align: 'center' });
      U.globalAlpha = 1; y += 22;
    }
  },
};

const Banner = {
  cur: null,
  show(title, sub, dur = 3.2) { this.cur = { title, sub, t: 0, dur }; return wait(dur); },
  update(dt) { if (this.cur) { this.cur.t += dt; if (this.cur.t > this.cur.dur) this.cur = null; } },
  draw() {
    const b = this.cur; if (!b) return;
    const a = b.t < 0.7 ? b.t / 0.7 : b.t > b.dur - 0.8 ? (b.dur - b.t) / 0.8 : 1;
    U.globalAlpha = clamp(a, 0, 1);
    U.fillStyle = 'rgba(0,0,0,0.55)'; U.fillRect(0, H / 2 - 34, W, 68);
    U.fillStyle = '#c9a24a'; U.fillRect(W / 2 - 90 * a, H / 2 - 34, 180 * a, 1); U.fillRect(W / 2 - 90 * a, H / 2 + 33, 180 * a, 1);
    UI.text(b.title, W / 2, H / 2 - 2, { size: 20, font: UI.fT, col: UI.gold, align: 'center' });
    if (b.sub) UI.text(b.sub, W / 2, H / 2 + 18, { size: 11, col: '#e8d8c8', align: 'center', weight: 500 });
    U.globalAlpha = 1;
  },
};

/* ------------------------------------------------------------------------
   Dialogue — typewriter text, portraits, choices. `await Dlg.say(...)`.
   ------------------------------------------------------------------------ */
const NAMECOL = { Vesper: '#ff6a7e', Gaspard: '#6ad0e0', Ilse: '#c0a0ff', Tally: '#50f0e0', 'The Curator': '#f6f0e6', Oriel: '#7ae0a0', Aura: '#a8dcff', Cosette: '#f0d8b8' };
const LOOK_FOR = { Vesper: 'vesper', Gaspard: 'gaspard', Ilse: 'ilse', Tally: 'tally', 'The Curator': 'curator', Oriel: 'oriel', Aura: 'aura', Cosette: 'singer' };

const Dlg = {
  st: null, choice: null, resolve: null,
  get active() { return !!(this.st || this.choice); },

  say(name, text, o = {}) {
    return new Promise(res => {
      const look = o.look || LOOK_FOR[name] || null;
      const hasP = !!(look && LOOKS[look]);
      const maxW = hasP ? 318 : 396;
      const lines = UI.wrap(text, maxW, 10.5);
      const pages = [];
      for (let i = 0; i < lines.length; i += 3) pages.push(lines.slice(i, i + 3));
      this.st = { name, look, expr: o.expr || 'n', pages, p: 0, c: 0, hasP, res, done: false, t: 0, col: o.col || NAMECOL[name] || UI.gold, sfx: o.sfx };
      Input.flush();
    });
  },
  /* narration with no speaker */
  narrate(text, o = {}) { return this.say('', text, Object.assign({ look: null }, o)); },

  ask(options, o = {}) {
    return new Promise(res => { this.choice = { options, sel: 0, res, title: o.title || null }; Input.flush(); });
  },

  update(dt) {
    if (this.choice) {
      const c = this.choice;
      if (Input.rep('up')) { c.sel = (c.sel + c.options.length - 1) % c.options.length; Snd.sfx('blip'); }
      if (Input.rep('down')) { c.sel = (c.sel + 1) % c.options.length; Snd.sfx('blip'); }
      if (Input.hit('ok')) { const r = c.res, s = c.sel; this.choice = null; Snd.sfx('ok'); r(s); }
      return true;
    }
    const s = this.st; if (!s) return false;
    s.t += dt;
    const page = s.pages[s.p].join('\n');
    const spd = (Game.settings && Game.settings.textSpeed) || 55;
    if (!s.done) {
      const prev = Math.floor(s.c);
      s.c += dt * spd;
      const now = Math.floor(s.c);
      if (now > prev && now % 3 === 0 && s.name && page[now - 1] !== ' ') Snd.sfx('talk', s.name);
      if (s.c >= page.length) { s.c = page.length; s.done = true; }
      if (Input.hit('ok') || Input.hit('cancel')) { s.c = page.length; s.done = true; }
    } else if (Input.hit('ok') || Input.hit('cancel')) {
      if (s.p < s.pages.length - 1) { s.p++; s.c = 0; s.done = false; Snd.sfx('blip'); }
      else { const r = s.res; this.st = null; r(); }
    }
    return true;
  },

  draw() {
    const s = this.st;
    if (s) {
      const x = 12, y = 192, w = W - 24, h = 66;
      UI.panel(x, y, w, h, { a: 0.94 });
      let tx = x + 12;
      if (s.hasP) {
        const pc = Art.portrait(s.look, s.expr);
        U.fillStyle = 'rgba(0,0,0,0.5)'; U.fillRect(x + 6, y + 1, 66, 64);
        if (pc) { U.imageSmoothingEnabled = false; U.drawImage(pc, x + 5, y + 0, 66, 66); U.imageSmoothingEnabled = true; }
        U.strokeStyle = '#c9a24a'; U.lineWidth = 0.8; U.strokeRect(x + 5.5, y + 0.5, 65, 65);
        tx = x + 80;
      }
      if (s.name) {
        const nw = UI.measure(s.name, 11, UI.fT, 700) + 22;
        UI.panel(x + 8, y - 11, nw, 15, { a: 0.97 });
        UI.text(s.name, x + 8 + nw / 2, y + 0.5, { size: 10.5, font: UI.fT, col: s.col, align: 'center' });
      }
      const page = s.pages[s.p].join('\n').slice(0, Math.floor(s.c)).split('\n');
      const italic = !s.name;
      page.forEach((ln, i) => UI.text(ln, tx, y + 18 + i * 14, { size: 10.5, col: italic ? '#d8ccf0' : UI.ink, weight: italic ? 500 : 700 }));
      if (s.done) {
        const bob = Math.sin(UI.t * 6) * 1.5;
        UI.icon('arrow', x + w - 12, y + h - 10 + bob, 3, UI.gold);
      }
    }
    const c = this.choice;
    if (c) {
      const w = Math.max(...c.options.map(o => UI.measure(o, 10.5))) + 34, h = c.options.length * 16 + 12;
      const x = W - w - 24, y = 186 - h;
      UI.panel(x, y, w, h);
      if (c.title) UI.text(c.title, x + w / 2, y - 4, { size: 9, col: UI.gold, align: 'center' });
      c.options.forEach((o, i) => {
        const on = i === c.sel;
        if (on) { U.fillStyle = 'rgba(224,56,78,0.28)'; U.fillRect(x + 4, y + 6 + i * 16, w - 8, 15); UI.icon('diamond', x + 12, y + 14 + i * 16, 3, UI.red); }
        UI.text(o, x + 22, y + 17 + i * 16, { size: 10.5, col: on ? '#fff' : UI.dim });
      });
    }
  },
};

/* ------------------------------------------------------------------------
   ListMenu — reusable vertical list with scrolling, descriptions, columns.
   ------------------------------------------------------------------------ */
class ListMenu {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, w: 140, rows: 6, items: [], sel: 0, top: 0, rowH: 14, size: 10, active: true, panel: true, title: null, keepSel: true }, o);
  }
  get cur() { return this.items[this.sel]; }
  setItems(items) { this.items = items; this.sel = clamp(this.sel, 0, Math.max(0, items.length - 1)); this.clampTop(); }
  clampTop() { if (this.sel < this.top) this.top = this.sel; if (this.sel >= this.top + this.rows) this.top = this.sel - this.rows + 1; this.top = clamp(this.top, 0, Math.max(0, this.items.length - this.rows)); }
  /* returns 'ok' | 'cancel' | null */
  update() {
    if (!this.active) return null;
    const n = this.items.length;
    if (n) {
      if (Input.rep('down')) { this.sel = (this.sel + 1) % n; Snd.sfx('blip'); this.clampTop(); if (this.onMove) this.onMove(this.cur); }
      if (Input.rep('up')) { this.sel = (this.sel + n - 1) % n; Snd.sfx('blip'); this.clampTop(); if (this.onMove) this.onMove(this.cur); }
      if (this.cols === 2) {
        if (Input.rep('right') && this.sel + 1 < n) { this.sel++; Snd.sfx('blip'); this.clampTop(); }
        if (Input.rep('left') && this.sel > 0) { this.sel--; Snd.sfx('blip'); this.clampTop(); }
      }
      if (Input.hit('ok')) { if (this.cur && this.cur.disabled) { Snd.sfx('no'); return null; } Snd.sfx('ok'); return 'ok'; }
    }
    if (Input.hit('cancel')) { Snd.sfx('back'); return 'cancel'; }
    return null;
  }
  draw() {
    const { x, y, w } = this;
    const h = this.rows * this.rowH + 10;
    if (this.panel) UI.panel(x, y, w, h);
    if (this.title) UI.text(this.title, x + 8, y - 3, { size: 9, col: UI.gold, font: UI.fT });
    const end = Math.min(this.items.length, this.top + this.rows);
    for (let i = this.top; i < end; i++) {
      const it = this.items[i], ry = y + 5 + (i - this.top) * this.rowH;
      const on = i === this.sel && this.active;
      if (on) { U.fillStyle = 'rgba(224,56,78,0.30)'; U.fillRect(x + 4, ry, w - 8, this.rowH - 1); UI.icon('diamond', x + 10, ry + this.rowH / 2 - 0.5, 2.6, UI.red); }
      const col = it.disabled ? '#5a5268' : (on ? '#ffffff' : (it.col || UI.ink));
      UI.text(it.label, x + 17, ry + this.rowH - 4, { size: this.size, col });
      if (it.right !== undefined) UI.text(String(it.right), x + w - 8, ry + this.rowH - 4, { size: this.size, col: it.rcol || (it.disabled ? '#5a5268' : UI.gold), align: 'right' });
    }
    if (this.items.length > this.rows) {
      const th = h - 12, bh = Math.max(8, th * this.rows / this.items.length), by = y + 6 + (th - bh) * this.top / (this.items.length - this.rows);
      U.fillStyle = 'rgba(232,200,104,0.5)'; U.fillRect(x + w - 3, by, 1.5, bh);
    }
  }
}
