'use strict';
/* ==========================================================================
   VERMILION REQUIEM — menu.js
   Pause menu (Items, Status, Equip, Party, Terminal, Bestiary, Config, Save),
   Shop, and the shared "pick a party member" helper.
   ========================================================================== */

const Menu = {
  active: false, stage: 'main', m: null, m2: null, who: null, data: {}, msg: null,

  open() {
    if (this.active || Game.busy) return;
    this.active = true; Game.busy++;
    this.stage = 'main'; this.buildMain(); Snd.sfx('ok');
  },
  openConfig() {
    if (this.active) return;
    this.active = true; Game.busy++; this.data.fromTitle = true;
    this.m = this.list([{ label: 'OPTIONS' }], { rows: 1, w: 110 });
    this.stage = 'config'; this.buildConfig();
  },
  close() { this.active = false; Game.busy = Math.max(0, Game.busy - 1); Input.flush(); Snd.sfx('back'); },

  list(items, o = {}) { return new ListMenu(Object.assign({ x: 10, y: 34, w: 110, rows: Math.min(items.length, 9), rowH: 15, size: 10, items }, o)); },

  buildMain() {
    this.stage = 'main';
    const items = [
      { label: 'Items', k: 'items' }, { label: 'Status', k: 'status' }, { label: 'Equip', k: 'equip' }, { label: 'Party', k: 'party' },
      { label: 'Terminal', k: 'terminal', col: UI.cy }, { label: 'Bestiary', k: 'best' }, { label: 'Config', k: 'config' }, { label: 'Save', k: 'save' }, { label: 'Title', k: 'title' },
    ];
    this.m = this.list(items, { title: 'MENU' });
  },

  members() { return Game.S.party; },
  pickMember(cb, stage = 'pick') {
    const items = this.members().map(id => ({ label: CHARS[id].name, id, right: 'Lv ' + Game.S.chars[id].lv }));
    this.m2 = this.list(items, { x: 126, y: 34, w: 130, title: 'WHO?' });
    this.stage = stage; this.data.cb = cb;
  },

  /* ----------------------------------------------------------------- update */
  update(dt) {
    if (!this.active) return false;
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    switch (this.stage) {
      case 'main': this.upMain(); break;
      case 'pick': this.upPick(); break;
      case 'items': this.upItems(); break;
      case 'status': this.upStatus(); break;
      case 'equipSlot': this.upEquipSlot(); break;
      case 'equipList': this.upEquipList(); break;
      case 'party': this.upParty(); break;
      case 'terminal': this.upTerminal(); break;
      case 'best': this.upBest(); break;
      case 'config': this.upConfig(); break;
      case 'confirmTitle': this.upConfirm(); break;
    }
    return true;
  },
  toast(t, col) { this.msg = { txt: t, t: 1.6, col: col || UI.gold }; },

  upMain() {
    const r = this.m.update();
    if (r === 'cancel') return this.close();
    if (r !== 'ok') return;
    const k = this.m.cur.k;
    switch (k) {
      case 'items': this.stage = 'items'; this.buildItems(); break;
      case 'status': this.pickMember(id => { this.who = id; this.stage = 'status'; this.data.tab = 0; }, 'pick'); this.data.next = 'status'; break;
      case 'equip': this.pickMember(id => { this.who = id; this.buildEquipSlots(); }, 'pick'); this.data.next = 'equip'; break;
      case 'party': this.stage = 'party'; this.buildParty(); break;
      case 'terminal': this.stage = 'terminal'; this.buildTerminal(); break;
      case 'best': this.stage = 'best'; this.buildBest(); break;
      case 'config': this.stage = 'config'; this.buildConfig(); break;
      case 'save': Game.S.x = Field.player.x / 16; Game.S.y = Field.player.y / 16; Game.S.dir = Field.player.dir; Game.save(); Snd.sfx('save'); this.toast('Game saved.', UI.green); break;
      case 'title': this.stage = 'confirmTitle'; this.m2 = this.list([{ label: 'Return to title' }, { label: 'Cancel' }], { x: 126, y: 34, w: 130 }); break;
    }
  },
  upPick() {
    const r = this.m2.update();
    if (r === 'cancel') { this.stage = 'main'; return; }
    if (r === 'ok') { const id = this.m2.cur.id; this.data.cb(id); }
  },
  upConfirm() {
    const r = this.m2.update();
    if (r === 'cancel') { this.stage = 'main'; return; }
    if (r === 'ok') { if (this.m2.sel === 0) { this.active = false; Game.busy = Math.max(0, Game.busy - 1); Main.toTitle(); } else this.stage = 'main'; }
  },

  /* ---- items ---- */
  buildItems() {
    const items = Object.keys(Game.S.inv).filter(id => ITEMS[id]).map(id => ({ label: ITEMS[id].name, right: '×' + Game.S.inv[id], id, disabled: ITEMS[id].battleOnly }));
    if (!items.length) items.push({ label: '(empty)', disabled: true });
    this.m2 = this.list(items, { x: 126, y: 34, w: 200, rows: 9, title: 'ITEMS' });
    this.data.itemTarget = null;
  },
  upItems() {
    if (this.data.itemTarget) {
      const r = this.data.tm.update();
      if (r === 'cancel') { this.data.itemTarget = null; return; }
      if (r === 'ok') {
        const it = ITEMS[this.data.itemTarget], id = this.data.tm.cur.id, c = Game.S.chars[id], st = Game.stats(id);
        let used = false;
        if (it.use === 'hp' && c.hp > 0 && c.hp < st.hp) { c.hp = Math.min(st.hp, c.hp + it.amt); used = true; }
        else if (it.use === 'mp' && c.hp > 0 && c.mp < st.mp) { c.mp = Math.min(st.mp, c.mp + it.amt); used = true; }
        else if (it.use === 'revive' && c.hp <= 0) { c.hp = Math.max(1, Math.round(st.hp * it.amt)); used = true; }
        else if (it.use === 'full' && c.hp > 0) { c.hp = st.hp; c.mp = st.mp; used = true; }
        else if (it.use === 'cleanse') { used = false; this.toast('Nothing to cure.'); }
        if (used) { Game.take(this.data.itemTarget, 1); Snd.sfx('heal'); this.toast(`${CHARS[id].name} recovered.`, UI.green); if (!Game.count(this.data.itemTarget)) { this.data.itemTarget = null; this.buildItems(); } }
        else Snd.sfx('no');
      }
      return;
    }
    const r = this.m2.update();
    if (r === 'cancel') { this.stage = 'main'; return; }
    if (r === 'ok') {
      const id = this.m2.cur.id; if (!id) return;
      this.data.itemTarget = id;
      this.data.tm = this.list(this.members().map(m => ({ label: CHARS[m].name, id: m, right: `${Game.S.chars[m].hp}/${Game.stats(m).hp}` })), { x: 336, y: 34, w: 130, title: 'USE ON' });
    }
  },

  /* ---- status ---- */
  upStatus() {
    if (Input.hit('cancel')) { this.pickMember(id => { this.who = id; this.stage = 'status'; }, 'pick'); return; }
    if (Input.hit('l') || Input.rep('left')) { const p = this.members(), i = p.indexOf(this.who); this.who = p[(i + p.length - 1) % p.length]; Snd.sfx('blip'); }
    if (Input.hit('r') || Input.rep('right')) { const p = this.members(), i = p.indexOf(this.who); this.who = p[(i + 1) % p.length]; Snd.sfx('blip'); }
  },

  /* ---- equip ---- */
  buildEquipSlots() {
    const c = Game.S.chars[this.who];
    const items = ['weapon', 'armor', 'charm'].map(s => ({ label: cap(s), slot: s, right: c.eq[s] ? EQUIP[c.eq[s]].name : '—' }));
    this.m2 = this.list(items, { x: 126, y: 34, w: 220, rows: 3, title: CHARS[this.who].name.toUpperCase() });
    this.stage = 'equipSlot';
  },
  upEquipSlot() {
    const r = this.m2.update();
    if (r === 'cancel') { this.pickMember(id => { this.who = id; this.buildEquipSlots(); }, 'pick'); return; }
    if (r === 'ok') { this.data.slot = this.m2.cur.slot; this.buildEquipList(); }
  },
  buildEquipList() {
    const slot = this.data.slot, c = Game.S.chars[this.who];
    const items = [{ label: '(unequip)', id: null }];
    for (const id in Game.S.gear) if (Game.S.gear[id] > 0 && EQUIP[id].slot === slot && (!EQUIP[id].who || EQUIP[id].who.includes(this.who))) items.push({ label: EQUIP[id].name, id, right: '×' + Game.S.gear[id] });
    this.m = this.list(items, { x: 126, y: 78, w: 220, rows: Math.min(6, items.length), title: cap(slot) });
    this.stage = 'equipList';
  },
  upEquipList() {
    const r = this.m.update();
    if (r === 'cancel') { this.buildEquipSlots(); return; }
    if (r === 'ok') {
      const c = Game.S.chars[this.who], slot = this.data.slot, id = this.m.cur.id;
      const old = c.eq[slot];
      if (old) Game.S.gear[old] = (Game.S.gear[old] || 0) + 1;
      if (id) { Game.S.gear[id]--; if (Game.S.gear[id] <= 0) delete Game.S.gear[id]; }
      c.eq[slot] = id;
      const st = Game.stats(this.who); c.hp = Math.min(c.hp, st.hp); c.mp = Math.min(c.mp, st.mp);
      Snd.sfx('ok'); this.buildEquipSlots();
    }
  },

  /* ---- party order ---- */
  buildParty() {
    this.data.swap = null;
    this.m2 = this.list(this.members().map((id, i) => ({ label: CHARS[id].name, id, right: i < 3 ? 'Active' : 'Reserve', rcol: i < 3 ? UI.green : UI.dim })), { x: 126, y: 34, w: 200, title: 'PARTY ORDER  (first three fight)' });
  },
  upParty() {
    const r = this.m2.update();
    if (r === 'cancel') { if (this.data.swap !== null) { this.data.swap = null; return; } this.stage = 'main'; return; }
    if (r === 'ok') {
      const i = this.m2.sel;
      if (this.data.swap === null) { this.data.swap = i; Snd.sfx('blip'); }
      else {
        const a = this.data.swap, b = i;
        if (a !== b && a !== 0 && b !== 0) { const p = Game.S.party; [p[a], p[b]] = [p[b], p[a]]; Snd.sfx('ok'); }
        else if (a === 0 || b === 0) this.toast('Vesper always leads.', UI.red);
        this.data.swap = null; this.buildParty(); this.m2.sel = b;
      }
    }
  },

  /* ---- terminal ---- */
  buildTerminal() {
    const found = CODEX.filter(c => Game.flag('cdx_' + c.id));
    const items = found.map(c => ({ label: c.title, id: c.id }));
    if (!items.length) items.push({ label: '(no entries yet)', disabled: true });
    this.m2 = this.list(items, { x: 126, y: 34, w: 150, rows: 9, title: 'THE TERMINAL' });
    this.data.total = CODEX.length;
  },
  upTerminal() { const r = this.m2.update(); if (r === 'cancel') this.stage = 'main'; },

  /* ---- bestiary ---- */
  buildBest() {
    const items = Object.keys(ENEMIES).filter(id => Game.S.best[id] !== undefined).map(id => ({ label: ENEMIES[id].name, id, right: Game.S.best[id] }));
    if (!items.length) items.push({ label: '(nothing seen)', disabled: true });
    this.m2 = this.list(items, { x: 126, y: 34, w: 150, rows: 9, title: 'BESTIARY' });
  },
  upBest() { const r = this.m2.update(); if (r === 'cancel') this.stage = 'main'; },

  /* ---- config ---- */
  buildConfig() {
    const s = Game.settings;
    const spd = { 35: 'Slow', 55: 'Normal', 90: 'Fast', 999: 'Instant' };
    const items = [
      { label: 'Text speed', right: spd[s.textSpeed] || 'Normal', k: 'ts' },
      { label: 'Battle time', right: s.atb === 'wait' ? 'Wait' : 'Active', k: 'atb' },
      { label: 'Timing assist', right: s.assist ? 'On' : 'Off', k: 'assist' },
      { label: 'Auto Judgment Ring', right: s.autoRing ? 'On' : 'Off', k: 'auto' },
      { label: 'Music', right: Math.round(s.music * 10), k: 'mus' },
      { label: 'Sound effects', right: Math.round(s.sfx * 10), k: 'sfx' },
    ];
    const keep = this.m2 ? this.m2.sel : 0;
    this.m2 = this.list(items, { x: 126, y: 34, w: 240, title: 'CONFIG   (← → to change)' });
    this.m2.sel = keep;
  },
  upConfig() {
    const r = this.m2.update();
    if (r === 'cancel') { Game.saveSettings(); if (this.data.fromTitle) { this.data.fromTitle = false; this.close(); return; } this.stage = 'main'; return; }
    const dir = (Input.rep('right') ? 1 : 0) - (Input.rep('left') ? 1 : 0), ok = r === 'ok' ? 1 : 0;
    const d = dir || ok;
    if (!d) return;
    const s = Game.settings, k = this.m2.cur.k;
    if (k === 'ts') { const v = [35, 55, 90, 999]; s.textSpeed = v[(v.indexOf(s.textSpeed) + d + 4) % 4] || 55; }
    if (k === 'atb') s.atb = s.atb === 'wait' ? 'active' : 'wait';
    if (k === 'assist') s.assist = !s.assist;
    if (k === 'auto') s.autoRing = !s.autoRing;
    if (k === 'mus') s.music = clamp(Math.round((s.music + d * 0.1) * 10) / 10, 0, 1);
    if (k === 'sfx') s.sfx = clamp(Math.round((s.sfx + d * 0.1) * 10) / 10, 0, 1);
    Snd.setVolumes(); Snd.sfx('blip'); this.buildConfig();
  },

  /* ------------------------------------------------------------------ draw */
  draw() {
    if (!this.active) return;
    U.fillStyle = 'rgba(6,2,16,0.72)'; U.fillRect(0, 0, W, H);
    UI.text('VERMILION REQUIEM', W - 12, 20, { size: 9, font: UI.fT, col: 'rgba(232,200,104,0.5)', align: 'right' });
    // side info
    UI.panel(10, 214, 110, 46);
    UI.text(`Écus  ${Game.S.gold}`, 18, 230, { size: 9, col: UI.gold });
    UI.text(fmtTime(Game.S.time), 18, 243, { size: 9, font: UI.fM, weight: 400, col: UI.dim });
    UI.text(Field.def ? Field.def.name.split('—')[0].trim() : '', 18, 255, { size: 7.5, col: UI.dim });
    if (this.stage === 'main') { this.m.draw(); this.drawParty(); }
    else {
      this.m.draw();
      switch (this.stage) {
        case 'pick': this.m2.draw(); this.drawParty(260); break;
        case 'items': this.m2.draw(); this.drawItemDesc(); if (this.data.itemTarget) this.data.tm.draw(); break;
        case 'status': this.drawStatus(); break;
        case 'equipSlot': this.m2.draw(); this.drawEquipInfo(); break;
        case 'equipList': this.m2.draw(); this.m.draw(); this.drawEquipInfo(); break;
        case 'party': this.m2.draw(); this.drawParty(336, true); break;
        case 'terminal': this.m2.draw(); this.drawTerminal(); break;
        case 'best': this.m2.draw(); this.drawBest(); break;
        case 'config': this.m2.draw(); break;
        case 'confirmTitle': this.m2.draw(); UI.text('Unsaved progress will be lost.', 126, 100, { size: 9, col: UI.dim }); break;
      }
    }
    if (this.msg) { const w = UI.measure(this.msg.txt, 10) + 24; UI.panel(W / 2 - w / 2, 236, w, 18, { a: 0.95 }); UI.text(this.msg.txt, W / 2, 248, { size: 10, align: 'center', col: this.msg.col }); }
  },

  drawParty(x0 = 126, compact = false) {
    const ids = this.members();
    ids.forEach((id, i) => {
      const c = Game.S.chars[id], st = Game.stats(id), C = CHARS[id];
      const y = compact ? 34 + i * 40 : 34 + i * 44, x = compact ? x0 : x0, w = compact ? 134 : 344;
      if (!compact || true) UI.panel(x, y, w, compact ? 36 : 40, { a: 0.85 });
      const pc = Art.portrait(C.look, 'n');
      if (pc) { U.imageSmoothingEnabled = false; U.drawImage(pc, x + 4, y + 3, compact ? 30 : 34, compact ? 30 : 34); U.imageSmoothingEnabled = true; }
      const tx = x + (compact ? 38 : 44);
      UI.text(C.name, tx, y + 12, { size: 9.5, font: UI.fT, col: C.col });
      UI.text('Lv ' + c.lv, tx + (compact ? 70 : 100), y + 12, { size: 8, col: UI.dim });
      const bw = compact ? 90 : 150;
      UI.bar(tx, y + 16, bw, 5, c.hp / st.hp, '#58c878'); UI.text(`${c.hp}/${st.hp}`, tx + bw + 4, y + 21, { size: 7, font: UI.fM, weight: 400 });
      UI.bar(tx, y + 24, bw * 0.7, 4, c.mp / st.mp, '#58a0f0'); UI.text(`${c.mp}/${st.mp}`, tx + bw * 0.7 + 4, y + 28, { size: 7, font: UI.fM, weight: 400, col: '#a8c8ff' });
      if (!compact) { UI.text(C.role, x + w - 8, y + 12, { size: 8, align: 'right', col: UI.dim }); const nx = c.lv >= MAXLV ? 1 : c.xp / xpNeed(c.lv); UI.bar(tx, y + 31, bw, 3, nx, '#c9a24a'); UI.text('EXP', tx + bw + 4, y + 34, { size: 6, col: UI.dim }); }
      if (this.data.swap === i && this.stage === 'party') { U.strokeStyle = UI.gold; U.strokeRect(x - 1, y - 1, w + 2, (compact ? 36 : 40) + 2); }
      if (i >= 3) UI.text('Reserve', x + w - 6, y + (compact ? 30 : 34), { size: 7, align: 'right', col: UI.dim });
    });
  },

  drawItemDesc() {
    const it = this.m2.cur; if (!it || !it.id) return;
    UI.panel(126, 176, 344, 34); UI.text(ITEMS[it.id].desc, 136, 196, { size: 10 });
    if (it.disabled) UI.text('Battle only', 460, 196, { size: 8, align: 'right', col: UI.dim });
  },

  drawStatus() {
    const id = this.who, c = Game.S.chars[id], st = Game.stats(id), C = CHARS[id];
    UI.panel(126, 34, 344, 176);
    const pc = Art.portrait(C.look, 'n'); U.imageSmoothingEnabled = false; U.drawImage(pc, 134, 42, 64, 64); U.imageSmoothingEnabled = true;
    UI.text(C.name, 206, 56, { size: 15, font: UI.fT, col: C.col }); UI.text(C.role + ' — Lv ' + c.lv, 206, 70, { size: 9, col: UI.dim });
    const bio = UI.wrap(C.bio, 250, 8.5); bio.forEach((l, i) => UI.text(l, 206, 84 + i * 10, { size: 8.5, col: '#d8ccc0', weight: 500 }));
    const rows = [['HP', st.hp], ['MP', st.mp], ['ATK', st.atk], ['DEF', st.def], ['MAG', st.mag], ['RES', st.res], ['SPD', st.spd], ['LCK', st.lck]];
    rows.forEach(([k, v], i) => { const x = 134 + (i % 4) * 58, y = 122 + Math.floor(i / 4) * 14; UI.text(k, x, y, { size: 8, col: UI.dim }); UI.text(String(v), x + 50, y, { size: 9, align: 'right' }); });
    const eq = ['weapon', 'armor', 'charm'].map(s => `${cap(s)}: ${c.eq[s] ? EQUIP[c.eq[s]].name : '—'}`);
    eq.forEach((t, i) => UI.text(t, 134, 156 + i * 10, { size: 8.5, col: '#e8dcc8' }));
    UI.text('SKILLS', 300, 122, { size: 8, col: UI.gold, font: UI.fT });
    const sk = Game.skillsOf(id); const upcoming = CHARS[id].skills.filter(([s, l]) => l > c.lv);
    [C.attack].concat(sk).forEach((s, i) => UI.text(SKILLS[s].name + (SKILLS[s].mp ? `  ${SKILLS[s].mp}` : ''), 300, 133 + i * 9, { size: 8, col: '#e8dcc8' }));
    if (upcoming.length) UI.text(`Next: ${SKILLS[upcoming[0][0]].name} at Lv ${upcoming[0][1]}`, 134, 198, { size: 8, col: UI.dim });
    UI.text('← → switch   X back', 462, 204, { size: 7, align: 'right', col: UI.dim });
  },

  drawEquipInfo() {
    const id = this.who, c = Game.S.chars[id], st = Game.stats(id);
    UI.panel(126, 176, 344, 34);
    const slot = this.data.slot;
    if (this.stage === 'equipList' && this.m.cur) {
      const it = this.m.cur.id;
      const S2 = JSON.parse(JSON.stringify(Game.S)); S2.chars[id].eq[slot] = it;
      const after = Game.statsOf(S2, id);
      let x = 134;
      for (const k of ['atk', 'def', 'mag', 'res', 'spd', 'hp', 'mp']) { const d = after[k] - st[k]; UI.text(`${k.toUpperCase()} ${after[k]}`, x, 190, { size: 8, col: d > 0 ? UI.green : d < 0 ? '#ff8a8a' : UI.dim }); if (d) UI.text((d > 0 ? '+' : '') + d, x, 202, { size: 7.5, col: d > 0 ? UI.green : '#ff8a8a' }); x += 47; }
    } else UI.text('Select a slot to change gear.', 134, 196, { size: 9, col: UI.dim });
  },

  drawTerminal() {
    const it = this.m2.cur; UI.panel(284, 34, 186, 176);
    UI.text(`${CODEX.filter(c => Game.flag('cdx_' + c.id)).length} / ${CODEX.length} entries`, 462, 46, { size: 7.5, align: 'right', col: UI.dim });
    if (!it || !it.id) return;
    const c = CODEX.find(x => x.id === it.id);
    UI.text(c.title, 292, 58, { size: 10, font: UI.fT, col: UI.cy });
    UI.wrap(c.text, 168, 9).forEach((l, i) => UI.text(l, 292, 74 + i * 11, { size: 9, col: '#dfeff0', weight: 500 }));
  },

  drawBest() {
    const it = this.m2.cur; UI.panel(284, 34, 186, 176);
    if (!it || !it.id) return;
    const d = ENEMIES[it.id], art = Art.enemy(it.id);
    const s = Math.min(1, 70 / art.height);
    U.imageSmoothingEnabled = false; U.drawImage(art, 380 - art.width * s / 2, 42, art.width * s, art.height * s); U.imageSmoothingEnabled = true;
    UI.text(d.name, 292, 122, { size: 10, font: UI.fT, col: UI.gold });
    UI.text(`Lv ${d.lvl}   HP ${d.hp}   Defeated ${Game.S.best[it.id]}`, 292, 134, { size: 8, col: UI.dim });
    UI.wrap(d.desc, 168, 8.5).forEach((l, i) => UI.text(l, 292, 147 + i * 10, { size: 8.5, col: '#e8dcc8', weight: 500 }));
    if (d.weak) { UI.text('Weak:', 292, 196, { size: 8, col: UI.dim }); d.weak.forEach((e, i) => { U.fillStyle = ELEM[e].col; U.beginPath(); U.arc(328 + i * 10, 194, 3.4, 0, TAU); U.fill(); UI.text(ELEM[e].name, 338 + i * 40, 196, { size: 8, col: ELEM[e].col }); }); }
  },
};

/* -------------------------------------------------------------------------
   Shop — buy consumables and gear. `await Shop.open('aurelle')`.
   ------------------------------------------------------------------------- */
const Shop = {
  active: false, m: null, qty: 1, mode: 'list', res: null, msg: null,
  open(id) {
    return new Promise(res => {
      this.res = res; this.active = true; this.id = id; this.mode = 'list'; this.qty = 1;
      this.rebuild(); Snd.sfx('ok');
    });
  },
  rebuild() {
    const stock = SHOPS[this.id];
    const items = stock.map(k => { const it = ITEMS[k] || EQUIP[k]; return { label: it.name, right: it.price, id: k, disabled: Game.S.gold < it.price }; });
    const keep = this.m ? this.m.sel : 0;
    this.m = new ListMenu({ x: 10, y: 28, w: 210, rows: 10, rowH: 15, size: 10, items, title: 'WARES' });
    this.m.sel = keep; this.m.clampTop();
  },
  openConfig() {
    if (this.active) return;
    this.active = true; Game.busy++; this.data.fromTitle = true;
    this.m = this.list([{ label: 'OPTIONS' }], { rows: 1, w: 110 });
    this.stage = 'config'; this.buildConfig();
  },
  close() { this.active = false; const r = this.res; this.res = null; Input.flush(); if (r) r(); },
  update(dt) {
    if (!this.active) return false;
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    if (this.mode === 'list') {
      const r = this.m.update();
      if (r === 'cancel') { Snd.sfx('back'); this.close(); return true; }
      if (r === 'ok') { const it = this.m.cur; if (EQUIP[it.id]) this.buy(it.id, 1); else { this.mode = 'qty'; this.qty = 1; } }
    } else if (this.mode === 'qty') {
      const id = this.m.cur.id, it = ITEMS[id], max = Math.min(9, Math.floor(Game.S.gold / it.price), 99 - Game.count(id));
      if (Input.rep('right')) this.qty = Math.min(max, this.qty + 1); if (Input.rep('left')) this.qty = Math.max(1, this.qty - 1);
      if (Input.rep('up')) this.qty = Math.min(max, this.qty + 5); if (Input.rep('down')) this.qty = Math.max(1, this.qty - 5);
      if (Input.hit('cancel')) { this.mode = 'list'; Snd.sfx('back'); }
      if (Input.hit('ok')) { this.buy(id, Math.max(1, Math.min(this.qty, max))); this.mode = 'list'; }
    }
    return true;
  },
  buy(id, n) {
    const it = ITEMS[id] || EQUIP[id], cost = it.price * n;
    if (Game.S.gold < cost) { Snd.sfx('no'); return; }
    Game.S.gold -= cost; Game.add(id, n); Snd.sfx('chest');
    this.msg = { txt: `Bought ${it.name}${n > 1 ? ' ×' + n : ''}.`, t: 1.5 };
    this.rebuild();
  },
  draw() {
    if (!this.active) return;
    U.fillStyle = 'rgba(6,2,16,0.75)'; U.fillRect(0, 0, W, H);
    this.m.draw();
    UI.panel(226, 28, 244, 40); UI.text(`Écus  ${Game.S.gold}`, 236, 52, { size: 12, col: UI.gold, font: UI.fT });
    const cur = this.m.cur; if (!cur) return;
    const it = ITEMS[cur.id] || EQUIP[cur.id];
    UI.panel(226, 74, 244, 130);
    UI.text(it.name, 236, 92, { size: 11, font: UI.fT, col: UI.gold });
    if (ITEMS[cur.id]) {
      UI.text(it.desc, 236, 108, { size: 9.5, col: '#e8dcc8' });
      UI.text(`Owned: ${Game.count(cur.id)}`, 236, 124, { size: 9, col: UI.dim });
    } else {
      const parts = ['atk', 'def', 'mag', 'res', 'spd', 'lck', 'hp', 'mp'].filter(k => it[k]).map(k => `${k.toUpperCase()} +${it[k]}`);
      UI.text(cap(it.slot) + (it.who ? ' — ' + it.who.map(w => CHARS[w].name).join(', ') : ''), 236, 108, { size: 9, col: UI.dim });
      UI.text(parts.join('   ') || '—', 236, 122, { size: 10, col: UI.green });
      UI.text(`Owned: ${Game.S.gear[cur.id] || 0}${Object.values(Game.S.chars).some(c => Object.values(c.eq).includes(cur.id)) ? ' (+equipped)' : ''}`, 236, 138, { size: 9, col: UI.dim });
    }
    if (this.mode === 'qty') { UI.panel(300, 150, 120, 44); UI.text(`Quantity: ${this.qty}`, 360, 168, { size: 11, align: 'center' }); UI.text(`= ${it.price * this.qty} Écus`, 360, 184, { size: 9, align: 'center', col: UI.gold }); }
    if (this.msg) UI.text(this.msg.txt, 348, 196, { size: 9.5, align: 'center', col: UI.green });
  },
};
