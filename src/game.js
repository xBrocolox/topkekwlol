'use strict';
/* ==========================================================================
   VERMILION REQUIEM — game.js
   Save state, party stats, inventory, flags, persistence.
   ========================================================================== */

const Game = {
  settings: { textSpeed: 55, atb: 'wait', assist: false, music: 0.55, sfx: 0.8, autoRing: false },
  S: null,
  scene: null,
  busy: 0,
  memSave: null,
  SAVEKEY: 'vermilion_requiem_save_v1',
  SETKEY: 'vermilion_requiem_settings_v1',

  newState() {
    const mk = (id, lv = 1) => ({ lv, xp: 0, hp: 1, mp: 1, eq: { weapon: 'w_' + id[0] + '0', armor: 'a_0', charm: null }, mal: 0, res: 0 });
    const S = {
      party: ['vesper', 'gaspard'], chars: { vesper: mk('vesper'), gaspard: mk('gaspard') },
      inv: { tonic: 4, ether: 1 }, gear: {}, gold: 120, flags: {}, map: 'aurelle', x: 20.5, y: 9, dir: 'down',
      time: 0, steps: 0, best: {}, kills: 0, deaths: 0, parries: 0, version: 1,
    };
    for (const id of S.party) { const st = this.statsOf(S, id); S.chars[id].hp = st.hp; S.chars[id].mp = st.mp; }
    return S;
  },

  addMember(id, lv) {
    const S = this.S;
    if (S.chars[id]) { if (!S.party.includes(id)) S.party.push(id); return; }
    S.chars[id] = { lv, xp: 0, hp: 1, mp: 1, eq: { weapon: 'w_' + id[0] + '0', armor: 'a_0', charm: null }, mal: 0, res: 0 };
    S.party.push(id);
    const st = this.stats(id); S.chars[id].hp = st.hp; S.chars[id].mp = st.mp;
  },

  statsOf(S, id) {
    const C = CHARS[id], c = S.chars[id], lv = c.lv;
    const s = {};
    for (const k in C.base) s[k] = C.base[k] + C.grow[k] * (lv - 1);
    for (const slot in c.eq) {
      const it = c.eq[slot] && EQUIP[c.eq[slot]];
      if (!it) continue;
      for (const k of ['atk', 'def', 'mag', 'res', 'spd', 'lck', 'hp', 'mp']) if (it[k]) s[k] += it[k];
    }
    for (const k in s) s[k] = Math.round(s[k]);
    return s;
  },
  stats(id) { return this.statsOf(this.S, id); },
  skillsOf(id) {
    const lv = this.S.chars[id].lv;
    return CHARS[id].skills.filter(([, l]) => l <= lv).map(([s]) => s);
  },
  activeParty() { return this.S.party.slice(0, 3); },

  /* ---- inventory ---- */
  count(id) { return this.S.inv[id] || 0; },
  add(id, n = 1) {
    if (EQUIP[id]) { this.S.gear[id] = (this.S.gear[id] || 0) + n; return; }
    this.S.inv[id] = (this.S.inv[id] || 0) + n;
  },
  take(id, n = 1) { this.S.inv[id] = Math.max(0, (this.S.inv[id] || 0) - n); if (!this.S.inv[id]) delete this.S.inv[id]; },
  nameOf(id) { return (ITEMS[id] || EQUIP[id] || { name: id }).name; },
  flag(k) { return this.S.flags[k]; },
  setFlag(k, v = true) { this.S.flags[k] = v; },

  healAll() {
    for (const id of this.S.party) { const st = this.stats(id), c = this.S.chars[id]; c.hp = st.hp; c.mp = st.mp; c.mal = 0; }
  },

  /* ---- XP / leveling. returns list of level-up records ---- */
  giveXP(id, amount) {
    const c = this.S.chars[id], ups = [];
    if (!c || c.lv >= MAXLV) return ups;
    c.xp += amount;
    while (c.lv < MAXLV && c.xp >= xpNeed(c.lv)) {
      c.xp -= xpNeed(c.lv);
      const before = this.stats(id), oldSk = this.skillsOf(id);
      c.lv++;
      const after = this.stats(id);
      c.hp += after.hp - before.hp; c.mp += after.mp - before.mp;
      const learned = this.skillsOf(id).filter(s => !oldSk.includes(s));
      ups.push({ id, lv: c.lv, before, after, learned });
    }
    if (c.lv >= MAXLV) c.xp = 0;
    return ups;
  },

  /* ---- persistence ---- */
  hasSave() { try { return !!localStorage.getItem(this.SAVEKEY); } catch (e) { return !!this.memSave; } },
  saveSummary() {
    try { const raw = localStorage.getItem(this.SAVEKEY) || this.memSave; if (!raw) return null; const s = JSON.parse(raw); return s; } catch (e) { return this.memSave ? JSON.parse(this.memSave) : null; }
  },
  save() {
    const S = this.S; S.savedAt = Date.now();
    const raw = JSON.stringify(S);
    this.memSave = raw;
    try { localStorage.setItem(this.SAVEKEY, raw); } catch (e) { /* storage unavailable: keep in memory */ }
  },
  load() {
    let raw = null;
    try { raw = localStorage.getItem(this.SAVEKEY); } catch (e) { /* ignore */ }
    raw = raw || this.memSave;
    if (!raw) return false;
    try { this.S = JSON.parse(raw); return true; } catch (e) { return false; }
  },
  saveSettings() { try { localStorage.setItem(this.SETKEY, JSON.stringify(this.settings)); } catch (e) { /* ignore */ } },
  loadSettings() { try { const r = localStorage.getItem(this.SETKEY); if (r) Object.assign(this.settings, JSON.parse(r)); } catch (e) { /* ignore */ } },

  /* ---- scene plumbing ---- */
  setScene(s) { this.scene = s; if (s.enter) s.enter(); Input.flush(); },
  async cutscene(fn) {
    this.busy++;
    try { await fn(); } catch (e) { console.error('cutscene error', e); }
    this.busy--;
  },
};
