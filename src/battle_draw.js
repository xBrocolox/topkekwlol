'use strict';
/* ==========================================================================
   VERMILION REQUIEM — battle_draw.js
   Rendering for the battle scene (world layer + UI layer).
   ========================================================================== */

const _sil = new WeakMap();
function silOf(img, col) {
  let m = _sil.get(img); if (!m) { m = {}; _sil.set(img, m); }
  return m[col] || (m[col] = silhouette(img, col));
}

Object.assign(Battle, {
  draw() {
    const bg = Art.bg(this.bgName);
    L.drawImage(bg, 0, 0, W, H, 0, 0, W, H);
    // animated ambience per backdrop
    this.drawAmbience();
    L.drawImage(FX.paintC, 0, 0);
    const list = [];
    for (const f of this.foes) if (f.dead < 1) list.push({ y: f.y + f.oy, c: f });
    for (const p of this.party) list.push({ y: p.y + p.oy, c: p });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) this.shadow(d.c);
    for (const d of list) d.c.side === 'p' ? this.drawParty(d.c) : this.drawFoe(d.c);
  },

  drawAmbience() {
    const t = this.t, n = this.bgName;
    L.save();
    if (n === 'woods' || n === 'temple') { L.fillStyle = n === 'woods' ? '#f0f0a0' : '#f4d878'; for (let i = 0; i < 22; i++) { L.globalAlpha = 0.4 + 0.3 * Math.sin(t * 2 + i); L.fillRect(Math.round((i * 53.3 + Math.sin(t * 0.5 + i) * 20) % W), Math.round(60 + (i * 31) % 130 + Math.sin(t + i) * 6), 1, 1); } }
    if (n === 'terminus' || n === 'datacore') { L.fillStyle = n === 'terminus' ? '#30e2d2' : '#ff2a4a'; for (let i = 0; i < 14; i++) { L.globalAlpha = 0.5; L.fillRect(Math.round((i * 71 + t * 30 * (1 + i % 3)) % W), Math.round((i * 43) % 120), 1, 3 + i % 4); } }
    if (n === 'aurelle' || n === 'opera') { L.fillStyle = '#ffcf70'; for (let i = 0; i < 12; i++) { L.globalAlpha = 0.3 + 0.3 * Math.sin(t * 3 + i * 2); L.fillRect(Math.round((i * 89) % W), Math.round(20 + (i * 47) % 150 - (t * 6 + i * 9) % 20), 1, 1); } }
    if (n === 'catacombs') { L.globalAlpha = 0.07; L.fillStyle = '#8affc0'; for (let i = 0; i < 5; i++) L.fillRect(0, Math.round(140 + i * 10 + Math.sin(t + i) * 4), W, 3); }
    if (n === 'lacuna') { L.fillStyle = '#e0384e'; for (let i = 0; i < 8; i++) { L.globalAlpha = 0.5; const x = (i * 61) % W; L.fillRect(x, 0, 1, Math.round(((t * 12 + i * 20) % 90))); } }
    L.restore();
  },

  shadow(c) {
    const w = c.side === 'p' ? 16 : Math.min(60, c.art.width * c.scale * 0.32);
    L.fillStyle = 'rgba(8,4,16,0.5)'; L.beginPath(); L.ellipse(Math.round(c.x + c.ox), Math.round(c.y + 2), w, w * 0.22, 0, 0, TAU); L.fill();
  },

  drawParty(c) {
    let pose = c.pose;
    if (!c.alive) pose = 'down';
    else if (pose === 'idle' && c.hp / c.maxhp < 0.25) pose = 'guard';
    const frame = (pose === 'idle' || pose === 'win') ? (Math.floor(this.t * 2 + c.slot * 0.5) & 1) : 0;
    const img = Art.battle(c.look, pose, frame);
    const an = Art.battleAnchor;
    let x, y;
    if (pose === 'down') { x = Math.round(c.x + c.ox - img.width); y = Math.round(c.y + c.oy - img.height * 2 + 6); }
    else { x = Math.round(c.x + c.ox - an.x * 2); y = Math.round(c.y + c.oy - c.hop - an.y * 2 + 2); }
    if (c.fused) this.drawWings(c, x, y);
    L.drawImage(img, x, y, img.width * 2, img.height * 2);
    if (c.fused) { L.save(); L.globalCompositeOperation = 'source-atop'; }
    if (c.flash > 0) { L.globalAlpha = Math.min(1, c.flash * 2.4); L.drawImage(silOf(img, '#ffffff'), x, y, img.width * 2, img.height * 2); L.globalAlpha = 1; }
    if (c.fused) L.restore();
    if (c.fused) { L.save(); L.globalAlpha = 0.28; L.globalCompositeOperation = 'lighter'; L.drawImage(silOf(img, '#8a4aff'), x, y, img.width * 2, img.height * 2); L.restore(); }
    if (c.stat.shield) { L.strokeStyle = 'rgba(160,208,255,0.7)'; L.beginPath(); L.ellipse(Math.round(c.x + c.ox), Math.round(c.y - 30), 22, 34, 0, 0, TAU); L.stroke(); }
    if (c.alive && this.turnQ.includes(c) && this.mode !== 'intro') { L.fillStyle = '#ffe9a0'; const b = Math.round(Math.sin(this.t * 8) * 2); L.fillRect(Math.round(c.x + c.ox) - 1, Math.round(c.y - 76 + b), 3, 5); L.fillRect(Math.round(c.x + c.ox) - 1, Math.round(c.y - 69 + b), 3, 2); }
  },

  drawWings(c, x, y) {
    const cx = Math.round(c.x + c.ox) + 6, cy = Math.round(c.y - 44), t = this.t;
    L.save();
    for (let i = 0; i < 5; i++) {
      const a = -0.5 + i * 0.32 + Math.sin(t * 2 + i) * 0.05, len = 42 - i * 3;
      L.fillStyle = i % 2 ? '#1a0f2a' : '#2a1848'; L.strokeStyle = '#8a4aff';
      L.beginPath(); L.moveTo(cx, cy); L.lineTo(cx + Math.cos(a) * len + 12, cy - Math.sin(a + 0.9) * len); L.lineTo(cx + Math.cos(a) * len * 0.8 + 18, cy - Math.sin(a + 0.4) * len * 0.5 + 6); L.closePath(); L.fill(); L.stroke();
    }
    L.restore();
  },

  drawFoe(f) {
    const img = f.art, w = Math.round(img.width * f.scale), h = Math.round(img.height * f.scale);
    const bob = f.alive ? Math.round(Math.sin(f.bob) * 2) : 0;
    const x = Math.round(f.x + f.ox - w / 2), y = Math.round(f.y + f.oy - h + bob);
    const appearY = (1 - Ease.out(f.appear)) * -30;
    L.save();
    L.globalAlpha = f.appear;
    if (!f.alive) {
      const rows = img.height;
      for (let yy = 0; yy < rows; yy += 2) { if ((((yy * 7 + 3) % 10) / 10) > f.dead) L.drawImage(img, 0, yy, img.width, 2, x + Math.round((Math.random() - 0.5) * f.dead * 6), Math.round(y + yy * f.scale + appearY), w, Math.round(2 * f.scale)); }
    } else {
      L.drawImage(img, x, y + appearY, w, h);
      if (f.flash > 0) { L.globalAlpha = Math.min(1, f.flash * 2.4); L.drawImage(silOf(img, '#ffffff'), x, y + appearY, w, h); L.globalAlpha = 1; }
      if (f.charging) { L.globalAlpha = 0.25 + 0.25 * Math.sin(this.t * 14); L.drawImage(silOf(img, '#ff2a4a'), x, y, w, h); }
      if (f.stunT > 0) { L.globalAlpha = 1; L.fillStyle = '#ffe070'; for (let i = 0; i < 4; i++) { const a = this.t * 5 + i * 1.57; L.fillRect(Math.round(f.x + Math.cos(a) * 18), Math.round(y - 6 + Math.sin(a) * 4), 3, 3); } }
    }
    L.restore();
  },

  /* ------------------------------------------------------------------ UI */
  drawUI() {
    FX.draw();
    // foe bars / boss bar
    for (const f of this.foes) {
      if (!f.alive) continue;
      if (f.boss) continue;
      if (f.seen > 0 || this.mode === 'target') {
        const p = this.head(f), w = 46, x = f.x + f.ox - w / 2, y = f.y + f.oy - f.art.height * f.scale - 12;
        U.globalAlpha = Math.min(1, f.seen * 2 + (this.mode === 'target' ? 1 : 0));
        UI.text(f.name, f.x + f.ox, y - 2, { size: 7.5, align: 'center' });
        UI.bar(x, y, w, 4, f.shown / f.maxhp, '#e0384e', 'rgba(0,0,0,0.7)');
        U.globalAlpha = 1;
      }
    }
    for (const f of this.foes) {
      if (!f.alive) continue;
      if (f.charging) {
        const m = f.charging.mv, x = f.x + f.ox, y = f.y + f.oy - f.art.height * f.scale - 22;
        const pct = f.charging.t / m.ch;
        UI.text(m.n, x, y - 3, { size: 8, align: 'center', col: '#ff6a7e' });
        UI.bar(x - 30, y, 60, 5, pct, '#ff2a4a', 'rgba(0,0,0,0.8)', { border: '#ff6a7e' });
        UI.text((m.ch - f.charging.t).toFixed(1) + 's', x, y + 13, { size: 7, align: 'center', col: '#ffdbe0' });
      }
      if (f.stunT > 0) UI.text('STUNNED', f.x + f.ox, f.y - f.art.height * f.scale - 6, { size: 7.5, align: 'center', col: '#ffe070' });
    }
    const boss = this.foes.find(f => f.boss && f.alive);
    if (boss && this.mode !== 'intro') {
      const w = 260, x = (W - w) / 2, y = 12;
      UI.text(boss.name, W / 2, y - 1, { size: 10, font: UI.fT, align: 'center', col: UI.gold });
      UI.bar(x, y + 3, w, 7, boss.shown / boss.maxhp, '#c8283e', 'rgba(0,0,0,0.75)', { grad: '#ff6a5a' });
      if (boss.d.weak) this.drawWeak(boss, x + w + 6, y + 10);
    }
    // target reticle
    if (this.mode === 'target' && this.tsel) this.drawTarget();

    this.drawCards();

    // command menu
    if (this.mode === 'cmd' && this.cmd) {
      this.cmd.menu.draw();
      const it = this.cmd.menu.cur;
      const d = it ? this.descOf(it) : '';
      if (d) { const w = Math.min(330, UI.measure(d, 9) + 20); UI.panel(W / 2 - w / 2, 28, w, 16, { a: 0.9 }); UI.text(d, W / 2, 39, { size: 9, align: 'center', col: '#e8dcc8' }); }
    }
    if (this.nameTag) { const n = this.nameTag, a = n.t < 0.15 ? n.t / 0.15 : n.t > 1.0 ? Math.max(0, 1 - (n.t - 1.0) / 0.3) : 1; U.globalAlpha = a; const w = UI.measure(n.txt, 11, UI.fT) + 26; UI.panel(W / 2 - w / 2, 50, w, 17, { a: 0.9 }); UI.text(n.txt, W / 2, 62, { size: 11, font: UI.fT, align: 'center', col: n.col }); U.globalAlpha = 1; }
    if (this.ring) this.drawRing();
    if (this.defw) this.drawDef();
    if (this.banner) this.drawBanner();
    if (this.mode === 'result' && this.result) this.drawResult();
    if (this.mode === 'over' && this.over) this.drawOver();
  },

  drawWeak(f, x, y) {
    UI.text('WEAK', x, y - 8, { size: 6.5, col: UI.dim });
    (f.d.weak || []).forEach((e, i) => { U.fillStyle = ELEM[e].col; U.beginPath(); U.arc(x + 4 + i * 9, y, 3.2, 0, TAU); U.fill(); U.strokeStyle = '#000'; U.lineWidth = 0.5; U.stroke(); });
  },

  drawTarget() {
    const t = this.tsel, c = t.list[t.idx]; if (!c) return;
    const all = t.action.mode === 'all';
    const draw1 = (c, main) => {
      const m = this.mid(c), r = (c.side === 'p' ? 18 : Math.max(16, c.art.width * c.scale * 0.42)), bob = Math.sin(UI.t * 8) * 1.5;
      U.strokeStyle = main ? '#ffe9a0' : 'rgba(255,233,160,0.5)'; U.lineWidth = 1.4;
      const d = r + bob;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { U.beginPath(); U.moveTo(m.x + sx * d, m.y + sy * (d * 0.9) - sy * 7); U.lineTo(m.x + sx * d, m.y + sy * (d * 0.9)); U.lineTo(m.x + sx * (d - 7), m.y + sy * (d * 0.9)); U.stroke(); }
    };
    draw1(c, true);
    const known = c.side === 'p' || (Game.S.best[c.id] || 0) > 0 || c.boss;
    const txt = c.name + (c.side === 'e' ? `  Lv ${c.lvl}` : '');
    const w = Math.max(120, UI.measure(txt, 10) + 20);
    UI.panel(W / 2 - w / 2, 28, w, c.side === 'e' ? 30 : 20, { a: 0.92 });
    UI.text(txt, W / 2, 40, { size: 10, align: 'center' });
    if (c.side === 'e') {
      UI.bar(W / 2 - 40, 44, 80, 4, c.hp / c.maxhp, '#e0384e');
      if (c.d.weak) { if (known) this.drawWeak(c, W / 2 + 46, 50); else UI.text('Weakness: ???', W / 2 + 46, 50, { size: 6.5, col: UI.dim }); }
    }
  },

  drawCards() {
    this.party.forEach((p, i) => {
      const x = 6 + i * 158, y = 206, w = 154, h = 58;
      const ready = this.turnQ.includes(p) && p.alive;
      const active = this.cmd && this.cmd.a === p;
      UI.panel(x, y, w, h, { a: 0.95, border: active ? '#ffe9a0' : ready ? '#e8c868' : '#8a7a4a', inner: active ? '#c8283e' : '#5a1424' });
      const pc = Art.portrait(p.look, p.hp / p.maxhp < 0.3 ? 'sad' : 'n');
      if (pc) { U.imageSmoothingEnabled = false; U.drawImage(pc, x + 6, y + 8, 38, 38); U.imageSmoothingEnabled = true; U.strokeStyle = p.col; U.lineWidth = 1; U.strokeRect(x + 6.5, y + 8.5, 37, 37); }
      UI.text(p.name, x + 50, y + 15, { size: 10, font: UI.fT, col: p.col });
      UI.text('Lv ' + p.lv, x + w - 8, y + 15, { size: 8, align: 'right', col: UI.dim });
      const bx = x + 50, bw = w - 60;
      UI.bar(bx, y + 19, bw, 6, p.shown / p.maxhp, p.hp / p.maxhp < 0.3 ? '#e8583a' : '#58c878', 'rgba(0,0,0,0.7)');
      UI.text(`${Math.round(p.hp)}/${p.maxhp}`, bx + bw, y + 32, { size: 7, align: 'right', font: UI.fM, weight: 400, col: '#e8f0e0' });
      UI.bar(bx, y + 34, bw * 0.6, 4, p.mp / p.maxmp, '#58a0f0', 'rgba(0,0,0,0.7)');
      UI.text(`${Math.round(p.mp)}`, bx + bw * 0.6 + 4, y + 39, { size: 7, font: UI.fM, weight: 400, col: '#a8c8ff' });
      // ATB
      const ab = p.alive ? p.atb / 100 : 0;
      UI.bar(bx, y + 42, bw, 5, ab, ready ? '#ffe9a0' : '#c9a24a', 'rgba(0,0,0,0.7)');
      if (ready) { U.globalAlpha = 0.4 + 0.3 * Math.sin(UI.t * 10); U.fillStyle = '#fff8d0'; U.fillRect(bx, y + 42, bw, 5); U.globalAlpha = 1; }
      // resonance / malice
      const rr = p.reson / 100;
      UI.bar(bx, y + 49, bw * 0.55, 3, rr, rr >= 1 ? '#ff6a7e' : '#c8283e', 'rgba(0,0,0,0.7)', { border: rr >= 1 ? '#ffb0b8' : undefined });
      if (rr >= 1) UI.text('REQUIEM', bx + bw * 0.55 + 4, y + 52, { size: 6.5, col: '#ff8a9a' });
      if (CHARS[p.id].fuse) { UI.bar(bx + bw * 0.62, y + 49, bw * 0.38, 3, p.mal / 100, p.mal >= 100 ? '#c0a0ff' : '#7a4ab8', 'rgba(0,0,0,0.7)'); }
      // status
      let sx = x + 8; let k = 0;
      for (const s in p.stat) { if (!STATUS[s] || k > 4) continue; U.fillStyle = STATUS[s].col; U.fillRect(sx + k * 8, y + 50, 6, 6); UI.text(STATUS[s].name[0], sx + k * 8 + 3, y + 55.5, { size: 5.5, col: '#000', align: 'center', shadow: false }); k++; }
      if (p.fused) UI.text('FUSED', x + 8, y + 54, { size: 7, col: '#c0a0ff', font: UI.fT });
      if (!p.alive) { U.fillStyle = 'rgba(20,0,10,0.6)'; U.fillRect(x + 3, y + 3, w - 6, h - 6); UI.text('KO', x + w / 2, y + 36, { size: 14, font: UI.fT, align: 'center', col: '#ff6a7e' }); }
    });
  },

  drawRing() {
    const r = this.ring, cx = r.x, cy = r.y, R0 = 30;
    const col = r.info.col || '#f4d878';
    U.save();
    U.fillStyle = 'rgba(8,4,20,0.72)'; U.beginPath(); U.arc(cx, cy, R0 + 9, 0, TAU); U.fill();
    U.strokeStyle = '#c9a24a'; U.lineWidth = 1; U.beginPath(); U.arc(cx, cy, R0 + 9, 0, TAU); U.stroke();
    U.strokeStyle = 'rgba(232,200,104,0.35)'; U.beginPath(); U.arc(cx, cy, R0 - 8, 0, TAU); U.stroke();
    // zones
    const lap = Math.floor(r.hand / 360);
    for (const z of r.zones) {
      const zl = Math.floor(z.c / 360);
      const a = (z.c % 360 - 90) * Math.PI / 180, hw = r.half * Math.PI / 180;
      const active = zl === lap || zl === lap + 0; // this lap
      let c = col, al = active ? 1 : 0.28;
      if (z.res === 'hit' || z.res === 'crit') { c = '#80ffb0'; al = 0.5 + z.flash * 0.5; } else if (z.res === 'miss') { c = '#5a3a4a'; al = 0.6; }
      U.globalAlpha = al; U.strokeStyle = c; U.lineWidth = 7; U.lineCap = 'butt';
      U.beginPath(); U.arc(cx, cy, R0, a - hw, a + hw); U.stroke();
      if (z.res === null) { U.strokeStyle = '#ffffff'; U.lineWidth = 4; U.beginPath(); U.arc(cx, cy, R0, a - hw * 0.4, a + hw * 0.4); U.stroke(); }
      U.globalAlpha = 1;
      if (z.flash > 0) { U.globalCompositeOperation = 'lighter'; U.strokeStyle = rgba(z.res === 'miss' ? '#ff5a6a' : '#ffffff', z.flash); U.lineWidth = 9; U.beginPath(); U.arc(cx, cy, R0, a - hw, a + hw); U.stroke(); U.globalCompositeOperation = 'source-over'; }
    }
    // hand
    const ha = (r.hand % 360 - 90) * Math.PI / 180;
    U.strokeStyle = '#fff'; U.lineWidth = 2; U.lineCap = 'round';
    U.beginPath(); U.moveTo(cx, cy); U.lineTo(cx + Math.cos(ha) * (R0 + 5), cy + Math.sin(ha) * (R0 + 5)); U.stroke();
    U.globalCompositeOperation = 'lighter'; U.strokeStyle = rgba(col, 0.6); U.lineWidth = 6;
    U.beginPath(); U.moveTo(cx + Math.cos(ha) * (R0 - 9), cy + Math.sin(ha) * (R0 - 9)); U.lineTo(cx + Math.cos(ha) * (R0 + 6), cy + Math.sin(ha) * (R0 + 6)); U.stroke();
    U.globalCompositeOperation = 'source-over';
    U.fillStyle = '#fff'; U.beginPath(); U.arc(cx, cy, 2.5, 0, TAU); U.fill();
    // laps pips & label
    UI.text(r.info.name, cx, cy - R0 - 14, { size: 8, align: 'center', font: UI.fT, col });
    const done = r.zones.filter(z => z.res && z.res !== 'miss').length;
    UI.text(`${done}/${r.info.n}`, cx, cy + 4, { size: 8, align: 'center', font: UI.fM, weight: 400 });
    U.restore();
    // press hint
    if (r.t < 1.6) UI.text(Input.lastDevice === 'touch' ? 'TAP A' : 'PRESS  Z', cx, cy + R0 + 20, { size: 8, align: 'center', col: '#ffe9a0', alpha: 0.6 + 0.4 * Math.sin(r.t * 10) });
  },

  drawDef() {
    const d = this.defw;
    const targets = d.isAll ? this.alive('p') : [d.target];
    const col = d.type === 'h' ? '#ffcf5a' : d.type === 'f' ? '#ff7ad0' : '#ffdbe0';
    for (const tg of targets) {
      const m = this.mid(tg);
      let rad;
      if (d.t < d.pre) rad = lerp(36, 17, Ease.out(d.t / d.pre));
      else if (d.t < d.pre + d.hold) rad = 17 + Math.sin((d.t - d.pre) * 18) * 0.8;
      else rad = lerp(17, 9, clamp((d.t - d.pre - d.hold) / d.fin, 0, 1));
      const x = m.x, y = m.y - 6;
      U.save();
      U.strokeStyle = 'rgba(255,255,255,0.8)'; U.lineWidth = 1.2; U.beginPath(); U.arc(x, y, 9, 0, TAU); U.stroke();
      U.globalCompositeOperation = 'lighter';
      U.strokeStyle = rgba(col, 0.95); U.lineWidth = d.type === 'h' ? 3.4 : 2.4; U.beginPath(); U.arc(x, y, rad, 0, TAU); U.stroke();
      if (d.type === 'h') { U.strokeStyle = rgba('#ff7a2a', 0.8); U.lineWidth = 1; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + d.t * 2; U.beginPath(); U.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); U.lineTo(x + Math.cos(a) * (rad + 5), y + Math.sin(a) * (rad + 5)); U.stroke(); } }
      U.globalAlpha = 0.35; U.fillStyle = col; U.beginPath(); U.arc(x, y, Math.max(1, 9 - (rad - 9) * 0.1), 0, TAU); U.fill();
      U.restore();
    }
    // hint bar
    const hint = Input.lastDevice === 'touch' ? 'A: PARRY   B: DODGE' : 'Z: PARRY    X: DODGE';
    UI.text(d.type === 'h' ? 'HEAVY — DODGE!' : d.type === 'f' ? 'FEINT — WAIT FOR IT' : hint, W / 2, 200, { size: 8, align: 'center', col: d.type === 'h' ? '#ffcf5a' : '#e8dcc8', alpha: 0.85 });
    if (d.whiff) UI.text('TOO EARLY', W / 2, 190, { size: 8, align: 'center', col: '#ff9a9a', alpha: Math.min(1, d.lock * 4) });
  },

  drawBanner() {
    const b = this.banner, p = b.t / b.dur;
    const a = p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1;
    U.globalAlpha = clamp(a, 0, 1);
    if (b.big) {
      U.fillStyle = 'rgba(0,0,0,0.55)'; U.fillRect(0, 88, W, 56);
      U.fillStyle = '#c8283e'; U.fillRect(0, 88, W, 1); U.fillRect(0, 143, W, 1);
      UI.text(b.txt, W / 2, 118, { size: 22, font: UI.fT, col: b.col, align: 'center' });
      if (b.sub) UI.text(b.sub, W / 2, 134, { size: 9, col: '#d8c8d8', align: 'center', weight: 500 });
    } else {
      const w = UI.measure(b.txt, 13, UI.fT) + 40; UI.panel(W / 2 - w / 2, 96, w, 26, { a: 0.9 });
      UI.text(b.txt, W / 2, 114, { size: 13, font: UI.fT, col: b.col, align: 'center' });
    }
    U.globalAlpha = 1;
  },

  drawResult() {
    const r = this.result, t = r.t;
    U.fillStyle = 'rgba(6,2,16,0.55)'; U.fillRect(0, 0, W, H);
    const x = 70, y = 18, w = 340, h = 176 + (this.result.drops.length ? 12 : 0);
    UI.panel(x, y, w, h);
    UI.text('VICTORY', W / 2, y + 22, { size: 20, font: UI.fT, col: UI.gold, align: 'center' });
    UI.text(`+${r.xp} XP   ·   +${r.gold} Écus`, W / 2, y + 36, { size: 10, align: 'center', col: '#e8dcc8' });
    let yy = y + 44;
    for (const row of r.rows) {
      const C = CHARS[row.id], c = Game.S.chars[row.id];
      const rowH = row.ups.length ? 30 : 24;
      const pc = Art.portrait(C.look, 'happy');
      if (pc) { U.imageSmoothingEnabled = false; U.drawImage(pc, x + 8, yy, 22, 22); U.imageSmoothingEnabled = true; }
      UI.text(C.name, x + 36, yy + 9, { size: 9.5, font: UI.fT, col: C.col });
      UI.text('Lv ' + c.lv, x + 100, yy + 9, { size: 9, col: row.ups.length ? '#ffe9a0' : UI.dim });
      const pct = c.lv >= MAXLV ? 1 : c.xp / xpNeed(c.lv);
      UI.bar(x + 36, yy + 13, 130, 4, Math.min(1, pct * Math.min(1, t)), '#58a0f0', 'rgba(0,0,0,0.6)');
      if (!row.inActive) UI.text('(reserve)', x + 172, yy + 17, { size: 7, col: UI.dim });
      if (row.ups.length) {
        const u = row.ups[row.ups.length - 1], b0 = row.ups[0].before;
        const gain = k => u.after[k] - b0[k];
        UI.text(`LEVEL UP!  HP +${gain('hp')}  MP +${gain('mp')}  ATK +${gain('atk')}  MAG +${gain('mag')}  DEF +${gain('def')}`, x + 172, yy + 9, { size: 7.5, col: '#ffe9a0' });
        const learned = row.ups.flatMap(u2 => u2.learned);
        if (learned.length) UI.text('Learned: ' + learned.map(s => SKILLS[s].name).join(', '), x + 172, yy + 20, { size: 7.5, col: '#80ffb0' });
      }
      yy += rowH + 2;
    }
    if (r.drops.length) UI.text('Found: ' + r.drops.map(d => Game.nameOf(d)).join(', '), W / 2, y + h - 10, { size: 8.5, align: 'center', col: '#ffe9a0' });
    if (t > 0.6) UI.text(Input.lastDevice === 'touch' ? 'tap A' : 'Z: continue', x + w - 10, y + h - 6, { size: 7.5, align: 'right', col: UI.dim, alpha: 0.6 + 0.4 * Math.sin(t * 5) });
  },

  drawOver() {
    const o = this.over, a = clamp(o.t / 1.2, 0, 1);
    U.fillStyle = `rgba(20,2,8,${0.82 * a})`; U.fillRect(0, 0, W, H);
    U.globalAlpha = a;
    UI.text('THE FRAME FADES', W / 2, 96, { size: 26, font: UI.fT, col: '#e0384e', align: 'center' });
    UI.text('...but the Ring still turns.', W / 2, 114, { size: 11, col: '#d8c8d8', align: 'center', weight: 500 });
    if (o.t > 1.2) ['Try again', 'Return to title'].forEach((s, i) => {
      const on = o.sel === i;
      UI.text((on ? '◆ ' : '   ') + s, W / 2, 150 + i * 18, { size: 12, align: 'center', col: on ? '#fff' : UI.dim });
    });
    U.globalAlpha = 1;
  },
});
