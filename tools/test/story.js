// End-to-end story test: intro -> Opera -> Catacombs -> Frame II -> Temple -> Terminus -> Datacore -> Lacuna -> credits.
//   node tools/test/story.js
// End-to-end story playthrough (teleport between beats, bot handles dialogue + combat)
const { launch, OUT } = require('./harness');
(async () => {
  const { b, p, errs } = await launch();
  const snap = n => p.screenshot({ path: OUT + n + '.png' });
  const until = async (label, fn, t = 120000) => { const s = Date.now(); while (Date.now() - s < t) { if (await p.evaluate(fn)) { console.log('  ok:', label); return true; } await p.waitForTimeout(150); } console.log('  TIMEOUT:', label); const st = await p.evaluate(() => { const V = window.__vr; return { scene: V.Battle.active ? 'battle:' + V.Battle.mode : V.Game.scene === V.Field ? 'field:' + V.Field.id : 'other', dlg: V.Dlg.active, busy: V.Game.busy, flags: Object.keys(V.Game.S.flags).join(',') }; }); console.log('  state', JSON.stringify(st)); return false; };
  const setLv = lv => p.evaluate(lv => { const V = window.__vr, G = V.Game; for (const id of G.S.party) { G.S.chars[id].lv = Math.max(G.S.chars[id].lv, lv); const st = G.stats(id); G.S.chars[id].hp = st.hp; G.S.chars[id].mp = st.mp; } G.S.inv = Object.assign({ hi_tonic: 4, hi_ether: 2, feather: 2, tonic: 4 }, G.S.inv); }, lv);
  const tp = (tx, ty) => p.evaluate(([tx, ty]) => { const F = window.__vr.Field; F.player.x = tx * 16; F.player.y = ty * 16; F.pushTrail(); }, [tx, ty]);
  const warp = (id, x, y, d) => p.evaluate(async ([id, x, y, d]) => { await window.__vr.Field.warp(id, x, y, d); }, [id, x, y, d]);
  const free = () => p.evaluate(() => { const V = window.__vr; return !V.Dlg.active && !V.Battle.active && V.Game.busy === 0 && V.Game.scene === V.Field; });
  const flag = f => p.evaluate(f => !!window.__vr.Game.S.flags[f], f);

  console.log('1. new game + intro + tutorial fight');
  await p.evaluate(() => { window.__vr.Main.turbo = 3; window.__vr.Main.newGame(); });
  await until('intro_done', () => window.__vr.Game.S.flags.intro_done && !window.__vr.Dlg.active && window.__vr.Game.busy === 0, 200000);
  await snap('F1_after_intro');

  console.log('2. opera: meet Ilse');
  await setLv(3); await warp('opera', 15, 20.5, 'up'); await until('free', () => window.__vr.Game.busy === 0);
  await tp(15, 18.2); await until('ilse_joined', () => window.__vr.Game.S.flags.ilse_joined && !window.__vr.Dlg.active && window.__vr.Game.busy === 0, 60000);
  await snap('F2_ilse_joined');

  console.log('3. opera: Cosette boss');
  await setLv(5); await tp(15, 10.2);
  await until('cosette battle start', () => window.__vr.Battle.active, 30000);
  await snap('F3_cosette_start');
  await until('cosette_defeated', () => window.__vr.Game.S.flags.cosette_defeated && !window.__vr.Dlg.active && window.__vr.Game.busy === 0, 240000);
  await snap('F3_cosette_done');

  console.log('4. catacombs: Warden');
  await warp('catacombs'); await until('free', () => window.__vr.Game.busy === 0);
  await setLv(8);
  const room = await p.evaluate(() => { const g = window.__vr.Field.def.gen; return [g.last.cx, g.last.cy]; });
  await tp(room[0] + 0.5, room[1] + 1.5);
  await until('warden_defeated', () => window.__vr.Game.S.flags.warden_defeated && !window.__vr.Dlg.active && window.__vr.Game.busy === 0, 300000);
  await snap('F4_gate_open');
  console.log('   gate entity present:', await p.evaluate(() => window.__vr.Field.ents.some(e => e.kind === 'gate')));

  console.log('5. time gate -> Frame II');
  await p.evaluate(() => { const F = window.__vr.Field; const g = F.ents.find(e => e.kind === 'gate'); F.interact(g); });
  await until('arrived glade', () => window.__vr.Field.id === 'glade' && window.__vr.Game.busy === 0, 30000);
  await tp(18, 17.5);
  await until('oriel_met', () => window.__vr.Game.S.flags.oriel_met && !window.__vr.Dlg.active && window.__vr.Game.busy === 0, 90000);
  await snap('F5_oriel');

  console.log('6. woods -> temple -> Chorister');
  await warp('woods'); await until('free', () => window.__vr.Game.busy === 0);
  const goal = await p.evaluate(() => window.__vr.Field.def.woods.goal);
  await tp(goal.x + 0.5, goal.y + 0.5);
  await until('temple loaded', () => window.__vr.Field.id === 'temple' && window.__vr.Game.busy === 0, 30000);
  await setLv(16);
  const troom = await p.evaluate(() => { const g = window.__vr.Field.def.gen; return [g.last.cx, g.last.cy]; });
  await tp(troom[0] + 0.5, troom[1] + 1.5);
  await until('chorister_defeated', () => window.__vr.Game.S.flags.chorister_defeated && !window.__vr.Dlg.active && window.__vr.Game.busy === 0, 300000);
  await snap('F6_chorister_done');

  console.log('7. gate -> Terminus, meet Tally');
  await p.evaluate(() => { window.__bot.choiceLabel = 'Terminus'; const F = window.__vr.Field; const g = F.ents.find(e => e.kind === 'gate'); F.interact(g); });
  await until('arrived terminus', () => window.__vr.Field.id === 'terminus' && window.__vr.Game.busy === 0, 40000);
  await p.evaluate(() => { window.__bot.choiceLabel = null; });
  await tp(18, 18);
  await until('tally_joined', () => window.__vr.Game.S.flags.tally_joined && !window.__vr.Dlg.active && window.__vr.Game.busy === 0, 90000);
  await snap('F7_tally');

  console.log('8. datacore -> Regent');
  await warp('datacore'); await until('free', () => window.__vr.Game.busy === 0);
  await p.evaluate(() => { const G = window.__vr.Game; G.S.party = ['vesper', 'ilse', 'tally']; });
  await setLv(22);
  const droom = await p.evaluate(() => { const g = window.__vr.Field.def.gen; return [g.last.cx, g.last.cy]; });
  await tp(droom[0] + 0.5, droom[1] + 1.5);
  await until('regent_defeated', () => window.__vr.Game.S.flags.regent_defeated && !window.__vr.Dlg.active && window.__vr.Game.busy === 0, 400000);
  await snap('F8_regent_done');

  console.log('9. lacuna gate + finale');
  await p.evaluate(() => { const F = window.__vr.Field; const g = F.ents.find(e => e.kind === 'gate'); F.interact(g); });
  await until('arrived lacuna', () => window.__vr.Field.id === 'lacuna' && window.__vr.Game.busy === 0, 40000);
  await setLv(26); await tp(13, 10.6);
  await until('final battle', () => window.__vr.Battle.active, 120000);
  await snap('F9_final_start');
  await until('credits scene', () => window.__vr.Game.scene === window.__vr.Game.scene && window.__vr.Game.S.flags.ending_seen, 500000);
  await p.waitForTimeout(3000); await snap('F10_credits');
  console.log('final flags:', await p.evaluate(() => Object.keys(window.__vr.Game.S.flags).filter(k => !k.startsWith('chest_')).join(',')));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
