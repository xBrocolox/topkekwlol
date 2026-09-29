'use strict';
/* ==========================================================================
   VERMILION REQUIEM — art_world.js
   Procedural tilesets (7 themes), tall props, and battle/title backdrops.
   ========================================================================== */

/* ---------- ground patterns (16x16, no outline) ---------- */
const TP = {
  cobble(g, base, light, dark, seed) {
    const r = new RNG(seed); g.r(0, 0, 16, 16, dark);
    let y = 0;
    while (y < 16) {
      const h = r.int(4, 6); let x = -r.int(0, 4);
      while (x < 16) {
        const w = r.int(5, 8), x0 = Math.max(x + 1, 0), ww = Math.min(x + w - 1, 16) - x0;
        if (ww > 0) { const col = mixc(base, light, r.next() * 0.7); g.r(x0, y + 1, ww, Math.min(h - 1, 16 - y - 1), col); g.r(x0, y + 1, ww, 1, mixc(col, light, 0.35)); }
        x += w;
      }
      y += h;
    }
  },
  flags(g, base, joint, seed) {
    const r = new RNG(seed); g.r(0, 0, 16, 16, joint);
    for (const [x, y] of [[0, 0], [8, 0], [0, 8], [8, 8]]) { const c = mixc(base, '#ffffff', r.next() * 0.1); g.r(x + 1, y + 1, 7, 7, c); g.r(x + 1, y + 1, 7, 1, shadeC(c, 0.15)); g.r(x + 1, y + 1, 1, 7, shadeC(c, 0.08)); }
    if (r.chance(0.4)) g.p(r.int(2, 13), r.int(2, 13), shadeC(base, -0.15));
  },
  bricks(g, base, mortar, hi, seed) {
    const r = new RNG(seed); g.r(0, 0, 16, 16, mortar);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 4 : 0;
      for (let x = -off; x < 16; x += 8) {
        const c = mixc(base, hi, r.next() * 0.5), x0 = Math.max(x + 1, 0), ww = Math.min(x + 8, 16) - x0 - 1;
        if (ww > 0) { g.r(x0, row * 4, ww, 3, c); g.r(x0, row * 4, ww, 1, shadeC(c, 0.18)); }
      }
    }
  },
  planks(g, base, dark, seed) {
    const r = new RNG(seed);
    for (let y = 0; y < 16; y += 4) { const c = mixc(base, '#ffffff', r.next() * 0.08); g.r(0, y, 16, 3, c); g.r(0, y + 3, 16, 1, dark); g.r(0, y, 16, 1, shadeC(c, 0.12)); const sx = r.int(2, 13); g.r(sx, y, 1, 4, dark); }
  },
  grass(g, base, tuft, seed) {
    const r = new RNG(seed); g.r(0, 0, 16, 16, base);
    for (let i = 0; i < 14; i++) { const x = r.int(0, 15), y = r.int(0, 14); const c = r.chance(0.5) ? shadeC(base, 0.14) : shadeC(base, -0.14); g.p(x, y, c); if (r.chance(0.5)) g.p(x, y + 1, c); }
    for (let i = 0; i < 3; i++) { const x = r.int(1, 14), y = r.int(2, 14); g.p(x, y, tuft); g.p(x - 1, y - 1, tuft); g.p(x + 1, y - 1, tuft); }
  },
  grid(g, base, line, seed) {
    const r = new RNG(seed); g.r(0, 0, 16, 16, base);
    g.r(0, 0, 16, 1, line); g.r(0, 0, 1, 16, line); g.r(0, 8, 16, 1, rgba(line, 0.4) && shadeC(base, 0.06)); g.r(8, 0, 1, 16, shadeC(base, 0.06));
    g.p(0, 0, '#ffffff'); if (r.chance(0.25)) g.r(r.int(2, 12), r.int(2, 12), 3, 1, line);
  },
  checker(g, a, b, s = 8) { for (let y = 0; y < 16; y += s) for (let x = 0; x < 16; x += s) g.r(x, y, s, s, ((x + y) / s) & 1 ? b : a); },
  marble(g, base, vein, seed) {
    const r = new RNG(seed); g.r(0, 0, 16, 16, base); g.r(0, 15, 16, 1, shadeC(base, -0.1)); g.r(15, 0, 1, 16, shadeC(base, -0.1)); g.r(0, 0, 16, 1, shadeC(base, 0.1));
    let x = r.int(0, 15); for (let y = 0; y < 16; y++) { g.p(x, y, vein); x = clamp(x + r.int(-1, 1), 0, 15); }
  },
  water(g, a, b, f, seed) {
    g.r(0, 0, 16, 16, a);
    for (let y = 0; y < 16; y += 4) { const off = (y * 3 + f * 4) % 16; g.r(off % 16, y + 1, 5, 1, b); g.r((off + 9) % 16, y + 3, 3, 1, shadeC(b, -0.2)); }
  },
  roof(g, a, b) {
    g.r(0, 0, 16, 16, a);
    for (let row = 0; row < 4; row++) for (let x = (row % 2) * 4 - 4; x < 16; x += 8) { g.r(Math.max(x, 0), row * 4 + 3, Math.min(8, 16 - Math.max(x, 0)), 1, shadeC(a, -0.3)); g.r(Math.max(x + 1, 0), row * 4, 3, 1, b); }
  },
  carpet(g, base, border) { g.r(0, 0, 16, 16, base); g.r(0, 0, 2, 16, border); g.r(14, 0, 2, 16, border); g.r(2, 0, 1, 16, shadeC(base, -0.2)); g.r(13, 0, 1, 16, shadeC(base, -0.2)); g.p(8, 8, border); g.p(8, 4, shadeC(base, 0.15)); g.p(8, 12, shadeC(base, 0.15)); },
  blank(g, base, line, seed) { const r = new RNG(seed); g.r(0, 0, 16, 16, base); for (let i = 0; i < 3; i++) { const x = r.int(0, 15), y = r.int(0, 15); g.r(x, y, r.int(3, 8), 1, line); } if (r.chance(0.15)) { g.r(r.int(0, 13), r.int(0, 13), 3, 2, '#c8283e'); } },
};

/* ---------- tall props (16x32, pad 1) ---------- */
const PROPS = {
  tree_autumn(g) { g.r(7, 22, 3, 10, '#4a3024'); g.ell(8, 14, 8, 10, '#b8402a'); g.ell(5, 16, 5, 6, '#d8703a'); g.ell(11, 12, 5, 5, '#e89a4a'); g.ell(6, 9, 3, 3, '#f0b860'); g.p(2, 24, '#d8703a'); g.p(13, 27, '#e89a4a'); },
  tree_green(g) { g.r(6, 22, 4, 10, '#3a2a20'); g.ell(8, 12, 8, 11, '#1b4d3e'); g.ell(6, 10, 5, 6, '#2a6e58'); g.ell(11, 15, 5, 6, '#245e4c'); g.p(5, 8, '#e6cf8a'); g.p(10, 12, '#e6cf8a'); g.p(7, 17, '#e6cf8a'); g.r(4, 22, 2, 3, '#1b4d3e'); },
  tree_dead(g) { g.r(7, 12, 3, 20, '#3a2c30'); g.line(8, 16, 2, 8, '#3a2c30', 2); g.line(8, 14, 14, 6, '#3a2c30', 2); g.line(8, 20, 13, 14, '#3a2c30'); g.line(3, 9, 1, 4, '#3a2c30'); },
  gaslamp(g) { g.r(7, 9, 2, 21, '#2a2a3a'); g.r(5, 28, 6, 3, '#3a3a4a'); g.r(4, 2, 8, 8, '#2a2a3a'); g.r(5, 3, 6, 6, '#f6d878'); g.r(7, 4, 2, 4, '#fff6c8'); g.poly([[3, 3], [8, -1], [13, 3]], '#2a2a3a'); g.r(6, 13, 4, 1, '#4a4a5a'); },
  statue_angel(g) { g.r(3, 24, 10, 7, '#8a8a9a'); g.r(2, 29, 12, 2, '#6a6a7a'); g.poly([[8, 12], [1, 5], [3, 20]], '#e8e8f0'); g.poly([[8, 12], [15, 5], [13, 20]], '#e8e8f0'); g.r(6, 11, 4, 14, '#dcdce6'); g.ell(8, 8, 3, 3, '#f0f0f6'); g.r(6, 16, 4, 1, '#b8b8c8'); g.p(8, 4, '#e6cf8a'); },
  pillar_marble(g) { g.r(3, 2, 10, 4, '#f0f0f6'); g.r(4, 6, 8, 22, '#dcdce6'); g.r(3, 27, 10, 4, '#c8c8d4'); for (const x of [6, 9]) g.r(x, 6, 1, 22, '#b8b8c8'); g.r(4, 6, 1, 22, '#f4f4fa'); },
  pillar_gold(g) { g.r(3, 2, 10, 4, '#f0d078'); g.r(4, 6, 8, 22, '#c8963a'); g.r(3, 27, 10, 4, '#8a6420'); for (const x of [6, 9]) g.r(x, 6, 1, 22, '#8a6420'); g.r(4, 6, 1, 22, '#f0d078'); g.r(7, 14, 2, 2, '#c8283e'); },
  pillar_patina(g) { g.r(3, 2, 10, 4, '#d8e8d8'); g.r(4, 6, 8, 22, '#b8ccc0'); g.r(3, 27, 10, 4, '#98aca0'); g.r(4, 6, 1, 22, '#e8f4ec'); g.r(5, 12, 4, 6, '#4a9a7a'); g.r(8, 22, 3, 4, '#4a9a7a'); g.r(6, 3, 2, 2, '#4a9a7a'); },
  bookshelf(g) { g.r(1, 4, 14, 27, '#5a3a24'); g.r(2, 5, 12, 25, '#3a2416'); const cols = ['#b8283a', '#2a5a8a', '#c8963a', '#3a7a4a', '#7a3a8a', '#e8dfd0']; for (let row = 0; row < 3; row++) { g.r(2, 12 + row * 8, 12, 1, '#7a5a34'); for (let i = 0; i < 6; i++) g.r(2 + i * 2, 6 + row * 8, 1 + (i % 2), 6, cols[(i + row * 2) % cols.length]); } },
  crate(g) { g.r(2, 18, 12, 13, '#7a5a34'); g.r(2, 18, 12, 2, '#a07a4a'); g.r(2, 29, 12, 2, '#4a3420'); g.r(2, 18, 2, 13, '#5a4024'); g.r(12, 18, 2, 13, '#5a4024'); g.line(3, 20, 12, 29, '#5a4024'); g.line(12, 20, 3, 29, '#5a4024'); },
  barrel(g) { g.ell(8, 24, 6, 7, '#7a5030'); g.r(2, 20, 12, 1, '#3a2a2a'); g.r(2, 27, 12, 1, '#3a2a2a'); g.r(4, 18, 8, 2, '#a07048'); g.r(6, 20, 1, 9, '#5a3a20'); },
  bush(g) { g.ell(8, 25, 7, 5, '#2f7a4a'); g.ell(5, 23, 4, 4, '#3f9a5a'); g.ell(11, 24, 4, 4, '#2a6a40'); g.p(4, 21, '#f0e8a0'); g.p(12, 22, '#f08a8a'); },
  rock(g) { g.poly([[2, 30], [4, 20], [9, 17], [14, 22], [15, 30]], '#7a8a88'); g.poly([[4, 20], [9, 17], [10, 22], [5, 24]], '#a4b4b0'); g.r(6, 26, 4, 2, '#4a8a58'); },
  torch(g) { g.r(7, 14, 2, 16, '#4a3a2a'); g.r(4, 28, 8, 3, '#3a2a2a'); g.r(5, 11, 6, 4, '#5a4a3a'); g.poly([[8, 3], [12, 9], [8, 13], [4, 9]], '#ff8a2a'); g.poly([[8, 6], [10, 10], [8, 13], [6, 10]], '#ffd060'); },
  skullpile(g) { g.ell(8, 26, 7, 4, '#d8d0bc'); g.ell(5, 23, 3, 3, '#efe8d8'); g.ell(11, 24, 3, 3, '#efe8d8'); g.p(4, 23, '#1c1024'); g.p(6, 23, '#1c1024'); g.p(10, 24, '#1c1024'); g.p(12, 24, '#1c1024'); g.line(2, 29, 14, 28, '#b8b09c'); },
  rack(g) { g.r(2, 2, 12, 29, '#141a30'); g.r(2, 2, 12, 2, '#30e2d2'); for (let i = 0; i < 6; i++) { g.r(4, 6 + i * 4, 8, 3, '#1c2444'); g.p(5, 7 + i * 4, i % 2 ? '#ff5ab8' : '#30e2d2'); g.p(7, 7 + i * 4, i % 3 ? '#30e2d2' : '#f0e040'); g.r(9, 7 + i * 4, 2, 1, '#3a4a7a'); } },
  spire(g) { g.poly([[8, 0], [13, 26], [3, 26]], '#1c2444'); g.poly([[8, 0], [10, 26], [6, 26]], '#30e2d2'); g.r(2, 26, 12, 5, '#141a30'); g.p(8, 8, '#fff'); g.r(5, 20, 6, 1, '#ff5ab8'); },
  neon(g) { g.r(6, 4, 4, 27, '#1c2444'); g.r(7, 4, 2, 27, '#30e2d2'); g.r(7, 4, 2, 3, '#ffffff'); g.r(4, 28, 8, 3, '#141a30'); },
  holo(g) { g.r(4, 27, 8, 4, '#141a30'); g.r(5, 26, 6, 1, '#30e2d2'); g.ell(8, 14, 4, 10, 'rgba(48,226,210,0.55)'); g.ell(8, 8, 3, 3, 'rgba(200,255,248,0.8)'); g.r(4, 15, 8, 1, '#c8fff8'); g.r(6, 20, 4, 1, '#c8fff8'); },
  brush(g) { g.r(7, 6, 2, 25, '#f6f0e6'); g.poly([[8, 0], [12, 8], [4, 8]], '#c8283e'); g.r(6, 8, 4, 2, '#c9a24a'); g.r(5, 29, 6, 2, '#c8283e'); g.p(8, 1, '#ff8a90'); },
  fountain(g) { g.ell(8, 26, 8, 5, '#8a8a9a'); g.ell(8, 25, 7, 4, '#4a7ab0'); g.ell(8, 24, 5, 2, '#8ab8e8'); g.r(7, 12, 2, 12, '#a8a8b8'); g.r(5, 10, 6, 3, '#8a8a9a'); g.r(7, 6, 2, 6, '#9ad0f0'); g.p(5, 8, '#c8e8ff'); g.p(11, 8, '#c8e8ff'); g.p(4, 11, '#c8e8ff'); g.p(12, 11, '#c8e8ff'); g.r(2, 26, 12, 3, '#6a6a7a'); },
  drape(g) { g.r(0, 0, 16, 3, '#c9a24a'); g.poly([[0, 3], [16, 3], [15, 30], [8, 26], [1, 30]], '#8a1a2a'); for (const x of [3, 7, 11]) g.line(x, 4, x + 1, 27, '#5a0f1c'); g.r(6, 22, 4, 2, '#c9a24a'); },
  brazier(g) { g.r(5, 22, 6, 8, '#5a4a3a'); g.r(3, 18, 10, 5, '#8a6420'); g.poly([[8, 4], [13, 14], [8, 18], [3, 14]], '#ffb03a'); g.poly([[8, 8], [11, 15], [8, 18], [5, 15]], '#fff0a0'); },
  chair(g) { g.r(3, 20, 10, 9, '#8a1a2a'); g.r(3, 14, 10, 7, '#a82a3a'); g.r(3, 28, 2, 3, '#3a2a20'); g.r(11, 28, 2, 3, '#3a2a20'); g.r(3, 14, 10, 1, '#c9a24a'); },
  lantern(g) { g.r(7, 10, 2, 20, '#3a4a44'); g.r(4, 4, 8, 8, '#2a3a34'); g.r(5, 5, 6, 6, '#78ffd0'); g.r(7, 6, 2, 4, '#e8fff4'); g.r(4, 28, 8, 3, '#4a5a54'); },
  frame(g) { g.r(1, 2, 14, 24, '#c9a24a'); g.r(3, 4, 10, 20, '#f6f0e6'); g.r(3, 4, 10, 2, '#e8dfd0'); g.line(4, 20, 12, 8, '#c8283e'); g.r(7, 24, 2, 5, '#8a6a20'); },
  bed(g) { g.r(1, 16, 14, 14, '#7a5a34'); g.r(2, 17, 12, 8, '#f4ecda'); g.r(2, 17, 12, 3, '#c8d8f0'); g.r(2, 24, 12, 5, '#a02a3a'); },
  table(g) { g.r(1, 18, 14, 7, '#7a5030'); g.r(1, 18, 14, 1, '#a07048'); g.r(2, 25, 2, 6, '#5a3a20'); g.r(12, 25, 2, 6, '#5a3a20'); g.r(6, 16, 4, 3, '#f4ecda'); },
  stall(g) { g.r(0, 4, 16, 5, '#a02a3a'); g.r(0, 8, 16, 2, '#f4ecda'); g.r(1, 10, 2, 20, '#5a3a20'); g.r(13, 10, 2, 20, '#5a3a20'); g.r(1, 20, 14, 5, '#7a5030'); g.r(3, 17, 2, 3, '#e8c868'); g.r(7, 17, 3, 3, '#c8283e'); g.r(11, 18, 2, 2, '#58a868'); },
  inkwell(g) { g.r(4, 24, 8, 7, '#2a2038'); g.ell(8, 18, 5, 8, 'rgba(255,200,160,0.35)'); g.poly([[8, 6], [13, 17], [8, 26], [3, 17]], '#ff5a4a'); g.poly([[8, 9], [11, 17], [8, 23], [5, 17]], '#ffd0b0'); g.p(8, 13, '#fff'); },
  door(g) { g.r(2, 8, 12, 23, '#4a2a20'); g.r(3, 9, 5, 22, '#6a3a2a'); g.r(9, 9, 5, 22, '#6a3a2a'); g.r(1, 6, 14, 3, '#c9a24a'); g.p(7, 20, '#f0d078'); g.p(10, 20, '#f0d078'); g.r(2, 8, 12, 1, '#8a5a3a'); },
  crystal(g) { g.poly([[8, 2], [13, 14], [8, 30], [3, 14]], '#58e0d0'); g.poly([[8, 2], [10, 14], [8, 30], [6, 14]], '#c8fff8'); g.r(4, 28, 8, 3, '#141a30'); },
  none() {},
};

const THEMES = {
  aurelle: {
    floor: g => TP.cobble(g, '#4e4660', '#645c78', '#352e46', 0), alt: g => TP.flags(g, '#6c6280', '#4a4260', 0),
    accent: g => TP.checker(g, '#dccab4', '#b89a9c'), wall: g => TP.bricks(g, '#84505a', '#4a2a34', '#a46870', 0), top: g => TP.roof(g, '#2c2a3c', '#4c4a64'),
    water: (g, f) => TP.water(g, '#28487a', '#4c7ab4', f), carpet: g => TP.carpet(g, '#8a1a2a', '#c9a24a'), grass: g => TP.grass(g, '#4a5a48', '#8a9a68', 0),
    props: { T: 'tree_autumn', t: 'crate', L: 'gaslamp', S: 'statue_angel', P: 'pillar_marble', B: 'bookshelf', F: 'fountain', D: 'drape', b: 'barrel', s: 'stall', C: 'chair' },
    ambient: '#5a3a80', amb: 0.22, light: '#ffcf70',
  },
  opera: {
    floor: g => TP.planks(g, '#7a4a30', '#3a2016', 0), alt: g => TP.planks(g, '#8a5a3a', '#3a2016', 3),
    accent: g => TP.planks(g, '#a87a48', '#4a2a16', 5), wall: g => TP.bricks(g, '#5a2a30', '#2a1018', '#7a3a44', 0), top: g => TP.roof(g, '#22121a', '#3a2028'),
    water: (g, f) => TP.water(g, '#1a1030', '#3a2a5a', f), carpet: g => TP.carpet(g, '#8a1a2a', '#c9a24a'), grass: g => TP.planks(g, '#7a4a30', '#3a2016', 1),
    props: { T: 'pillar_gold', t: 'chair', L: 'brazier', S: 'statue_angel', P: 'pillar_gold', B: 'bookshelf', F: 'frame', D: 'drape', C: 'chair', b: 'barrel', s: 'table' },
    ambient: '#602030', amb: 0.28, light: '#ffb060',
  },
  catacomb: {
    floor: g => TP.flags(g, '#403a50', '#221e2e', 0), alt: g => TP.cobble(g, '#3a3448', '#4c465e', '#221e2e', 1),
    accent: g => TP.flags(g, '#4a4460', '#221e2e', 3), wall: g => TP.bricks(g, '#4a4458', '#1c1826', '#625c78', 0), top: g => TP.roof(g, '#14101e', '#2a2438'),
    water: (g, f) => TP.water(g, '#0a0812', '#2a5a4a', f), carpet: g => TP.carpet(g, '#3a1a2a', '#8a6a3a'), grass: g => TP.flags(g, '#403a50', '#221e2e', 5),
    props: { T: 'pillar_marble', t: 'skullpile', L: 'torch', S: 'statue_angel', P: 'pillar_marble', B: 'bookshelf', F: 'brazier', D: 'drape', b: 'barrel' },
    ambient: '#101830', amb: 0.3, light: '#ff9a40',
  },
  verdigris: {
    floor: g => TP.grass(g, '#3a6a48', '#8ac078', 0), alt: g => TP.grass(g, '#6a6448', '#a89868', 1),
    accent: g => TP.marble(g, '#b8c8b8', '#8aa898', 0), wall: g => TP.bricks(g, '#4a6a5a', '#1e3a2e', '#6a8a78', 0), top: g => TP.roof(g, '#183428', '#2c5a44'),
    water: (g, f) => TP.water(g, '#2e6a80', '#6ab0c0', f), carpet: g => TP.carpet(g, '#3a6a58', '#e6cf8a'), grass: g => TP.grass(g, '#3a6a48', '#8ac078', 2),
    props: { T: 'tree_green', t: 'bush', L: 'lantern', S: 'statue_angel', P: 'pillar_patina', B: 'bookshelf', F: 'rock', D: 'drape', b: 'barrel', s: 'stall', C: 'chair' },
    ambient: '#1a4a5a', amb: 0.22, light: '#8affd0',
  },
  temple: {
    floor: g => TP.checker(g, '#c4ccc4', '#a8b8b0'), alt: g => TP.marble(g, '#bcc8c0', '#88a898', 2),
    accent: g => TP.checker(g, '#e6cf8a', '#c9a24a'), wall: g => TP.bricks(g, '#b4c4bc', '#5a7a6a', '#d8e8e0', 0), top: g => TP.roof(g, '#1e3a34', '#3a6a5a'),
    water: (g, f) => TP.water(g, '#0a1a20', '#58e0a8', f), carpet: g => TP.carpet(g, '#2a6a58', '#e6cf8a'), grass: g => TP.marble(g, '#bcc8c0', '#88a898', 4),
    props: { T: 'pillar_patina', t: 'bush', L: 'brazier', S: 'statue_angel', P: 'pillar_patina', B: 'bookshelf', F: 'crystal', D: 'drape', b: 'barrel' },
    ambient: '#1a4a4a', amb: 0.25, light: '#f4d878',
  },
  terminus: {
    floor: g => TP.grid(g, '#121830', '#22406a', 0), alt: g => TP.grid(g, '#161c38', '#30e2d2', 1),
    accent: g => TP.checker(g, '#1c2a52', '#2a3c7a'), wall: g => TP.bricks(g, '#1c2444', '#0a0e1c', '#30e2d2', 0), top: g => TP.roof(g, '#0a0e1c', '#22406a'),
    water: (g, f) => TP.water(g, '#0a1a3a', '#ff5ab8', f), carpet: g => TP.carpet(g, '#22406a', '#30e2d2'), grass: g => TP.grid(g, '#121830', '#22406a', 2),
    props: { T: 'rack', t: 'crate', L: 'neon', S: 'holo', P: 'spire', B: 'rack', F: 'crystal', D: 'neon', b: 'crate' },
    ambient: '#102060', amb: 0.2, light: '#30e2d2',
  },
  datacore: {
    floor: g => TP.grid(g, '#180c1c', '#802858', 0), alt: g => TP.grid(g, '#1c0c20', '#ff2a4a', 1),
    accent: g => TP.checker(g, '#2a1030', '#401848'), wall: g => TP.bricks(g, '#2a1030', '#0a040e', '#ff2a4a', 0), top: g => TP.roof(g, '#0a040e', '#401040'),
    water: (g, f) => TP.water(g, '#12040a', '#ff00ff', f), carpet: g => TP.carpet(g, '#401040', '#ff2a4a'), grass: g => TP.grid(g, '#180c1c', '#802858', 2),
    props: { T: 'rack', t: 'crate', L: 'neon', S: 'holo', P: 'spire', B: 'rack', F: 'crystal', D: 'neon', b: 'crate' },
    ambient: '#601030', amb: 0.28, light: '#ff2a6a',
  },
  lacuna: {
    floor: g => TP.blank(g, '#f4efe6', '#d8d0c4', 0), alt: g => TP.blank(g, '#eee8dc', '#cfc6b8', 1),
    accent: g => TP.checker(g, '#f4efe6', '#e8e0d0'), wall: g => TP.bricks(g, '#e8e0d0', '#c8beae', '#f8f4ec', 0), top: g => TP.roof(g, '#d8d0c4', '#eee8dc'),
    water: (g, f) => TP.water(g, '#fbf8f2', '#eee8dc', f), carpet: g => TP.carpet(g, '#c8283e', '#f0d078'), grass: g => TP.blank(g, '#f4efe6', '#d8d0c4', 2),
    props: { T: 'brush', t: 'crate', L: 'lantern', S: 'frame', P: 'pillar_marble', B: 'frame', F: 'inkwell', D: 'frame', b: 'barrel' },
    ambient: '#ffe8d0', amb: 0.0, light: '#ffb0a0',
  },
};

const TileArt = {
  cache: {},
  ground(theme, kind, v = 0, f = 0) {
    const key = `${theme}:${kind}:${v}:${f}`;
    if (this.cache[key]) return this.cache[key];
    const g = new Pix(16, 16, 0), T = THEMES[theme];
    const fn = T[kind] || T.floor;
    if (kind === 'water') fn(g, f); else fn(g);
    if (kind === 'wall') { g.r(0, 0, 16, 1, 'rgba(255,255,255,0.18)'); g.r(0, 14, 16, 2, 'rgba(0,0,0,0.35)'); g.r(0, 12, 16, 2, 'rgba(0,0,0,0.15)'); }
    if (kind === 'top') { g.r(0, 15, 16, 1, 'rgba(255,255,255,0.12)'); }
    if ((kind === 'floor' || kind === 'alt' || kind === 'grass') && v) { // subtle variation
      const r = new RNG(v * 977 + 13);
      for (let i = 0; i < 3; i++) g.p(r.int(0, 15), r.int(0, 15), 'rgba(0,0,0,0.12)');
    }
    return (this.cache[key] = g.c);
  },
  prop(theme, name) {
    const key = `${theme}:prop:${name}`;
    if (this.cache[key]) return this.cache[key];
    const g = new Pix(16, 32, 1);
    (PROPS[name] || PROPS.none)(g);
    g.finish({ outline: '#120a18', hi: 0.15, lo: 0.2 });
    return (this.cache[key] = g.c);
  },
};

/* ==========================================================================
   Backdrops (rendered at half-res, scaled 2x for a painterly chunk)
   ========================================================================== */
function vgrad(g, y0, y1, c0, c1, x0 = 0, x1 = null, dither = true) {
  x1 = x1 === null ? g.w : x1;
  const n = y1 - y0;
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / n;
    const a = mixc(c0, c1, t);
    g.r(x0, y, x1 - x0, 1, a);
    if (dither && (y & 1)) { const b = mixc(c0, c1, Math.min(1, t + 0.06)); for (let x = x0; x < x1; x += 2) g.p(x, y, b); }
  }
}
function stars(g, n, seed, y1, col = '#f6f0e6') { const r = new RNG(seed); for (let i = 0; i < n; i++) g.p(r.int(0, g.w - 1), r.int(0, y1), r.chance(0.2) ? '#ffffff' : col); }
function ring(g, cx, cy, r, col, th = 1, sq = 1) { for (let a = 0; a < 360; a += 1) { const t = a / 180 * Math.PI; for (let k = 0; k < th; k++) g.p(cx + Math.cos(t) * (r + k), cy + Math.sin(t) * (r + k) * sq, col); } }

const BG = {
  aurelle(g) {
    vgrad(g, 0, 78, '#1c1238', '#c8503a'); vgrad(g, 56, 78, '#c8503a', '#f0a050');
    stars(g, 60, 1, 40);
    g.ell(120, 66, 30, 30, '#f8c070'); g.ell(120, 66, 24, 24, '#ffe0a0');
    ring(g, 120, 66, 44, '#ff5a4a', 1); ring(g, 120, 66, 47, '#c8283e', 2);
    // lacuna patches
    for (const [x, y, r] of [[40, 22, 12], [190, 30, 15], [160, 12, 8]]) { g.ell(x, y, r, r * 0.6, '#f6f0e6'); g.ell(x + 2, y + 1, r - 4, r * 0.4, '#ffffff'); }
    // skyline
    const rr = new RNG(7);
    for (let x = 0; x < 240; x += 0) { const w = rr.int(14, 26), h = rr.int(22, 44); g.r(x, 80 - h, w, h, '#2a1c40'); g.poly([[x - 1, 80 - h], [x + w / 2, 80 - h - 8], [x + w + 1, 80 - h]], '#1c1230'); for (let wy = 80 - h + 5; wy < 76; wy += 7) for (let wx = x + 3; wx < x + w - 3; wx += 6) g.r(wx, wy, 2, 3, rr.chance(0.5) ? '#f0c060' : '#3a2a58'); x += w + 1; }
    // clocktower
    g.r(28, 20, 22, 60, '#231638'); g.poly([[26, 20], [39, 4], [52, 20]], '#1a1030'); g.ell(39, 32, 8, 8, '#f0e0b0'); g.line(39, 32, 39, 26, '#2a1c40'); g.line(39, 32, 43, 34, '#2a1c40');
    // street
    vgrad(g, 80, 135, '#3a2c4a', '#5a4a6a', 0, null, false);
    for (let i = 0; i <= 14; i++) g.line(120 + (i - 7) * 4, 80, 120 + (i - 7) * 26, 135, '#2a1e3a');
    for (let y = 84; y < 135; y += 4 + Math.floor((y - 80) / 12)) g.r(0, y, 240, 1, '#2a1e3a');
    for (const x of [30, 90, 150, 210]) { g.r(x, 60, 2, 24, '#1a1226'); g.r(x - 2, 56, 6, 5, '#ffe090'); }
    g.r(0, 78, 240, 2, '#1a1226');
  },
  opera(g) {
    vgrad(g, 0, 135, '#1a0a14', '#3a1420');
    for (let x = 30; x < 210; x += 16) { g.r(x, 10, 1, 60, '#4a1a28'); }
    g.ell(120, 60, 60, 44, '#2a0e1a'); g.ell(120, 60, 50, 36, '#4a1a2c'); ring(g, 120, 56, 30, '#c9a24a', 1);
    for (const [x, y] of [[100, 50], [140, 52], [120, 40]]) g.ell(x, y, 8, 5, '#6a2a3c');
    // proscenium arch
    g.r(0, 0, 240, 12, '#7a1424'); g.r(0, 12, 240, 3, '#c9a24a'); g.r(0, 15, 240, 1, '#8a6420');
    // curtains
    for (const s of [0, 1]) for (let i = 0; i < 9; i++) { const x = s ? 240 - 6 - i * 6 : i * 6; const h = 96 - Math.abs(i - 4) * 4 + (i % 2) * 3; g.r(x, 12, 7, h, i % 2 ? '#8a1a2a' : '#a82a3a'); g.r(x, 12, 1, h, '#5a0f1c'); }
    // chandelier
    g.r(119, 12, 2, 12, '#c9a24a'); g.ell(120, 28, 14, 5, '#e8c868'); for (let i = -12; i <= 12; i += 4) { g.r(120 + i, 32, 1, 4, '#c9a24a'); g.p(120 + i, 31, '#fff6c8'); g.p(120 + i, 37, '#ffe090'); }
    // stage
    vgrad(g, 96, 135, '#7a4a30', '#3a2016', 0, null, false);
    for (let i = 0; i <= 16; i++) g.line(120 + (i - 8) * 5, 96, 120 + (i - 8) * 30, 135, '#2a160e');
    for (let y = 98; y < 135; y += 5) g.r(0, y, 240, 1, '#2a160e');
    for (let x = 30; x < 220; x += 24) { g.r(x, 128, 6, 4, '#ffe090'); g.r(x + 1, 127, 4, 1, '#fff6d0'); }
  },
  catacombs(g) {
    vgrad(g, 0, 135, '#07050c', '#1c1626');
    for (let i = 0; i < 6; i++) { const w = 200 - i * 30, h = 100 - i * 14, x = 120 - w / 2, y = 108 - h; g.ell(120, y + h * 0.5, w / 2, h / 2, i % 2 ? '#241e34' : '#2c2640'); g.ell(120, y + h * 0.5 + 3, w / 2 - 6, h / 2 - 4, '#0c0814'); }
    g.ell(120, 62, 22, 30, '#040208');
    for (const x of [20, 210]) { g.r(x, 60, 4, 30, '#3a2a2a'); g.poly([[x + 2, 44], [x + 7, 58], [x + 2, 62], [x - 3, 58]], '#ff8a2a'); g.poly([[x + 2, 50], [x + 5, 58], [x + 2, 62], [x - 1, 58]], '#ffd060'); }
    vgrad(g, 100, 135, '#241e34', '#100c1a', 0, null, false);
    for (let i = 0; i <= 14; i++) g.line(120 + (i - 7) * 4, 100, 120 + (i - 7) * 24, 135, '#0c0814');
    for (let y = 102; y < 135; y += 5) g.r(0, y, 240, 1, '#0c0814');
    const r = new RNG(3); for (let i = 0; i < 10; i++) { const x = r.int(10, 230), y = r.int(108, 132); g.ell(x, y, 3, 2, '#d8d0bc'); g.p(x - 1, y, '#1c1024'); g.p(x + 1, y, '#1c1024'); }
  },
  woods(g) {
    vgrad(g, 0, 90, '#0e2a30', '#3a7a68'); stars(g, 20, 4, 30, '#d8ffe8');
    // light rays
    for (const [x, w] of [[60, 14], [120, 10], [170, 16]]) g.poly([[x, 0], [x + w, 0], [x + w + 30, 100], [x + 10, 100]], 'rgba(255,240,170,0.13)');
    // far canopy layers
    const r = new RNG(9);
    for (let l = 0; l < 3; l++) { const col = ['#1c4a4a', '#153a3c', '#0e2a30'][l]; for (let x = -10; x < 250; x += 16) g.ell(x, 50 + l * 14 + r.int(-4, 4), 20, 22, col); }
    // trunks
    for (const [x, w] of [[-6, 34], [60, 14], [150, 12], [206, 40]]) { g.r(x, 0, w, 100, '#1a1418'); g.r(x + w * 0.65, 0, w * 0.2, 100, '#2a2028'); g.r(x - 4, 90, w + 8, 10, '#1a1418'); }
    vgrad(g, 96, 135, '#1e4a38', '#0e261e', 0, null, false);
    const rr = new RNG(11); for (let i = 0; i < 80; i++) g.p(rr.int(0, 239), rr.int(96, 134), rr.chance(0.5) ? '#3a8a5a' : '#0a1a14');
    for (let i = 0; i < 24; i++) g.p(rr.int(0, 239), rr.int(60, 120), '#f0f0a0');
  },
  temple(g) {
    vgrad(g, 0, 100, '#0a1c20', '#2a5a5a');
    // rose window
    ring(g, 120, 46, 30, '#e6cf8a', 2); g.ell(120, 46, 28, 28, '#1a3a4a');
    const cols = ['#d8503a', '#e6cf8a', '#4a9a7a', '#4a7ab0', '#a878d8'];
    for (let a = 0; a < 16; a++) { const t = a / 16 * TAU; const c = cols[a % cols.length]; g.poly([[120, 46], [120 + Math.cos(t) * 27, 46 + Math.sin(t) * 27], [120 + Math.cos(t + 0.39) * 27, 46 + Math.sin(t + 0.39) * 27]], c); }
    ring(g, 120, 46, 8, '#e6cf8a', 2); g.ell(120, 46, 6, 6, '#fff6c8');
    g.poly([[110, 76], [130, 76], [180, 135], [60, 135]], 'rgba(255,240,170,0.10)');
    // columns
    for (const [x, s] of [[16, 1.2], [56, 1], [184, 1], [224, 1.2]]) { const w = 14 * s; g.r(x - w / 2, 8, w, 100, '#b8ccc0'); g.r(x - w / 2, 8, 2, 100, '#e8f4ec'); g.r(x + w / 2 - 3, 8, 3, 100, '#7a9a8a'); g.r(x - w / 2 - 3, 4, w + 6, 6, '#d8e8e0'); g.r(x - w / 2 - 3, 106, w + 6, 6, '#98aca0'); }
    // floor
    vgrad(g, 108, 135, '#8aa8a0', '#3a5a58', 0, null, false);
    for (let i = 0; i <= 16; i++) g.line(120 + (i - 8) * 5, 108, 120 + (i - 8) * 30, 135, '#2a4a48');
    for (let y = 110; y < 135; y += 5) g.r(0, y, 240, 1, '#2a4a48');
    g.r(112, 108, 16, 27, 'rgba(230,207,138,0.45)');
  },
  terminus(g) {
    vgrad(g, 0, 78, '#0a0620', '#5a1a6a'); vgrad(g, 56, 78, '#5a1a6a', '#ff5ab8');
    stars(g, 70, 12, 44, '#c8fff8');
    g.ell(120, 62, 34, 34, '#ff9ad0'); for (let y = 50; y < 96; y += 5) g.r(85, y, 70, 1 + (y - 50) / 22, '#5a1a6a');
    g.r(0, 78, 240, 1, '#30e2d2');
    const r = new RNG(5); for (let x = 0; x < 240; x += 0) { const w = r.int(8, 18), h = r.int(14, 44); g.r(x, 78 - h, w, h, '#0c0a24'); g.r(x, 78 - h, w, 1, '#30e2d2'); for (let wy = 78 - h + 3; wy < 76; wy += 4) if (r.chance(0.5)) g.r(x + 2, wy, w - 4, 1, r.chance(0.5) ? '#30e2d2' : '#ff5ab8'); x += w + 2; }
    vgrad(g, 78, 135, '#100a2a', '#1a1450', 0, null, false);
    for (let i = -16; i <= 16; i++) g.line(120 + i * 3, 78, 120 + i * 36, 135, '#30e2d2');
    for (let k = 0; k < 8; k++) { const y = 78 + Math.round(Math.pow(k / 8, 1.8) * 57); g.r(0, y, 240, 1, '#30e2d2'); }
    for (const [x, y, s] of [[30, 30, 6], [200, 24, 8], [170, 48, 5]]) { g.r(x, y, s, s, '#30e2d2'); g.r(x + 1, y + 1, s - 2, s - 2, '#0c0a24'); }
  },
  datacore(g) {
    vgrad(g, 0, 135, '#12040a', '#3a0a20');
    const r = new RNG(21);
    for (let i = 0; i < 36; i++) g.r(0, r.int(0, 134), r.int(30, 240), r.int(1, 3), r.chance(0.5) ? '#5a0a2a' : '#12040a');
    g.ell(120, 66, 42, 42, '#1a0410'); ring(g, 120, 66, 42, '#ff2a4a', 2); ring(g, 120, 66, 34, '#ff00ff', 1);
    g.ell(120, 66, 20, 14, '#f4f4f0'); g.ell(120, 66, 11, 11, '#ff2a4a'); g.r(119, 54, 2, 24, '#12040a');
    for (let i = 0; i < 20; i++) g.r(r.int(0, 230), r.int(0, 130), r.int(4, 12), 1, r.chance(0.5) ? '#30e2d2' : '#ff00ff');
    vgrad(g, 100, 135, '#2a0a1c', '#120410', 0, null, false);
    for (let i = -16; i <= 16; i++) g.line(120 + i * 3, 100, 120 + i * 30, 135, '#802858');
    for (let k = 0; k < 6; k++) { const y = 100 + Math.round(Math.pow(k / 6, 1.7) * 35); g.r(0, y, 240, 1, '#802858'); }
  },
  lacuna(g) {
    vgrad(g, 0, 135, '#ece5f2', '#d2c8de');
    const r = new RNG(31);
    for (let i = 0; i < 40; i++) { const x = r.int(0, 239), y = r.int(0, 110); g.line(x, y, x + r.int(-30, 30), y + r.int(-6, 6), '#d8d0c4'); }
    ring(g, 120, 62, 46, '#c8283e', 2); ring(g, 120, 62, 40, '#f0d078', 1);
    g.r(60, 20, 120, 2, '#c9a24a'); g.r(60, 100, 120, 2, '#c9a24a'); g.r(60, 20, 2, 82, '#c9a24a'); g.r(178, 20, 2, 82, '#c9a24a');
    for (let i = 0; i < 16; i++) { const x = 10 + i * 15 + r.int(-4, 4); const l = r.int(8, 46); g.r(x, 0, 2, l, '#c8283e'); g.ell(x + 1, l, 2, 2, '#c8283e'); }
    for (let i = 0; i < 6; i++) { const x = r.int(20, 220), y = r.int(90, 130); g.ell(x, y, r.int(5, 12), r.int(2, 4), '#c8283e'); }
    vgrad(g, 104, 135, '#cfc4d8', '#a89cb8', 0, null, false);
    for (let i = -14; i <= 14; i++) g.line(120 + i * 4, 104, 120 + i * 30, 135, '#b6aac6');
    for (let y = 106; y < 135; y += 6) g.r(0, y, 240, 1, '#b6aac6');
  },
  title(g) {
    vgrad(g, 0, 150, '#0a0418', '#8a1a30'); vgrad(g, 96, 150, '#8a1a30', '#ff7a4a');
    stars(g, 90, 44, 70);
    g.ell(120, 84, 46, 46, '#ffb070'); g.ell(120, 84, 38, 38, '#ffd8a0'); g.ell(126, 78, 30, 30, '#ffe8c0');
    ring(g, 120, 84, 66, '#ff3a3a', 1); ring(g, 120, 84, 70, '#c8283e', 2); ring(g, 120, 84, 76, '#f0d078', 1);
    for (let a = 0; a < 24; a++) { const t = a / 24 * TAU; g.r(120 + Math.cos(t) * 76 - 1, 84 + Math.sin(t) * 76 - 1, 3, 3, '#f0d078'); }
    const r = new RNG(77);
    for (let l = 0; l < 3; l++) { const col = ['#3a1030', '#24081e', '#12040e'][l]; const base = 112 + l * 10; for (let x = 0; x < 240;) { const w = r.int(10, 22), h = r.int(12, 34) + l * 3; g.r(x, base - h + 26, w, h + 12, col); if (r.chance(0.6)) g.poly([[x - 1, base - h + 26], [x + w / 2, base - h + 20], [x + w + 1, base - h + 26]], col); if (l === 2) for (let wy = base - h + 30; wy < 140; wy += 6) if (r.chance(0.5)) g.r(x + 3, wy, 2, 3, '#ffcf70'); x += w; } }
    g.r(0, 138, 240, 12, '#0a020a');
  },
};

Art.bg = function (name) {
  const key = 'bg:' + name;
  if (this.cache[key]) return this.cache[key];
  let c;
  if (Assets.has('bg_' + name) || (name === 'title' && Assets.has('title_bg'))) c = Assets.fit(name === 'title' ? 'title_bg' : 'bg_' + name, W, H, 'cover');
  if (!c) {
    const g = new Pix(240, name === 'title' ? 150 : 135, 0);
    (BG[name] || BG.aurelle)(g);
    const h = name === 'title' ? 300 : H;
    const [cc, x] = mkCanvas(W, h);
    x.drawImage(g.c, 0, 0, W, h);
    c = cc;
  }
  return (this.cache[key] = c);
};
