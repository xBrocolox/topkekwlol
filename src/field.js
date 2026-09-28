'use strict';
/* ==========================================================================
   VERMILION REQUIEM — field.js
   Exploration: tile maps, y-sorted actors, collision, lighting, visible
   roaming enemies (strike them first for the advantage), chests, save wells,
   time gates, scripted movement for cutscenes.
   ========================================================================== */

const SOLID = new Set('#~TtLSPBFDbsCw'.split(''));
const PROPCH = new Set('TtLSPBFDbsC'.split(''));
const LIGHTCH = new Set(['L']);
const WINDOWED = new Set(['aurelle', 'opera', 'terminus', 'datacore']);

const Chest = {
  make(open) {
    const g = new Pix(16, 14);
    g.r(1, 5, 14, 8, '#7a4a28'); g.r(1, 5, 14, 2, '#a06a3a'); g.r(1, 11, 14, 2, '#4a2a18');
    g.r(0, 6, 2, 7, '#c9a24a'); g.r(14, 6, 2, 7, '#c9a24a'); g.r(7, 8, 2, 3, '#e8c868');
    if (!open) { g.r(1, 2, 14, 4, '#8a5a30'); g.r(1, 2, 14, 1, '#b07a44'); g.r(7, 5, 2, 2, '#f0d078'); }
    else { g.r(1, 0, 14, 3, '#5a3a20'); g.r(3, 5, 10, 2, '#ffe9a0'); g.p(5, 4, '#fff'); g.p(10, 3, '#fff'); }
    return g.finish();
  },
  cache: {},
  get(open) { return this.cache[open ? 1 : 0] || (this.cache[open ? 1 : 0] = this.make(open)); },
};

function bigCentral(theme, w = 2, h = 2) {
  const g = new Pix(32, 44);
  if (theme === 'aurelle') {
    g.ell(16, 34, 16, 9, '#8a8a9a'); g.ell(16, 33, 14, 7, '#5a86bc'); g.ell(16, 32, 11, 5, '#8ab8e8'); g.ell(16, 34, 6, 3, '#a8a8b8');
    g.r(14, 14, 4, 20, '#a8a8b8'); g.r(10, 12, 12, 4, '#8a8a9a'); g.ell(16, 12, 7, 2, '#9ad0f0'); g.r(15, 3, 2, 10, '#bfe6ff');
    for (const [x, y] of [[9, 9], [23, 9], [7, 14], [25, 14], [12, 5], [20, 5]]) g.p(x, y, '#dff2ff');
    g.r(4, 38, 24, 4, '#6a6a7a');
  } else if (theme === 'terminus' || theme === 'datacore') {
    const c = theme === 'terminus' ? ['#30e2d2', '#c8fff8', '#ff5ab8'] : ['#ff2a4a', '#ffd0d8', '#ff00ff'];
    g.ell(16, 36, 15, 7, '#141a30'); g.ell(16, 35, 13, 5, c[0]); g.ell(16, 35, 10, 3, '#0a0e1c');
    g.poly([[16, 0], [24, 22], [16, 38], [8, 22]], c[0]); g.poly([[16, 0], [19, 22], [16, 38], [13, 22]], c[1]);
    g.p(16, 10, '#fff'); g.r(4, 36, 3, 1, c[2]); g.r(25, 36, 3, 1, c[2]);
  }
  return g.finish({ outline: '#120a18' });
}

const Field = {
  id: null, def: null, rows: [], w: 0, h: 0, theme: 'aurelle', ents: [], player: null, followers: [],
  trail: [], cam: { x: 0, y: 0 }, t: 0, strikeCd: 0, lights: [], exits: [], triggers: [], gfxCache: {},
  groundK: [], lightSrc: [], encCd: 0, hint: null, ready: false, camTarget: null, bigs: [], fireflies: [],

  /* ------------------------------------------------------------------ load */
  async load(id, o = {}) {
    const def = MAPDEFS[id]; if (!def) throw new Error('no map ' + id);
    this.id = id; this.def = def; this.rows = def.rows; this.h = def.rows.length; this.w = def.rows[0].length;
    this.theme = def.theme; this.ents = []; this.exits = []; this.triggers = []; this.hint = null; this.bigs = [];
    this.trail = []; this.camTarget = null;
    Game.S.map = id;
    // ground kinds for non-ground chars (props sit on the surrounding floor)
    this.groundK = [];
    for (let y = 0; y < this.h; y++) {
      const row = [];
      for (let x = 0; x < this.w; x++) {
        const ch = this.get(x, y);
        let k = this.kindOf(ch);
        if (!k) {
          k = 'floor';
          for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]]) { const kk = this.kindOf(this.get(x + dx, y + dy)); if (kk && kk !== 'wall' && kk !== 'top') { k = kk; break; } }
        }
        row.push(k);
      }
      this.groundK.push(row);
    }
    // 2x2 centrepieces
    for (let y = 0; y < this.h - 1; y++) for (let x = 0; x < this.w - 1; x++) {
      if (this.get(x, y) === 'F' && this.get(x + 1, y) === 'F' && this.get(x, y + 1) === 'F' && this.get(x + 1, y + 1) === 'F') this.bigs.push({ x, y });
    }
    // light sources from props
    this.lightSrc = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (LIGHTCH.has(this.get(x, y))) this.lightSrc.push({ x: x * 16 + 8, y: y * 16 + 4, r: 54 });
    for (const b of this.bigs) this.lightSrc.push({ x: b.x * 16 + 16, y: b.y * 16 + 10, r: 70, col: def.theme === 'aurelle' ? '#9ad0ff' : null });

    // player
    const sp = o.x !== undefined ? { x: o.x, y: o.y } : def.spawn;
    this.player = { kind: 'player', x: sp.x * 16, y: sp.y * 16, dir: o.dir || 'down', look: 'vesper', moving: false, anim: 0, solid: false };
    this.followers = [];
    this.cam.x = clamp(this.player.x - W / 2, 0, Math.max(0, this.w * 16 - W)); this.cam.y = clamp(this.player.y - H / 2, 0, Math.max(0, this.h * 16 - H));
    this.trail = []; for (let i = 0; i < 80; i++) this.trail.push({ x: this.player.x, y: this.player.y, dir: this.player.dir });

    // procedural population
    if (def.gen) this.populateGen(def);
    if (def.woods) this.populateWoods(def);
    // story-scripted entities
    if (Story.setup[id]) Story.setup[id](this);
    Snd.play(def.bgm);
    this.ready = true;
    this.encCd = 1.2;
    Game.S.era = def.era;
  },

  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? '#' : this.rows[y][x]; },
  kindOf(ch) { return ch === '.' ? 'floor' : ch === ',' ? 'alt' : ch === '_' ? 'accent' : ch === '=' ? 'carpet' : ch === '~' ? 'water' : ch === '#' || ch === '+' ? 'wall' : null; },
  solidTile(x, y) { return SOLID.has(this.get(x, y)); },

  /* ----------------------------------------------------------- population */
  pickGroup(rng) {
    const tab = ENC[this.def.enc]; if (!tab) return null;
    return tab[rng.int(0, tab.length - 1)];
  },
  populateGen(def) {
    const g = def.gen, rng = new RNG(hashStr(def.name));
    const done = Game.S.flags['clr_' + this.id];
    const bossSpawn = g.last;
    if (!done) {
      let n = 0;
      for (const sp of g.spots) {
        const cnt = sp.r.w * sp.r.h > 70 ? 2 : 1;
        for (let k = 0; k < cnt && n < def.groups; k++, n++) {
          const grp = this.pickGroup(rng);
          this.addEnemy(sp.x + (k ? rng.int(-2, 2) : 0), sp.y + (k ? rng.int(-2, 2) : 0), grp);
        }
      }
      // a couple of corridor patrols
      for (let i = 0; i < 2 && n < def.groups + 2; i++, n++) {
        const r = g.rooms[rng.int(1, g.rooms.length - 2)]; this.addEnemy(r.x + 1.5, r.y + r.h - 1.5, this.pickGroup(rng));
      }
    }
    // chests
    const items = def.chestItems.slice();
    const spots = g.chestSpots.slice(0, def.chests);
    spots.forEach((s, i) => {
      const it = items[i % items.length];
      this.addChest(s.x + 0.5, s.y + 0.5, `${this.id}_${i}`, it[0], it[1]);
    });
    // save well near the entrance
    this.addWell(g.first.cx + 2.5, g.first.cy + 0.5);
  },
  populateWoods(def) {
    const g = def.woods, rng = new RNG(hashStr(def.name));
    for (const c of g.clearings) if (Math.abs(c.cx - g.start.x) + Math.abs(c.cy - g.start.y) > 10) this.addEnemy(c.cx + 0.5, c.cy + 0.5, this.pickGroup(rng));
    for (let i = 0; i < 4; i++) { const c = g.clearings[rng.int(0, g.clearings.length - 1)]; this.addEnemy(c.cx + rng.int(-2, 2), c.cy + rng.int(-2, 2), this.pickGroup(rng)); }
    const items = def.chestItems;
    g.clearings.slice(1, 1 + def.chests).forEach((c, i) => { const it = items[i % items.length]; this.addChest(c.cx + 2.5, c.cy + 0.5, `${this.id}_${i}`, it[0], it[1]); });
  },

  addEnemy(tx, ty, group) {
    if (!group) return null;
    const e = { kind: 'enemy', x: tx * 16, y: ty * 16, hx: tx * 16, hy: ty * 16, group, state: 'wander', wt: R.range(0, 2), tx: tx * 16, ty: ty * 16, stun: 0, dir: 'down', solid: false, bob: R.range(0, 6), boss: false };
    const lead = ENEMIES[group.reduce((a, b) => (ENEMIES[b].lvl > ENEMIES[a].lvl ? b : a), group[0])];
    e.lead = lead.id; e.speed = lead.spd > 16 ? 34 : 26;
    this.ents.push(e); return e;
  },
  addNPC(id, tx, ty, look, o = {}) {
    const e = Object.assign({ kind: 'npc', id, x: tx * 16, y: ty * 16, look, dir: 'down', solid: true, moving: false, anim: 0 }, o);
    this.ents.push(e); return e;
  },
  addChest(tx, ty, id, item, n = 1) {
    const key = 'chest_' + id;
    const e = { kind: 'chest', x: tx * 16, y: ty * 16, id: key, item, n, opened: !!Game.S.flags[key], solid: true };
    this.ents.push(e); return e;
  },
  addExit(x, y, w, h, to, tx, ty, dir, cond) { const e = { x, y, w, h, to, tx, ty, dir, cond }; this.exits.push(e); return e; },
  addTrigger(id, x, y, w, h, fn, o = {}) { const t = Object.assign({ id, x, y, w, h, fn, once: true }, o); this.triggers.push(t); return t; },
  addWell(tx, ty) { const e = { kind: 'well', x: tx * 16, y: ty * 16, solid: true }; this.ents.push(e); return e; },
  addGate(tx, ty, kind = 'time') { const e = { kind: 'gate', gk: kind, x: tx * 16, y: ty * 16, solid: true }; this.ents.push(e); return e; },
  byId(id) { return this.ents.find(e => e.id === id); },
  removeEnt(e) { const i = this.ents.indexOf(e); if (i >= 0) this.ents.splice(i, 1); },

  /* ------------------------------------------------------------- collision */
  hitbox(e, x = e.x, y = e.y) { return [x - 5, y - 5, 10, 5]; },
  blockedAt(x, y, self) {
    const x0 = x - 5, x1 = x + 5, y0 = y - 5, y1 = y;
    for (const [px, py] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [x, y0], [x, y1]]) {
      if (this.solidTile(Math.floor(px / 16), Math.floor(py / 16))) return true;
    }
    for (const e of this.ents) {
      if (!e.solid || e === self) continue;
      if (x1 > e.x - 6 && x0 < e.x + 6 && y1 > e.y - 5 && y0 < e.y + 1) return true;
    }
    return false;
  },
  tryMove(e, dx, dy) {
    if (dx && !this.blockedAt(e.x + dx, e.y, e)) e.x += dx;
    if (dy && !this.blockedAt(e.x, e.y + dy, e)) e.y += dy;
  },

  /* -------------------------------------------------------- scripted moves */
  walkTo(e, tx, ty, speed = 54) {
    const sx = e.x, sy = e.y, d = Math.hypot(tx - sx, ty - sy);
    if (d < 1) return Promise.resolve();
    e.moving = true;
    return Tw.add(d / speed, p => {
      e.x = sx + (tx - sx) * p; e.y = sy + (ty - sy) * p;
      if (Math.abs(tx - sx) > Math.abs(ty - sy)) e.dir = tx > sx ? 'right' : 'left'; else e.dir = ty > sy ? 'down' : 'up';
      e.anim += 0.016;
    }).then(() => { e.moving = false; });
  },
  async path(e, pts, speed) { for (const [x, y] of pts) await this.walkTo(e, x * 16, y * 16, speed); },
  face(e, dir) { e.dir = dir; },
  faceTo(e, o) { const dx = o.x - e.x, dy = o.y - e.y; e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); },
  camTo(tx, ty, sec = 1) {
    const sx = this.cam.x, sy = this.cam.y;
    const cx = clamp(tx * 16 - W / 2, 0, Math.max(0, this.w * 16 - W)), cy = clamp(ty * 16 - H / 2, 0, Math.max(0, this.h * 16 - H));
    this.camTarget = { x: cx, y: cy, free: true };
    return Tw.add(sec, p => { this.cam.x = lerp(sx, cx, p); this.cam.y = lerp(sy, cy, p); }, Ease.inout);
  },
  camFree() { this.camTarget = null; },
  followCam(sec = 0.8) {
    const sx = this.cam.x, sy = this.cam.y;
    const px = clamp(this.player.x - W / 2, 0, Math.max(0, this.w * 16 - W)), py = clamp(this.player.y - H / 2, 0, Math.max(0, this.h * 16 - H));
    this.camTarget = null;
    return Tw.add(sec, p => { this.cam.x = lerp(sx, px, p); this.cam.y = lerp(sy, py, p); }, Ease.inout);
  },

  async warp(id, x, y, dir) {
    Game.busy++;
    await Gfx.fadeTo(1, 0.28);
    await this.load(id, { x, y, dir });
    Toast.add(this.def.name, UI.gold);
    await Gfx.fadeTo(0, 0.35);
    Game.busy--;
    Input.flush();
  },

  /* --------------------------------------------------------------- update */
  update(dt) {
    this.t += dt;
    const P = this.player;
    // animation clocks
    for (const e of this.ents) if (e.moving) e.anim += dt;
    if (Game.busy > 0 || Dlg.active) { P.moving = P.moving && Game.busy > 0 ? P.moving : false; this.updateCam(dt); return; }

    Game.S.time += dt;
    this.strikeCd = Math.max(0, this.strikeCd - dt);
    if (P.strike) { P.strike.t += dt; if (P.strike.t > 0.24) P.strike = null; }
    this.encCd = Math.max(0, this.encCd - dt);

    // movement
    let dx = (Input.isDown('right') ? 1 : 0) - (Input.isDown('left') ? 1 : 0);
    let dy = (Input.isDown('down') ? 1 : 0) - (Input.isDown('up') ? 1 : 0);
    if (P.strike && P.strike.t < 0.12) { dx = 0; dy = 0; }
    const moving = dx || dy;
    if (moving) {
      const n = Math.hypot(dx, dy); dx /= n; dy /= n;
      const sp = Input.isDown('run') ? 92 : 62;
      const ox = P.x, oy = P.y;
      this.tryMove(P, dx * sp * dt, dy * sp * dt);
      if (Math.abs(dx) > Math.abs(dy) + 0.01) P.dir = dx > 0 ? 'right' : 'left';
      else if (Math.abs(dy) > Math.abs(dx) + 0.01) P.dir = dy > 0 ? 'down' : 'up';
      else if (!P.dirLock) P.dir = dy > 0 ? 'down' : dy < 0 ? 'up' : P.dir;
      P.anim += dt * (Input.isDown('run') ? 1.5 : 1);
      const moved = Math.hypot(P.x - ox, P.y - oy);
      if (moved > 0) { Game.S.steps += moved / 16; this.pushTrail(); }
    }
    P.moving = !!moving;

    // interaction / strike
    this.hint = null;
    const it = this.findInteract();
    if (it) this.hint = it;
    if (Input.hit('ok')) {
      if (it) this.interact(it);
      else this.strike();
    }
    if (Input.hit('menu') || Input.hit('cancel')) Menu.open();

    this.updateEnemies(dt);
    this.checkExits();
    this.checkTriggers();
    this.updateCam(dt);
  },

  pushTrail() {
    const P = this.player, last = this.trail[0];
    if (!last || Math.hypot(P.x - last.x, P.y - last.y) >= 2) { this.trail.unshift({ x: P.x, y: P.y, dir: P.dir }); if (this.trail.length > 90) this.trail.pop(); }
  },

  updateCam(dt) {
    if (this.camTarget && this.camTarget.free) return;
    const P = this.player;
    const tx = clamp(P.x - W / 2, 0, Math.max(0, this.w * 16 - W)), ty = clamp(P.y - 20 - H / 2, 0, Math.max(0, this.h * 16 - H));
    const k = 1 - Math.pow(0.0005, dt);
    this.cam.x = lerp(this.cam.x, tx, k); this.cam.y = lerp(this.cam.y, ty, k);
    if (this.w * 16 <= W) this.cam.x = (this.w * 16 - W) / 2;
    if (this.h * 16 <= H) this.cam.y = (this.h * 16 - H) / 2;
  },

  findInteract() {
    const P = this.player;
    const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[P.dir];
    const px = P.x + v[0] * 11, py = P.y - 4 + v[1] * 9;
    let best = null, bd = 1e9;
    for (const e of this.ents) {
      if (!(e.kind === 'npc' || e.kind === 'chest' || e.kind === 'well' || e.kind === 'gate') || e.noTalk) continue;
      const d = Math.hypot(e.x - px, (e.y - 4) - py);
      if (d < 15 && d < bd) { best = e; bd = d; }
    }
    return best;
  },

  async interact(e) {
    Game.busy++;
    try {
      if (e.kind === 'npc') {
        if (!e.noTurn) this.faceTo(e, this.player);
        Snd.sfx('blip');
        if (e.talk) await e.talk(e); else if (e.say) for (const [n, t, x] of e.say) await Dlg.say(n, t, { expr: x, look: e.look && !LOOK_FOR[n] ? e.look : undefined });
      } else if (e.kind === 'chest') await this.openChest(e);
      else if (e.kind === 'well') await Story.wellMenu();
      else if (e.kind === 'gate') await Story.gateMenu(e);
    } catch (err) { console.error(err); }
    Game.busy--;
    Input.flush();
  },

  async openChest(e) {
    if (e.opened) { await Dlg.narrate('The chest is empty.'); return; }
    e.opened = true; Game.setFlag(e.id); Snd.sfx('chest');
    if (typeof e.item === 'string' && e.item.startsWith('cdx_')) {
      const cid = e.item.slice(4); Game.setFlag(e.item);
      const c = CODEX.find(x => x.id === cid);
      Toast.add(`Terminal entry: ${c.title}`, UI.cy);
      await Dlg.narrate(`Inside is a folded page: "${c.title}". (Added to the Terminal.)`);
    } else {
      Game.add(e.item, e.n || 1);
      Toast.add(`Obtained ${Game.nameOf(e.item)}${e.n > 1 ? ' ×' + e.n : ''}`, UI.gold);
      await wait(0.25);
    }
  },

  strike() {
    if (this.strikeCd > 0) return;
    const P = this.player;
    this.strikeCd = 0.42; P.strike = { t: 0, dir: P.dir };
    Snd.sfx('swing');
    const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[P.dir];
    for (const e of this.ents) {
      if (e.kind !== 'enemy' || e.stun > 0) continue;
      const rx = e.x - P.x, ry = (e.y - 6) - (P.y - 6), d = Math.hypot(rx, ry);
      if (d < 30 && (rx * v[0] + ry * v[1]) > -4) {
        e.stun = 3.2; e.state = 'stun'; Snd.sfx('hit'); Gfx.doShake(2);
        this.puff(e.x, e.y - 12, '#ffe9a0', 8);
      }
    }
  },

  puffs: [],
  puff(x, y, col, n = 8) { for (let i = 0; i < n; i++) this.puffs.push({ x, y, vx: R.range(-30, 30), vy: R.range(-40, 0), t: 0, life: R.range(0.3, 0.6), col }); },

  updateEnemies(dt) {
    const P = this.player;
    for (let i = this.puffs.length - 1; i >= 0; i--) { const p = this.puffs[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; if (p.t > p.life) this.puffs.splice(i, 1); }
    for (const e of this.ents) {
      if (e.kind === 'bossvis') { e.bob += dt * 2; continue; }
      if (e.kind !== 'enemy') continue;
      e.bob += dt * 3;
      if (e.stun > 0) { e.stun -= dt; if (e.stun <= 0) e.state = 'wander'; continue; }
      const d = Math.hypot(P.x - e.x, P.y - e.y);
      if (e.state === 'wander') {
        e.wt -= dt;
        if (e.wt <= 0) { e.wt = R.range(1, 3); e.tx = e.hx + R.range(-28, 28); e.ty = e.hy + R.range(-20, 20); }
        this.chaseStep(e, e.tx, e.ty, 14, dt);
        if (d < 84 && this.los(e, P)) { e.state = 'chase'; e.alert = 0.6; Snd.sfx('alert'); }
      } else if (e.state === 'chase') {
        if (e.alert > 0) e.alert -= dt;
        else this.chaseStep(e, P.x, P.y, e.speed, dt);
        if (d > 150) e.state = 'wander';
      }
      if (d < 11 && this.encCd <= 0 && Game.busy === 0 && !Dlg.active) { this.encounter(e); return; }
    }
  },
  chaseStep(e, tx, ty, sp, dt) {
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d < 2) return;
    const mx = dx / d * sp * dt, my = dy / d * sp * dt;
    if (!this.blockedAt(e.x + mx, e.y, e)) e.x += mx; else if (!this.blockedAt(e.x, e.y + my * 2, e)) e.y += my * 2;
    if (!this.blockedAt(e.x, e.y + my, e)) e.y += my;
    e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  },
  los(a, b) {
    const n = 8;
    for (let i = 1; i < n; i++) {
      const x = lerp(a.x, b.x, i / n), y = lerp(a.y, b.y, i / n) - 6;
      if (this.solidTile(Math.floor(x / 16), Math.floor(y / 16))) return false;
    }
    return true;
  },

  async encounter(e) {
    Game.busy++;
    this.encCd = 99;
    const first = e.stun > 0;
    Snd.sfx('encounter');
    Gfx.doFlash('#ffffff', 0.9);
    await wait(0.18);
    const tut = !Game.flag('tut_done');
    const res = await Battle.fight(e.group, { first, bg: this.def.bg, bgm: 'battle', from: this.id, tutorial: tut ? Story.tutorial : null, noEscape: tut, noAmbush: tut });
    Game.busy--;
    this.encCd = 1.5;
    if (res === 'win') { this.removeEnt(e); this.puff(e.x, e.y - 10, '#ffffff', 14); }
    else if (res === 'flee') { e.stun = 3.5; e.state = 'stun'; }
    else if (res === 'lose') return;
    Snd.play(this.def.bgm);
    Input.flush();
    if (this.afterBattle) { const f = this.afterBattle; this.afterBattle = null; f(res); }
  },

  checkExits() {
    if (Game.busy) return;
    const P = this.player, tx = P.x / 16, ty = (P.y - 3) / 16;
    for (const ex of this.exits) {
      if (tx >= ex.x && tx < ex.x + ex.w && ty >= ex.y && ty < ex.y + ex.h) {
        if (ex.cond && !ex.cond()) { if (ex.deny) ex.deny(); continue; }
        if (ex.to === null) { this.leaveDungeon(); return; }
        this.warp(ex.to, ex.tx, ex.ty, ex.dir);
        return;
      }
    }
  },
  async leaveDungeon() {
    const back = this.def.leave || Story.leave[this.id];
    if (!back) return;
    const ok = await (async () => { Game.busy++; const r = await Dlg.ask(['Leave', 'Stay'], { title: 'Leave this place?' }); Game.busy--; return r === 0; })();
    if (ok) this.warp(back.to, back.x, back.y, back.dir);
    else { this.player.y += 20; this.pushTrail(); }
  },
  checkTriggers() {
    if (Game.busy) return;
    const P = this.player, tx = P.x / 16, ty = (P.y - 3) / 16;
    for (const t of this.triggers) {
      if (t.done) continue;
      if (t.cond && !t.cond()) continue;
      if (tx >= t.x && tx < t.x + t.w && ty >= t.y && ty < t.y + t.h) {
        if (t.once) t.done = true;
        Game.cutscene(async () => { await t.fn(this); Input.flush(); });
        return;
      }
    }
  },

  /* ----------------------------------------------------------------- draw */
  tileSpr(kind, x, y) {
    const v = (x * 7 + y * 13 + (x * y) % 5) & 3;
    return TileArt.ground(this.theme, kind, kind === 'water' ? 0 : v, kind === 'water' ? Math.floor(this.t * 2 + (x + y) * 0.3) & 1 : 0);
  },

  draw() {
    const cam = { x: Math.round(this.cam.x), y: Math.round(this.cam.y) };
    const tx0 = Math.max(0, Math.floor(cam.x / 16)), ty0 = Math.max(0, Math.floor(cam.y / 16));
    const tx1 = Math.min(this.w - 1, tx0 + 31), ty1 = Math.min(this.h - 1, ty0 + 18);
    const drawList = [];
    const T = this.theme;
    // backdrop for out-of-map areas
    L.fillStyle = T === 'lacuna' ? '#fbf8f2' : '#07040c'; L.fillRect(0, 0, W, H);
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      const ch = this.get(x, y), px = x * 16 - cam.x, py = y * 16 - cam.y;
      if (ch === '#' || ch === '+') {
        const below = this.get(x, y + 1), below2 = this.get(x, y + 2);
        const isW = c => c === '#' || c === '+';
        if (!isW(below) || ch === '+') {
          L.drawImage(this.tileSpr('wall', x, y), px, py);
        } else if (!isW(below2)) {
          L.drawImage(this.tileSpr('wall', x, y), px, py);
          if (WINDOWED.has(T) && ((x * 5 + y * 3) % 4 === 0)) this.drawWindow(px, py);
        } else L.drawImage(this.tileSpr('top', x, y), px, py);
        if (ch === '+') drawList.push({ y: y * 16 + 8, img: TileArt.prop(T, 'door'), x: px - 1, yy: py - 17 });
        continue;
      }
      const kind = this.groundK[y][x];
      L.drawImage(this.tileSpr(kind === 'wall' || kind === 'top' ? 'floor' : kind, x, y), px, py);
      if (PROPCH.has(ch)) {
        const th = THEMES[T];
        let name = th.props[ch];
        if (ch === 'F' && this.bigs.some(b => x >= b.x && x <= b.x + 1 && y >= b.y && y <= b.y + 1)) name = null;
        if (name) drawList.push({ y: y * 16 + 16, img: TileArt.prop(T, name), x: px - 1, yy: py - 17 });
      }
    }
    for (const b of this.bigs) {
      const key = 'big:' + T; const img = this.gfxCache[key] || (this.gfxCache[key] = bigCentral(T));
      drawList.push({ y: b.y * 16 + 32, img, x: b.x * 16 - cam.x - 1, yy: b.y * 16 - cam.y + 32 - 45 });
    }
    // entities
    for (const e of this.ents) {
      if (e.x < cam.x - 60 || e.x > cam.x + W + 60 || e.y < cam.y - 40 || e.y > cam.y + H + 90) continue;
      drawList.push({ y: e.y, ent: e });
    }
    drawList.push({ y: this.player.y, ent: this.player, isP: true });
    if (!Game.busy || this.followersVisible) {
      const n = this.trailFollowers();
      n.forEach((f, i) => drawList.push({ y: f.y - 0.05 * (i + 1), ent: f, follower: true }));
    }
    drawList.sort((a, b) => a.y - b.y);
    for (const d of drawList) {
      if (d.img) L.drawImage(d.img, Math.round(d.x), Math.round(d.yy));
      else this.drawEnt(d.ent, cam);
    }
    this.drawFx(cam);
    this.drawLighting(cam);
  },

  drawWindow(px, py) {
    L.fillStyle = '#1a1020'; L.fillRect(px + 3, py + 2, 10, 10);
    const lit = ((px + py) & 8) ? '#ffd88a' : '#f0b860';
    L.fillStyle = this.theme === 'terminus' || this.theme === 'datacore' ? '#30e2d2' : lit; L.fillRect(px + 4, py + 3, 8, 8);
    L.fillStyle = '#1a1020'; L.fillRect(px + 7, py + 3, 2, 8); L.fillRect(px + 4, py + 6, 8, 1);
    L.fillStyle = 'rgba(255,255,255,0.35)'; L.fillRect(px + 4, py + 3, 3, 1);
  },

  trailFollowers() {
    const arr = [];
    const party = Game.activeParty().slice(1);
    party.forEach((id, i) => {
      const idx = Math.min(this.trail.length - 1, (i + 1) * 9);
      const tp = this.trail[idx] || this.player;
      arr.push({ kind: 'follower', look: CHARS[id].look, x: tp.x, y: tp.y, dir: tp.dir, moving: this.player.moving, anim: this.player.anim - i * 0.05 });
    });
    return arr;
  },

  frameOf(e) { return e.moving ? [0, 1, 0, 2][Math.floor(e.anim * 8) & 3] : 0; },

  drawShadow(x, y, w = 6) { L.fillStyle = 'rgba(8,4,16,0.45)'; L.beginPath(); L.ellipse(x, y - 1, w, 2.4, 0, 0, TAU); L.fill(); },

  drawEnt(e, cam) {
    const sx = Math.round(e.x - cam.x), sy = Math.round(e.y - cam.y);
    if (e.kind === 'npc' || e.kind === 'player' || e.kind === 'follower') {
      if (e.hidden) return;
      const spr = Art.field(e.look, e.dir, this.frameOf(e));
      this.drawShadow(sx, sy, 6);
      const off = e.hop ? -Math.abs(Math.sin(this.t * 10)) * 3 : 0;
      L.drawImage(spr, sx - 9, sy - 24 + off);
      if (e.kind === 'player' && e.strike) this.drawStrike(e, sx, sy);
    } else if (e.kind === 'marker') {
      const b = Math.sin(this.t * 4) * 1.5;
      L.fillStyle = '#e8c868'; L.fillRect(sx - 5, sy - 3, 10, 2); L.fillRect(sx - 4, sy - 6, 8, 2); L.fillRect(sx - 3, sy - 9 + Math.round(b), 6, 2); L.fillRect(sx - 1, sy - 13 + Math.round(b), 2, 4);
      L.fillStyle = 'rgba(255,255,255,0.7)'; L.fillRect(sx - 4, sy - 6, 2, 1);
    } else if (e.kind === 'enemy' || e.kind === 'bossvis') {
      const spr = Art.enemy(e.lead);
      const bob = Math.round(Math.sin(e.bob) * 1.5);
      this.drawShadow(sx, sy, spr.width / 3);
      L.save();
      if (e.stun > 0) L.globalAlpha = 0.6 + Math.sin(this.t * 30) * 0.3;
      const ww = spr.width, hh = spr.height;
      L.drawImage(spr, Math.round(sx - ww / 2), Math.round(sy - hh + bob + 2));
      L.restore();
      if (e.kind === 'enemy' && e.group.length > 1) { L.fillStyle = '#150d1f'; L.fillRect(sx + ww / 2 - 6, sy - hh, 9, 7); L.fillStyle = '#e8c868'; L.fillRect(sx + ww / 2 - 5, sy - hh + 1, 7, 5); L.fillStyle = '#150d1f'; L.fillRect(sx + ww / 2 - 3, sy - hh + 2, 3, 3); }
      if (e.kind === 'enemy' && e.alert > 0) { L.fillStyle = '#e0384e'; L.fillRect(sx - 1, sy - hh - 9, 3, 6); L.fillRect(sx - 1, sy - hh - 2, 3, 2); }
      if (e.kind === 'enemy' && e.stun > 0) { L.fillStyle = '#ffe070'; for (let i = 0; i < 3; i++) { const a = this.t * 6 + i * 2.1; L.fillRect(Math.round(sx + Math.cos(a) * 7), Math.round(sy - hh - 3 + Math.sin(a) * 2), 2, 2); } }
    } else if (e.kind === 'chest') {
      L.drawImage(Chest.get(e.opened), sx - 9, sy - 15);
    } else if (e.kind === 'well') {
      const pr = TileArt.prop(this.theme, 'inkwell');
      L.drawImage(pr, sx - 9, sy - 32);
    } else if (e.kind === 'gate') {
      this.drawGate(e, sx, sy);
    }
  },

  drawStrike(e, sx, sy) {
    const t = e.strike.t / 0.24, v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[e.strike.dir];
    const a0 = Math.atan2(v[1], v[0]) - 1.1, a1 = a0 + 2.2 * Ease.out(t);
    L.save(); L.globalAlpha = 1 - t * 0.6; L.strokeStyle = '#fff4d0'; L.lineWidth = 2;
    L.beginPath(); L.arc(sx + v[0] * 4, sy - 10 + v[1] * 4, 17, a0, a1); L.stroke();
    L.strokeStyle = '#e0384e'; L.lineWidth = 1; L.beginPath(); L.arc(sx + v[0] * 4, sy - 10 + v[1] * 4, 15, a0, a1); L.stroke(); L.restore();
  },

  drawGate(e, sx, sy) {
    const t = this.t;
    const col = e.gk === 'chaos' ? '#30e2d2' : '#e8c868';
    this.drawShadow(sx, sy, 12);
    L.save();
    L.fillStyle = '#1a1226'; L.fillRect(sx - 12, sy - 4, 24, 4); L.fillStyle = '#3a2e4a'; L.fillRect(sx - 10, sy - 6, 20, 2);
    for (let i = 0; i < 3; i++) {
      L.strokeStyle = i === 0 ? col : (i === 1 ? '#e0384e' : '#fff'); L.globalAlpha = 0.9 - i * 0.2; L.lineWidth = 1.5;
      L.beginPath(); L.ellipse(sx, sy - 22, 11 - i * 3, 17 - i * 4, 0, 0, TAU); L.stroke();
    }
    L.globalAlpha = 0.5; L.fillStyle = col;
    for (let i = 0; i < 10; i++) { const a = t * 1.5 + i * 0.63; L.fillRect(Math.round(sx + Math.cos(a) * 9 * ((i % 3 + 1) / 3)), Math.round(sy - 22 + Math.sin(a * 1.3) * 14), 1, 2); }
    L.globalAlpha = 0.25 + Math.sin(t * 3) * 0.1; L.beginPath(); L.ellipse(sx, sy - 22, 9, 15, 0, 0, TAU); L.fill();
    L.restore();
  },

  drawFx(cam) {
    for (const p of this.puffs) { L.globalAlpha = 1 - p.t / p.life; L.fillStyle = p.col; L.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), 2, 2); }
    L.globalAlpha = 1;
    // drifting motes
    const T = this.theme;
    const motes = T === 'verdigris' ? '#f0f0a0' : T === 'lacuna' ? '#e0384e' : T === 'terminus' || T === 'datacore' ? '#30e2d2' : T === 'aurelle' ? '#ffcf70' : T === 'temple' ? '#f4d878' : null;
    if (motes) {
      L.fillStyle = motes;
      for (let i = 0; i < 24; i++) {
        const s = i * 97.13, x = ((s * 3.1 + this.t * (6 + (i % 5))) % (W + 20)) - 10, y = (H - ((s * 1.7 + this.t * (4 + (i % 4) * 2)) % (H + 20))) + 10;
        L.globalAlpha = 0.35 + 0.3 * Math.sin(this.t * 2 + i);
        L.fillRect(Math.round(x), Math.round(y + Math.sin(this.t + i) * 4), 1, 1);
      }
      L.globalAlpha = 1;
    }
  },

  /* ambient tint + darkness with light pools */
  drawLighting(cam) {
    const def = this.def;
    const th = THEMES[this.theme];
    if (th.amb > 0) {
      L.save(); L.globalCompositeOperation = 'multiply'; L.globalAlpha = 1;
      L.fillStyle = mixc('#ffffff', th.ambient, Math.min(1, th.amb * 2.6)); L.fillRect(0, 0, W, H); L.restore();
    }
    const dark = def.dark || 0;
    const lc = this.lightCanvas || (this.lightCanvas = mkCanvas(W, H));
    const [c, x] = lc;
    if (dark > 0) {
      x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
      x.fillStyle = `rgba(4,2,12,${dark})`; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'destination-out';
      const P = this.player;
      const holes = [{ x: P.x - cam.x, y: P.y - 12 - cam.y, r: 92 }].concat(this.lightSrc.map(l => ({ x: l.x - cam.x, y: l.y - cam.y, r: l.r })));
      for (const h of holes) {
        if (h.x < -120 || h.x > W + 120 || h.y < -120 || h.y > H + 120) continue;
        const fl = 1 + Math.sin(this.t * 9 + h.x) * 0.03;
        const g = x.createRadialGradient(h.x, h.y, h.r * 0.15, h.x, h.y, h.r * fl);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(h.x - h.r - 2, h.y - h.r - 2, h.r * 2 + 4, h.r * 2 + 4);
      }
      L.drawImage(c, 0, 0);
    }
    // warm additive glows
    L.save(); L.globalCompositeOperation = 'lighter';
    for (const l of this.lightSrc) {
      const sx = l.x - cam.x, sy = l.y - cam.y;
      if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) continue;
      const col = l.col || th.light;
      const r = l.r * 0.7 * (1 + Math.sin(this.t * 7 + l.x) * 0.04);
      const g = L.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, rgba(col, 0.32)); g.addColorStop(1, rgba(col, 0));
      L.fillStyle = g; L.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    for (const e of this.ents) if (e.kind === 'well' || e.kind === 'gate') {
      const sx = e.x - cam.x, sy = e.y - 14 - cam.y, col = e.kind === 'gate' ? (e.gk === 'chaos' ? '#30e2d2' : '#e8c868') : '#ff8a6a';
      const r = 40 + Math.sin(this.t * 3) * 3, g = L.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, rgba(col, 0.35)); g.addColorStop(1, rgba(col, 0)); L.fillStyle = g; L.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    L.restore();
  },

  drawUI() {
    // interaction hint
    if (this.hint && !Game.busy && !Dlg.active) {
      const e = this.hint, sx = e.x - this.cam.x, sy = e.y - this.cam.y - (e.kind === 'npc' ? 32 : e.kind === 'gate' ? 46 : 22);
      const bob = Math.sin(UI.t * 6) * 1.5;
      UI.panel(sx - 8, sy - 8 + bob, 16, 14, { a: 0.85 });
      UI.text(Input.lastDevice === 'touch' ? 'A' : 'Z', sx, sy + 3 + bob, { size: 9, align: 'center', col: UI.gold, font: UI.fT });
    }
    // enemy stun/awareness hint & map name (top-left small)
    if (!Game.busy) {
      U.globalAlpha = 0.65;
      UI.text(this.def.name, 8, 12, { size: 8, col: '#d8c8e8', font: UI.fT });
      U.globalAlpha = 1;
    }
  },
};
