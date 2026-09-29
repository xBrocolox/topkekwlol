'use strict';
/* ==========================================================================
   VERMILION REQUIEM — data.js
   Characters, skills, techs, items, equipment, enemies, maps, codex.
   ========================================================================== */

const ELEM = {
  phys: { name: 'Blade', col: '#f0e6d8' }, ember: { name: 'Ember', col: '#ff8a3a' }, frost: { name: 'Frost', col: '#8ad8ff' },
  volt: { name: 'Volt', col: '#30e2d2' }, gilt: { name: 'Gilt', col: '#f4d878' }, ink: { name: 'Ink', col: '#b070ff' },
};

/* -------------------------------------------------------------------------
   Party
   ------------------------------------------------------------------------- */
const CHARS = {
  vesper: {
    id: 'vesper', name: 'Vesper', look: 'vesper', role: 'Ringbearer', col: '#e0384e',
    base: { hp: 120, mp: 20, atk: 15, def: 9, mag: 9, res: 8, spd: 13, lck: 8 },
    grow: { hp: 15, mp: 2.8, atk: 2.5, def: 1.6, mag: 1.4, res: 1.4, spd: 0.35, lck: 0.3 },
    skills: [['v_flurry', 1], ['v_vercut', 3], ['v_gilt', 6], ['v_slip', 9], ['v_dance', 14]],
    req: 'v_hour', attack: 'v_attack', bio: 'A Chronicler\'s apprentice who bears the Judgment Halo. Strikes where fate is thinnest.',
    weapon: 'rapier',
  },
  gaspard: {
    id: 'gaspard', name: 'Gaspard', look: 'gaspard', role: 'Gunwright', col: '#4ab0c0',
    base: { hp: 150, mp: 14, atk: 16, def: 12, mag: 5, res: 7, spd: 9, lck: 6 },
    grow: { hp: 18, mp: 2, atk: 2.6, def: 2.0, mag: 0.8, res: 1.2, spd: 0.25, lck: 0.2 },
    skills: [['g_aimed', 1], ['g_scatter', 4], ['g_guard', 6], ['g_keg', 9], ['g_lastcall', 12]],
    req: 'g_waltz', attack: 'g_attack', bio: 'Ex-siege engineer. Repairs automata by day, shoots things that shouldn\'t move by night.',
    weapon: 'revolver',
  },
  ilse: {
    id: 'ilse', name: 'Ilse', look: 'ilse', role: 'Mourner', col: '#a878e8',
    base: { hp: 95, mp: 34, atk: 8, def: 6, mag: 17, res: 12, spd: 12, lck: 7 },
    grow: { hp: 11, mp: 4, atk: 1.2, def: 1.1, mag: 2.7, res: 1.9, spd: 0.3, lck: 0.3 },
    skills: [['i_hex', 1], ['i_mend', 2], ['i_waltz', 5], ['i_exorcise', 8], ['i_shroud', 11]],
    req: 'i_requiem', attack: 'i_attack', bio: 'A medium who hears the erased. Her grief can wear a black-feathered shape.',
    weapon: 'parasol', fuse: true,
  },
  tally: {
    id: 'tally', name: 'Tally', look: 'tally', role: 'Wavemaster', col: '#30e2d2',
    base: { hp: 100, mp: 30, atk: 10, def: 7, mag: 15, res: 10, spd: 15, lck: 9 },
    grow: { hp: 12, mp: 3.6, atk: 1.6, def: 1.2, mag: 2.4, res: 1.6, spd: 0.4, lck: 0.3 },
    skills: [['t_drain', 1], ['t_patch', 3], ['t_overflow', 6], ['t_step', 8], ['t_rootkit', 11]],
    req: 't_root', attack: 't_attack', bio: 'A player avatar trapped in a dying server for three hundred years. Talks fast, hacks faster.',
    weapon: 'glitchstaff',
  },
};

/* defence softening constant: dmg *= DEFK / (DEFK + defence) */
const DEFK = 70;
const xpNeed = L => Math.round(14 * Math.pow(L, 1.45));
const MAXLV = 30;

/* -------------------------------------------------------------------------
   Skills. ring: {n zones, w degrees, spd revolutions/sec}
   tgt: one | all | ally | allies | self
   ------------------------------------------------------------------------- */
const SKILLS = {
  /* Vesper */
  v_attack: { name: 'Rapier Strike', mp: 0, tgt: 'one', stat: 'atk', pow: 1.0, ring: { n: 2, w: 38, spd: 0.8 }, elem: 'phys', anim: 'slash', desc: 'Two quick thrusts.' },
  v_flurry: { name: 'Riposte Flurry', mp: 4, tgt: 'one', stat: 'atk', pow: 1.15, ring: { n: 4, w: 30, spd: 0.95 }, elem: 'phys', anim: 'slash', desc: 'Four lightning cuts.' },
  v_vercut: { name: 'Vermilion Cut', mp: 6, tgt: 'one', stat: 'atk', pow: 2.7, ring: { n: 1, w: 24, spd: 0.9 }, elem: 'phys', anim: 'cleave', st: { id: 'slow', ch: 0.6, dur: 12 }, desc: 'One perfect cut. Slows.' },
  v_gilt: { name: 'Gilt Thrust', mp: 8, tgt: 'all', stat: 'atk', pow: 1.35, ring: { n: 3, w: 30, spd: 1.0 }, elem: 'gilt', anim: 'pierce', desc: 'A golden lance through all foes.' },
  v_slip: { name: 'Time Slip', mp: 9, tgt: 'one', stat: 'atk', pow: 1.3, ring: { n: 3, w: 28, spd: 1.0 }, elem: 'phys', anim: 'slash', st: { id: 'stun', ch: 0.55, dur: 4 }, desc: 'Cut between moments. May stun.' },
  v_dance: { name: 'Ring Dance', mp: 14, tgt: 'all', stat: 'atk', pow: 1.5, ring: { n: 5, w: 24, spd: 1.1 }, elem: 'gilt', anim: 'spin', desc: 'Five spinning arcs.' },
  v_hour: { name: 'Hour of Ruin', mp: 0, tgt: 'all', stat: 'atk', pow: 2.5, ring: { n: 6, w: 22, spd: 1.15 }, elem: 'gilt', anim: 'spin', req: true, desc: 'REQUIEM. The Halo turns full circle.' },
  /* Gaspard */
  g_attack: { name: 'Revolver', mp: 0, tgt: 'one', stat: 'atk', pow: 0.95, ring: { n: 2, w: 40, spd: 0.8 }, elem: 'phys', anim: 'shot', desc: 'Two shots.' },
  g_aimed: { name: 'Aimed Shot', mp: 3, tgt: 'one', stat: 'atk', pow: 2.4, ring: { n: 1, w: 20, spd: 0.85, critMul: 2.2 }, elem: 'phys', anim: 'shot', desc: 'One breath. One bullet.' },
  g_scatter: { name: 'Scatter Volley', mp: 7, tgt: 'all', stat: 'atk', pow: 1.15, ring: { n: 3, w: 32, spd: 0.95 }, elem: 'phys', anim: 'shot', desc: 'Buckshot across the whole field.' },
  g_guard: { name: 'Iron Guard', mp: 6, tgt: 'allies', type: 'buff', st: [{ id: 'shield', dur: 20 }], anim: 'buff', desc: 'Party takes 40% less damage.' },
  g_keg: { name: 'Powder Keg', mp: 9, tgt: 'all', stat: 'atk', pow: 2.1, ring: { n: 1, w: 34, spd: 0.8 }, elem: 'ember', anim: 'blast', st: { id: 'burn', ch: 0.5, dur: 9 }, desc: 'A very large bang.' },
  g_lastcall: { name: 'Last Call', mp: 12, tgt: 'one', stat: 'atk', pow: 1.9, ring: { n: 2, w: 26, spd: 1.0 }, elem: 'phys', anim: 'shot', desc: 'Two heavy slugs.' },
  g_waltz: { name: 'Dead Man\'s Waltz', mp: 0, tgt: 'all', stat: 'atk', pow: 2.1, ring: { n: 8, w: 24, spd: 1.2 }, elem: 'ember', anim: 'blast', req: true, desc: 'REQUIEM. Eight beats, eight blasts.' },
  /* Ilse */
  i_attack: { name: 'Parasol Jab', mp: 0, tgt: 'one', stat: 'mag', pow: 0.8, ring: { n: 2, w: 38, spd: 0.8 }, elem: 'ink', anim: 'slash', desc: 'Two hexed jabs.' },
  i_hex: { name: 'Hex Bloom', mp: 4, tgt: 'one', stat: 'mag', pow: 1.6, ring: { n: 2, w: 34, spd: 0.9 }, elem: 'ink', anim: 'ink', st: { id: 'poison', ch: 0.6, dur: 12 }, desc: 'Ink blossoms. Poisons.' },
  i_mend: { name: 'Mend Spirit', mp: 5, tgt: 'ally', type: 'heal', stat: 'mag', pow: 3.0, ring: { n: 2, w: 44, spd: 0.8 }, anim: 'heal', desc: 'Restore an ally.' },
  i_waltz: { name: 'Ghost Waltz', mp: 9, tgt: 'all', stat: 'mag', pow: 1.4, ring: { n: 3, w: 32, spd: 0.95 }, elem: 'ink', anim: 'ink', desc: 'The erased dance.' },
  i_exorcise: { name: 'Exorcise', mp: 8, tgt: 'one', stat: 'mag', pow: 2.6, ring: { n: 2, w: 30, spd: 0.95 }, elem: 'gilt', anim: 'burst', desc: 'Purging light.' },
  i_shroud: { name: 'Veil of Mourning', mp: 10, tgt: 'allies', type: 'buff', st: [{ id: 'regen', dur: 24 }], anim: 'buff', desc: 'Party regenerates.' },
  i_requiem: { name: 'Requiem for the Erased', mp: 0, tgt: 'all', stat: 'mag', pow: 2.7, ring: { n: 7, w: 24, spd: 1.15 }, elem: 'ink', anim: 'ink', req: true, healParty: 0.25, desc: 'REQUIEM. Every name, sung once.' },
  i_swan: { name: 'Swan Song', mp: 0, tgt: 'all', stat: 'mag', pow: 2.3, ring: { n: 4, w: 30, spd: 1.0 }, elem: 'ink', anim: 'ink', fusion: true, desc: 'FUSED. Black feathers fall like rain.' },
  i_feather: { name: 'Feather Storm', mp: 0, tgt: 'one', stat: 'mag', pow: 3.0, ring: { n: 5, w: 28, spd: 1.05 }, elem: 'ink', anim: 'ink', fusion: true, drain: 0.3, desc: 'FUSED. Drains life.' },
  i_devour: { name: 'Devour Grief', mp: 0, tgt: 'one', stat: 'mag', pow: 4.2, ring: { n: 2, w: 24, spd: 1.0 }, elem: 'ink', anim: 'cleave', fusion: true, desc: 'FUSED. A single terrible bite.' },
  /* Tally */
  t_attack: { name: 'Glitch Staff', mp: 0, tgt: 'one', stat: 'atk', pow: 0.8, ring: { n: 3, w: 34, spd: 0.9 }, elem: 'volt', anim: 'slash', desc: 'Three glitching swings.' },
  t_drain: { name: 'Data Drain', mp: 5, tgt: 'one', stat: 'mag', pow: 1.4, ring: { n: 2, w: 34, spd: 0.9 }, elem: 'volt', anim: 'beam', drain: 0.5, interrupt: true, mpDrain: 4, desc: 'Steals HP & MP. INTERRUPTS charges.' },
  t_patch: { name: 'Patch', mp: 6, tgt: 'ally', type: 'heal', stat: 'mag', pow: 2.3, ring: { n: 2, w: 44, spd: 0.85 }, cleanse: true, anim: 'heal', desc: 'Heal one ally and cleanse ailments.' },
  t_overflow: { name: 'Buffer Overflow', mp: 9, tgt: 'all', stat: 'mag', pow: 1.55, ring: { n: 3, w: 30, spd: 1.0 }, elem: 'volt', anim: 'burst', desc: 'Memory floods the field.' },
  t_step: { name: 'Glitch Step', mp: 7, tgt: 'allies', type: 'buff', st: [{ id: 'haste', dur: 20 }], anim: 'buff', desc: 'Party gains Haste.' },
  t_rootkit: { name: 'Rootkit', mp: 10, tgt: 'one', stat: 'mag', pow: 1.3, ring: { n: 2, w: 32, spd: 1.0 }, elem: 'volt', anim: 'beam', st: { id: 'corrupt', ch: 0.85, dur: 12 }, interrupt: true, desc: 'Corrupts a foe. INTERRUPTS charges.' },
  t_root: { name: 'Root Access', mp: 0, tgt: 'all', stat: 'mag', pow: 2.6, ring: { n: 6, w: 24, spd: 1.15 }, elem: 'volt', anim: 'beam', req: true, atbAll: true, desc: 'REQUIEM. Everyone acts again.' },
};

/* Dual & triple techs (Chrono-style). need: character ids; mp per participant */
const TECHS = {
  crossfire: { name: 'Crossfire Waltz', need: ['vesper', 'gaspard'], mp: 6, tgt: 'one', pow: 8.0, hits: 6, w: 30, spd: 1.05, elem: 'ember', anim: 'shot', desc: 'Blade and bullet in three-quarter time.', flag: 'tut_done' },
  eclipse: { name: 'Vermilion Eclipse', need: ['vesper', 'ilse'], mp: 8, tgt: 'all', pow: 6.0, hits: 6, w: 28, spd: 1.05, elem: 'gilt', anim: 'burst', desc: 'Gilt and ink collide into one red sun.', flag: 'ilse_joined' },
  powder: { name: 'Powder & Prayer', need: ['gaspard', 'ilse'], mp: 8, tgt: 'all', pow: 6.0, hits: 6, w: 28, spd: 1.05, elem: 'ember', anim: 'blast', desc: 'A blessed explosion.', flag: 'ilse_joined' },
  loop: { name: 'Time Loop', need: ['vesper', 'tally'], mp: 9, tgt: 'one', pow: 9.0, hits: 5, w: 28, spd: 1.1, elem: 'volt', anim: 'pierce', st: { id: 'stun', ch: 1, dur: 5 }, desc: 'Cut the same second five times.', flag: 'tally_joined' },
  barrage: { name: 'Overclock Barrage', need: ['gaspard', 'tally'], mp: 9, tgt: 'one', pow: 10.0, hits: 8, w: 26, spd: 1.15, elem: 'volt', anim: 'shot', desc: 'Every bullet has admin rights.', flag: 'tally_joined' },
  protocol: { name: 'Requiem Protocol', need: ['ilse', 'tally'], mp: 10, tgt: 'all', pow: 6.5, hits: 6, w: 28, spd: 1.1, elem: 'ink', anim: 'ink', healParty: 0.2, desc: 'A hymn compiled in ink and volt.', flag: 'tally_joined' },
  chrono: { name: 'Chrono Requiem', need: ['vesper', 'ilse', 'tally'], mp: 12, tgt: 'all', pow: 14.0, hits: 9, w: 24, spd: 1.2, elem: 'gilt', anim: 'burst', desc: 'TRIPLE TECH. Three eras, one chord.', flag: 'tally_joined' },
};

/* Status catalogue (durations in seconds of battle time) */
const STATUS = {
  poison: { name: 'Poison', col: '#9ae06a', bad: 1 }, burn: { name: 'Burn', col: '#ff8a3a', bad: 1 },
  slow: { name: 'Slow', col: '#8ab0ff', bad: 1 }, haste: { name: 'Haste', col: '#ffe070' },
  stun: { name: 'Stun', col: '#f0f0a0', bad: 1 }, shield: { name: 'Shield', col: '#a0d0ff' },
  regen: { name: 'Regen', col: '#80ffb0' }, corrupt: { name: 'Corrupt', col: '#ff5ab8', bad: 1 },
  atkup: { name: 'Might', col: '#ff9a6a' }, defup: { name: 'Bulwark', col: '#a0c0ff' }, sap: { name: 'Sap', col: '#c090ff', bad: 1 },
};

/* -------------------------------------------------------------------------
   Items & equipment
   ------------------------------------------------------------------------- */
const ITEMS = {
  tonic: { name: 'Tonic', price: 30, use: 'hp', amt: 90, desc: 'Restores 90 HP.' },
  hi_tonic: { name: 'Grand Tonic', price: 120, use: 'hp', amt: 280, desc: 'Restores 280 HP.' },
  mega_tonic: { name: 'Sovereign Tonic', price: 340, use: 'hp', amt: 700, desc: 'Restores 700 HP.' },
  ether: { name: 'Ether', price: 60, use: 'mp', amt: 30, desc: 'Restores 30 MP.' },
  hi_ether: { name: 'Grand Ether', price: 200, use: 'mp', amt: 80, desc: 'Restores 80 MP.' },
  feather: { name: 'Ember Feather', price: 150, use: 'revive', amt: 0.4, desc: 'Revives an ally at 40% HP.' },
  elixir: { name: 'Elixir', price: 900, use: 'full', desc: 'Fully restores HP and MP.' },
  panacea: { name: 'Panacea', price: 40, use: 'cleanse', desc: 'Cures all ailments.' },
  smoke: { name: 'Smoke Bomb', price: 50, use: 'smoke', desc: 'Guaranteed escape (not bosses).', battleOnly: true },
  flare: { name: 'Flare Shard', price: 80, use: 'dmgall', amt: 120, elem: 'ember', desc: 'Scorches all foes.', battleOnly: true },
  coil: { name: 'Volt Coil', price: 90, use: 'dmg', amt: 220, elem: 'volt', desc: 'Shocks one foe.', battleOnly: true },
  vial: { name: 'Resonance Vial', price: 200, use: 'reson', amt: 45, desc: 'Adds 45 Resonance.', battleOnly: true },
};

/* slot: weapon | armor | charm. who: ids permitted */
const EQUIP = {
  /* weapons */
  w_v0: { name: 'Iron Rapier', slot: 'weapon', who: ['vesper'], atk: 0, price: 0 },
  w_v1: { name: 'Gilt Foil', slot: 'weapon', who: ['vesper'], atk: 7, price: 260 },
  w_v2: { name: 'Vermilion Blade', slot: 'weapon', who: ['vesper'], atk: 16, spd: 1, price: 900 },
  w_v3: { name: 'Chrono Epee', slot: 'weapon', who: ['vesper'], atk: 28, spd: 2, price: 2400 },
  w_g0: { name: 'Old Revolver', slot: 'weapon', who: ['gaspard'], atk: 0, price: 0 },
  w_g1: { name: 'Brass Peacemaker', slot: 'weapon', who: ['gaspard'], atk: 8, price: 260 },
  w_g2: { name: 'Choir Cannon', slot: 'weapon', who: ['gaspard'], atk: 17, price: 900 },
  w_g3: { name: 'Null Magnum', slot: 'weapon', who: ['gaspard'], atk: 29, price: 2400 },
  w_i0: { name: 'Black Parasol', slot: 'weapon', who: ['ilse'], mag: 0, price: 0 },
  w_i1: { name: 'Mourner\'s Parasol', slot: 'weapon', who: ['ilse'], mag: 8, price: 260 },
  w_i2: { name: 'Seraph Umbrella', slot: 'weapon', who: ['ilse'], mag: 18, price: 900 },
  w_i3: { name: 'Requiem Canopy', slot: 'weapon', who: ['ilse'], mag: 30, price: 2400 },
  w_t0: { name: 'Glitch Staff', slot: 'weapon', who: ['tally'], mag: 0, price: 0 },
  w_t1: { name: 'Patch Rod', slot: 'weapon', who: ['tally'], mag: 8, price: 260 },
  w_t2: { name: 'Root Scepter', slot: 'weapon', who: ['tally'], mag: 18, price: 900 },
  w_t3: { name: 'Sudo Staff', slot: 'weapon', who: ['tally'], mag: 30, price: 2400 },
  /* armor */
  a_0: { name: 'Traveler\'s Coat', slot: 'armor', def: 3, res: 2, price: 0 },
  a_1: { name: 'Gaslight Vest', slot: 'armor', def: 8, res: 4, price: 240 },
  a_2: { name: 'Patina Mail', slot: 'armor', def: 16, res: 10, price: 800 },
  a_3: { name: 'Packet Weave', slot: 'armor', def: 26, res: 18, price: 1900 },
  a_4: { name: 'Vermilion Mantle', slot: 'armor', def: 38, res: 28, price: 4000 },
  /* charms */
  c_ink: { name: 'Ink Locket', slot: 'charm', res: 5, price: 180 },
  c_ribbon: { name: 'Signal Ribbon', slot: 'charm', spd: 3, price: 320 },
  c_coin: { name: 'Lucky Coin', slot: 'charm', lck: 10, price: 200 },
  c_halo: { name: 'Halo Shard', slot: 'charm', mp: 18, price: 500 },
  c_hours: { name: 'Ring of Hours', slot: 'charm', spd: 5, atk: 4, price: 1400 },
  c_song: { name: 'Songbird Locket', slot: 'charm', mag: 6, mp: 10, price: 0 },
  c_gear: { name: 'Warden\'s Cog', slot: 'charm', def: 6, hp: 40, price: 0 },
  c_score: { name: 'Sunken Score', slot: 'charm', mag: 8, res: 8, price: 0 },
  c_null: { name: 'Null Pointer', slot: 'charm', atk: 8, mag: 8, price: 0 },
};

const SHOPS = {
  aurelle: ['tonic', 'ether', 'feather', 'panacea', 'smoke', 'flare', 'w_v1', 'w_g1', 'w_i1', 'w_t1', 'a_1', 'c_ink', 'c_coin'],
  glade: ['hi_tonic', 'hi_ether', 'feather', 'panacea', 'smoke', 'flare', 'vial', 'w_v2', 'w_g2', 'w_i2', 'w_t2', 'a_2', 'c_ribbon', 'c_halo'],
  terminus: ['hi_tonic', 'mega_tonic', 'hi_ether', 'feather', 'panacea', 'coil', 'vial', 'elixir', 'w_v3', 'w_g3', 'w_i3', 'w_t3', 'a_3', 'a_4', 'c_hours'],
};

/* -------------------------------------------------------------------------
   Enemies — stats derive from level and multipliers, then overrides apply.
   moves: n name, p power, h hits, t telegraph (n|h heavy|f feint), a one|all,
          e element, st status {id,ch,dur}, w weight, c condition, ch charge secs
   ------------------------------------------------------------------------- */
function mkEnemy(o) {
  const L = o.lvl, m = o.m || {};
  const e = {
    hp: Math.round((40 + L * 24 + L * L * 0.45) * (m.hp || 1)),
    atk: (10 + L * 3.9) * (m.atk || 1), def: (4 + L * 1.5) * (m.def || 1),
    mag: (8 + L * 3.3) * (m.mag || 1), res: (4 + L * 1.3) * (m.res || 1),
    spd: 9 + L * 0.22 + (m.spd || 0),
    xp: Math.round((6 + L * 4) * (m.xp || 1)), gold: Math.round((4 + L * 3) * (m.gold || 1)),
  };
  return Object.assign(e, o, { id: o.id });
}
const ENEMIES = {};
function defEnemy(id, name, art, lvl, m, extra) { ENEMIES[id] = mkEnemy(Object.assign({ id, name, art, lvl, m }, extra)); }

/* --- Era I: Aurelle --- */
defEnemy('wisp', 'Lacuna Wisp', 'wisp', 1, { hp: 0.6, xp: 1.4 }, {
  weak: ['ember'], resist: ['ink'], scale: 2, desc: 'A flame of unpainted canvas. Where it touches, things forget themselves.',
  moves: [{ n: 'Erase Touch', p: 1.0, h: 1, w: 3 }, { n: 'Blank Flare', p: 0.7, h: 2, w: 2 }],
  drops: [['tonic', 0.2]],
});
defEnemy('inkslime', 'Ink Slime', 'inkslime', 3, { hp: 0.9, xp: 1.1 }, {
  weak: ['gilt', 'ember'], resist: ['ink'], scale: 2, desc: 'Spilled ink that learned to want.',
  moves: [{ n: 'Splat', p: 1.0, h: 1, w: 3 }, { n: 'Ooze Spray', p: 0.6, h: 1, a: 'all', e: 'ink', st: { id: 'poison', ch: 0.25, dur: 9 }, w: 2 }],
  drops: [['tonic', 0.25], ['ether', 0.1]],
});
defEnemy('moth', 'Umbral Moth', 'moth', 4, { hp: 0.6, spd: 4 }, {
  weak: ['ember', 'volt'], scale: 2, desc: 'Drawn to lamplight, and to the last warm thing in a room.',
  moves: [{ n: 'Dust Flutter', p: 0.65, h: 3, t: 'f', w: 3 }, { n: 'Drowsy Scales', p: 0.5, h: 1, a: 'all', st: { id: 'slow', ch: 0.35, dur: 8 }, w: 1 }],
  drops: [['ether', 0.2]],
});
defEnemy('puppet', 'Bone Marionette', 'puppet', 5, { hp: 1.0 }, {
  weak: ['gilt'], resist: ['ink'], scale: 2, desc: 'Strings lead up into the dark. Someone is still playing.',
  moves: [{ n: 'Bone Swing', p: 1.2, h: 1, t: 'h', w: 2 }, { n: 'String Lash', p: 0.6, h: 3, w: 3 }],
  drops: [['tonic', 0.3], ['panacea', 0.1]],
});
defEnemy('phantom', 'Opera Phantom', 'phantom', 4, { hp: 0.9, mag: 1.2 }, {
  weak: ['gilt'], resist: ['ink'], scale: 2, desc: 'It applauds every wound.',
  moves: [{ n: 'Curtain Call', p: 0.9, h: 2, w: 3 }, { n: 'Wail', p: 0.6, h: 1, a: 'all', e: 'ink', w: 2 }],
  drops: [['ether', 0.3]],
});
defEnemy('sentry', 'Brass Sentry', 'sentry', 7, { hp: 1.3, def: 1.4 }, {
  weak: ['volt'], scale: 2, desc: 'Guards a door that no longer exists.',
  moves: [{ n: 'Brass Slug', p: 1.1, h: 1, w: 3 }, { n: 'Rifle Volley', p: 0.55, h: 4, t: 'f', w: 2 }, { n: 'Steam Vent', p: 0.8, h: 1, a: 'all', e: 'ember', st: { id: 'burn', ch: 0.4, dur: 8 }, w: 1 }],
  drops: [['hi_tonic', 0.15], ['flare', 0.15]],
});

/* --- Era II: Verdigris --- */
defEnemy('hound', 'Patina Hound', 'hound', 10, { hp: 0.9, spd: 5 }, {
  weak: ['ember', 'gilt'], scale: 2, desc: 'Green with age, not envy.',
  moves: [{ n: 'Rend', p: 0.9, h: 2, w: 3 }, { n: 'Pounce', p: 1.5, h: 1, t: 'h', w: 2 }, { n: 'Howl', p: 0, h: 0, self: { id: 'atkup', dur: 14 }, w: 1, c: 'noatkup' }],
  drops: [['hi_tonic', 0.15]],
});
defEnemy('thornseraph', 'Thorn Seraph', 'thornseraph', 11, { hp: 1.0, mag: 1.2 }, {
  weak: ['ember'], resist: ['gilt'], scale: 2, desc: 'A hymn grown into a hedge.',
  moves: [{ n: 'Thorn Volley', p: 0.65, h: 4, t: 'f', w: 3 }, { n: 'Petal Storm', p: 0.7, h: 1, a: 'all', w: 2 }, { n: 'Bloom', p: 0, h: 0, healSelf: 0.2, w: 1, c: 'hp<60' }],
  drops: [['hi_ether', 0.15]],
});
defEnemy('golem', 'Choir Golem', 'golem', 12, { hp: 1.7, def: 1.5, spd: -3 }, {
  weak: ['volt'], resist: ['phys'], scale: 2, desc: 'A statue that remembers how to sing, and only how to sing.',
  moves: [{ n: 'Stone Fist', p: 1.5, h: 1, t: 'h', w: 3 }, { n: 'Tremor', p: 0.9, h: 1, a: 'all', w: 2 }],
  drops: [['hi_tonic', 0.25], ['panacea', 0.2]],
});
defEnemy('sporeling', 'Spore Cap', 'sporeling', 10, { hp: 0.7 }, {
  weak: ['ember'], scale: 2, desc: 'Cheerful. Contagious.',
  moves: [{ n: 'Headbutt', p: 1.0, h: 1, w: 3 }, { n: 'Spore Cloud', p: 0.4, h: 1, a: 'all', st: { id: 'poison', ch: 0.6, dur: 12 }, w: 2 }],
  drops: [['panacea', 0.3]],
});

/* --- Era III: Terminus --- */
defEnemy('glitchsprite', 'Packet Sprite', 'glitchsprite', 16, { hp: 0.7, spd: 6 }, {
  weak: ['gilt'], resist: ['volt'], scale: 2, desc: 'A fragment with no header and plenty of opinions.',
  moves: [{ n: 'Packet Loss', p: 0.65, h: 3, t: 'f', w: 3 }, { n: 'Static', p: 0.7, h: 1, a: 'all', e: 'volt', w: 2 }],
  drops: [['hi_ether', 0.2], ['coil', 0.1]],
});
defEnemy('bugknight', 'Bugged Knight', 'bugknight', 18, { hp: 1.4 }, {
  weak: ['gilt'], resist: ['volt'], scale: 2, desc: 'Half its textures failed to load. It resents this.',
  moves: [{ n: 'Null Slash', p: 1.15, h: 2, w: 3 }, { n: 'Segfault', p: 1.7, h: 1, t: 'h', w: 2 }, { n: 'Missing Texture', p: 0.5, h: 1, a: 'all', st: { id: 'corrupt', ch: 0.35, dur: 8 }, w: 1 }],
  drops: [['hi_tonic', 0.25], ['vial', 0.1]],
});
defEnemy('daemon', 'Daemon Serpent', 'daemon', 19, { hp: 1.3, spd: 2 }, {
  weak: ['gilt', 'frost'], resist: ['volt'], scale: 2, desc: 'A background process that got ideas.',
  moves: [{ n: 'Coil Crush', p: 1.3, h: 1, t: 'h', w: 2 }, { n: 'Byte Storm', p: 0.55, h: 5, t: 'f', w: 3 }, { n: 'Data Rot', p: 0.7, h: 1, a: 'all', e: 'ink', st: { id: 'corrupt', ch: 0.3, dur: 8 }, w: 1 }],
  drops: [['mega_tonic', 0.1], ['hi_ether', 0.25]],
});
defEnemy('firewall', 'Firewall Drone', 'firewall', 17, { hp: 1.1, def: 1.3 }, {
  weak: ['ink'], resist: ['ember'], scale: 2, desc: 'It does not let anything through, including you.',
  moves: [{ n: 'Burn Barrier', p: 0.8, h: 1, a: 'all', e: 'ember', st: { id: 'burn', ch: 0.4, dur: 8 }, w: 2 }, { n: 'Scorch Beam', p: 1.5, h: 1, t: 'h', e: 'ember', w: 3 }],
  drops: [['flare', 0.3]],
});

/* --- Bosses --- */
defEnemy('cosette', 'Echo of Cosette', 'cosette', 4, { hp: 11, xp: 9, gold: 12, mag: 1.4, atk: 1.3, spd: 2 }, {
  boss: true, scale: 2, bg: 'opera', bgm: 'boss', weak: ['gilt'], resist: ['ink'],
  desc: 'A soprano the world forgot. Her final aria has not ended.',
  moves: [
    { n: 'Aria of Erasure', p: 0.75, h: 3, w: 3 }, { n: 'Crescendo', p: 1.4, h: 1, t: 'h', w: 2 },
    { n: 'Silent Verse', p: 0.55, h: 1, a: 'all', e: 'ink', st: { id: 'slow', ch: 0.4, dur: 8 }, w: 2 },
    { n: 'Encore', p: 0.65, h: 5, t: 'f', w: 3, c: 'hp<55' },
    { n: 'Dies Irae', p: 1.3, h: 2, a: 'all', e: 'ink', ch: 11, w: 2, c: 'hp<50' },
  ],
  half: 'cosette_half', drops: [['c_song', 1]],
});
defEnemy('warden', 'Gilded Warden', 'warden', 8, { hp: 14, def: 1.3, xp: 8, gold: 10, spd: 3, atk: 1.4 }, {
  boss: true, scale: 2, bg: 'catacombs', bgm: 'boss', weak: ['volt'], resist: ['phys'],
  desc: 'Guardian of the First Gate. It rings once for every era it has outlived.',
  moves: [
    { n: 'Hammer Drop', p: 1.6, h: 1, t: 'h', w: 3 }, { n: 'Gear Grind', p: 0.7, h: 4, t: 'f', w: 3 },
    { n: 'Steam Burst', p: 0.9, h: 1, a: 'all', e: 'ember', st: { id: 'burn', ch: 0.5, dur: 8 }, w: 2 },
    { n: 'Toll of Ruin', p: 1.4, h: 2, a: 'all', ch: 12, w: 2, c: 'hp<60' },
  ],
  half: 'warden_half', drops: [['c_gear', 1], ['hi_tonic', 1]],
});
defEnemy('chorister', 'Chorister Marionette', 'chorister', 16, { hp: 13, mag: 1.4, atk: 1.4, xp: 8, gold: 10, spd: 3 }, {
  boss: true, scale: 2, bg: 'temple', bgm: 'boss', weak: ['ink'], resist: ['gilt'],
  desc: 'The seal-keeper of the Choir. Its strings were cut; it kept singing.',
  moves: [
    { n: 'Seraph Lance', p: 1.3, h: 2, w: 3 }, { n: 'Wing Storm', p: 0.6, h: 3, a: 'all', t: 'f', w: 3 },
    { n: 'Hymn of Rot', p: 0.6, h: 1, a: 'all', e: 'ink', st: { id: 'poison', ch: 0.8, dur: 12 }, w: 2 },
    { n: 'Tether', p: 0.9, h: 1, st: { id: 'stun', ch: 0.6, dur: 3 }, w: 2 },
    { n: 'Requiem Aeternam', p: 1.2, h: 3, a: 'all', ch: 14, w: 2, c: 'hp<65' },
  ],
  half: 'chorister_half', drops: [['c_score', 1], ['mega_tonic', 1]],
});
defEnemy('regent', 'Null Regent', 'regent', 23, { hp: 14, xp: 8, gold: 10, spd: 4, atk: 1.45, mag: 1.45 }, {
  boss: true, scale: 2, bg: 'datacore', bgm: 'boss', weak: ['gilt'], resist: ['volt'],
  desc: 'The Loom\'s own deletion daemon. It has been promoted, and it is furious.',
  moves: [
    { n: 'Delete', p: 1.6, h: 1, t: 'h', w: 3 }, { n: 'Packet Storm', p: 0.55, h: 6, t: 'f', w: 3 },
    { n: 'Overwrite', p: 0.7, h: 1, a: 'all', st: { id: 'corrupt', ch: 0.5, dur: 8 }, w: 2 },
    { n: 'Format Drive', p: 1.15, h: 3, a: 'all', ch: 14, w: 2, c: 'hp<75' },
  ],
  half: 'regent_half', drops: [['c_null', 1], ['elixir', 1]],
});
defEnemy('curator1', 'The Curator', 'curator1', 26, { hp: 15, xp: 6, gold: 20, spd: 4, atk: 1.5, mag: 1.5 }, {
  boss: true, scale: 1.5, bg: 'lacuna', bgm: 'final', weak: ['ink'], resist: ['gilt'], noEscape: true,
  desc: 'She has lived this hour nine hundred times.',
  moves: [
    { n: 'Brushstroke', p: 1.0, h: 3, w: 3 }, { n: 'Vermilion Rain', p: 0.75, h: 4, a: 'all', t: 'f', w: 3 },
    { n: 'Erase', p: 1.8, h: 1, t: 'h', st: { id: 'stun', ch: 0.5, dur: 3 }, w: 2 },
    { n: 'Varnish', p: 0, h: 0, self: { id: 'shield', dur: 10 }, w: 1, c: 'noshield' },
  ],
});
defEnemy('curator2', 'The Curator — Unframed', 'curator2', 27, { hp: 16, xp: 10, gold: 40, spd: 5, atk: 1.55, mag: 1.55 }, {
  boss: true, scale: 1.5, bg: 'lacuna', bgm: 'final', weak: ['ink', 'volt'], noEscape: true,
  desc: 'No frame. No mask. No more Hours.',
  moves: [
    { n: 'Six Strokes', p: 0.65, h: 6, t: 'f', w: 3 }, { n: 'Blank Canvas', p: 1.1, h: 2, a: 'all', w: 3 },
    { n: 'Halo Sweep', p: 1.4, h: 1, a: 'all', t: 'h', w: 2 },
    { n: 'Hour of Ruin', p: 1.25, h: 4, a: 'all', ch: 15, w: 2, c: 'hp<80' },
  ],
  drops: [],
});

/* encounter tables per map id */
const ENC = {
  aurelle: [['wisp', 'wisp']],
  catacombs: [['inkslime', 'inkslime'], ['puppet', 'moth'], ['puppet', 'puppet', 'inkslime'], ['moth', 'moth', 'inkslime'], ['sentry', 'puppet'], ['sentry', 'inkslime', 'moth']],
  opera: [['phantom', 'phantom'], ['phantom', 'wisp', 'wisp']],
  woods: [['hound', 'hound'], ['sporeling', 'sporeling', 'hound'], ['thornseraph', 'sporeling'], ['hound', 'thornseraph']],
  temple: [['golem', 'sporeling'], ['thornseraph', 'thornseraph', 'golem'], ['golem', 'hound', 'hound'], ['thornseraph', 'golem']],
  datacore: [['glitchsprite', 'glitchsprite', 'firewall'], ['bugknight', 'glitchsprite'], ['daemon', 'firewall'], ['bugknight', 'bugknight'], ['daemon', 'glitchsprite', 'glitchsprite']],
};

/* -------------------------------------------------------------------------
   Map building
   ------------------------------------------------------------------------- */
class MB {
  constructor(w, h, fill = '.') { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => Array(w).fill(fill)); }
  set(x, y, ch) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = ch; return this; }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? '#' : this.g[y][x]; }
  r(x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, ch); return this; }
  rows() { return this.g.map(r => r.join('')); }
}

function genRooms(seed, w, h, o = {}) {
  const rng = new RNG(seed), mb = new MB(w, h, '#'), rooms = [];
  const count = o.rooms || 8;
  for (let tries = 0; tries < 400 && rooms.length < count; tries++) {
    const rw = rng.int(o.minR || 6, o.maxR || 11), rh = rng.int(o.minR || 6, o.maxR || 9);
    const x = rng.int(2, w - rw - 3), y = rng.int(3, h - rh - 3);
    if (rooms.some(r => x < r.x + r.w + 3 && x + rw + 3 > r.x && y < r.y + r.h + 3 && y + rh + 3 > r.y)) continue;
    rooms.push({ x, y, w: rw, h: rh, cx: Math.floor(x + rw / 2), cy: Math.floor(y + rh / 2) });
  }
  rooms.sort((a, b) => a.cx - b.cx);
  for (const r of rooms) mb.r(r.x, r.y, r.w, r.h, '.');
  const cw = o.corr || 2;
  for (let i = 0; i < rooms.length - 1; i++) {
    const a = rooms[i], b = rooms[i + 1];
    const x0 = Math.min(a.cx, b.cx), x1 = Math.max(a.cx, b.cx), y0 = Math.min(a.cy, b.cy), y1 = Math.max(a.cy, b.cy);
    mb.r(x0, a.cy, x1 - x0 + cw, cw, ',');
    mb.r(b.cx, y0, cw, y1 - y0 + cw, ',');
  }
  // restore room interiors (corridors may have overwritten with ',' — keep both walkable)
  for (const r of rooms) {
    if (o.pillars && r.w >= 7 && r.h >= 7) {
      for (const [dx, dy] of [[1, 1], [r.w - 2, 1], [1, r.h - 2], [r.w - 2, r.h - 2]]) if (mb.get(r.x + dx, r.y + dy) === '.') mb.set(r.x + dx, r.y + dy, o.pillars);
    }
    if (o.torch) for (const dx of [2, r.w - 3]) if (mb.get(r.x + dx, r.y) === '.' && mb.get(r.x + dx, r.y - 1) === '#') mb.set(r.x + dx, r.y, o.torch);
    if (o.junk) for (let k = 0; k < 2; k++) { const jx = r.x + rng.int(0, r.w - 1), jy = r.y + rng.int(r.h - 3, r.h - 1); if (mb.get(jx, jy) === '.' && jx !== r.cx && jx !== r.cx + 1 && jy !== r.cy && jy !== r.cy + 1) mb.set(jx, jy, o.junk); }
    if (o.pit && r.w >= 8) { const px = r.x + 3, py = r.y + 3; mb.r(px, py, 2, 2, o.pit); }
  }
  return { mb, rooms, rng };
}

function genWoods(seed, w, h) {
  const rng = new RNG(seed), mb = new MB(w, h, 'T');
  let x = 3, y = h - 4;
  const carve = (cx, cy, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + 1) mb.set(cx + i, cy + j, '.'); };
  const goal = { x: w - 5, y: 4 };
  let steps = 0;
  while (steps++ < 2200 && (Math.abs(x - goal.x) > 2 || Math.abs(y - goal.y) > 2)) {
    carve(x, y, 2);
    const dx = sign(goal.x - x), dy = sign(goal.y - y);
    if (rng.chance(0.5)) x += rng.chance(0.75) ? dx : rng.int(-1, 1); else y += rng.chance(0.75) ? dy : rng.int(-1, 1);
    x = clamp(x, 3, w - 4); y = clamp(y, 3, h - 4);
  }
  carve(goal.x, goal.y, 3);
  const clearings = [];
  for (let i = 0; i < 6; i++) {
    let sx = rng.int(8, w - 9), sy = rng.int(6, h - 7);
    // attach: walk from a random open tile
    const open = []; for (let j = 3; j < h - 3; j++) for (let k = 3; k < w - 3; k++) if (mb.get(k, j) === '.') open.push([k, j]);
    [sx, sy] = rng.pick(open);
    let cx = sx, cy = sy;
    for (let s = 0; s < 22; s++) { carve(cx, cy, 1); cx = clamp(cx + rng.int(-1, 1) * 2, 4, w - 5); cy = clamp(cy + rng.int(-1, 1) * 2, 4, h - 5); }
    carve(cx, cy, 3); clearings.push({ cx, cy });
  }
  carve(4, h - 4, 3);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (mb.get(i, j) === '.' && rng.chance(0.07) && Math.abs(i - 3) + Math.abs(j - (h - 4)) > 5 && Math.abs(i - goal.x) + Math.abs(j - goal.y) > 5) mb.set(i, j, 't');
    else if (mb.get(i, j) === '.' && rng.chance(0.02)) mb.set(i, j, 'L');
  }
  return { mb, clearings, start: { x: 4, y: h - 4 }, goal, rng };
}

/* Convert a generated layout into a runtime map definition with spawn points */
function finishGen(g, o) {
  const { mb, rooms, rng } = g;
  const first = rooms[0], last = rooms[rooms.length - 1];
  const spots = [], chestSpots = [];
  rooms.forEach((r, i) => {
    if (i === 0 || i === rooms.length - 1) return;
    spots.push({ x: r.cx + 0.5, y: r.cy + 0.5, r });
    if (r.w * r.h > 40 || i % 2 === 0) chestSpots.push({ x: r.x + r.w - 2, y: r.y + r.h - 2 });
  });
  return { rows: mb.rows(), start: { x: first.cx, y: first.cy }, end: { x: last.cx, y: last.cy }, first, last, spots, chestSpots, rooms };
}

const MAPDEFS = {};
(function buildMaps() {
  /* ---------------- AURELLE (hub, Era I) ---------------- */
  {
    const m = new MB(40, 28, '.');
    m.r(0, 0, 40, 4, '#');
    for (const x of [5, 12, 30, 36]) m.set(x, 3, '+');
    m.set(21, 3, '+'); m.set(22, 3, '+');
    m.r(0, 4, 40, 2, ',');
    m.r(10, 7, 20, 13, '_');
    m.set(20, 13, 'F'); m.set(19, 13, 'F'); m.set(20, 12, 'F'); m.set(19, 12, 'F');
    for (const [x, y] of [[10, 7], [29, 7], [10, 19], [29, 19], [14, 5], [26, 5]]) m.set(x, y, 'L');
    for (let y = 7; y <= 20; y += 3) { m.set(1, y, 'T'); m.set(2, y + 1, 'T'); m.set(38, y, 'T'); m.set(37, y + 1, 'T'); }
    m.set(5, 10, 's'); m.set(5, 14, 's'); m.set(33, 10, 'S'); m.set(6, 18, 't'); m.set(7, 18, 't'); m.set(32, 17, 'b'); m.set(33, 17, 'b');
    m.r(0, 22, 40, 2, '~'); m.r(19, 22, 3, 2, ',');
    m.r(0, 24, 40, 4, '#'); m.r(14, 24, 12, 4, '_');
    m.set(14, 24, 'L'); m.set(25, 24, 'L');
    m.r(0, 0, 1, 28, '#'); m.r(39, 0, 1, 28, '#');
    MAPDEFS.aurelle = {
      name: 'Vesperine — Place des Lanternes', theme: 'aurelle', bgm: 'aurelle', bg: 'aurelle', rows: m.rows(), enc: 'aurelle',
      spawn: { x: 20.5, y: 9 }, ambient: 0.16, shop: 'aurelle', era: 1,
    };
  }
  /* ---------------- OPERA ---------------- */
  {
    const m = new MB(30, 24, '#');
    m.r(2, 4, 26, 18, '.');
    m.r(6, 4, 18, 5, '_');
    for (const x of [3, 4, 5, 24, 25, 26]) m.set(x, 4, 'D');
    m.r(14, 9, 2, 12, '=');
    for (let y = 11; y <= 19; y += 2) for (const x of [5, 6, 7, 8, 9, 10, 11, 18, 19, 20, 21, 22, 23, 24]) m.set(x, y, 'C');
    for (const [x, y] of [[3, 10], [26, 10], [3, 20], [26, 20]]) m.set(x, y, 'P');
    m.set(14, 22, '+'); m.set(15, 22, '+'); m.set(14, 3, '+'); m.set(15, 3, '+');
    m.set(7, 5, 'L'); m.set(22, 5, 'L');
    MAPDEFS.opera = {
      name: 'Opéra Vesperine', theme: 'opera', bgm: 'opera', bg: 'opera', rows: m.rows(), enc: 'opera',
      spawn: { x: 15, y: 20 }, ambient: 0.24, era: 1,
    };
  }
  /* ---------------- CATACOMBS (procedural) ---------------- */
  {
    const g = genRooms(1899, 56, 40, { rooms: 9, minR: 7, maxR: 11, corr: 2, pillars: 'P', torch: 'L', junk: 't' });
    const f = finishGen(g);
    // boss chamber: enlarge last room
    const L = f.last; const mb = g.mb;
    mb.r(L.x - 1, L.y - 1, L.w + 2, L.h + 2, '.');
    f.rows = mb.rows();
    MAPDEFS.catacombs = {
      name: 'Catacombs of the Understage', theme: 'catacomb', bgm: 'catacombs', bg: 'catacombs', rows: f.rows, enc: 'catacombs',
      spawn: { x: f.start.x + 0.5, y: f.start.y + 0.5 }, ambient: 0.5, dark: 0.48, era: 1, gen: f, boss: 'warden', chests: 4, groups: 9,
      chestItems: [['tonic', 3], ['ether', 2], ['panacea', 1], ['w_v1', 1], ['smoke', 2], ['cdx_lacuna', 1]],
    };
  }
  /* ---------------- GLADE (hub, Era II) ---------------- */
  {
    const m = new MB(36, 28, '.');
    m.r(0, 0, 36, 2, 'T'); m.r(0, 0, 2, 28, 'T'); m.r(34, 0, 2, 28, 'T'); m.r(0, 26, 36, 2, 'T');
    for (let x = 2; x < 34; x += 3) { m.set(x, 2, 'T'); m.set(x + 1, 26 - 1, 'T'); }
    m.r(16, 0, 4, 3, ',');
    m.r(4, 4, 7, 4, '#'); m.set(7, 7, '+');
    m.r(25, 4, 7, 4, '#'); m.set(28, 7, '+');
    m.r(13, 3, 10, 5, '#'); m.set(17, 7, '+'); m.set(18, 7, '+');
    m.r(17, 8, 2, 12, ','); m.r(4, 14, 28, 2, ',');
    m.r(12, 10, 12, 8, '_');
    m.set(18, 14, 'S'); m.set(12, 10, 'L'); m.set(23, 10, 'L'); m.set(12, 17, 'L'); m.set(23, 17, 'L');
    m.r(25, 18, 6, 5, '~');
    m.set(30, 12, 's'); m.set(5, 19, 'T'); m.set(9, 21, 't'); m.set(28, 25, 't');
    m.r(3, 22, 8, 3, '_'); m.set(2, 24, 'L');
    MAPDEFS.glade = {
      name: 'Oriel\'s Glade — Frame II', theme: 'verdigris', bgm: 'glade', bg: 'woods', rows: m.rows(), enc: null,
      spawn: { x: 18, y: 21 }, ambient: 0.16, shop: 'glade', era: 2,
    };
  }
  /* ---------------- WOODS (procedural) ---------------- */
  {
    const g = genWoods(400, 58, 42);
    MAPDEFS.woods = {
      name: 'The Verdigris Wood', theme: 'verdigris', bgm: 'woods', bg: 'woods', rows: g.mb.rows(), enc: 'woods',
      spawn: { x: g.start.x + 0.5, y: g.start.y + 0.5 }, ambient: 0.32, dark: 0.3, era: 2, woods: g, chests: 3, groups: 10,
      chestItems: [['hi_tonic', 2], ['hi_ether', 1], ['feather', 1], ['cdx_choir', 1], ['w_g1', 1]],
    };
  }
  /* ---------------- TEMPLE (procedural) ---------------- */
  {
    const g = genRooms(4004, 58, 40, { rooms: 9, minR: 7, maxR: 12, corr: 3, pillars: 'P', torch: 'L' });
    const f = finishGen(g); const L = f.last; g.mb.r(L.x - 2, L.y - 2, L.w + 4, L.h + 4, '.');
    f.rows = g.mb.rows();
    MAPDEFS.temple = {
      name: 'Temple of the Sunken Score', theme: 'temple', bgm: 'temple', bg: 'temple', rows: f.rows, enc: 'temple',
      spawn: { x: f.start.x + 0.5, y: f.start.y + 0.5 }, ambient: 0.32, dark: 0.35, era: 2, gen: f, boss: 'chorister', chests: 4, groups: 9,
      chestItems: [['hi_tonic', 2], ['hi_ether', 2], ['feather', 1], ['cdx_score', 1], ['c_ribbon', 1], ['panacea', 1]],
    };
  }
  /* ---------------- TERMINUS (hub, Era III) ---------------- */
  {
    const m = new MB(36, 28, '.');
    m.r(0, 0, 36, 4, '#'); m.set(17, 3, '+'); m.set(18, 3, '+');
    for (const x of [6, 10, 26, 30]) m.set(x, 3, '+');
    m.r(0, 4, 36, 2, ',');
    m.r(9, 8, 18, 12, '_');
    m.set(18, 14, 'F'); m.set(17, 14, 'F'); m.set(18, 13, 'F'); m.set(17, 13, 'F');
    for (const [x, y] of [[9, 8], [26, 8], [9, 19], [26, 19], [3, 6], [32, 6]]) m.set(x, y, 'L');
    for (let y = 8; y <= 20; y += 4) { m.set(2, y, 'T'); m.set(3, y, 'T'); m.set(32, y, 'T'); m.set(33, y, 'T'); }
    m.set(5, 12, 'S'); m.set(30, 12, 'S'); m.set(6, 17, 't'); m.set(29, 17, 't'); m.set(5, 22, 'P'); m.set(30, 22, 'P');
    m.r(0, 21, 36, 1, ','); m.r(0, 22, 36, 6, '#'); m.r(12, 22, 12, 6, '_'); m.set(12, 22, 'L'); m.set(23, 22, 'L');
    m.r(0, 0, 1, 28, '#'); m.r(35, 0, 1, 28, '#');
    MAPDEFS.terminus = {
      name: 'Terminus — Root Town', theme: 'terminus', bgm: 'terminus', bg: 'terminus', rows: m.rows(), enc: null,
      spawn: { x: 18, y: 24.5 }, ambient: 0.1, shop: 'terminus', era: 3,
    };
  }
  /* ---------------- DATACORE (procedural) ---------------- */
  {
    const g = genRooms(7331, 60, 42, { rooms: 10, minR: 7, maxR: 12, corr: 3, pillars: 'P', pit: '~' });
    const f = finishGen(g); const L = f.last; g.mb.r(L.x - 2, L.y - 2, L.w + 4, L.h + 4, '.');
    f.rows = g.mb.rows();
    MAPDEFS.datacore = {
      name: 'The Datacore', theme: 'datacore', bgm: 'datacore', bg: 'datacore', rows: f.rows, enc: 'datacore',
      spawn: { x: f.start.x + 0.5, y: f.start.y + 0.5 }, ambient: 0.35, dark: 0.35, era: 3, gen: f, boss: 'regent', chests: 5, groups: 11,
      chestItems: [['hi_tonic', 2], ['mega_tonic', 1], ['hi_ether', 2], ['feather', 2], ['cdx_loom', 1], ['coil', 2], ['vial', 1], ['a_3', 1]],
    };
  }
  /* ---------------- LACUNA (final) ---------------- */
  {
    const m = new MB(26, 22, '~');
    m.r(3, 3, 20, 16, '.');
    m.r(12, 4, 2, 15, '=');
    m.r(8, 5, 10, 4, '_');
    for (const [x, y] of [[4, 4], [21, 4], [4, 17], [21, 17]]) m.set(x, y, 'T');
    for (const [x, y] of [[8, 10], [17, 10], [8, 14], [17, 14]]) m.set(x, y, 'S');
    m.set(12, 18, ','); m.set(13, 18, ',');
    MAPDEFS.lacuna = {
      name: 'Lacuna — The Unpainted Hour', theme: 'lacuna', bgm: 'lacuna', bg: 'lacuna', rows: m.rows(), enc: null,
      spawn: { x: 13, y: 17 }, ambient: 0, era: 4, vignette: 0.25,
    };
  }
})();

/* -------------------------------------------------------------------------
   Codex (the Terminal). Discovered via flags cdx_<id>.
   ------------------------------------------------------------------------- */
const CODEX = [
  { id: 'lacuna', title: 'On the Lacuna', text: 'A Lacuna is not a hole. A hole implies something was there. Witnesses agree only on this: after it passes, they cannot say what they have lost, only that they are lighter.' },
  { id: 'halo', title: 'The Seven Halos', text: 'Seven rings were struck from the First Score. Each judges a different moment of fate. The bearer of the Judgment Halo is said to see the instant a thing can still be changed, and to be obliged to change it.' },
  { id: 'gaslight', title: 'Gaslight Ordinance, 1899', text: 'By decree of the Municipal Guild, lanterns shall burn from dusk until the Seventh Bell. Citizens found without a lantern after the Seventh Bell shall be presumed already gone.' },
  { id: 'diva', title: 'Playbill: "The Last Aria"', text: 'Cosette Verlaine, soprano. Nine performances, no encore. The playbill is blank below her name. The printer swears he set the type himself.' },
  { id: 'choir', title: 'Hymn of the First Painters', text: '"We did not make the world. We remembered it, so loudly that it stayed." — inscribed on the lintel of the Choir\'s temple.' },
  { id: 'score', title: 'The Sunken Score', text: 'A song too long for any throat. The Choir hid it beneath the temple so that no one could finish it. Whoever sings the last bar ends the piece, and the piece is us.' },
  { id: 'loom', title: 'ROOT_TOWN/README.txt', text: 'if you are reading this you are logged in. if you are logged in you are still here. if you are still here, do not go to the Datacore. (they always go to the Datacore.) —T' },
  { id: 'varnish', title: 'On Varnishing', text: 'A finished painting is sealed with varnish so that time cannot touch it. The Curator does not destroy worlds. She preserves them, forever, at the moment she loves best.' },
  { id: 'ring', title: 'Judgment', text: 'To strike true, do not aim at the enemy. Aim at the moment. The ring turns whether you are ready or not.' },
  { id: 'gaspard', title: 'Gaspard\'s Workshop Notes', text: 'Automata do not fear. That is the thing to remember when one of them stops mid-sentence. It is not being dramatic. It has simply been erased.' },
  { id: 'aura', title: 'Aura.log', text: 'she says she is not a person. i ask her why she cries then. she says it is a rendering effect. i ask her to render it again.' },
  { id: 'hour', title: 'The Vermilion Hour', text: 'The hour when the sky burns the colour of a held breath. It has come, by Terminus records, nine hundred and one times.' },
];
