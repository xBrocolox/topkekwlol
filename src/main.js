'use strict';
/* ==========================================================================
   VERMILION REQUIEM — main.js
   Boot, fixed-step loop, title screen, credits.
   ========================================================================== */

const Title = {
  t: 0, stage: 'press', sel: 0, items: [], drips: [], embers: [], msg: null,

  enter() { this.t = 0; this.stage = 'press'; this.build(); this.drips = []; },
  build() {
    this.items = [];
    if (Game.hasSave()) this.items.push({ k: 'continue', label: 'Continue' });
    this.items.push({ k: 'new', label: 'New Game' }, { k: 'config', label: 'Config' });
    this.sel = 0;
  },
  update(dt) {
    this.t += dt;
    if (Math.random() < dt * 1.6) this.drips.push({ x: R.range(20, W - 20), y: -4, v: R.range(14, 30), len: R.range(10, 40), w: R.range(1, 2.4), life: 0 });
    for (const d of this.drips) { d.y += d.v * dt; d.life += dt; }
    this.drips = this.drips.filter(d => d.y - d.len < H);
    if (Math.random() < dt * 14) this.embers.push({ x: R.range(0, W), y: H + 4, vx: R.range(-8, 8), vy: R.range(-40, -14), t: 0, life: R.range(3, 6) });
    for (const e of this.embers) { e.t += dt; e.x += e.vx * dt + Math.sin(e.t * 2) * 0.2; e.y += e.vy * dt; }
    this.embers = this.embers.filter(e => e.t < e.life);
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    if (Menu.active) return;
    if (this.stage === 'press') {
      if (Input.hit('ok') || Input.hit('menu') || Input.hit('cancel') || Input.hit('down') || Input.hit('up')) { Snd.unlock(); Snd.play('title'); this.stage = 'menu'; Snd.sfx('ok'); }
      return;
    }
    if (Input.rep('down')) { this.sel = (this.sel + 1) % this.items.length; Snd.sfx('blip'); }
    if (Input.rep('up')) { this.sel = (this.sel + this.items.length - 1) % this.items.length; Snd.sfx('blip'); }
    if (Input.hit('ok')) {
      Snd.sfx('ok');
      const k = this.items[this.sel].k;
      if (k === 'new') Main.newGame();
      else if (k === 'continue') Main.continueGame();
      else if (k === 'config') Menu.openConfig();
    }
  },
  draw() {
    const bg = Art.bg('title');
    const off = Math.round(14 + Math.sin(this.t * 0.2) * 12);
    L.drawImage(bg, 0, 0, W, 300, 0, -off, W, 300);
  },
  drawUI() {
    // drips
    U.fillStyle = '#c8283e';
    for (const d of this.drips) {
      U.fillRect(d.x - d.w / 2, d.y - d.len, d.w, d.len);
      U.beginPath(); U.arc(d.x, d.y, d.w * 1.2, 0, TAU); U.fill();
    }
    U.save(); U.globalCompositeOperation = 'lighter';
    for (const e of this.embers) { U.globalAlpha = Math.max(0, 1 - e.t / e.life) * 0.8; U.fillStyle = '#ffb070'; U.fillRect(e.x, e.y, 1.5, 1.5); }
    U.restore(); U.globalAlpha = 1;
    // vignette band
    const g = U.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(6,2,14,0.55)'); g.addColorStop(0.35, 'rgba(6,2,14,0)'); g.addColorStop(0.7, 'rgba(6,2,14,0)'); g.addColorStop(1, 'rgba(6,2,14,0.8)');
    U.fillStyle = g; U.fillRect(0, 0, W, H);
    // logo
    const pulse = 1 + Math.sin(this.t * 1.5) * 0.02;
    U.save(); U.translate(W / 2, 62); U.scale(pulse, pulse);
    U.font = `900 38px ${UI.fT}`; U.textAlign = 'center';
    const gr = U.createLinearGradient(0, -30, 0, 8); gr.addColorStop(0, '#fff2c8'); gr.addColorStop(0.5, '#e8c868'); gr.addColorStop(1, '#a8781f');
    U.fillStyle = 'rgba(20,4,10,0.9)'; U.fillText('VERMILION', 1.5, 2); U.fillStyle = gr; U.fillText('VERMILION', 0, 0);
    U.font = `700 24px ${UI.fT}`; const gr2 = U.createLinearGradient(0, 8, 0, 34); gr2.addColorStop(0, '#ff6a7e'); gr2.addColorStop(1, '#9a1428');
    U.fillStyle = 'rgba(20,4,10,0.9)'; U.fillText('R  E  Q  U  I  E  M', 1.5, 32.5); U.fillStyle = gr2; U.fillText('R  E  Q  U  I  E  M', 0, 31);
    U.restore();
    UI.text('a requiem in four frames', W / 2, 108, { size: 10, align: 'center', col: '#e8d8c8', weight: 500, alpha: 0.85 });
    if (this.stage === 'press') {
      UI.text(Input.lastDevice === 'touch' ? 'TAP TO BEGIN' : 'PRESS  Z / ENTER', W / 2, 206, { size: 11, align: 'center', font: UI.fT, col: '#fff', alpha: 0.5 + 0.5 * Math.sin(this.t * 3) });
    } else {
      this.items.forEach((it, i) => {
        const on = i === this.sel, y = 172 + i * 20;
        if (on) { const w = 130; U.fillStyle = 'rgba(200,40,62,0.35)'; U.fillRect(W / 2 - w / 2, y - 12, w, 17); UI.icon('diamond', W / 2 - w / 2 + 8, y - 3.5, 3, UI.gold); UI.icon('diamond', W / 2 + w / 2 - 8, y - 3.5, 3, UI.gold); }
        UI.text(it.label, W / 2, y, { size: 12, align: 'center', font: UI.fT, col: on ? '#fff' : '#b8a8c8' });
      });
      if (Game.hasSave() && this.items[this.sel].k === 'continue') {
        const s = Game.saveSummary();
        if (s) UI.text(`${MAPDEFS[s.map] ? MAPDEFS[s.map].name.split('—')[0].trim() : ''}  ·  ${fmtTime(s.time || 0)}  ·  Lv ${s.chars.vesper.lv}`, W / 2, 232, { size: 8, align: 'center', col: UI.dim });
      }
    }
    UI.text('Original work · procedural art & music · no assets required', W / 2, H - 6, { size: 7, align: 'center', col: 'rgba(200,190,220,0.4)', weight: 500 });
    if (this.msg) UI.text(this.msg.txt, W / 2, 250, { size: 9, align: 'center', col: UI.gold });
  },
};

const Credits = {
  t: 0, lines: [], done: false,
  enter() {
    this.t = 0; this.done = false;
    const S_ = Game.S;
    this.lines = [
      ['VERMILION REQUIEM', 'title'], ['', ''], ['a requiem in four frames', 'sub'], ['', ''], ['', ''],
      ['THE HOUR', 'head'], ['', ''],
      [`Time played   ${fmtTime(S_.time)}`, ''], [`Foes defeated   ${S_.kills}`, ''], [`Perfect parries   ${S_.parries}`, ''], [`Times the frame faded   ${S_.deaths}`, ''],
      ['', ''], ['', ''],
      ['THE PARTY', 'head'], ['', ''],
      ['Vesper — Ringbearer', ''], ['Gaspard — Gunwright', ''], ['Ilse — Mourner', ''], ['Tally — Wavemaster', ''],
      ['', ''], ['', ''],
      ['INSPIRED BY', 'head'], ['', ''],
      ['Chrono Trigger · Clair Obscur · Shadow Hearts · .hack', ''], ['— with love, and no assets taken —', 'sub'],
      ['', ''], ['', ''],
      ['ALL ART, MUSIC AND CODE', 'head'], ['generated procedurally at runtime', ''], ['', ''],
      ['Every sprite, tile, backdrop, note and sound effect', ''], ['is drawn or synthesized in your browser.', ''],
      ['', ''], ['', ''], ['Thank you for playing.', 'title'], ['', ''], ['The Eighth Bell has rung.', 'sub'],
    ];
  },
  update(dt) {
    this.t += dt;
    if (Input.isDown('ok') || Input.isDown('down')) this.t += dt * 2.5;
    const total = this.lines.length * 16 + 300;
    if (this.t * 22 > total && !this.done) { this.done = true; }
    if (this.done && (Input.hit('ok') || Input.hit('cancel'))) Main.toTitle();
  },
  draw() { L.drawImage(Art.bg('title'), 0, 0, W, 300, 0, -18, W, 300); },
  drawUI() {
    U.fillStyle = 'rgba(6,2,14,0.72)'; U.fillRect(0, 0, W, H);
    const y0 = H - this.t * 22 + 20;
    this.lines.forEach(([t, k], i) => {
      const y = y0 + i * 16;
      if (y < -20 || y > H + 20 || !t) return;
      if (k === 'title') UI.text(t, W / 2, y, { size: 18, font: UI.fT, align: 'center', col: UI.gold });
      else if (k === 'head') UI.text(t, W / 2, y, { size: 11, font: UI.fT, align: 'center', col: '#ff6a7e' });
      else if (k === 'sub') UI.text(t, W / 2, y, { size: 9, align: 'center', col: UI.dim, weight: 500 });
      else UI.text(t, W / 2, y, { size: 10, align: 'center' });
    });
    if (this.done) UI.text('Z: return to title', W / 2, H - 10, { size: 8, align: 'center', col: UI.dim, alpha: 0.5 + 0.5 * Math.sin(this.t * 4) });
  },
};

const Main = {
  last: 0, acc: 0, turbo: 1, onStep: null,

  async boot() {
    Gfx.init(); Input.init(); Game.loadSettings();
    const unlock = () => Snd.unlock();
    addEventListener('keydown', unlock); addEventListener('pointerdown', unlock); addEventListener('touchstart', unlock, { passive: true });
    try { if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) { const t = document.getElementById('touch'); if (t) t.classList.add('on'); Input.lastDevice = 'touch'; } } catch (e) { /* ignore */ }
    try { await Promise.race([Promise.all([document.fonts.load('700 12px Cinzel'), document.fonts.load('700 12px "Cormorant Garamond"'), document.fonts.load('400 12px "Share Tech Mono"')]), wait0(1200)]); } catch (e) { /* offline fonts: fall back */ }
    await Promise.race([Assets.load(), wait0(2500)]);
    Game.S = Game.newState();
    Game.setScene(Title);
    Snd.play('title');
    requestAnimationFrame(t => this.frame(t));
  },

  frame(ts) {
    const dt = Math.min(0.1, (ts - (this.last || ts)) / 1000); this.last = ts;
    this.acc += dt;
    let n = 0;
    while (this.acc >= 1 / 60 && n++ < 6) { for (let k = 0; k < this.turbo; k++) this.update(1 / 60); this.acc -= 1 / 60; }
    if (n >= 6) this.acc = 0;
    try { this.draw(); } catch (e) { console.error('draw error', e); }
    requestAnimationFrame(t => this.frame(t));
  },

  update(dt) {
    Input.begin(dt);
    if (this.onStep) this.onStep(dt);
    UI.tick(dt); Tw.update(dt); Gfx.update(dt); if (!Menu.active && !Shop.active) Toast.update(dt); Banner.update(dt);
    const sc = Game.scene; if (!sc) return;
    let blocked = false;
    if (Shop.active) blocked = Shop.update(dt);
    else if (Menu.active) blocked = Menu.update(dt);
    else if (Dlg.update(dt)) blocked = true;
    try { if (!blocked) sc.update(dt); else if (sc === Field) sc.update(dt); } catch (e) { console.error('update error', e); }
  },

  draw() {
    const sc = Game.scene; if (!sc) return;
    Gfx.begin(); sc.draw(); Gfx.present(); sc.drawUI && sc.drawUI(); Gfx.post();
    Menu.draw(); Shop.draw(); if (!Menu.active && !Shop.active) Toast.draw(); Banner.draw(); Dlg.draw();
  },

  reset() {
    Tw.clear(); Game.busy = 0; Dlg.st = null; Dlg.choice = null; Menu.active = false; Shop.active = false; Battle.active = false;
    Gfx.fade = 0; Gfx.fadeCol = '#000'; Gfx.flash = 0; Gfx.shake = 0; Banner.cur = null; Toast.list = [];
  },

  toTitle() {
    this.reset(); Game.S = Game.newState(); Game.setScene(Title); Snd.play('title');
  },

  async newGame() {
    this.reset();
    Gfx.fade = 1;
    Game.S = Game.newState();
    Snd.stop();
    await Field.load('aurelle');
    Game.setScene(Field);
    Game.cutscene(() => Story.intro());
  },

  async continueGame() {
    this.reset();
    if (!Game.load()) { Title.msg = { txt: 'No save found.', t: 2 }; return; }
    Gfx.fade = 1;
    const S_ = Game.S;
    await Field.load(S_.map, { x: S_.x, y: S_.y, dir: S_.dir });
    Game.setScene(Field);
    await Gfx.fadeTo(0, 0.6);
    Toast.add('Welcome back.', UI.gold);
  },

  async credits() {
    await Gfx.fadeTo(1, 1.2, '#000');
    Game.S.flags.ending_seen = true; Game.save();
    Game.setScene(Credits); Snd.play('title');
    await Gfx.fadeTo(0, 1.2);
  },
};
const wait0 = ms => new Promise(r => setTimeout(r, ms));

window.addEventListener('load', () => Main.boot());
window.__vr = { Game, Field, Battle, Story, Main, Menu, Dlg, Input, Tw, Title, Snd, Gfx, Art, Assets, TECHS, SKILLS, ENEMIES, CHARS, ITEMS, EQUIP, MAPDEFS, FX, Toast, Shop };
