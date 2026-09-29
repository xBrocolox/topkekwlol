'use strict';
/* ==========================================================================
   VERMILION REQUIEM — art_enemies.js
   Procedural monsters and bosses. Every creature is composed from shapes,
   then rim-lit and outlined. Facing RIGHT (toward the party). Drop
   assets/ai/enemy_<id>.png to override any of them.
   ========================================================================== */

function drip(g, x, y, len, col) { g.r(x, y, 1, len, col); g.p(x, y + len, shadeC(col, 0.2)); }
function checker(g, x, y, w, h, a, b, s = 2) {
  for (let j = 0; j < h; j += s) for (let i = 0; i < w; i += s) g.r(x + i, y + j, s, s, ((i / s + j / s) & 1) ? a : b);
}
function fadeRows(g, y0, y1, w) { // dither the bottom of a ghostly sprite away
  const x = g.x, pad = g.pad;
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    for (let i = 0; i < w; i++) if (((i + y) & 1) === 0 && t > 0.3 || (i % 3 === 0 && t > 0.65) || t > 0.9) x.clearRect(i + pad, y + pad, 1, 1);
  }
}

const ENEMY_ART = {
  wisp() {
    const g = new Pix(24, 30);
    g.poly([[12, 1], [16, 8], [20, 15], [19, 23], [15, 28], [9, 28], [5, 23], [4, 15], [8, 8]], '#f4f0e8');
    g.poly([[12, 8], [16, 15], [15, 24], [9, 24], [8, 15]], '#dcd4c8');
    g.poly([[12, 1], [13, 6], [11, 6]], '#ffffff');
    g.ell(8.5, 16, 2, 3, '#1c1024'); g.ell(15.5, 16, 2, 3, '#1c1024');
    g.p(8, 15, '#c8283e'); g.p(15, 15, '#c8283e');
    g.r(10, 22, 4, 2, '#1c1024');
    drip(g, 6, 26, 3, '#f4f0e8'); drip(g, 17, 25, 4, '#f4f0e8'); drip(g, 12, 28, 1, '#c8283e');
    g.p(4, 20, '#c8283e'); g.p(19, 12, '#c8283e');
    return g.finish({ outline: '#3a2a48' });
  },
  inkslime() {
    const g = new Pix(30, 24);
    g.ell(15, 15, 14, 8, '#251d52'); g.ell(15, 12, 11, 8, '#382e78'); g.ell(15, 9, 6, 3, '#5a4ab0');
    g.r(3, 18, 24, 3, '#251d52');
    g.ell(15, 16, 4, 3, '#c8283e'); g.ell(15, 15, 2, 1, '#ff8a90');
    g.ell(9, 11, 2.4, 2.4, '#f4ecda'); g.ell(21, 11, 2.4, 2.4, '#f4ecda'); g.p(10, 11, '#150d1f'); g.p(22, 11, '#150d1f'); g.p(10, 12, '#150d1f'); g.p(22, 12, '#150d1f');
    drip(g, 6, 21, 2, '#251d52'); drip(g, 23, 20, 3, '#251d52'); drip(g, 15, 22, 1, '#c8283e');
    return g.finish({ outline: '#100a26' });
  },
  moth() {
    const g = new Pix(34, 28); g.sym = true;
    g.poly([[16, 11], [3, 2], [0, 13], [7, 22], [16, 17]], '#4a3a78');
    g.poly([[16, 12], [6, 6], [5, 14], [9, 19], [16, 16]], '#6a58a8');
    g.ell(7, 11, 3, 3, '#f0c860'); g.ell(7, 11, 1, 1, '#c8283e');
    g.poly([[13, 17], [8, 26], [12, 22]], '#3a2c5a');
    g.sym = false;
    g.r(15, 9, 4, 14, '#241a3c'); g.r(16, 9, 2, 12, '#3a2c5a');
    g.ell(16.5, 8, 3, 3, '#3a2c5a'); g.p(15, 8, '#ff5a6a'); g.p(18, 8, '#ff5a6a');
    g.line(15, 6, 12, 1, '#c8b0f0'); g.line(18, 6, 21, 1, '#c8b0f0');
    return g.finish({ outline: '#150d26' });
  },
  puppet() {
    const g = new Pix(24, 40);
    for (const sx of [5, 12, 18]) g.line(sx, 0, sx, 8 + (sx % 5), '#b8a888');
    g.line(6, 0, 4, 15, '#b8a888'); g.line(17, 0, 20, 17, '#b8a888');
    g.ell(12, 9, 5, 5, '#efe8d8'); g.r(9, 13, 6, 3, '#e0d8c4'); g.r(8, 8, 3, 3, '#1c1024'); g.r(13, 8, 3, 3, '#1c1024'); g.p(9, 9, '#c8283e'); g.p(14, 9, '#c8283e');
    g.r(10, 14, 1, 2, '#1c1024'); g.r(12, 14, 1, 2, '#1c1024'); g.r(14, 14, 1, 2, '#1c1024');
    g.r(11, 17, 2, 9, '#e0d8c4');
    for (let y = 18; y < 25; y += 2) g.r(7, y, 10, 1, '#efe8d8');
    g.r(8, 26, 8, 2, '#d0c8b4');
    g.line(7, 18, 4, 24, '#efe8d8'); g.line(4, 24, 5, 30, '#efe8d8'); g.line(17, 18, 20, 23, '#efe8d8'); g.line(20, 23, 19, 30, '#efe8d8');
    g.line(9, 28, 8, 37, '#efe8d8'); g.line(15, 28, 17, 37, '#efe8d8'); g.r(6, 37, 4, 2, '#d0c8b4'); g.r(15, 37, 4, 2, '#d0c8b4');
    g.p(4, 23, '#c8283e'); g.p(20, 22, '#c8283e');
    return g.finish({ outline: '#241a2c' });
  },
  sentry() {
    const g = new Pix(28, 38);
    g.r(8, 27, 4, 9, '#5a4a3a'); g.r(16, 27, 4, 9, '#5a4a3a'); g.r(6, 35, 7, 2, '#3a2a22'); g.r(15, 35, 7, 2, '#3a2a22');
    g.r(6, 11, 16, 17, '#b0803c'); g.r(6, 11, 16, 3, '#d8a850'); g.r(6, 24, 16, 4, '#7a5828');
    for (let x = 8; x < 22; x += 4) { g.p(x, 13, '#f0d890'); g.p(x, 26, '#f0d890'); }
    g.ell(14, 19, 4.5, 4.5, '#5a3a18'); g.ell(14, 19, 3, 3, '#c89a4a'); g.r(13, 15, 2, 8, '#5a3a18'); g.r(10, 18, 8, 2, '#5a3a18'); g.p(14, 19, '#ff6a5a');
    g.ell(14, 7, 6, 6, '#c89a4a'); g.r(9, 6, 10, 3, '#241a20'); g.r(15, 6, 3, 2, '#ff4a4a'); g.p(16, 6, '#fff');
    g.r(13, 0, 2, 3, '#7a5828');
    g.r(2, 12, 5, 12, '#a87a3a'); g.r(22, 12, 4, 10, '#a87a3a');
    g.r(22, 14, 5, 3, '#3a3238'); g.r(24, 12, 4, 2, '#3a3238'); g.r(23, 22, 3, 3, '#7a5828');
    g.p(3, 26, '#d8d0c0'); g.p(2, 5, '#d8d0c0'); g.p(1, 4, '#d8d0c0');
    return g.finish({ outline: '#241812' });
  },
  phantom() {
    const g = new Pix(30, 42);
    g.poly([[15, 14], [26, 22], [29, 40], [24, 36], [20, 41], [15, 36], [10, 41], [6, 36], [1, 40], [4, 22]], '#2a1838');
    g.poly([[15, 18], [22, 24], [24, 38], [15, 33], [7, 38], [8, 24]], '#5a1a2e');
    g.ell(15, 11, 6, 7, '#f6f0e6'); g.r(9, 3, 12, 3, '#2a1838'); g.r(7, 5, 16, 1, '#2a1838');
    g.r(10, 10, 4, 3, '#1c1024'); g.r(16, 10, 4, 3, '#1c1024'); g.p(11, 11, '#c8283e'); g.p(17, 11, '#c8283e');
    g.line(11, 16, 19, 16, '#c8283e'); g.p(12, 15, '#c8283e'); g.p(18, 15, '#c8283e');
    g.r(3, 22, 4, 3, '#f6f0e6'); g.r(23, 22, 4, 3, '#f6f0e6');
    g.p(15, 24, '#e8c868'); g.p(15, 27, '#e8c868');
    fadeRows(g, 36, 41, 30);
    return g.finish({ outline: '#150a1c' });
  },
  hound() {
    const g = new Pix(44, 28);
    const c = '#3a8a78', cd = '#256656', cl = '#8ad0b0';
    g.ell(20, 12, 13, 7, c); g.poly([[28, 8], [36, 8], [42, 13], [40, 17], [30, 16]], c);
    g.r(5, 17, 3, 9, cd); g.r(11, 18, 3, 8, c); g.r(24, 18, 3, 8, cd); g.r(30, 17, 3, 9, c);
    g.r(4, 25, 5, 2, '#1a3a30'); g.r(10, 25, 5, 2, '#1a3a30'); g.r(23, 25, 5, 2, '#1a3a30'); g.r(29, 25, 5, 2, '#1a3a30');
    g.poly([[6, 8], [0, 4], [1, 12]], c); g.poly([[31, 8], [33, 1], [36, 8]], cd); g.poly([[34, 8], [37, 2], [39, 9]], c);
    g.ell(38, 12, 1.5, 1.5, '#f0e060'); g.p(38, 12, '#150d1f');
    g.r(37, 16, 5, 1, '#f4ecda'); g.p(38, 17, '#f4ecda'); g.p(40, 17, '#f4ecda');
    g.ell(15, 9, 3, 2, cl); g.ell(22, 12, 2, 3, cl); g.r(28, 10, 4, 2, cl); g.p(10, 13, cl); g.p(8, 10, cl);
    g.line(14, 5, 26, 5, cl); g.p(30, 6, cl);
    return g.finish({ outline: '#0e2620' });
  },
  thornseraph() {
    const g = new Pix(38, 40);
    g.sym = true;
    g.poly([[18, 16], [5, 8], [0, 20], [8, 30], [18, 24]], '#3f8a4a'); g.poly([[18, 18], [8, 12], [5, 20], [10, 26], [18, 22]], '#5aaa62');
    g.line(17, 18, 4, 14, '#2a5a32'); g.line(17, 21, 5, 20, '#2a5a32');
    g.sym = false;
    g.poly([[14, 16], [24, 16], [22, 32], [16, 32]], '#2e6a3a'); g.r(16, 18, 6, 12, '#bce8b8');
    g.r(13, 32, 4, 7, '#2a5a32'); g.r(21, 32, 4, 7, '#2a5a32');
    g.ell(19, 10, 5, 5, '#d8e8c8'); g.r(15, 9, 3, 2, '#1c2a1c'); g.r(21, 9, 3, 2, '#1c2a1c'); g.p(16, 9, '#c8283e'); g.p(22, 9, '#c8283e');
    g.ell(19, 4, 4, 3, '#c8283e'); g.ell(19, 4, 2, 2, '#ff6a7a'); g.p(14, 6, '#2e6a3a'); g.p(24, 6, '#2e6a3a');
    for (const [x, y] of [[14, 18], [24, 20], [15, 26], [23, 27]]) g.poly([[x, y], [x + (x < 19 ? -3 : 3), y - 2], [x, y + 2]], '#e8e0a0');
    g.ell(19, -0.5, 6, 1.4, 'rgba(0,0,0,0)'); g.line(14, 0, 24, 0, '#e8c868');
    return g.finish({ outline: '#10241a' });
  },
  golem() {
    const g = new Pix(36, 46);
    const s = '#8a9a92', sd = '#5a6a66', sl = '#b4c4bc';
    g.r(10, 30, 7, 15, sd); g.r(20, 30, 7, 15, s); g.r(8, 43, 10, 3, '#3a4a46'); g.r(19, 43, 10, 3, '#3a4a46');
    g.r(9, 13, 19, 18, s); g.r(9, 13, 19, 3, sl); g.r(9, 27, 19, 4, sd);
    g.r(12, 3, 13, 11, s); g.r(12, 3, 13, 2, sl); g.r(14, 8, 3, 2, '#f0c860'); g.r(20, 8, 3, 2, '#f0c860'); g.p(15, 8, '#fff'); g.p(21, 8, '#fff');
    g.r(3, 14, 6, 18, sd); g.r(28, 14, 6, 18, s); g.r(2, 30, 8, 5, sl); g.r(27, 30, 8, 5, sl);
    g.line(15, 19, 21, 24, '#3a4a46'); g.line(21, 24, 18, 29, '#3a4a46'); g.r(17, 20, 3, 3, '#f0c860'); g.p(18, 21, '#fff');
    g.r(10, 15, 4, 2, '#4a8a58'); g.r(23, 24, 4, 3, '#4a8a58'); g.r(4, 20, 3, 4, '#4a8a58'); g.r(13, 11, 3, 1, '#4a8a58'); g.r(15, 38, 5, 3, '#4a8a58');
    g.line(12, 3, 12, 0, '#e6cf8a'); g.line(24, 3, 24, 0, '#e6cf8a');
    return g.finish({ outline: '#18221e' });
  },
  sporeling() {
    const g = new Pix(26, 26);
    g.ell(13, 10, 12, 8, '#b8503a'); g.r(2, 13, 22, 3, '#8a3a2a'); g.ell(8, 7, 2, 2, '#f4ecda'); g.ell(17, 8, 2.5, 2.5, '#f4ecda'); g.ell(13, 4, 1.5, 1.5, '#f4ecda');
    g.r(8, 15, 10, 9, '#e8dcc8'); g.r(8, 22, 10, 2, '#c8b8a0');
    g.r(10, 18, 2, 3, '#1c1024'); g.r(14, 18, 2, 3, '#1c1024'); g.p(10, 18, '#fff'); g.p(14, 18, '#fff');
    g.p(4, 1, '#f0e8a0'); g.p(21, 2, '#f0e8a0'); g.p(1, 7, '#f0e8a0'); g.p(23, 12, '#f0e8a0');
    return g.finish({ outline: '#2a1410' });
  },
  glitchsprite() {
    const g = new Pix(28, 28);
    g.r(2, 6, 18, 18, 'rgba(255,90,184,0.9)'); g.r(8, 3, 18, 18, 'rgba(48,226,210,0.9)');
    g.r(5, 5, 18, 18, '#0d1424');
    checker(g, 5, 5, 6, 6, '#ff5ab8', '#0d1424', 3);
    g.r(8, 10, 4, 4, '#30e2d2'); g.r(16, 10, 4, 4, '#30e2d2'); g.r(9, 11, 2, 2, '#fff'); g.r(17, 11, 2, 2, '#fff');
    g.r(9, 17, 10, 2, '#ff5ab8');
    for (let i = 0; i < 6; i++) g.r(1 + ((i * 11) % 22), 4 + ((i * 7) % 20), 4 + (i % 3) * 2, 1, i % 2 ? '#30e2d2' : '#ff5ab8');
    g.r(23, 14, 4, 2, '#0d1424'); g.r(0, 20, 5, 2, '#0d1424');
    return g.finish({ outline: '#050810' });
  },
  bugknight() {
    const g = new Pix(34, 46);
    const a = '#465070', ad = '#2a3248', al = '#7a88b0';
    g.r(9, 31, 6, 13, ad); g.r(18, 31, 6, 13, a); g.r(7, 43, 9, 3, '#1a2030'); g.r(17, 43, 9, 3, '#1a2030');
    g.r(8, 14, 18, 18, a); g.r(8, 14, 18, 3, al);
    checker(g, 11, 18, 8, 8, '#ff00ff', '#0a0a0a', 4);
    g.ell(9, 15, 5, 4, ad); g.ell(25, 15, 5, 4, a);
    checker(g, 5, 13, 6, 4, '#ff00ff', '#0a0a0a', 2);
    g.r(12, 3, 11, 12, a); g.r(12, 3, 11, 2, al); g.r(13, 8, 9, 2, '#0a0a0a'); g.r(14, 8, 7, 1, '#30e2d2'); g.r(16, 0, 3, 4, '#c8283e');
    g.r(3, 17, 5, 13, ad); g.r(27, 17, 5, 13, a);
    g.line(30, 30, 30, 4, '#30e2d2', 2); g.line(31, 8, 33, 8, '#c8fff8'); g.r(28, 26, 5, 2, '#30e2d2');
    g.r(24, 26, 3, 4, '#ff00ff'); g.p(10, 36, '#30e2d2'); g.p(19, 39, '#ff5ab8'); g.p(5, 22, '#30e2d2');
    return g.finish({ outline: '#080a14' });
  },
  daemon() {
    const g = new Pix(50, 34);
    const c = '#22384a', cl = '#30e2d2';
    const pts = [[6, 26], [12, 22], [19, 26], [26, 20], [31, 14], [36, 10]];
    for (let i = 0; i < pts.length; i++) { const r = 4 + i * 0.7; g.ell(pts[i][0], pts[i][1], r, r, i % 2 ? c : shadeC(c, 0.08)); g.r(pts[i][0] - 1, pts[i][1] - r + 1, 2, 2, cl); }
    g.poly([[34, 7], [44, 6], [48, 11], [44, 15], [36, 15]], c); g.r(36, 5, 3, 2, cl); g.r(40, 5, 2, 2, cl);
    g.r(38, 9, 3, 2, '#ff3a5a'); g.p(38, 9, '#fff'); g.r(44, 13, 5, 1, '#f4ecda'); g.p(45, 14, '#f4ecda'); g.p(47, 14, '#f4ecda');
    g.line(2, 28, 0, 32, c, 2); for (let i = 0; i < 5; i++) g.p(6 + i * 7, 30 + (i % 2), i % 2 ? '#ff5ab8' : cl);
    g.r(15, 24, 2, 1, '#ff5ab8'); g.r(28, 16, 2, 1, '#ff5ab8');
    return g.finish({ outline: '#060a12' });
  },
  firewall() {
    const g = new Pix(30, 32);
    g.poly([[15, 3], [26, 9], [26, 21], [15, 27], [4, 21], [4, 9]], '#3a1a22'); g.poly([[15, 7], [22, 11], [22, 19], [15, 23], [8, 19], [8, 11]], '#5a2a30');
    g.ell(15, 15, 5, 5, '#ffb03a'); g.ell(15, 15, 3, 3, '#ff4a2a'); g.r(14, 13, 2, 5, '#1c0810'); g.p(14, 14, '#fff');
    g.poly([[10, 27], [15, 31], [20, 27]], '#ff7a2a'); g.poly([[12, 27], [15, 30], [18, 27]], '#ffd060');
    g.p(4, 6, '#ff7a2a'); g.p(26, 6, '#ff7a2a'); g.p(1, 15, '#ffd060'); g.p(29, 14, '#ffd060');
    return g.finish({ outline: '#1a080c' });
  },

  /* ------------------------------ BOSSES ------------------------------ */
  cosette() {
    const g = new Pix(56, 76);
    // halo of staff lines
    for (let i = 0; i < 5; i++) { g.line(6, 20 + i * 2, 28, 8 + i, '#e8c868'); g.line(50, 20 + i * 2, 28, 8 + i, '#e8c868'); }
    g.ell(28, 20, 22, 4, 'rgba(0,0,0,0)');
    // hair back
    g.poly([[18, 12], [10, 30], [8, 56], [16, 50], [22, 30]], '#8a1a2a'); g.poly([[38, 12], [46, 30], [48, 56], [40, 50], [34, 30]], '#8a1a2a');
    // gown
    g.poly([[20, 30], [36, 30], [40, 48], [52, 72], [4, 72], [16, 48]], '#f0e4d0');
    g.poly([[22, 32], [34, 32], [36, 48], [46, 70], [10, 70], [20, 48]], '#e0d0b8');
    g.line(28, 34, 28, 70, '#c8b090'); g.line(22, 40, 14, 70, '#c8b090'); g.line(34, 40, 42, 70, '#c8b090');
    g.r(21, 30, 14, 3, '#e8c868'); g.r(20, 36, 16, 2, '#c8283e');
    // arms raised
    g.line(21, 33, 10, 26, '#f4dcc8', 3); g.line(35, 33, 46, 26, '#f4dcc8', 3); g.line(10, 26, 8, 16, '#f4dcc8', 3); g.line(46, 26, 48, 16, '#f4dcc8', 3);
    g.r(6, 12, 4, 5, '#f4dcc8'); g.r(46, 12, 4, 5, '#f4dcc8');
    // head — blank face, singing mouth
    g.ell(28, 20, 8, 9, '#f8f0e4'); g.poly([[20, 12], [36, 12], [34, 8], [22, 8]], '#8a1a2a'); g.ell(28, 12, 9, 4, '#a82a3a');
    g.ell(28, 27, 2.5, 3.5, '#2a0a14'); g.r(25, 19, 2, 1, '#e0d0c0'); g.r(30, 19, 2, 1, '#e0d0c0');
    g.r(26, 21, 4, 1, '#f0e4d8');
    // notes
    for (const [x, y] of [[2, 40], [50, 44], [4, 56], [52, 30]]) { g.ell(x, y, 2, 1.5, '#e8c868'); g.line(x + 2, y, x + 2, y - 6, '#e8c868'); g.p(x + 3, y - 6, '#e8c868'); }
    g.p(27, 18, '#c8283e'); g.p(26, 18, '#c8283e');
    fadeRows(g, 62, 74, 56);
    return g.finish({ outline: '#2a1420' });
  },
  warden() {
    const g = new Pix(72, 80);
    const b = '#c8963a', bd = '#8a6420', bl = '#f0d078', dk = '#2a2028';
    g.r(18, 54, 12, 22, bd); g.r(38, 54, 12, 22, b); g.r(14, 74, 20, 6, dk); g.r(34, 74, 20, 6, dk);
    for (const x of [21, 41]) { g.r(x, 60, 6, 2, bl); g.r(x, 66, 6, 2, bl); }
    // torso — barrel with bell
    g.r(14, 22, 40, 34, b); g.r(14, 22, 40, 5, bl); g.r(14, 50, 40, 6, bd);
    for (let x = 17; x < 52; x += 6) { g.p(x, 25, '#fff8d0'); g.p(x, 52, '#fff8d0'); }
    g.poly([[34, 30], [44, 38], [46, 50], [22, 50], [24, 38]], '#e8b850'); g.r(22, 48, 24, 3, bd); g.poly([[34, 32], [40, 38], [42, 48], [26, 48], [28, 38]], '#f8d888');
    g.r(33, 46, 3, 8, dk); g.ell(34.5, 56, 3, 3, dk); g.p(34, 43, '#ff5a3a');
    // shoulders + head
    g.ell(11, 26, 9, 8, bl); g.ell(57, 26, 9, 8, b); g.ell(11, 26, 5, 4, bd); g.ell(57, 26, 5, 4, bd);
    g.r(24, 6, 20, 17, b); g.r(24, 6, 20, 3, bl); g.r(28, 12, 12, 4, dk); g.r(29, 13, 4, 2, '#ff5a3a'); g.r(35, 13, 4, 2, '#ff5a3a'); g.p(30, 13, '#fff'); g.p(36, 13, '#fff');
    g.poly([[34, 0], [40, 8], [28, 8]], '#c8283e'); g.r(24, 20, 20, 3, bd);
    // arms
    g.r(0, 30, 9, 22, bd); g.r(59, 30, 9, 22, bd); g.r(-1, 50, 11, 6, dk);
    // hammer (right)
    g.r(62, 4, 4, 52, '#5a3a2a'); g.r(52, 0, 20, 14, '#8a8a98'); g.r(52, 0, 20, 3, '#c8c8d8'); g.r(52, 11, 20, 3, '#5a5a68'); g.r(58, 4, 8, 6, '#ffd060');
    // gear (left)
    g.ell(4, 60, 6, 6, bd); g.ell(4, 60, 3, 3, dk); for (let a = 0; a < 8; a++) g.r(4 + Math.round(Math.cos(a * Math.PI / 4) * 7) - 1, 60 + Math.round(Math.sin(a * Math.PI / 4) * 7) - 1, 2, 2, bd);
    // steam
    g.p(18, 20, '#e8e0e8'); g.p(16, 17, '#e8e0e8'); g.p(50, 18, '#e8e0e8'); g.p(53, 15, '#e8e0e8');
    return g.finish({ outline: '#1c1418' });
  },
  chorister() {
    const g = new Pix(90, 92);
    g.sym = true;
    const wcols = ['#e8f4ee', '#b8e0d0', '#7ac0a8'];
    // wings: three pairs, fanned
    g.poly([[43, 40], [4, 14], [0, 36], [16, 58], [43, 50]], wcols[2]);
    g.poly([[43, 36], [12, 6], [6, 28], [22, 50], [43, 46]], wcols[1]);
    g.poly([[43, 32], [22, 0], [16, 24], [30, 42], [43, 40]], wcols[0]);
    for (let i = 0; i < 6; i++) { g.line(43, 40, 6 + i * 7, 8 + i * 6, '#5a9a88'); }
    g.poly([[43, 56], [22, 84], [32, 68]], '#7ac0a8');
    g.sym = false;
    // strings
    for (const x of [12, 30, 46, 62, 78]) g.line(x, 0, 45, 22, '#e8dcb8');
    // body
    g.poly([[36, 34], [54, 34], [50, 62], [58, 88], [32, 88], [40, 62]], '#f0f4ee');
    g.poly([[40, 36], [50, 36], [47, 62], [52, 84], [38, 84], [43, 62]], '#c8d8d0');
    g.r(34, 34, 22, 4, '#e6cf8a'); g.r(40, 44, 10, 2, '#e6cf8a'); g.r(38, 62, 14, 2, '#e6cf8a');
    g.line(36, 38, 22, 50, '#f0f4ee', 3); g.line(54, 38, 68, 50, '#f0f4ee', 3); g.line(22, 50, 18, 62, '#f0f4ee', 2); g.line(68, 50, 72, 62, '#f0f4ee', 2);
    for (let i = 0; i < 4; i++) { g.line(18 + i, 62, 16 + i * 2, 68, '#f0f4ee'); g.line(72 - i, 62, 74 - i * 2, 68, '#f0f4ee'); }
    // head — porcelain mask
    g.ell(45, 24, 8, 10, '#f8f8f4'); g.r(40, 20, 3, 4, '#1c2a24'); g.r(47, 20, 3, 4, '#1c2a24'); g.p(41, 21, '#58e0a8'); g.p(48, 21, '#58e0a8');
    g.line(42, 30, 48, 30, '#8ab8a8'); g.line(45, 24, 45, 28, '#c8d8d0');
    g.ell(45, 15, 9, 3, '#7ac0a8');
    // halo
    for (let a = 0; a < 40; a++) { const t = a / 40 * TAU; g.p(45 + Math.cos(t) * 16, 6 + Math.sin(t) * 4, '#f4d878'); g.p(45 + Math.cos(t) * 17, 6 + Math.sin(t) * 5, '#c9a24a'); }
    // verdigris
    g.r(37, 44, 3, 2, '#4a9a7a'); g.r(52, 72, 4, 3, '#4a9a7a'); g.r(34, 78, 3, 3, '#4a9a7a');
    return g.finish({ outline: '#123028' });
  },
  regent() {
    const g = new Pix(96, 92);
    const k = '#0e1220', kl = '#2a3452', red = '#ff2a4a', cy = '#30e2d2', mg = '#ff00ff';
    // tendrils
    for (let i = 0; i < 9; i++) { const x = 16 + i * 8; const len = 22 + ((i * 13) % 14); g.line(x, 58, x + ((i % 2) ? 3 : -3), 58 + len, i % 3 === 0 ? mg : cy, 2); g.r(x - 2 + ((i % 2) ? 3 : -3), 58 + len, 5, 3, i % 3 === 0 ? mg : cy); }
    // main cube (isometric)
    g.poly([[48, 4], [88, 22], [88, 60], [48, 78], [8, 60], [8, 22]], k);
    g.poly([[48, 4], [88, 22], [48, 40], [8, 22]], kl);
    g.poly([[48, 40], [88, 22], [88, 60], [48, 78]], '#141a30');
    g.line(48, 40, 48, 78, cy); g.line(8, 22, 48, 40, cy); g.line(88, 22, 48, 40, cy);
    checker(g, 12, 30, 12, 12, mg, '#000', 4); checker(g, 72, 44, 12, 12, mg, '#000', 4);
    // eye
    g.ell(48, 40, 14, 10, '#f4f4f0'); g.ell(48, 40, 8, 8, red); g.r(47, 32, 2, 16, '#12040a'); g.p(45, 36, '#fff'); g.p(46, 36, '#fff');
    g.line(34, 32, 62, 32, k, 2);
    for (let i = 0; i < 12; i++) g.r(10 + ((i * 29) % 76), 8 + ((i * 17) % 60), 3, 1, i % 2 ? cy : mg);
    g.r(30, 2, 4, 6, red); g.r(60, 4, 4, 5, red);
    g.r(20, 66, 6, 4, mg); g.r(70, 70, 5, 4, cy); g.r(4, 80, 4, 4, cy); g.r(90, 30, 4, 4, mg);
    return g.finish({ outline: '#04050c' });
  },
  curator1() {
    const g = new Pix(64, 88);
    // picture frame
    g.r(0, 2, 64, 4, '#c9a24a'); g.r(0, 82, 64, 4, '#c9a24a'); g.r(0, 2, 4, 84, '#c9a24a'); g.r(60, 2, 4, 84, '#c9a24a');
    g.r(4, 6, 56, 2, '#8a6a20'); g.r(4, 78, 56, 4, '#8a6a20'); g.r(4, 6, 2, 76, '#8a6a20'); g.r(58, 6, 2, 76, '#8a6a20');
    g.r(3, 3, 4, 4, '#f0d078'); g.r(57, 3, 4, 4, '#f0d078'); g.r(3, 79, 4, 4, '#f0d078'); g.r(57, 79, 4, 4, '#f0d078');
    // cape
    g.poly([[32, 22], [56, 52], [60, 80], [4, 80], [8, 52]], '#e8dfd0');
    g.poly([[32, 26], [50, 52], [54, 78], [10, 78], [14, 52]], '#f8f2e8');
    // robe
    g.poly([[24, 30], [40, 30], [46, 78], [18, 78]], '#f6f0e6'); g.poly([[28, 30], [36, 30], [38, 78], [26, 78]], '#c8283e');
    g.line(24, 30, 18, 78, '#c8283e'); g.line(40, 30, 46, 78, '#c8283e');
    // head
    g.ell(32, 22, 7, 8, '#f8f4ec'); g.r(25, 2, 14, 12, '#f6f0e6'); g.r(21, 13, 22, 3, '#f6f0e6'); g.r(25, 11, 14, 2, '#c8283e');
    g.ell(29, 22, 2, 1.5, '#c8283e'); g.ell(35, 22, 2, 1.5, '#c8283e'); g.line(29, 28, 35, 28, '#c8283e'); g.p(32, 25, '#d8ccc0');
    // arms + brush
    g.line(26, 34, 14, 46, '#f6f0e6', 3); g.line(38, 34, 50, 44, '#f6f0e6', 3);
    g.line(50, 44, 58, 20, '#8a5a2a', 2); g.poly([[58, 20], [54, 8], [62, 10]], '#c8283e'); g.p(58, 6, '#ff6a7a');
    for (let i = 0; i < 6; i++) drip(g, 16 + i * 8, 76, 3 + (i % 3) * 2, '#c8283e');
    g.r(28, 44, 8, 2, '#c8283e');
    return g.finish({ outline: '#3a1a1a' });
  },
  curator2() {
    const g = new Pix(120, 112);
    const cx = 60, cy = 56;
    // outer halo ring
    for (let a = 0; a < 200; a++) { const t = a / 200 * TAU; for (const [r, c] of [[52, '#c9a24a'], [50, '#f0d078'], [47, '#c8283e'], [45, '#8a1a2a']]) g.p(cx + Math.cos(t) * r * 1.1, cy + Math.sin(t) * r, c); }
    for (let a = 0; a < 12; a++) { const t = a / 12 * TAU; g.r(cx + Math.cos(t) * 56 * 1.1 - 2, cy + Math.sin(t) * 56 - 2, 5, 5, '#f0d078'); }
    // robes as streaks
    g.poly([[60, 34], [84, 60], [96, 108], [24, 108], [36, 60]], '#f6f0e6');
    g.poly([[60, 40], [76, 62], [84, 106], [36, 106], [44, 62]], '#e0d6c8');
    g.poly([[60, 44], [68, 64], [72, 106], [48, 106], [52, 64]], '#c8283e');
    // six arms with brushes
    const arms = [[-1, -0.9], [-1, -0.2], [-1, 0.6], [1, -0.9], [1, -0.2], [1, 0.6]];
    for (const [d, s] of arms) {
      const sx = cx + d * 8, sy = cy - 6 + s * 8, ex = cx + d * (38 + s * 4), ey = cy + s * 32 - 6;
      g.line(sx, sy, ex, ey, '#f6f0e6', 3); g.line(ex, ey, ex + d * 8, ey - 8, '#8a5a2a', 2);
      g.poly([[ex + d * 8, ey - 8], [ex + d * 14, ey - 16], [ex + d * 10, ey - 5]], '#c8283e');
    }
    // head + mask + top hat
    g.ell(60, 36, 12, 13, '#f8f4ec'); g.r(48, 8, 24, 18, '#f6f0e6'); g.r(42, 24, 36, 4, '#f6f0e6'); g.r(48, 20, 24, 3, '#c8283e');
    g.ell(54, 37, 3, 2, '#c8283e'); g.ell(66, 37, 3, 2, '#c8283e'); g.line(54, 46, 66, 46, '#c8283e'); g.line(52, 44, 54, 46, '#c8283e'); g.line(68, 44, 66, 46, '#c8283e');
    g.p(54, 37, '#ffb0b8'); g.p(66, 37, '#ffb0b8');
    for (let i = 0; i < 10; i++) drip(g, 30 + i * 6, 106 - (i % 3) * 4, 3 + (i % 4), '#c8283e');
    return g.finish({ outline: '#3a1218' });
  },
};

/* Procedural size of an enemy (drives external-art fitting and field size). */
Art.enemyProcSize = function (id) {
  const key = 'es:' + id;
  if (this.cache[key]) return this.cache[key];
  const def = typeof ENEMIES !== 'undefined' ? ENEMIES[id] : null;
  const fn = ENEMY_ART[(def && def.art) || id] || ENEMY_ART.wisp;
  const c = fn();
  return (this.cache[key] = { w: c.width, h: c.height, c });
};

/* Battle-size art. External PNGs (assets/ai/enemy_<id>.png) are fitted to the
   same on-screen box the procedural sprite would occupy, and flagged .ext so
   the battle draws them at 1:1 instead of pixel-doubling. */
Art.enemy = function (id) {
  const key = 'e:' + id;
  if (this.cache[key]) return this.cache[key];
  const def = typeof ENEMIES !== 'undefined' ? ENEMIES[id] : null;
  const ps = this.enemyProcSize(id), sc = (def && def.scale) || 2;
  let c = null;
  if (Assets.has('enemy_' + id)) { c = Assets.fit('enemy_' + id, Math.round(ps.w * sc), Math.round(ps.h * sc)); if (c) c.ext = true; }
  if (!c) c = ps.c;
  return (this.cache[key] = c);
};
/* Field-size art (roughly the procedural size, never the doubled one). */
Art.enemyField = function (id) {
  const key = 'ef:' + id;
  if (this.cache[key]) return this.cache[key];
  const ps = this.enemyProcSize(id);
  let c = ps.c;
  if (Assets.has('enemy_' + id)) c = Assets.fit('enemy_' + id, ps.w, ps.h) || c;
  return (this.cache[key] = c);
};
