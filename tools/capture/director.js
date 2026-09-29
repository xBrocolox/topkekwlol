// "Director": an input bot that plays a boss fight the way a skilled human would, for capturing showcase footage.
// It only ever presses buttons (Input.pressed) and moves the menu cursor step by step; it never touches HP,
// gauges or damage. Timing has human-scale jitter and a few deliberate mistakes so Hard mode shows real tension.
//
// Serialised into the page by showcase.js:  page.evaluate(installDirector, opts)

function installDirector(opts) {
  const V = window.__vr, { Main, Battle: B, Game: G, Dlg, Input, SKILLS, CHARS, ITEMS } = V;
  const D = window.__dir = { seed: opts.seed || 1, plan: null, think: 0, cursorT: 0, stats: { parry: 0, dodge: 0, block: 0, hit: 0, interrupts: 0, crits: 0, rings: 0, minHP: 1, parry_: 0, techs: 0, fusions: 0, requiems: 0, heals: 0 } };
  const rnd = () => (D.seed = (D.seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 1.2;
  const press = a => { Input.pressed[a] = true; };
  const hpF = p => p.hp / p.maxhp;
  let dlgFrames = 0;

  // ---- stats hooks (observation only) ----
  const origAvoid = B.avoidFx.bind(B);
  B.avoidFx = function (e, v, kind) { D.stats[kind === 'parry' ? 'parry' : 'dodge']++; return origAvoid(e, v, kind); };
  const origInterrupt = B.interrupt.bind(B);
  B.interrupt = function (e) { const r = origInterrupt(e); if (r) D.stats.interrupts++; return r; };
  D.log = [];
  const origExec = B.execMove.bind(B);
  B.execMove = function (e, mv) { D.log.push({ t: +B.t.toFixed(1), move: mv.n, ch: !!mv.ch }); return origExec(e, mv); };
  const origDefend = B.defend.bind(B);
  B.defend = function (e, target, type, isAll) { return origDefend(e, target, type, isAll).then(r => { D.stats[r === 'parry' ? 'parry_' : r]++; D.log.push({ t: +B.t.toFixed(1), defence: r, type }); return r; }); };
  const origPerform = B.perform.bind(B);
  B.perform = function (act) {
    if (act.type === 'tech') D.stats.techs++;
    if (act.type === 'fuse') D.stats.fusions++;
    if (act.type === 'item') D.stats.heals++;
    if (act.type === 'skill' && SKILLS[act.sk].req) D.stats.requiems++;
    if (act.type === 'skill' && SKILLS[act.sk].type === 'heal') D.stats.heals++;
    return origPerform(act);
  };
  const origHitFx = B.hitFx.bind(B);
  B.hitFx = function (a, t, anim, col, crit, dmg, wk) { if (crit) D.stats.crits++; return origHitFx(a, t, anim, col, crit, dmg, wk); };

  function decide(a) {
    const foes = B.alive('e'), party = B.party.filter(p => p.alive);
    const low = party.slice().sort((x, y) => hpF(x) - hpF(y))[0];
    const charging = foes.some(f => f.charging);
    const tally = B.party.find(p => p.id === 'tally');
    const inv = G.S.inv;
    // 1. interrupt a charging boss with Tally (the signature .hack move)
    if (charging) {
      if (a.id === 'tally' && a.mp >= SKILLS.t_drain.mp) return { k: 'skill', sk: (rnd() < 0.5 && a.mp >= SKILLS.t_rootkit.mp) ? 't_rootkit' : 't_drain' };
      if (tally && tally.alive && a !== tally && B.turnQ.includes(tally)) return { k: 'switch' };
    }
    // 2. keep everyone alive
    if (hpF(low) < 0.40) {
      if (a.id === 'ilse' && a.mp >= SKILLS.i_mend.mp) return { k: 'skill', sk: 'i_mend', heal: true };
      if (a.id === 'tally' && a.mp >= SKILLS.t_patch.mp) return { k: 'skill', sk: 't_patch', heal: true };
      if (hpF(low) < 0.28 && (inv.hi_tonic || inv.tonic)) return { k: 'item', item: inv.hi_tonic ? 'hi_tonic' : 'tonic', heal: true };
    }
    // 3. Ilse gives in to the grief
    if (a.id === 'ilse' && G.flag('fusion') && a.mal >= 100 && !a.fused) return { k: 'fuse' };
    if (a.fused) return { k: 'skill', sk: hpF(low) < 0.55 ? 'i_feather' : 'i_swan' };
    // 4. Requiem
    if (a.reson >= 100) return { k: 'skill', sk: CHARS[a.id].req };
    // 5. combo techs
    const ready = B.availTechs(a).filter(({ t, mem }) => mem.every(m => m.alive && m.atb >= 100 && m.mp >= t.mp));
    if (ready.length && (rnd() < 0.85)) { ready.sort((x, y) => y.mem.length - x.mem.length || y.t.pow - x.t.pow); return { k: 'tech', id: ready[0].id }; }
    // 6. character rotation
    const pick = list => list.find(id => a.mp >= SKILLS[id].mp && (a.skills || []).concat([CHARS[a.id].attack]).includes(id));
    if (a.id === 'tally') {
      const boss = foes[0];
      if (!a.stat.haste && !party.some(p => p.stat.haste) && a.mp >= SKILLS.t_step.mp && !D.hasted) { D.hasted = true; return { k: 'skill', sk: 't_step' }; }
      if (party.some(p => hpF(p) < 0.7) && a.mp >= SKILLS.t_drain.mp) return { k: 'skill', sk: 't_drain' };
      return { k: 'skill', sk: pick(['t_overflow', 't_attack']) || 't_attack' };
    }
    if (a.id === 'ilse') return { k: 'skill', sk: pick(rnd() < 0.5 ? ['i_exorcise', 'i_hex', 'i_attack'] : ['i_hex', 'i_exorcise', 'i_attack']) || 'i_attack' };
    if (a.id === 'vesper') return { k: 'skill', sk: pick(rnd() < 0.5 ? ['v_dance', 'v_gilt', 'v_vercut', 'v_flurry', 'v_attack'] : ['v_gilt', 'v_slip', 'v_flurry', 'v_dance', 'v_attack']) || 'v_attack' };
    return { k: 'skill', sk: CHARS[a.id].attack };
  }

  // move the visible cursor like a person: one step at a time, then confirm
  function steer(m, idx) {
    if (idx < 0) return false;
    if (m.sel !== idx) { D.cursorT++; if (D.cursorT % 5 === 0) press(idx > m.sel || m.sel === m.items.length - 1 && idx === 0 ? 'down' : 'up'); return false; }
    D.cursorT++;
    if (D.cursorT % 5 < 4) return false;
    D.cursorT = 0; return true;
  }

  Main.onStep = () => {
    // dialogue: read for ~1.9 s a page
    if (Dlg.active) { dlgFrames++; if (dlgFrames > 115) { press('ok'); dlgFrames = 0; } return; } dlgFrames = 0;
    if (!B.active) return;
    for (const c of B.party) D.stats.minHP = Math.min(D.stats.minHP, hpF(c));

    // ---- Judgment Ring: aim each arc with a couple of degrees of human error ----
    if (B.ring) {
      const r = B.ring;
      if (r.endT <= 0) {
        const nextHand = r.hand + r.speed / 60;
        for (let i = 0; i < r.zones.length; i++) {
          const z = r.zones[i];
          if (z.res !== null) continue;
          if (z.aim === undefined) { z.aim = z.c + gauss() * (opts.ringSD || 2.6); if (rnd() < (opts.ringMiss || 0.03)) z.aim = 1e9; D.stats.rings++; }
          if (nextHand >= z.aim && Math.abs(nextHand - z.c) <= r.half * 0.98) { press('ok'); break; }
          break; // zones are ordered; only consider the next one
        }
      }
      return;
    }
    // ---- telegraphed attacks: parry when it is stylish, dodge the heavy ones ----
    if (B.defw) {
      const d = B.defw;
      if (d.mode === undefined) {
        const heavy = d.type === 'h';
        d.mode = heavy ? 'dodge' : (rnd() < (d.type === 'f' ? 0.6 : 0.74) ? 'parry' : 'dodge');
        d.aimOff = d.mode === 'parry' ? -0.03 + gauss() * 0.018 : -0.075 + gauss() * 0.03;
        if (rnd() < (opts.mistake || 0.12)) { d.aimOff = 0.11; d.mode = 'late'; } // a slip: takes the hit
      }
      const off = d.t + 1 / 60 - d.T;
      if (!d.press && off >= d.aimOff && off < d.aimOff + 0.05) press(d.mode === 'dodge' ? 'cancel' : 'ok');
      return;
    }
    // ---- command menus ----
    if (B.mode === 'cmd' && B.cmd) {
      const c = B.cmd, m = c.menu;
      if (c.stage === 'main') {
        if (D.plan && D.plan.actor !== c.a) D.plan = null;
        if (!D.plan) { D.think = D.think || Math.round(28 + rnd() * 32); if (--D.think > 0) return; D.think = 0; D.plan = decide(c.a); D.plan.actor = c.a; D.cursorT = 0; }
        const p = D.plan;
        if (p.k === 'switch') { press('r'); D.plan = null; return; }
        let idx = -1;
        if (p.k === 'fuse') idx = m.items.findIndex(it => it.k === 'fuse');
        else if (p.k === 'skill') { idx = m.items.findIndex(it => it.k === 'skill' && it.sk === p.sk); if (idx < 0) idx = m.items.findIndex(it => it.k === 'skills'); }
        else if (p.k === 'tech') idx = m.items.findIndex(it => it.k === 'techs');
        else if (p.k === 'item') idx = m.items.findIndex(it => it.k === 'items');
        if (idx < 0) { D.plan = { k: 'skill', sk: CHARS[c.a.id].attack }; idx = 0; }
        if (steer(m, idx)) press('ok');
        return;
      }
      const p = D.plan || { k: 'skill', sk: CHARS[c.a.id].attack };
      let idx = -1;
      if (c.stage === 'skills') idx = m.items.findIndex(it => it.sk === p.sk && !it.disabled);
      if (c.stage === 'techs') idx = m.items.findIndex(it => it.tech === p.id && !it.disabled);
      if (c.stage === 'items') idx = m.items.findIndex(it => it.item === p.item);
      if (idx < 0) { D.plan = null; press('cancel'); return; }
      if (steer(m, idx)) press('ok');
      return;
    }
    if (B.mode === 'target' && B.tsel) {
      const t = B.tsel, p = D.plan || {};
      if (t.side === 'p' && p.heal) { let bi = 0, bf = 9; t.list.forEach((c, i) => { const f = hpF(c); if (f < bf) { bf = f; bi = i; } }); t.idx = bi; }
      D.cursorT++;
      if (D.cursorT > 10) { D.cursorT = 0; D.plan = null; press('ok'); }
      return;
    }
    if (B.mode === 'idle' && !B.cmd && !B.busy) D.plan = null; // 'all' / 'self' actions have no target step
  };
  return true;
}

module.exports = { installDirector };
