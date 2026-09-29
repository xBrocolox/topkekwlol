// Records a boss fight as a share-ready MP4 (1920x1080, 60 fps, H.264 + AAC).
//
//   node tools/capture/showcase.js [--boss regent] [--level 21] [--seed 1] [--out out.mp4] [--preview 8]
//
// How it works: the live loop is paused and the game is stepped one 1/60 s frame at a time (Main.captureStep), so
// the footage is deterministic and never drops frames. Each canvas frame is piped to ffmpeg as PNG. Every sound
// event is recorded with its frame time, then the soundtrack is re-rendered offline (OfflineAudioContext) and muxed in.
//
// Needs: playwright (npm i -D playwright), an ffmpeg with libx264 (FFMPEG=/path/to/ffmpeg), and optionally the
// game's fonts (FONTS_DIR=.../node_modules/@fontsource) so text renders like the real game instead of a fallback serif.

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const { installDirector } = require('./director');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..', '..');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FONTS = process.env.FONTS_DIR || '';
const BOSS = arg('boss', 'regent'), LEVEL = +arg('level', 21), SEED = +arg('seed', 1);
const OUT = path.resolve(arg('out', path.join(__dirname, 'out', 'vermilion-requiem-hard-mode.mp4')));
const PREVIEW = +arg('preview', 0);          // capture only the first N seconds (pipeline test)
const W = 1920, H = 1080, FPS = 60, TITLE_SECS = 2.6, RESULT_HOLD = 3.4, END_SECS = 3.8, MAX_SECS = 150;
const TMP = path.join(path.dirname(OUT), '.tmp'); fs.mkdirSync(TMP, { recursive: true });

const BOSS_INFO = { regent: { name: 'NULL REGENT', bg: 'datacore', map: 'datacore' }, warden: { name: 'GILDED WARDEN', bg: 'catacombs', map: 'catacombs' }, chorister: { name: 'CHORISTER MARIONETTE', bg: 'temple', map: 'temple' }, curator1: { name: 'THE CURATOR', bg: 'lacuna', map: 'lacuna' } }[BOSS];

(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|net::|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.__vr && window.__vr.Game.scene, null, { timeout: 20000 });
  if (FONTS) {
    const face = (fam, w, f) => `@font-face{font-family:"${fam}";font-weight:${w};src:url("file://${path.join(FONTS, f)}") format("woff2")}`;
    await page.addStyleTag({ content: [face('Cinzel', 500, 'cinzel/files/cinzel-latin-500-normal.woff2'), face('Cinzel', 700, 'cinzel/files/cinzel-latin-700-normal.woff2'), face('Cinzel', 900, 'cinzel/files/cinzel-latin-900-normal.woff2'),
      face('Cormorant Garamond', 500, 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2'), face('Cormorant Garamond', 700, 'cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff2'),
      face('Share Tech Mono', 400, 'share-tech-mono/files/share-tech-mono-latin-400-normal.woff2')].join('\n') });
    await page.evaluate(() => Promise.all(['500 12px Cinzel', '700 12px Cinzel', '900 12px Cinzel', '500 12px "Cormorant Garamond"', '700 12px "Cormorant Garamond"', '400 12px "Share Tech Mono"'].map(f => document.fonts.load(f))));
  }

  // ---- scenario: Hard difficulty, an even-handed late-game party, no assist ----
  await page.evaluate(async ([boss, level, info]) => {
    const V = window.__vr, G = V.Game, M = V.Main;
    M.paused = true;
    G.settings.diff = 2; G.settings.assist = false; G.settings.autoRing = false; G.settings.atb = 'wait'; G.settings.textSpeed = 55;
    G.S = G.newState();
    for (const id of ['ilse', 'tally']) G.addMember(id, level);
    const tier = level >= 20 ? 3 : level >= 12 ? 2 : 1;
    for (const id of G.S.party) {
      const c = G.S.chars[id]; c.lv = level; c.eq.armor = ['a_0', 'a_1', 'a_2', 'a_3'][tier];
      if (tier > 0) c.eq.weapon = 'w_' + id[0] + tier;
      const st = G.stats(id); c.hp = st.hp; c.mp = st.mp;
    }
    G.S.chars.ilse.mal = 62;                       // Fusion becomes available mid-fight
    for (const f of ['tut_done', 'ilse_joined', 'tally_joined', 'fusion', 'oriel_met']) G.setFlag(f);
    G.S.party = ['vesper', 'ilse', 'tally', 'gaspard'];
    G.S.inv = { hi_tonic: 3, hi_ether: 2, feather: 1 };
    await V.Field.load(info.map); G.setScene(V.Field); G.busy = 0; V.Gfx.fade = 0; V.Tw.clear();
    V.Snd.rec = []; V.Snd.recT = 0; M.capT = 0;
  }, [BOSS, LEVEL, BOSS_INFO]);
  await page.evaluate(installDirector, { seed: SEED, ringSD: 2.6, ringMiss: 0.03, mistake: 0.06 });

  // ---- overlay: title card, HARD badge, end card ----
  await page.evaluate(([info, level, TITLE_SECS]) => {
    const V = window.__vr; window.__endAt = null;
    V.Snd.play('title');
    V.Main.overlay = (u, t) => {
      const U_ = u, gold = '#e8c868';
      const cardText = (a) => {
        U_.save(); U_.globalAlpha = a; U_.textAlign = 'center';
        const g = U_.createLinearGradient(0, 84, 0, 118); g.addColorStop(0, '#fff2c8'); g.addColorStop(0.5, '#e8c868'); g.addColorStop(1, '#a8781f');
        U_.font = '900 40px Cinzel, serif'; U_.fillStyle = 'rgba(20,4,10,0.9)'; U_.fillText('VERMILION', 241.5, 116); U_.fillStyle = g; U_.fillText('VERMILION', 240, 114);
        U_.font = '700 25px Cinzel, serif'; U_.fillStyle = '#c8283e'; U_.fillText('R  E  Q  U  I  E  M', 240, 146);
        U_.font = '500 11px "Cormorant Garamond", serif'; U_.fillStyle = '#d8c8e8'; U_.fillText(`HARD MODE   ·   ${info.name}   ·   PARTY LEVEL ${level}`, 240, 176);
        U_.restore();
      };
      // opening card
      if (t < TITLE_SECS + 0.7) {
        const a = t < TITLE_SECS ? 1 : 1 - (t - TITLE_SECS) / 0.7;
        U_.save(); U_.globalAlpha = a; U_.fillStyle = '#000'; U_.fillRect(0, 0, 480, 270); U_.restore();
        cardText(t < 0.6 ? t / 0.6 : t < TITLE_SECS - 0.4 ? 1 : Math.max(0, (TITLE_SECS + 0.3 - t) / 0.7));
      }
      // HARD badge (only while a fight is on screen)
      if (V.Battle.active && t > TITLE_SECS && window.__endAt === null) {
        U_.save(); U_.globalAlpha = 0.85; U_.fillStyle = 'rgba(120,10,30,0.85)'; U_.fillRect(8, 8, 62, 15); U_.strokeStyle = '#e8c868'; U_.lineWidth = 0.7; U_.strokeRect(8.4, 8.4, 61.2, 14.2);
        U_.font = '700 8.5px Cinzel, serif'; U_.textAlign = 'center'; U_.fillStyle = '#ffe9c8'; U_.fillText('HARD MODE', 39, 18.6); U_.restore();
      }
      // end card
      if (window.__endAt !== null) {
        const e = t - window.__endAt, a = Math.min(1, e / 0.9);
        U_.save(); U_.globalAlpha = a; U_.fillStyle = '#05020c'; U_.fillRect(0, 0, 480, 270); U_.restore();
        if (e > 0.5) {
          const b = Math.min(1, (e - 0.5) / 0.7);
          U_.save(); U_.globalAlpha = b; U_.textAlign = 'center';
          const g = U_.createLinearGradient(0, 70, 0, 100); g.addColorStop(0, '#fff2c8'); g.addColorStop(0.5, '#e8c868'); g.addColorStop(1, '#a8781f');
          U_.font = '900 34px Cinzel, serif'; U_.fillStyle = g; U_.fillText('VERMILION REQUIEM', 240, 106);
          U_.font = '500 13px "Cormorant Garamond", serif'; U_.fillStyle = '#e8d8c8'; U_.fillText('a JRPG in four frames', 240, 128);
          U_.font = '700 9px Cinzel, serif'; U_.fillStyle = '#ff6a7e'; U_.fillText('JUDGMENT RINGS   ·   TELEGRAPHED PARRIES   ·   DUAL & TRIPLE TECHS   ·   DATA DRAIN', 240, 158);
          U_.font = '500 10.5px "Cormorant Garamond", serif'; U_.fillStyle = '#b8a8c8'; U_.fillText('every sprite, tile and note is generated in your browser', 240, 182);
          U_.restore();
        }
      }
    };
  }, [BOSS_INFO, LEVEL, TITLE_SECS]);

  // ---- ffmpeg video pipe ----
  const silent = path.join(TMP, 'video_silent.mp4');
  const ff = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise(r => ff.on('close', r));

  let fought = false, resultAt = null, endStarted = false, endAt = null, frames = 0, outcome = 'unknown';
  const t0 = Date.now(); let last = t0;
  for (;;) {
    const st = await page.evaluate(([boss, info, TITLE_SECS]) => {
      const V = window.__vr, M = V.Main, B = V.Battle;
      if (M.capT >= TITLE_SECS - 0.2 && !window.__fought) { window.__fought = true; B.fight([boss], { noAmbush: true, bg: info.bg, bgm: 'boss', xpMul: 1 }); }
      M.captureStep();
      const c = document.getElementById('game');
      return { url: c.toDataURL('image/png'), t: M.capT, mode: B.active ? B.mode : 'off', hp: B.foes && B.foes[0] ? B.foes[0].hp / B.foes[0].maxhp : 1 };
    }, [BOSS, BOSS_INFO, TITLE_SECS]);
    const buf = Buffer.from(st.url.slice(st.url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    frames++;
    if (st.mode === 'over') { outcome = 'lost'; break; }
    if (st.mode === 'result' && resultAt === null) resultAt = st.t;
    if (resultAt !== null && !endStarted && st.t - resultAt >= RESULT_HOLD) { endStarted = true; endAt = st.t; await page.evaluate(t => { window.__endAt = t; }, st.t); }
    if (endStarted && st.t - endAt >= END_SECS) { outcome = 'won'; break; }
    if (PREVIEW && st.t >= PREVIEW) { outcome = 'preview'; break; }
    if (st.t > MAX_SECS) { outcome = 'too long'; break; }
    if (Date.now() - last > 15000) { last = Date.now(); console.log(`  t=${st.t.toFixed(1)}s  frames=${frames}  mode=${st.mode}  boss=${(st.hp * 100).toFixed(0)}%  (${((Date.now() - t0) / 1000).toFixed(0)}s elapsed)`); }
  }
  ff.stdin.end(); await ffDone;
  const stats = await page.evaluate(() => ({ dir: window.__dir.stats, parries: window.__vr.Game.S.parries, t: window.__vr.Main.capT, diff: window.__vr.Game.settings.diff }));
  console.log('outcome:', outcome, JSON.stringify(stats));
  if (outcome === 'lost' || outcome === 'too long') { console.log(errs.join('\n') || 'no page errors'); await browser.close(); process.exit(2); }

  // ---- soundtrack: re-render the recorded events offline and mux ----
  const dur = frames / FPS;
  const events = await page.evaluate(() => { const r = window.__vr.Snd.rec; window.__vr.Snd.rec = null; return r; });
  console.log(`rendering audio: ${events.length} events over ${dur.toFixed(1)}s`);
  const b64 = await page.evaluate(([ev, d]) => window.__vr.Snd.renderTimeline(ev, d), [events, dur]);
  const pcm = path.join(TMP, 'audio.pcm'); fs.writeFileSync(pcm, Buffer.from(b64, 'base64'));
  console.log(errs.join('\n') || 'no page errors');
  await browser.close();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const af = `loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.8,afade=t=out:st=${(dur - 1.6).toFixed(2)}:d=1.6`;
  await new Promise((res, rej) => spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-f', 's16le', '-ar', '44100', '-ac', '2', '-i', pcm,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', '-af', af, '-shortest', '-movflags', '+faststart', OUT], { stdio: 'inherit' }).on('close', c => c ? rej(new Error('mux failed ' + c)) : res()));
  console.log('wrote', OUT, (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB', dur.toFixed(1) + 's');
})().catch(e => { console.error(e); process.exit(1); });
