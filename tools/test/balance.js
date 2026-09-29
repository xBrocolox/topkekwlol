// Balance sweep: every boss / typical encounter at its expected level with a bot of adjustable skill.
//   node tools/test/balance.js [low|mid|high] [casesJSON]
// Balance harness: each boss / typical encounter at an expected level, bot skill configurable.
const { launch, OUT } = require('./harness');
const args = process.argv.slice(2);
const skillName = args[0] || 'mid';
const SK = { low: { parryRate: 0.35, ringSkill: 0.7, parryPref: 0.3, jitter: 0.1 }, mid: { parryRate: 0.65, ringSkill: 0.88, parryPref: 0.5, jitter: 0.07 }, high: { parryRate: 0.92, ringSkill: 0.97, parryPref: 0.75, jitter: 0.04 } }[skillName];
// [label, enemies, level, party, mpFrac, tonics]
const cases = JSON.parse(args[1] || require('fs').readFileSync(require('path').join(__dirname, 'cases.json'), 'utf8'));
(async () => {
  const { b, p, errs } = await launch();
  for (const c of cases) {
    const [label, foes, lv, party, items] = c;
    const res = await p.evaluate(async ([label, foes, lv, party, items, SK]) => {
      const V = window.__vr, G = V.Game, B = V.Battle;
      G.S = G.newState();
      for (const id of ['ilse', 'tally']) G.addMember(id, lv);
      for (const id of G.S.party) { G.S.chars[id].lv = lv; const st = G.stats(id); G.S.chars[id].hp = st.hp; G.S.chars[id].mp = st.mp; }
      // equip appropriate gear tier by level
      const tier = lv >= 20 ? 3 : lv >= 12 ? 2 : lv >= 6 ? 1 : 0;
      const armor = ['a_0', 'a_1', 'a_2', 'a_3'][tier];
      for (const id of G.S.party) { const c = G.S.chars[id]; c.eq.armor = armor; if (tier > 0) c.eq.weapon = 'w_' + id[0] + tier; const st = G.stats(id); c.hp = st.hp; c.mp = st.mp; }
      G.S.party = party; G.S.inv = items;
      for (const f of ['tut_done', 'ilse_joined', 'tally_joined', 'fusion']) G.setFlag(f);
      V.Battle.o = {}; V.Main.turbo = 4;
      Object.assign(window.__bot, SK, { on: true, noRetry: true, seed: Math.floor(Math.random() * 1e6) + 1, allowItems: true, techBias: true });
      const t0 = performance.now();
      let result = null;
      const opts = { noAmbush: true, bgm: 'boss', xpMul: 1 };
      const chain = foes.slice(1);
      if (foes[0] === 'curator1') opts.chain = [{ ids: ['curator2'], run: async () => {} }];
      const ids = foes[0] === 'curator1' ? ['curator1'] : foes;
      V.Field.load('aurelle').then(() => {});
      B.fight(ids, opts).then(r => { result = r; });
      const started = performance.now();
      let minF = 1, kos = 0, seenKO = new Set();
      while (result === null && B.mode !== 'over' && performance.now() - started < 400000) { await new Promise(r => setTimeout(r, 100)); for (const c of B.party) { minF = Math.min(minF, c.hp / c.maxhp); if (!c.alive && !seenKO.has(c.id)) { seenKO.add(c.id); kos++; } if (c.alive) seenKO.delete(c.id); } }
      const r = { label, lv, result: result || (B.mode === 'over' ? 'LOSE' : 'timeout'), secs: Math.round(B.t), hp: G.activeParty().map(id => Math.round(G.S.chars[id].hp / G.stats(id).hp * 100)), minHP: Math.round(minF * 100), kos };
      if (B.mode === 'over') { B.active = false; Game.scene = V.Field; }
      return r;
    }, [label, foes, lv, party, items, SK]);
    console.log(skillName, JSON.stringify(res));
    await p.evaluate(() => { const V = window.__vr; V.Battle.active = false; V.Battle.mode = 'idle'; V.Game.scene = V.Field; V.Game.busy = 0; V.Tw.clear(); });
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
