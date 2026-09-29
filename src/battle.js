'use strict';
/* ==========================================================================
   VERMILION REQUIEM — battle.js
   "Ring-Time Battle": Chrono-style active time gauges and combo techs,
   Shadow Hearts' Judgment Ring for offence, Clair Obscur-style telegraphed
   dodge / parry for defence, and .hack-style Data Drain interrupts against
   charging bosses.
   ========================================================================== */

const BP = [[352, 124], [398, 158], [350, 192]];
function foeSlots(n, boss) {
  if (boss && n === 1) return [[146, 198]];
  const T = { 1: [[150, 180]], 2: [[108, 150], [184, 192]], 3: [[76, 126], [150, 160], [98, 196]], 4: [[62, 122], [132, 146], [86, 172], [160, 198]] };
  return T[Math.min(n, 4)];
}
const angDiff = (a, b) => Math.abs(a - b);

const Battle = {
  active: false, mode: 'idle', t: 0, busy: false, party: [], foes: [], turnQ: [], cmd: null, tsel: null, ring: null, defw: null,
  o: {}, banner: null, result: null, freeze: 0, hooks: [], nameTag: null, zoom: 0, bgName: 'aurelle',

  /* ------------------------------------------------------------ lifecycle */
  fight(ids, o = {}) {
    return new Promise(res => {
      this.res = res; this.o = o; this.prevScene = Game.scene; this.stage = 0; this.ids0 = ids.slice();
      this.snapshot = JSON.stringify(Game.S.chars);
      Game.scene = this; this.active = true;
      Snd.play(o.bgm === 'battle' && ids.some(i => ENEMIES[i].boss) ? 'boss' : (o.bgm || 'battle'));
      this.begin(ids, true);
    });
  },

  begin(ids, first) {
    FX.reset();
    this.busy = false; this.mode = 'intro'; this.t = 0; this.turnQ = []; this.cmd = null; this.tsel = null; this.ring = null; this.defw = null;
    this.result = null; this.hooks = []; this.nameTag = null; this.freeze = 0; this.over = null;
    const boss = ids.some(i => ENEMIES[i].boss);
    this.bgName = (ids.map(i => ENEMIES[i].bg).find(Boolean)) || this.o.bg || 'aurelle';
    this.party = Game.activeParty().map((id, i) => this.mkParty(id, i));
    this.spawn(ids);
    const ambush = !boss && !this.o.first && !this.o.noAmbush && R.chance(0.07);
    this.o.ambushed = ambush;
    for (const p of this.party) { p.atb = this.o.first ? R.range(60, 85) : ambush ? 0 : R.range(15, 45); }
    for (const f of this.foes) { f.atb = ambush ? R.range(70, 90) : this.o.first ? R.range(0, 10) : R.range(5, 40); }
    for (const f of this.foes) Game.S.best[f.id] = Game.S.best[f.id] || 0;
    const intro = async () => {
      Gfx.doFlash('#fff', 0.5);
      await wait(0.35);
      if (boss) { await this.showBanner(this.foes[0].name, 'A great presence stirs...', 1.6); }
      else if (this.o.first) this.popBanner('FIRST STRIKE!', '#ffe9a0');
      else if (ambush) this.popBanner('AMBUSH!', '#ff6a7e');
      this.mode = 'idle';
      Input.flush();
      if (this.o.tutorial && first) await this.o.tutorial(this);
    };
    Game.busy++;
    intro().then(() => { Game.busy--; });
  },

  mkParty(id, i) {
    const c = Game.S.chars[id], st = Game.stats(id), C = CHARS[id];
    if (c.hp <= 0) c.hp = 1;
    return {
      side: 'p', id, name: C.name, look: C.look, col: C.col, lv: c.lv, hp: Math.min(c.hp, st.hp), maxhp: st.hp, mp: Math.min(c.mp, st.mp), maxmp: st.mp, s: st,
      atb: 0, ready: false, stat: {}, reson: c.res || 0, mal: c.mal || 0, fused: 0, pose: 'idle', poseT: 0, x: BP[i][0], y: BP[i][1], hx: BP[i][0], hy: BP[i][1],
      ox: 0, oy: 0, flash: 0, alive: true, slot: i, shown: c.hp, guard: false, tick: 0, hop: 0, skills: Game.skillsOf(id), after: 0,
    };
  },

  spawn(ids) {
    const boss = ids.some(i => ENEMIES[i].boss);
    const slots = foeSlots(ids.length, boss);
    this.foes = ids.map((id, i) => {
      const d = ENEMIES[id], art = Art.enemy(id), [x, y] = slots[i] || slots[0];
      return {
        side: 'e', id, d, name: d.name, hp: d.hp, maxhp: d.hp, lvl: d.lvl, s: { atk: d.atk, def: d.def, mag: d.mag, res: d.res, spd: d.spd },
        atb: 0, stat: {}, x, y, scale: art.ext ? 1 : (d.scale || 2), art, ox: 0, oy: 0, flash: 0, alive: true, dead: 0, charging: null, stunT: 0, seen: 0, halfDone: false, bob: R.range(0, 6),
        slot: i, boss: !!d.boss, appear: 0, readyMove: null, tick: 0, shown: d.hp,
      };
    });
  },

  end(result) {
    this.active = false;
    // write back party state
    for (const p of this.party) {
      const c = Game.S.chars[p.id];
      c.hp = Math.max(1, Math.round(p.hp)); c.mp = Math.round(p.mp); c.mal = Math.round(p.mal || 0); c.res = 0;
    }
    Game.scene = this.prevScene;
    Snd.stopFx && Snd.stopFx();
    Input.flush();
    const r = this.res; this.res = null;
    if (r) r(result);
  },

  /* ------------------------------------------------------------- helpers */
  alive(side) { return (side === 'p' ? this.party : this.foes).filter(c => c.alive); },
  head(c) { const h = c.side === 'p' ? 40 : c.art.height * c.scale * 0.6; return { x: c.x + c.ox, y: c.y + c.oy - h }; },
  mid(c) { const h = c.side === 'p' ? 24 : c.art.height * c.scale * 0.4; return { x: c.x + c.ox, y: c.y + c.oy - h }; },
  rate(c) {
    if (c.stat.stun || c.stunT > 0) return 0;
    let r = c.s.spd * 100 / 72;
    if (c.stat.haste) r *= 1.5; if (c.stat.slow) r *= 0.6;
    return r;
  },
  pose(c, p, t = 0.3) { c.pose = p; c.poseT = t; },
  elemMul(t, e) { if (!e || t.side === 'p') return 1; const d = t.d; if (d.weak && d.weak.includes(e)) return 1.5; if (d.resist && d.resist.includes(e)) return 0.6; return 1; },
  addStatus(c, id, dur) {
    if (!c.alive) return;
    if (c.side === 'e' && c.boss && (id === 'stun' || id === 'slow') && !c.d.allowStun) { if (!R.chance(0.35)) return; dur *= 0.5; }
    c.stat[id] = Math.max(c.stat[id] || 0, dur);
    const h = this.head(c);
    FX.text(h.x, h.y - 6, STATUS[id].name, STATUS[id].col, 8, { life: 0.8 });
  },
  popBanner(txt, col = '#fff', dur = 1.3) { this.banner = { txt, col, t: 0, dur }; },
  showBanner(t1, t2, dur = 1.6) { this.banner = { txt: t1, sub: t2, col: '#ffdbe0', t: 0, dur, big: true }; return wait(dur); },
  showName(name, col = '#fff') { this.nameTag = { txt: name, col, t: 0 }; },

  /* ---------------------------------------------------------------- update */
  update(dt) {
    this.t += dt;
    UI.tick(0);
    if (this.freeze > 0) { this.freeze -= dt; return; }
    FX.update(dt);
    this.animate(dt);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
    if (this.nameTag) { this.nameTag.t += dt; if (this.nameTag.t > 1.3) this.nameTag = null; }
    if (this.ring) return this.updateRing(dt);
    if (this.defw) return this.updateDef(dt);
    switch (this.mode) {
      case 'idle': this.updateIdle(dt); break;
      case 'cmd': this.updateCmd(dt); break;
      case 'target': this.updateTarget(dt); break;
      case 'result': this.updateResult(dt); break;
      case 'over': this.updateOver(dt); break;
    }
  },

  animate(dt) {
    for (const c of this.party.concat(this.foes)) {
      c.flash = Math.max(0, c.flash - dt * 4);
      if (c.poseT > 0) { c.poseT -= dt; if (c.poseT <= 0 && c.pose !== 'down' && c.pose !== 'win') c.pose = 'idle'; }
      if (c.side === 'p') c.shown += (c.hp - c.shown) * Math.min(1, dt * 8);
      else { c.shown += (c.hp - c.shown) * Math.min(1, dt * 6); c.seen = Math.max(0, c.seen - dt); c.appear = Math.min(1, c.appear + dt * 2); c.bob += dt * 2.5; }
      if (!c.alive && c.side === 'e') c.dead = Math.min(1, c.dead + dt * 1.6);
    }
  },

  updateIdle(dt) {
    if (this.busy) return;
    this.tickATB(dt);
    if (this.hooks.length) { this.runHook(); return; }
    const first = this.turnQ.find(c => c.alive);
    this.turnQ = this.turnQ.filter(c => c.alive);
    if (!first) return;
    if (first.side === 'p') this.openCmd(first);
    else this.enemyTurn(first);
  },

  tickATB(dt) {
    for (const c of this.party.concat(this.foes)) {
      if (!c.alive) continue;
      // statuses
      for (const k in c.stat) { c.stat[k] -= dt; if (c.stat[k] <= 0) delete c.stat[k]; }
      c.tick += dt;
      if (c.tick >= 2) {
        c.tick -= 2;
        if (c.stat.poison) this.dot(c, 0.04, '#9ae06a');
        if (c.stat.burn) this.dot(c, 0.04, '#ff8a3a');
        if (c.stat.regen && c.hp < c.maxhp) { const h = Math.round(c.maxhp * 0.04); c.hp = Math.min(c.maxhp, c.hp + h); const p = this.head(c); FX.text(p.x, p.y, '+' + h, '#80ffb0', 9); }
      }
      if (c.stunT > 0) c.stunT -= dt;
      if (c.charging) {
        c.charging.t += dt;
        if (c.charging.t >= c.charging.mv.ch) { c.readyMove = c.charging.mv; c.charging = null; this.turnQ.unshift(c); }
        continue;
      }
      if (c.atb < 100) c.atb = Math.min(100, c.atb + this.rate(c) * dt);
      if (c.atb >= 100 && !this.turnQ.includes(c) && !(c.stunT > 0)) { this.turnQ.push(c); if (c.side === 'p') { c.guard = false; Snd.sfx('ready'); } }
    }
  },
  dot(c, pct, col) {
    const d = Math.max(2, Math.round(c.maxhp * pct));
    c.hp = Math.max(c.side === 'p' ? 1 : 0, c.hp - d); c.flash = 0.2;
    const p = this.head(c); FX.text(p.x, p.y, String(d), col, 9);
    if (c.hp <= 0) this.kill(c);
  },

  /* ---------------------------------------------------------- kill / win */
  kill(c) {
    if (!c.alive) return;
    c.alive = false; c.hp = 0; c.atb = 0; c.stat = {}; c.charging = null; c.ready = false;
    this.turnQ = this.turnQ.filter(x => x !== c);
    if (c.side === 'p') { c.pose = 'down'; c.fused = 0; Snd.sfx('death'); }
    else {
      Snd.sfx('kill');
      const m = this.mid(c); FX.sparks(m.x, m.y, '#ffffff', 20, 120, 0.7, 2); FX.ink(m.x, m.y, '#e0384e', 8);
      Game.S.best[c.id] = (Game.S.best[c.id] || 0) + 1; Game.S.kills++;
      if (c.boss) { Gfx.doFlash('#fff', 0.9); Gfx.doShake(8); }
    }
  },

  async checkEnd() {
    if (!this.alive('e').length) {
      if (this.o.chain && this.o.chain[this.stage]) {
        const ch = this.o.chain[this.stage]; this.stage++;
        this.busy = true; Game.busy++;
        await wait(0.9);
        if (ch.run) await ch.run(this);
        this.spawn(ch.ids); this.bgName = ENEMIES[ch.ids[0]].bg || this.bgName;
        for (const f of this.foes) f.atb = R.range(0, 30);
        this.turnQ = this.turnQ.filter(c => c.side === 'p');
        Game.busy--; this.busy = false; return true;
      }
      this.busy = true; await this.victory(); return true;
    }
    if (!this.alive('p').length) { this.busy = true; await this.defeat(); return true; }
    return false;
  },

  runHook() {
    const key = this.hooks.shift();
    const fn = Story.hooks[key]; if (!fn) return;
    this.busy = true; Game.busy++;
    Promise.resolve(fn(this)).then(() => { Game.busy--; this.busy = false; Input.flush(); });
  },

  /* ------------------------------------------------------------- command */
  openCmd(a) {
    this.mode = 'cmd';
    this.cmd = { a, stage: 'main', menu: null };
    this.buildMain();
    Snd.sfx('blip');
  },
  cardX(a) { return 6 + a.slot * 158; },
  buildMain() {
    const a = this.cmd.a, items = [];
    const def = CHARS[a.id];
    if (a.fused) {
      items.push({ label: SKILLS.i_swan.name, k: 'skill', sk: 'i_swan' });
      items.push({ label: 'Fused Arts', k: 'skills', right: '›' });
    } else {
      items.push({ label: 'Attack', k: 'skill', sk: def.attack });
      items.push({ label: 'Skills', k: 'skills', right: '›' });
      const techs = this.availTechs(a);
      if (techs.length) items.push({ label: 'Techs', k: 'techs', right: '›', col: '#f4d878' });
      items.push({ label: 'Items', k: 'items', right: '›' });
    }
    if (a.reson >= 100) items.push({ label: 'REQUIEM', k: 'skill', sk: def.req, col: '#ff6a7e', disabled: false });
    if (def.fuse && Game.flag('fusion') && a.mal >= 100 && !a.fused) items.push({ label: 'Fuse', k: 'fuse', col: '#c0a0ff' });
    items.push({ label: 'Guard', k: 'guard' });
    if (!this.foes.some(f => f.boss) && !this.foes.some(f => f.d.noEscape) && !this.o.noEscape) items.push({ label: 'Flee', k: 'flee' });
    const m = new ListMenu({ x: Math.min(this.cardX(a), W - 96), y: 202 - (items.length * 12 + 10), w: 92, rows: items.length, rowH: 12, size: 9, items });
    this.cmd.menu = m; this.cmd.stage = 'main';
  },
  buildSkills() {
    const a = this.cmd.a;
    const list = a.fused ? ['i_feather', 'i_devour'] : a.skills;
    const items = list.map(id => { const s = SKILLS[id]; return { label: s.name, right: s.mp ? s.mp : '', sk: id, disabled: a.mp < s.mp, k: 'skill' }; });
    if (!items.length) items.push({ label: '(none yet)', disabled: true });
    const rows = Math.min(6, items.length);
    this.cmd.menu = new ListMenu({ x: Math.min(this.cardX(a) + 40, W - 126), y: 202 - (rows * 12 + 10), w: 122, rows, rowH: 12, size: 9, items });
    this.cmd.stage = 'skills';
  },
  availTechs(a) {
    const out = [];
    for (const [id, t] of Object.entries(TECHS)) {
      if (!t.need.includes(a.id)) continue;
      if (t.flag && !Game.flag(t.flag)) continue;
      const mem = t.need.map(n => this.party.find(p => p.id === n));
      if (mem.some(m => !m)) continue;
      out.push({ id, t, mem });
    }
    return out;
  },
  buildTechs() {
    const a = this.cmd.a;
    const items = this.availTechs(a).map(({ id, t, mem }) => {
      const ok = mem.every(m => m.alive && m.atb >= 100 && m.mp >= t.mp);
      return { label: t.name, right: t.mp, tech: id, disabled: !ok, col: '#f4d878', k: 'tech' };
    });
    const rows = Math.min(5, items.length);
    this.cmd.menu = new ListMenu({ x: Math.min(this.cardX(a) + 30, W - 136), y: 202 - (rows * 12 + 10), w: 132, rows, rowH: 12, size: 9, items });
    this.cmd.stage = 'techs';
  },
  buildItems() {
    const a = this.cmd.a;
    const items = Object.keys(Game.S.inv).filter(id => ITEMS[id]).map(id => ({ label: ITEMS[id].name, right: '×' + Game.S.inv[id], item: id, k: 'item' }));
    if (!items.length) items.push({ label: '(no items)', disabled: true });
    const rows = Math.min(6, items.length);
    this.cmd.menu = new ListMenu({ x: Math.min(this.cardX(a) + 30, W - 136), y: 202 - (rows * 12 + 10), w: 132, rows, rowH: 12, size: 9, items });
    this.cmd.stage = 'items';
  },

  updateCmd(dt) {
    if (Game.settings.atb === 'active') this.tickATB(dt);
    const c = this.cmd; if (!c) return;
    if (!c.a.alive) { this.mode = 'idle'; this.cmd = null; return; }
    // switch between ready members
    if (c.stage === 'main' && (Input.hit('l') || Input.hit('r'))) {
      const rdy = this.turnQ.filter(x => x.side === 'p' && x.alive && x !== c.a);
      if (rdy.length) { this.turnQ = this.turnQ.filter(x => x !== rdy[0]); this.turnQ.unshift(rdy[0]); this.openCmd(rdy[0]); return; }
    }
    const r = c.menu.update();
    if (c.menu.cur && this.descOf) this.desc = this.descOf(c.menu.cur);
    if (r === 'cancel') {
      if (c.stage !== 'main') this.buildMain();
      return;
    }
    if (r !== 'ok') return;
    const it = c.menu.cur;
    switch (it.k) {
      case 'skills': this.buildSkills(); break;
      case 'techs': this.buildTechs(); break;
      case 'items': this.buildItems(); break;
      case 'skill': this.pickTargets({ type: 'skill', sk: it.sk }); break;
      case 'tech': this.pickTargets({ type: 'tech', tech: it.tech }); break;
      case 'item': this.pickTargets({ type: 'item', item: it.item }); break;
      case 'guard': this.commit({ type: 'guard' }); break;
      case 'fuse': this.commit({ type: 'fuse' }); break;
      case 'flee': this.commit({ type: 'flee' }); break;
    }
  },
  descOf(it) {
    if (it.sk) return SKILLS[it.sk].desc;
    if (it.tech) return TECHS[it.tech].desc + (it.disabled ? '  (needs partners ready)' : '');
    if (it.item) return ITEMS[it.item].desc;
    return { skills: 'Special arts.', techs: 'Combine with allies. Everyone involved acts together.', items: 'Use an item.', guard: 'Halve damage until your next turn.', flee: 'Try to escape.', fuse: 'Give in to the grief. Malice is full.' }[it.k] || '';
  },

  /* ------------------------------------------------------------- targets */
  pickTargets(action) {
    let mode = 'one', side = 'e';
    if (action.type === 'skill') { const s = SKILLS[action.sk]; mode = s.tgt; }
    if (action.type === 'tech') mode = TECHS[action.tech].tgt;
    if (action.type === 'item') { const it = ITEMS[action.item]; mode = it.use === 'dmgall' ? 'all' : it.use === 'dmg' ? 'one' : (it.use === 'smoke' || it.use === 'reson' ? 'self' : 'ally'); }
    if (mode === 'ally' || mode === 'allies' || mode === 'self') side = 'p';
    action.mode = mode;
    if (mode === 'all' || mode === 'allies') { action.targets = this.alive(side === 'p' ? 'p' : 'e'); return this.commit(action); }
    if (mode === 'self') { action.targets = [this.cmd.a]; return this.commit(action); }
    let list = side === 'p' ? this.party.filter(p => p.alive || (action.type === 'item' && ITEMS[action.item].use === 'revive')) : this.alive('e');
    if (side === 'p' && action.type === 'item' && ITEMS[action.item].use === 'revive') list = this.party.filter(p => !p.alive);
    if (!list.length) { Snd.sfx('no'); return; }
    this.tsel = { action, list, idx: side === 'p' ? Math.max(0, list.indexOf(this.cmd.a)) : (this.lastTarget && list.includes(this.lastTarget) ? list.indexOf(this.lastTarget) : 0), side };
    this.mode = 'target';
  },
  updateTarget(dt) {
    if (Game.settings.atb === 'active') this.tickATB(dt);
    const t = this.tsel;
    if (Input.rep('down') || Input.rep('right')) { t.idx = (t.idx + 1) % t.list.length; Snd.sfx('blip'); }
    if (Input.rep('up') || Input.rep('left')) { t.idx = (t.idx + t.list.length - 1) % t.list.length; Snd.sfx('blip'); }
    if (t.list[t.idx]) t.list[t.idx].seen = 1.5;
    if (Input.hit('cancel')) { this.mode = 'cmd'; this.tsel = null; Snd.sfx('back'); return; }
    if (Input.hit('ok')) {
      const a = t.action; a.targets = [t.list[t.idx]]; this.lastTarget = t.list[t.idx];
      this.tsel = null; Snd.sfx('ok'); this.commit(a);
    }
  },

  commit(action) {
    const a = this.cmd.a;
    action.actor = a;
    this.mode = 'idle'; this.cmd = null; this.busy = true;
    this.turnQ = this.turnQ.filter(c => c !== a);
    this.perform(action).then(async () => {
      this.busy = false;
      if (a.alive) { a.atb = 0; }
      await this.checkEnd();
    }).catch(e => { console.error(e); this.busy = false; a.atb = 0; });
  },

  /* --------------------------------------------------------- perform (P) */
  async perform(act) {
    const a = act.actor;
    a.guard = false;
    if (a.stat.corrupt && act.type !== 'guard' && R.chance(0.3)) { const h = this.head(a); FX.text(h.x, h.y, 'GLITCH!', '#ff5ab8', 11); Snd.sfx('glitch'); await wait(0.6); return; }
    if (act.type === 'guard') { a.guard = true; this.pose(a, 'guard', 999); a.mp = Math.min(a.maxmp, a.mp + 3); const h = this.head(a); FX.text(h.x, h.y, 'GUARD', '#a0d0ff', 10); Snd.sfx('buff'); await wait(0.4); return; }
    if (act.type === 'flee') return this.tryFlee(a);
    if (act.type === 'fuse') return this.doFuse(a);
    if (act.type === 'item') return this.doItem(a, act);
    if (act.type === 'tech') return this.doTech(a, act);
    if (act.type === 'skill') return this.doSkill(a, SKILLS[act.sk], act.targets, act);
  },

  async tryFlee(a) {
    const spdF = this.alive('p').reduce((s, c) => s + c.s.spd, 0) / this.alive('p').length, spdE = this.alive('e').reduce((s, c) => s + c.s.spd, 0) / this.alive('e').length;
    const ch = clamp(0.5 + (spdF - spdE) * 0.03, 0.25, 0.9);
    this.popBanner('Escaping...', '#d8d0f0', 0.9); await wait(0.5);
    if (R.chance(ch)) { Snd.sfx('flee'); await wait(0.3); this.busy = true; this.finish('flee'); }
    else { FX.text(a.x, a.y - 50, 'Couldn\'t escape!', '#ff9a9a', 10); await wait(0.6); }
  },

  async doFuse(a) {
    Snd.sfx('fuse'); Gfx.doFlash('#a878e8', 0.9); Gfx.doShake(6);
    a.fused = 3; a.mal = 0; this.pose(a, 'cast', 0.8);
    this.showName('FUSION — BLACK SWAN', '#c0a0ff');
    FX.add({ type: 'pillar', x: a.x, y: a.y, col: '#b070ff', life: 1.0 });
    FX.add({ type: 'ring', x: a.x, y: a.y - 20, r: 4, r1: 60, col: '#b070ff', life: 0.7, w: 4 });
    FX.sparks(a.x, a.y - 20, '#b070ff', 30, 140, 0.9, 2);
    a.hp = Math.min(a.maxhp, a.hp + Math.round(a.maxhp * 0.3));
    await wait(0.9);
    a.atb = 60; // Fusion acts again soon
  },

  async lunge(a, tg, dur = 0.22, gap = 28) {
    const tw = tg.art ? tg.art.width * tg.scale * 0.35 : 12;
    const tx = a.side === 'p' ? tg.x + tw + gap - a.hx : tg.x - tw - gap - a.hx, ty = tg.y - a.hy;
    const sx = a.ox, sy = a.oy;
    await Tw.add(dur, p => { a.ox = lerp(sx, tx, p); a.oy = lerp(sy, ty, p); }, Ease.out);
  },
  async retreat(a, dur = 0.22) {
    const sx = a.ox, sy = a.oy;
    await Tw.add(dur, p => { a.ox = lerp(sx, 0, p); a.oy = lerp(sy, 0, p); }, Ease.inout);
    a.ox = 0; a.oy = 0;
  },

  /* ---- generic offensive/healing skill with Judgment Ring ---- */
  async doSkill(a, sk, targets, act = {}) {
    const isHeal = sk.type === 'heal', isBuff = sk.type === 'buff';
    a.mp = Math.max(0, a.mp - (sk.mp || 0));
    if (sk.req) a.reson = 0;
    this.showName(sk.name, a.col);
    const melee = ['slash', 'cleave', 'pierce', 'spin'].includes(sk.anim) && !isHeal && !isBuff;
    const elCol = sk.elem ? ELEM[sk.elem].col : '#f4d878';
    const isAll = sk.tgt === 'all' || sk.tgt === 'allies';
    if (isBuff) {
      this.pose(a, 'cast', 0.8); await wait(0.35);
      for (const t of targets) { for (const s of sk.st) this.addStatus(t, s.id, s.dur); const m = this.mid(t); FX.preset('buff', a.x, a.y, m.x, m.y, elCol); }
      Snd.sfx('buff'); await wait(0.7); return;
    }
    if (melee) { if (isAll) await this.lunge(a, { x: 190, y: 158, scale: 2 }, 0.3, 60); else await this.lunge(a, targets[0]); }
    this.pose(a, sk.stat === 'mag' || isHeal ? 'cast' : 'attack', 0.5);
    const n = sk.ring.n;
    const perHit = sk.pow;
    if (!isHeal && !this.alive('e').length) return;
    let cur = targets[0] && (isHeal || targets[0].alive) ? targets[0] : (isHeal ? targets[0] : this.alive('e')[0]);
    if (!cur) return;
    let landed = 0, totalDmg = 0, critN = 0;
    const foesHit = new Set();
    const res = await this.runRing(a, sk.ring, { name: sk.name, col: elCol, n }, (i, q) => {
      if (q === 'miss') return;
      landed++; if (q === 'crit') critN++;
      const mult = q === 'crit' ? (sk.ring.critMul || 1.6) : 1;
      this.pose(a, sk.stat === 'mag' || isHeal ? 'cast' : 'attack', 0.25);
      if (isHeal) {
        const tg = cur.alive || sk.type === 'heal' ? cur : cur;
        const st = a.s.mag * (a.fused ? 1.35 : 1);
        const amt = Math.round(st * perHit * mult / n * 1.05 + 3);
        tg.hp = Math.min(tg.maxhp, tg.hp + amt);
        const m = this.head(tg); FX.text(m.x, m.y, '+' + amt, '#80ffb0', 11);
        FX.preset('heal', a.x, a.y, this.mid(tg).x, this.mid(tg).y + 14, '#80ffb0'); Snd.sfx('heal');
        if (sk.cleanse) { for (const k of Object.keys(tg.stat)) if (STATUS[k].bad) delete tg.stat[k]; }
        a.reson = Math.min(100, a.reson + 4);
        return;
      }
      const targetsNow = isAll ? this.alive('e') : [cur.alive ? cur : (this.alive('e')[0] || cur)];
      for (const t of targetsNow) {
        if (!t.alive) continue;
        const dmg = this.calcPlayerDmg(a, t, sk, perHit, mult);
        const wk = this.elemMul(t, sk.elem);
        this.hitFx(a, t, sk.anim, elCol, q === 'crit', dmg, wk);
        totalDmg += this.applyDmg(t, dmg, { weak: wk > 1 });
        foesHit.add(t);
        if (sk.drain) { const h = Math.round(dmg * sk.drain); a.hp = Math.min(a.maxhp, a.hp + h); const hp = this.head(a); FX.text(hp.x, hp.y, '+' + h, '#80ffb0', 9); }
        if (sk.interrupt) this.interrupt(t);
        if (wk > 1) t.atb = Math.max(0, t.atb - 12);
      }
      a.reson = Math.min(100, a.reson + (a.side === 'p' ? 6 : 0));
      cur = (cur.alive ? cur : (this.alive('e')[0] || cur));
    });
    if (!isHeal && sk.mpDrain && landed) { const g = sk.mpDrain * landed; a.mp = Math.min(a.maxmp, a.mp + g); const h = this.head(a); FX.text(h.x, h.y - 10, '+' + g + ' MP', '#8ab0ff', 8); }
    if (!isHeal && sk.st && landed) {
      for (const t of foesHit) if (t.alive && R.chance(sk.st.ch * (landed / n))) this.addStatus(t, sk.st.id, sk.st.dur);
    }
    if (sk.healParty) for (const p of this.alive('p')) { const h = Math.round(p.maxhp * sk.healParty); p.hp = Math.min(p.maxhp, p.hp + h); const m = this.head(p); FX.text(m.x, m.y, '+' + h, '#80ffb0', 9); FX.preset('heal', a.x, a.y, p.x, p.y - 10, '#80ffb0'); }
    if (sk.atbAll) for (const p of this.alive('p')) { if (p !== a) p.atb = 100; if (p !== a && !this.turnQ.includes(p)) this.turnQ.push(p); }
    if (res.perfect && !isHeal) { const h = this.head(a); FX.text(h.x, h.y - 14, 'PERFECT', '#ffe9a0', 11); a.reson = Math.min(100, a.reson + 8); }
    if (a.fused) { a.fused--; if (a.fused <= 0) { const h = this.head(a); FX.text(h.x, h.y, 'Fusion ends', '#c0a0ff', 9); } }
    if (melee) await this.retreat(a);
    this.pose(a, 'idle', 0);
    if (!a.fused) a.pose = 'idle';
    await wait(0.15);
  },

  calcPlayerDmg(a, t, sk, perHit, mult) {
    const magic = sk.stat === 'mag';
    let st = (magic ? a.s.mag : a.s.atk) * (a.fused ? 1.35 : 1);
    if (a.stat.atkup) st *= 1.3; if (a.stat.sap) st *= 0.75;
    let defS = magic ? t.s.res : t.s.def;
    if (t.stat.defup) defS *= 1.3; if (t.stat.sap) defS *= 0.85;
    const lckCrit = R.chance(a.s.lck * 0.004) ? 1.4 : 1;
    let d = st * perHit * mult * DEFK / (DEFK + defS) * this.elemMul(t, sk.elem) * R.range(0.92, 1.08) * lckCrit;
    if (t.charging) d *= 1.0;
    return Math.max(1, d);
  },

  applyDmg(t, dmg, o = {}) {
    dmg = Math.max(1, Math.round(dmg));
    t.hp = Math.max(0, t.hp - dmg); t.flash = 0.25; t.seen = 2.5;
    const h = this.head(t);
    FX.text(h.x + R.range(-6, 6), h.y, String(dmg), o.weak ? '#ffe070' : (o.col || '#fff'), o.weak ? 15 : 12);
    if (o.weak) FX.text(h.x, h.y - 14, 'WEAK!', '#ffe070', 8);
    if (t.side === 'e') {
      this.pose(t, 'hurt', 0.12);
      if (t.d.half && !t.halfDone && t.hp > 0 && t.hp / t.maxhp < 0.5) { t.halfDone = true; this.hooks.push(t.d.half); }
      if (t.hp <= 0) this.kill(t);
    } else if (t.hp <= 0) this.kill(t);
    return dmg;
  },

  hitFx(a, t, anim, col, crit, dmg, wk) {
    const m = this.mid(t), am = this.mid(a);
    FX.preset(anim, am.x, am.y, m.x, m.y, col);
    Snd.sfx(crit ? 'crit' : 'hit', anim);
    this.freeze = crit ? 0.07 : 0.035; Gfx.doShake(crit ? 4 : 2);
    const inkc = t.side === 'e' ? '#e0384e' : '#e0384e';
    FX.splat(t.x + t.ox, t.y + 4, inkc, crit ? 4 : 2, 16);
    if (crit) { Gfx.doFlash('#ffffff', 0.18); FX.text(m.x, m.y - 26, 'CRIT', '#ffb0b8', 8, { life: 0.6 }); }
  },

  interrupt(e) {
    if (!e.charging) return false;
    e.charging = null; e.stunT = 5; e.atb = 0;
    const h = this.head(e); FX.text(h.x, h.y - 20, 'INTERRUPTED!', '#30e2d2', 12, { life: 1.2 });
    Snd.sfx('interrupt'); Gfx.doFlash('#30e2d2', 0.5); Gfx.doShake(5);
    return true;
  },

  /* ---- Dual / Triple techs ---- */
  async doTech(a, act) {
    const tech = TECHS[act.tech];
    const mem = tech.need.map(n => this.party.find(p => p.id === n));
    for (const m of mem) { m.mp -= tech.mp; m.atb = 0; m.guard = false; this.turnQ = this.turnQ.filter(c => c !== m); }
    this.showName(tech.name, '#f4d878');
    this.popBanner(mem.length === 3 ? 'TRIPLE TECH' : 'DUAL TECH', '#f4d878', 1.2);
    Gfx.doFlash('#f4d878', 0.5);
    const elCol = ELEM[tech.elem].col;
    for (const m of mem) this.pose(m, m.s.mag > m.s.atk ? 'cast' : 'attack', 0.6);
    const isAll = tech.tgt === 'all';
    let cur = act.targets[0] && act.targets[0].alive ? act.targets[0] : this.alive('e')[0];
    if (!cur) return;
    if (['slash', 'cleave', 'pierce', 'spin'].includes(tech.anim)) for (const m of mem) this.lunge(m, isAll ? { x: 190, y: 158 } : cur, 0.25, 30 + mem.indexOf(m) * 14);
    await wait(0.3);
    const avg = mem.reduce((s, m) => s + Math.max(m.s.atk, m.s.mag), 0) / mem.length;
    const n = tech.hits, foesHit = new Set();
    let landed = 0;
    const res = await this.runRing(a, { n, w: tech.w, spd: tech.spd }, { name: tech.name, col: elCol, n, dual: true }, (i, q) => {
      if (q === 'miss') return;
      landed++;
      const mult = q === 'crit' ? 1.6 : 1;
      const src = mem[i % mem.length];
      this.pose(src, src.s.mag > src.s.atk ? 'cast' : 'attack', 0.2);
      const targetsNow = isAll ? this.alive('e') : [cur.alive ? cur : (this.alive('e')[0] || cur)];
      for (const t of targetsNow) {
        if (!t.alive) continue;
        const magic = TECHS[act.tech].elem === 'ink' || TECHS[act.tech].elem === 'gilt' || TECHS[act.tech].elem === 'volt';
        const defS = magic ? t.s.res : t.s.def;
        const dmg = Math.max(1, avg * (tech.pow / n) * mult * DEFK / (DEFK + defS) * this.elemMul(t, tech.elem) * R.range(0.92, 1.08));
        const wk = this.elemMul(t, tech.elem);
        this.hitFx(src, t, tech.anim, elCol, q === 'crit', dmg, wk);
        this.applyDmg(t, dmg, { weak: wk > 1 }); foesHit.add(t);
      }
      cur = cur.alive ? cur : (this.alive('e')[0] || cur);
      for (const m of mem) m.reson = Math.min(100, m.reson + 5);
    });
    if (tech.st && landed) for (const t of foesHit) if (t.alive && R.chance(tech.st.ch)) this.addStatus(t, tech.st.id, tech.st.dur);
    if (tech.healParty) for (const p of this.alive('p')) { const h = Math.round(p.maxhp * tech.healParty); p.hp = Math.min(p.maxhp, p.hp + h); const m = this.head(p); FX.text(m.x, m.y, '+' + h, '#80ffb0', 9); }
    await Promise.all(mem.map(m => this.retreat(m)));
    for (const m of mem) { this.pose(m, 'idle', 0); m.pose = 'idle'; }
    await wait(0.2);
  },

  /* ---- items ---- */
  async doItem(a, act) {
    const it = ITEMS[act.item], t = act.targets[0];
    Game.take(act.item, 1);
    this.showName(it.name, '#f4d878');
    this.pose(a, 'cast', 0.5);
    await wait(0.25);
    const m = this.head(t || a);
    switch (it.use) {
      case 'hp': { const h = Math.min(t.maxhp - t.hp, it.amt); t.hp += h; FX.text(m.x, m.y, '+' + h, '#80ffb0', 12); FX.preset('heal', a.x, a.y, t.x, t.y - 12, '#80ffb0'); Snd.sfx('heal'); break; }
      case 'mp': { const h = Math.min(t.maxmp - t.mp, it.amt); t.mp += h; FX.text(m.x, m.y, '+' + h + ' MP', '#8ab0ff', 11); FX.preset('heal', a.x, a.y, t.x, t.y - 12, '#8ab0ff'); Snd.sfx('heal'); break; }
      case 'full': t.hp = t.maxhp; t.mp = t.maxmp; FX.text(m.x, m.y, 'FULL', '#ffe9a0', 12); FX.preset('heal', a.x, a.y, t.x, t.y - 12, '#ffe9a0'); Snd.sfx('heal'); break;
      case 'cleanse': for (const k of Object.keys(t.stat)) if (STATUS[k].bad) delete t.stat[k]; FX.text(m.x, m.y, 'Cleansed', '#a0ffe0', 10); FX.preset('heal', a.x, a.y, t.x, t.y - 12, '#a0ffe0'); Snd.sfx('heal'); break;
      case 'revive': { t.alive = true; t.hp = Math.max(1, Math.round(t.maxhp * it.amt)); t.pose = 'idle'; t.atb = 0; FX.text(m.x, m.y, 'REVIVE', '#ffe9a0', 12); FX.preset('heal', a.x, a.y, t.x, t.y - 12, '#ffe9a0'); Snd.sfx('heal'); break; }
      case 'reson': a.reson = Math.min(100, a.reson + it.amt); FX.text(m.x, m.y, '+' + it.amt + ' Resonance', '#ff9aa8', 9); Snd.sfx('buff'); break;
      case 'smoke': this.popBanner('Smoke!', '#d8d0f0', 0.8); await wait(0.5); if (this.foes.some(f => f.boss)) { FX.text(a.x, a.y - 50, 'It won\'t work!', '#ff9a9a', 10); } else { this.busy = true; this.finish('flee'); return; } break;
      case 'dmgall': for (const f of this.alive('e')) { const mm = this.mid(f); FX.preset('blast', a.x, a.y, mm.x, mm.y, ELEM[it.elem].col); this.applyDmg(f, it.amt * this.elemMul(f, it.elem) * R.range(0.9, 1.1), { weak: this.elemMul(f, it.elem) > 1 }); } Snd.sfx('hit'); break;
      case 'dmg': { const mm = this.mid(t); FX.preset('beam', a.x, a.y, mm.x, mm.y, ELEM[it.elem].col); this.applyDmg(t, it.amt * this.elemMul(t, it.elem) * R.range(0.9, 1.1), { weak: this.elemMul(t, it.elem) > 1 }); Snd.sfx('hit'); break; }
    }
    await wait(0.5);
  },

  /* ------------------------------------------------------------ Judgment Ring */
  runRing(actor, cfg, info, onResolve) {
    return new Promise(res => {
      const n = cfg.n, laps = n >= 5 ? 2 : 1;
      const total = 360 * laps;
      const zones = [];
      const a0 = 70, a1 = total - 34;
      for (let i = 0; i < n; i++) {
        const c = a0 + (a1 - a0) * (i + 0.5) / n + R.range(-5, 5);
        zones.push({ c, res: null, flash: 0 });
      }
      const speed = 360 * cfg.spd * (laps === 2 ? 0.52 : 1);
      const p = this.head(actor);
      this.ring = {
        actor, cfg, info, zones, hand: 0, speed, total, t: 0, lock: 0, res, onResolve, endT: 0, laps,
        x: clamp(actor.x + actor.ox - 4, 40, W - 40), y: clamp(p.y + 6, 40, 176), half: (cfg.w * 1.35 / 2) * (Game.settings.assist ? 1.6 : 1), miss: 0,
      };
      Snd.sfx('ring');
    });
  },
  updateRing(dt) {
    const r = this.ring;
    r.t += dt;
    if (r.endT > 0) { r.endT -= dt; if (r.endT <= 0) this.finishRing(); return; }
    r.hand += r.speed * dt;
    r.lock = Math.max(0, r.lock - dt);
    for (const z of r.zones) z.flash = Math.max(0, z.flash - dt * 3);
    // auto ring assist
    if (Game.settings.autoRing) for (let i = 0; i < r.zones.length; i++) { const z = r.zones[i]; if (z.res === null && r.hand >= z.c) { this.resolveZone(i, 'hit'); } }
    if (Input.hit('ok') || Input.hit('cancel')) {
      if (r.lock <= 0) {
        let hit = -1;
        for (let i = 0; i < r.zones.length; i++) { const z = r.zones[i]; if (z.res === null && angDiff(r.hand, z.c) <= r.half) { hit = i; break; } }
        if (hit >= 0) {
          const q = angDiff(r.hand, r.zones[hit].c) <= r.half * 0.4 ? 'crit' : 'hit';
          this.resolveZone(hit, q);
        } else {
          r.lock = 0.32; r.miss++;
          FX.text(r.x, r.y - 34, 'MISS', '#9a90a8', 9, { life: 0.5 }); Snd.sfx('miss');
        }
      }
    }
    for (let i = 0; i < r.zones.length; i++) { const z = r.zones[i]; if (z.res === null && r.hand > z.c + r.half + 4) { this.resolveZone(i, 'miss'); } }
    if (r.hand >= r.total || r.zones.every(z => z.res !== null)) { if (r.endT <= 0) r.endT = 0.28; }
  },
  resolveZone(i, q) {
    const r = this.ring, z = r.zones[i];
    z.res = q; z.flash = 1;
    if (q === 'miss') { Snd.sfx('miss'); }
    r.onResolve(i, q);
  },
  finishRing() {
    const r = this.ring; this.ring = null;
    const perfect = r.zones.every(z => z.res === 'crit');
    r.res({ zones: r.zones, perfect, hits: r.zones.filter(z => z.res && z.res !== 'miss').length });
  },

  /* ------------------------------------------------------ enemy turn (P) */
  enemyTurn(e) {
    this.turnQ = this.turnQ.filter(c => c !== e);
    if (!e.alive) return;
    if (e.stunT > 0) { e.atb = 0; return; }
    this.busy = true;
    (async () => {
      let mv = e.readyMove; e.readyMove = null;
      if (!mv) {
        mv = this.pickMove(e);
        if (mv.ch) {
          e.charging = { mv, t: 0 }; e.atb = 100;
          const h = this.head(e); FX.text(h.x, h.y - 26, 'CHARGING: ' + mv.n, '#ff6a7e', 9, { life: 1.6 }); Snd.sfx('charge');
          this.popBanner('Interrupt it!  (Data Drain / Rootkit)', '#ffdbe0', 1.6);
          await wait(0.5); return;
        }
      }
      await this.execMove(e, mv);
      if (e.alive) e.atb = 0;
    })().then(async () => { this.busy = false; await this.checkEnd(); }).catch(err => { console.error(err); this.busy = false; e.atb = 0; });
  },

  pickMove(e) {
    const hp = e.hp / e.maxhp * 100;
    const ok = e.d.moves.filter(m => {
      if (!m.c) return true;
      if (m.c === 'noatkup') return !e.stat.atkup;
      if (m.c === 'noshield') return !e.stat.shield;
      if (m.c.startsWith('hp<')) return hp < +m.c.slice(3);
      return true;
    });
    let tot = 0; for (const m of ok) tot += m.w || 1;
    let r = R.range(0, tot);
    for (const m of ok) { r -= m.w || 1; if (r <= 0) return m; }
    return ok[0];
  },
  pickTarget() {
    const a = this.alive('p'); let tot = 0;
    const ws = a.map(t => { const w = 1 + (t.hp / t.maxhp < 0.4 ? 1.2 : 0) + (t.slot === 0 ? 0.2 : 0); tot += w; return w; });
    let r = R.range(0, tot);
    for (let i = 0; i < a.length; i++) { r -= ws[i]; if (r <= 0) return a[i]; }
    return a[0];
  },

  async execMove(e, mv) {
    this.showName(mv.n, '#ffb0b8');
    if (mv.self) { this.addStatus(e, mv.self.id, mv.self.dur); const h = this.head(e); FX.preset('buff', e.x, e.y, h.x, h.y + 20, '#ff9a6a'); Snd.sfx('buff'); await wait(0.7); return; }
    if (mv.healSelf) { const h = Math.round(e.maxhp * mv.healSelf); e.hp = Math.min(e.maxhp, e.hp + h); const p = this.head(e); FX.text(p.x, p.y, '+' + h, '#80ffb0', 11); FX.preset('heal', e.x, e.y, e.x, e.y - 10, '#80ffb0'); Snd.sfx('heal'); await wait(0.7); return; }
    if (e.stat.corrupt && R.chance(0.4)) { const h = this.head(e); FX.text(h.x, h.y, 'GLITCH!', '#ff5ab8', 11); Snd.sfx('glitch'); await wait(0.6); return; }
    const isAll = mv.a === 'all';
    // wind-up
    const sx = e.ox;
    await Tw.add(0.28, p => { e.ox = sx + (e.side === 'e' ? -8 : 8) * p; e.flash = 0.15 + 0.15 * Math.sin(p * 20); }, Ease.out);
    let tg = isAll ? null : this.pickTarget();
    const col = mv.e ? ELEM[mv.e].col : '#ffb0b8';
    for (let h = 0; h < mv.h; h++) {
      if (!this.alive('p').length) break;
      if (!isAll && (!tg || !tg.alive)) tg = this.pickTarget();
      const focus = isAll ? { x: 372, y: 158 } : tg;
      const result = await this.defend(e, focus, mv.t || 'n', isAll);
      // strike animation
      const tx = (isAll ? 300 : tg.x - 34) - e.x;
      const from = e.ox;
      await Tw.add(0.09, p => { e.ox = lerp(from, tx, p); }, Ease.out);
      const victims = isAll ? this.alive('p') : [tg];
      const m = isAll ? focus : this.mid(tg);
      if (result === 'parry' || result === 'dodge') {
        for (const v of victims) this.avoidFx(e, v, result);
        if (result === 'parry') { await this.counter(victims[0], e); }
      } else {
        for (const v of victims) {
          let d = this.calcEnemyDmg(e, v, mv) * (result === 'block' ? 0.5 : 1) * (isAll ? 0.85 : 1);
          if (result === 'block') { const q = this.head(v); FX.text(q.x, q.y - 14, 'BLOCK', '#a0d0ff', 8); Snd.sfx('block'); }
          FX.preset(mv.e ? 'burst' : 'slash', e.x, e.y - 20, v.x, v.y - 24, col);
          Snd.sfx('hurt'); Gfx.doShake(result === 'block' ? 2 : 5); this.freeze = 0.05;
          FX.splat(v.x, v.y + 4, '#e0384e', 2, 14);
          this.applyDmg(v, d, { col: '#ffb0b8' });
          this.pose(v, 'hurt', 0.35);
          const ch = CHARS[v.id]; if (ch.fuse) v.mal = Math.min(100, v.mal + Math.max(6, d / v.maxhp * 120));
          v.reson = Math.min(100, v.reson + 3);
          if (mv.st && v.alive && result !== 'block' && h === mv.h - 1 && R.chance(mv.st.ch)) this.addStatus(v, mv.st.id, mv.st.dur);
        }
      }
      await Tw.add(0.12, p => { e.ox = lerp(e.ox, sx, p); }, Ease.out);
      if (h < mv.h - 1) await wait(mv.t === 'f' ? R.range(0.05, 0.25) : 0.12);
    }
    await Tw.add(0.2, p => { e.ox = lerp(e.ox, 0, p); });
    e.ox = 0; e.flash = 0;
    await wait(0.25);
  },

  calcEnemyDmg(e, t, mv) {
    const magic = mv.e && mv.e !== 'phys';
    let a = magic ? e.s.mag : e.s.atk; if (e.stat.atkup) a *= 1.3; if (e.stat.sap) a *= 0.75;
    let d = t.s[magic ? 'res' : 'def']; if (t.stat.defup) d *= 1.3;
    let dmg = a * mv.p * DEFK / (DEFK + d) * R.range(0.92, 1.08);
    if (t.stat.shield) dmg *= 0.6; if (t.guard) dmg *= 0.5;
    dmg *= [0.65, 1, 1.35][Game.settings.diff === undefined ? 1 : Game.settings.diff];
    return Math.max(1, dmg);
  },

  avoidFx(e, v, kind) {
    const m = this.mid(v), h = this.head(v);
    if (kind === 'parry') {
      Snd.sfx('parry'); Gfx.doFlash('#fff4d0', 0.55); Gfx.doShake(4); this.freeze = 0.14;
      FX.add({ type: 'ring', x: m.x - 14, y: m.y, r: 3, r1: 30, col: '#ffe9a0', life: 0.35, w: 3 });
      FX.add({ type: 'rays', x: m.x - 14, y: m.y, n: 12, r: 36, col: '#fff4d0', life: 0.3 });
      FX.sparks(m.x - 14, m.y, '#ffe9a0', 18, 150, 0.5, 2);
      FX.text(h.x, h.y - 8, 'PARRY!', '#ffe9a0', 15);
      v.reson = Math.min(100, v.reson + 16); Game.S.parries++;
      this.pose(v, 'attack', 0.25);
    } else {
      Snd.sfx('dodge');
      FX.text(h.x, h.y - 4, 'DODGE', '#8ae8ff', 11);
      v.reson = Math.min(100, v.reson + 5);
      const o0 = v.ox; Tw.add(0.28, p => { v.ox = o0 + Math.sin(p * Math.PI) * 18; v.hop = Math.sin(p * Math.PI) * 10; }).then(() => { v.hop = 0; });
      FX.sparks(m.x + 10, m.y, '#8ae8ff', 6, 60, 0.3);
    }
  },

  async counter(v, e) {
    if (!v.alive || !e.alive) return;
    const dmg = Math.max(1, Math.max(v.s.atk, v.s.mag) * 0.9 * DEFK / (DEFK + e.s.def) * R.range(0.92, 1.08));
    v.atb = Math.min(100, v.atb + 22);
    if (v.atb >= 100 && !this.turnQ.includes(v)) { this.turnQ.push(v); }
    e.atb = Math.max(0, e.atb - 8);
    const m = this.mid(e);
    await wait(0.1);
    FX.preset('slash', v.x, v.y, m.x, m.y, '#ffe9a0'); Snd.sfx('hit');
    this.applyDmg(e, dmg, { col: '#ffe9a0' });
    FX.text(m.x, m.y - 28, 'COUNTER', '#ffe9a0', 8, { life: 0.7 });
  },

  /* ---- defence window (Clair Obscur-style) ---- */
  defend(e, target, type, isAll) {
    return new Promise(res => {
      let pre = 0.62, hold = 0, fin = 0.33;
      if (type === 'h') { pre = 0.85; fin = 0.3; }
      if (type === 'f') { pre = 0.5; hold = R.range(0.22, 0.55); fin = 0.32; }
      const T = pre + hold + fin;
      this.defw = { e, target, type, isAll, t: 0, T, pre, hold, fin, press: null, lock: 0, res, done: false, whiff: null };
      Snd.sfx(type === 'h' ? 'telegraphH' : 'telegraph');
    });
  },
  updateDef(dt) {
    const d = this.defw;
    d.t += dt;
    d.lock = Math.max(0, d.lock - dt);
    const assist = Game.settings.assist ? 1.5 : 1;
    const PE = 0.085 * assist, PL = 0.055, DE = 0.26 * assist, DL = 0.07;
    const off = d.t - d.T;
    const pOk = Input.hit('ok'), pCancel = Input.hit('cancel');
    if ((pOk || pCancel) && !d.press && d.lock <= 0) {
      // touch users press one button; A = parry, B = dodge
      if (off > -DE - 0.05) {
        d.press = { kind: pOk ? 'ok' : 'cancel', off };
      } else { d.lock = 0.3; d.whiff = 0.3; }
    }
    if (d.t >= d.T + DL && !d.done) {
      d.done = true;
      let r = 'hit';
      const p = d.press;
      if (p) {
        const o = p.off;
        if (p.kind === 'ok') { if (o >= -PE && o <= PL && d.type !== 'h') r = 'parry'; else if (o >= -DE && o <= DL) r = 'block'; }
        else if (o >= -DE && o <= DL) r = 'dodge';
      }
      if (Game.settings.assist && r === 'block') r = 'dodge';
      this.defw = null;
      d.res(r);
    }
  },

  /* ----------------------------------------------------------- victory/defeat */
  async victory() {
    this.mode = 'idle'; this.turnQ = [];
    for (const p of this.party) if (p.alive) { p.pose = 'win'; p.guard = false; }
    Snd.play('victory', { once: true });
    await wait(0.8);
    let xp = 0, gold = 0; const drops = [];
    const lastGroup = this.o.chain ? [] : [];
    for (const f of this.allFoesDefeated()) {
      xp += f.d.xp; gold += f.d.gold;
      for (const [it, ch] of f.d.drops || []) if (R.chance(ch)) drops.push(it);
    }
    xp = Math.round(xp * (this.o.xpMul || 1.25));
    for (const id of drops) Game.add(id, 1);
    Game.S.gold += gold;
    const rows = [];
    // carry battle HP/MP into the save data first so level-up gains stack on top
    for (const p of this.party) { const c = Game.S.chars[p.id]; c.hp = Math.max(0, Math.round(p.hp)); c.mp = Math.round(p.mp); }
    for (const id of Game.S.party) {
      const inActive = this.party.find(p => p.id === id);
      const share = inActive ? xp : Math.round(xp * 0.5);
      const ups = Game.giveXP(id, share);
      rows.push({ id, share, ups, inActive });
    }
    // dead members come back with a sliver; everyone syncs back to the combatant
    for (const p of this.party) {
      const c = Game.S.chars[p.id], st = Game.stats(p.id);
      if (!p.alive || c.hp <= 0) { c.hp = Math.max(1, Math.round(st.hp * 0.15)); p.alive = true; p.pose = 'idle'; }
      c.hp = Math.min(st.hp, c.hp); c.mp = Math.min(st.mp, c.mp);
      p.hp = c.hp; p.mp = c.mp; p.maxhp = st.hp; p.maxmp = st.mp; p.lv = c.lv;
    }
    this.result = { xp, gold, drops, rows, t: 0, page: 0, leveled: rows.some(r => r.ups.length) };
    if (this.result.leveled) Snd.sfx('levelup');
    this.mode = 'result'; this.busy = false;
    Input.flush();
  },
  allFoesDefeated() { return this.defeatedLog || this.foes; },
  updateResult(dt) {
    const r = this.result; r.t += dt;
    if (r.t > 0.5 && Input.hit('ok')) {
      Snd.sfx('ok');
      this.finish('win');
    }
  },
  finish(result) {
    this.busy = true;
    Gfx.fadeTo(1, 0.35).then(() => { this.end(result); Gfx.fadeTo(0, 0.35); });
  },

  async defeat() {
    this.mode = 'over'; Snd.play('gameover', { once: true });
    Game.S.deaths++;
    this.over = { t: 0, sel: 0 };
    Gfx.fadeCol = '#1a0208';
    this.busy = false;
  },
  updateOver(dt) {
    const o = this.over; o.t += dt;
    if (o.t < 1.2) return;
    if (Input.rep('up') || Input.rep('down')) { o.sel = 1 - o.sel; Snd.sfx('blip'); }
    if (Input.hit('ok')) {
      Snd.sfx('ok');
      if (o.sel === 0) {
        Game.S.chars = JSON.parse(this.snapshot);
        for (const id of Game.S.party) { const st = Game.stats(id), c = Game.S.chars[id]; c.hp = Math.max(c.hp, Math.round(st.hp * 0.6)); c.mp = Math.max(c.mp, Math.round(st.mp * 0.6)); }
        this.o.first = false; this.stage = 0; this.defeatedLog = null;
        Snd.play(this.foes[0].boss ? 'boss' : 'battle');
        this.begin(this.ids0, false);
      } else { this.finishToTitle(); }
    }
  },
  finishToTitle() {
    this.busy = true;
    Gfx.fadeTo(1, 0.6).then(() => { this.active = false; Game.scene = this.prevScene; this.res = null; Main.toTitle(); });
  },
};

/* keep a log of every foe defeated across chained stages for rewards */
(function patchKill() {
  const orig = Battle.kill.bind(Battle);
  Battle.kill = function (c) {
    const was = c.alive;
    orig(c);
    if (was && c.side === 'e') { (this.defeatedLog = this.defeatedLog || []).push(c); }
  };
  const origBegin = Battle.begin.bind(Battle);
  Battle.begin = function (ids, first) { if (first) this.defeatedLog = []; origBegin(ids, first); };
})();
