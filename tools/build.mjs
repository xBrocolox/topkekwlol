// Bundles the game into ONE self-contained HTML file (all scripts inlined) for sharing / hosting.
//   node tools/build.mjs            -> dist/vermilion-requiem.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let html = readFileSync(join(root, 'index.html'), 'utf8');
const start = html.indexOf('<!-- SRC:START -->'), end = html.indexOf('<!-- SRC:END -->');
if (start < 0 || end < 0) throw new Error('SRC markers missing in index.html');
const block = html.slice(start, end);
const files = [...block.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const js = files.map(f => `/* ---- ${f} ---- */\n` + readFileSync(join(root, f), 'utf8')).join('\n');
if (js.includes('</script')) throw new Error('found </script inside sources');
html = html.slice(0, start) + `<script>\n${js}\n</script>\n` + html.slice(end + '<!-- SRC:END -->'.length);
// external asset manifest is intentionally empty in the single-file build
html = html.replace(/<script src="assets\/ai\/manifest\.js"><\/script>\n?/, '<script>window.VR_ASSETS=[];</script>\n');
mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', 'vermilion-requiem.html');
writeFileSync(out, html);
console.log(`built ${out}  (${(html.length / 1024).toFixed(0)} KiB, ${files.length} scripts)`);

// --artifact: a head/body-less fragment for hosts that supply their own document skeleton
if (process.argv.includes('--artifact')) {
  const grab = (re) => { const m = html.match(re); if (!m) throw new Error('missing ' + re); return m[0]; };
  const title = grab(/<title>[\s\S]*?<\/title>/);
  const links = (html.match(/<link [^>]*fonts\.googleapis\.com[^>]*>/g) || []).join('\n');
  let style = grab(/<style>[\s\S]*?<\/style>/);
  style = style.replace('</style>', `
  :root { --bg: #07030f; --ink: #f4ecda; --gold: #e8c868; --red: #c8283e; color-scheme: dark; }
  html, body { height: 100%; }
  body { background: var(--bg); color: var(--ink); box-sizing: border-box; padding-inline: 16px; }
  #game:focus { outline: none; }
</style>`);
  const bodyInner = grab(/<body>[\s\S]*<\/body>/).replace(/^<body>/, '').replace(/<\/body>$/, '');
  const frag = `${title}\n${links}\n${style}\n<script>window.VR_ARTIFACT = true; window.VR_GUTTER = 16;</script>\n${bodyInner.trim()}\n`;
  const outA = join(root, 'dist', 'artifact.html');
  writeFileSync(outA, frag);
  console.log(`built ${outA}  (${(frag.length / 1024).toFixed(0)} KiB, fragment)`);
}
