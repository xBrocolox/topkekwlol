// Playwright harness for Vermilion Requiem: loads the game, installs an input bot that plays dialogue,
// menus, Judgment Rings and defence windows. Needs:  npm i -D playwright  (or a global install + NODE_PATH)
// Shared Playwright harness: loads the game, installs an input bot, exposes helpers.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out') + path.sep;
fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.GAME_URL || 'file://' + path.join(ROOT, 'index.html');
async function launch(opts = {}) {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--disable-web-security'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|net::|Failed to load resource/.test(m.text())) errs.push('[console.error] ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await p.goto(URL);
  await p.waitForFunction(() => window.__vr && window.__vr.Game.scene, null, { timeout: 15000 });
  await p.evaluate(() => {
    const V = window.__vr;
    const bot = window.__bot = { on: true, t: 0, parryRate: 0.6, parryPref: 0.5, jitter: 0.06, ringSkill: 0.9, log: [], seed: 1 };
    const rnd = () => (bot.seed = (bot.seed * 16807) % 2147483647) / 2147483647;
    const press = a => { V.Input.pressed[a] = true; };
    V.Main.onStep = () => {
      if (!bot.on) return;
      const { Game, Battle: B, Dlg, Menu, SKILLS, ITEMS } = V;
      if (Dlg.active) { if ((bot.t++ % 2) === 0) press('ok'); return; }
      if (B.active) {
        if (B.ring) { const r = B.ring; if (r.endT <= 0) for (let i = 0; i < r.zones.length; i++) { const z = r.zones[i]; if (z.res === null && Math.abs(r.hand - z.c) < r.half * 0.5 && rnd() < bot.ringSkill) { press('ok'); break; } } return; }
        if (B.defw) { const d = B.defw; if (d.botTry === undefined) { d.botTry = rnd() < bot.parryRate; d.botKind = d.type === 'h' ? 'cancel' : (rnd() < bot.parryPref ? 'ok' : 'cancel'); d.botOff = (rnd() - 0.5) * 2 * (bot.jitter || 0.05); } if (d.botTry && !d.press && d.t >= d.T + d.botOff - 0.008 && d.t < d.T + d.botOff + 0.02) { press(d.botKind); } return; }
        if (B.mode === 'cmd' && B.cmd) {
          if (bot.skipItems > 0) bot.skipItems--;
          const m = B.cmd.menu; const cands = m.items.map((it, i) => [it, i]).filter(([it]) => !it.disabled && it.k !== 'flee' && it.k !== 'guard' && ((bot.allowItems && !(bot.skipItems > 0)) || it.k !== 'items'));
          const lowest = B.party.filter(c => c.alive).reduce((m, c) => Math.min(m, c.hp / c.maxhp), 1);
          const healSk = B.cmd.a.skills.find(id => SKILLS[id].type === 'heal' && B.cmd.a.mp >= SKILLS[id].mp);
          const charging = B.foes.some(f => f.alive && f.charging); const intr = B.cmd.a.skills.find(id => SKILLS[id].interrupt && B.cmd.a.mp >= SKILLS[id].mp);
          if (charging && intr && B.cmd.stage === 'main') { const sk = m.items.findIndex(it => it.k === 'skills'); m.sel = sk; press('ok'); bot.wantHeal = intr; return; }
          if (lowest < 0.45 && B.cmd.stage === 'main' && healSk) { const sk = m.items.findIndex(it => it.k === 'skills'); m.sel = sk; press('ok'); bot.wantHeal = healSk; return; }
          if (B.cmd.stage === 'skills' && bot.wantHeal) { const i = m.items.findIndex(it => it.sk === bot.wantHeal); bot.wantHeal = null; if (i >= 0) { m.sel = i; press('ok'); return; } }
          const hasItems = Object.keys(Game.S.inv).some(id => ITEMS[id] && ['hp', 'revive'].includes(ITEMS[id].use));
          if (lowest < 0.35 && B.cmd.stage === 'main' && hasItems && !healSk) { const ii = m.items.findIndex(it => it.k === 'items'); m.sel = ii; press('ok'); bot.wantItem = true; return; }
          if (B.cmd.stage === 'items' && bot.wantItem) { bot.wantItem = false; const i = m.items.findIndex(it => it.item && ['tonic','hi_tonic','mega_tonic','feather'].includes(it.item)); if (i >= 0) { m.sel = i; press('ok'); return; } }
          if (B.cmd.stage === 'main') { // prefer requiem, techs, skills, attack
            const pri = ['skill', 'techs', 'skills'];
            const req = cands.find(([it]) => it.label === 'REQUIEM'); const fuse = cands.find(([it]) => it.k === 'fuse');
            const techOk = B.availTechs(B.cmd.a).some(({ t, mem }) => mem.every(mm => mm.alive && mm.atb >= 100 && mm.mp >= t.mp));
            const pick = req || fuse || (bot.techBias && techOk && cands.find(([it]) => it.k === 'techs')) || cands.filter(([it]) => it.k !== 'techs' || techOk)[Math.floor(rnd() * cands.filter(([it]) => it.k !== 'techs' || techOk).length)];
            m.sel = pick[1]; m.clampTop();
          } else {
            let pool = cands;
            if (B.cmd.stage === 'items') {
              const anyDead = B.party.some(c => !c.alive), anyHurt = B.party.some(c => c.alive && c.hp / c.maxhp < 0.6), anyLowMp = B.party.some(c => c.alive && c.mp / c.maxmp < 0.4);
              pool = cands.filter(([it]) => { const u = ITEMS[it.item] && ITEMS[it.item].use; return (u === 'revive' && anyDead) || (u === 'hp' && anyHurt) || (u === 'mp' && anyLowMp) || u === 'dmgall' || u === 'dmg'; });
            }
            const c2 = pool.length ? pool[Math.floor(rnd() * pool.length)] : null;
            if (c2) { m.sel = c2[1]; m.clampTop(); } else { press('cancel'); bot.skipItems = 20; return; }
          }
          press('ok'); return;
        }
        if (B.mode === 'target') {
          const t = B.tsel; const a = t.action;
          const isHeal = (a.type === 'skill' && SKILLS[a.sk].type === 'heal') || (a.type === 'item' && ITEMS[a.item] && ['hp','mp','revive','full','cleanse'].includes(ITEMS[a.item].use));
          if (isHeal && t.side === 'p') { let bi = 0, bf = 9; t.list.forEach((c, i) => { const f = c.hp / c.maxhp; if (f < bf) { bf = f; bi = i; } }); t.idx = bi; }
          press('ok'); return;
        }
        if (B.mode === 'result' || B.mode === 'over') { if (B.mode === 'over' && bot.noRetry) return; press('ok'); return; }
      }
    };
  });
  return { b, p, errs, OUT };
}
module.exports = { launch, OUT };
