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
