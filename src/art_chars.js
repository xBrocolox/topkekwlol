'use strict';
/* ==========================================================================
   VERMILION REQUIEM — art_chars.js
   Procedural character art: field sprites (16x24, 4 dirs x walk cycle),
   battle sprites (skeleton-posed side view), and portraits (64x64).
   Any of these can be replaced by dropping PNGs in assets/ai/ (see Assets).
   ========================================================================== */

const LOOKS = {
  vesper: {
    name: 'Vesper', skin: '#f2cba8', hair: '#2a1533', hairStyle: 'ponytail', eye: '#c8283e',
    coat: '#b3263a', trim: '#ecc868', shirt: '#f4ecda', pants: '#28213c', boots: '#3b2732',
    scarf: '#f4ecda', coatLen: 'long', weapon: 'rapier', blush: true,
  },
  gaspard: {
    name: 'Gaspard', skin: '#c99671', hair: '#392822', hairStyle: 'short', eye: '#3a2a22',
    hat: 'bowler', hatCol: '#25202b', coat: '#2e5c68', trim: '#c9964a', shirt: '#dcd3bc',
    pants: '#3f3849', boots: '#2a1f24', coatLen: 'long', goggles: '#c9964a', beard: '#392822', weapon: 'revolver',
  },
  ilse: {
    name: 'Ilse', skin: '#f7e2d3', hair: '#dedcf2', hairStyle: 'long', eye: '#9a66d8',
    hat: 'veil', hatCol: '#241a30', coat: '#241a30', trim: '#9a66d8', shirt: '#f0e6f8',
    pants: '#241a30', boots: '#161020', coatLen: 'dress', weapon: 'parasol',
  },
  tally: {
    name: 'Tally', skin: '#ecd0c0', hair: '#30e2d2', hairStyle: 'wild', eye: '#30e2d2',
    coat: '#12303b', trim: '#30e2d2', shirt: '#0b1e26', pants: '#0b1e26', boots: '#30e2d2',
    coatLen: 'short', glitch: true, weapon: 'glitchstaff', visor: true,
  },
  curator: {
    name: 'The Curator', skin: '#f6f0e6', hair: '#f6f0e6', hairStyle: 'none', eye: '#c8283e',
    hat: 'tophat', hatCol: '#f6f0e6', coat: '#f6f0e6', trim: '#c8283e', shirt: '#c8283e',
    pants: '#f6f0e6', boots: '#f6f0e6', coatLen: 'dress', mask: true, cape: '#e8dfd0', weapon: 'brush',
  },
  oriel: {
    name: 'Oriel', skin: '#d8b48f', hair: '#e8ecf0', hairStyle: 'long', eye: '#58b088', beard: '#e8ecf0',
    hat: 'hood', hatCol: '#3f8a70', coat: '#3f8a70', trim: '#e6cf8a', shirt: '#d8eede',
    pants: '#2e6652', boots: '#4a3a2a', coatLen: 'dress',
  },
  aura: {
    name: 'Aura', skin: '#f4e8f0', hair: '#f0f4ff', hairStyle: 'long', eye: '#7fd0ff',
    coat: '#e6eeff', trim: '#7fd0ff', shirt: '#ffffff', pants: '#e6eeff', boots: '#bcd4f8',
    coatLen: 'dress', glitch: true, small: true,
  },
  /* townsfolk archetypes */
  citizenM: { name: 'Citizen', skin: '#dcae88', hair: '#4a3626', hairStyle: 'short', eye: '#3a2a22', hat: 'tophat', hatCol: '#2c2634', coat: '#5a4a6a', trim: '#b8a878', shirt: '#e8e0d0', pants: '#2c2634', boots: '#241c22', coatLen: 'long' },
  citizenF: { name: 'Citizen', skin: '#f0c8a8', hair: '#7a3a2a', hairStyle: 'bun', eye: '#4a3a30', coat: '#7a4058', trim: '#e8d0a0', shirt: '#f4ecda', pants: '#7a4058', boots: '#3a2a2a', coatLen: 'dress' },
  merchant: { name: 'Merchant', skin: '#d0a07a', hair: '#2a2028', hairStyle: 'short', eye: '#2a2028', hat: 'beret', hatCol: '#a03c3c', coat: '#c89a4a', trim: '#f0dca0', shirt: '#f0e8d8', pants: '#3a3040', boots: '#2a2024', coatLen: 'long', beard: '#2a2028' },
  guard: { name: 'Guard', skin: '#cfa27c', hair: '#3a2a22', hairStyle: 'short', eye: '#2a2028', hat: 'cap', hatCol: '#2a3a5a', coat: '#2a3a5a', trim: '#d0b060', shirt: '#dcd3bc', pants: '#22283a', boots: '#1a1a22', coatLen: 'long' },
  child: { name: 'Child', skin: '#f2cba8', hair: '#5a3a28', hairStyle: 'short', eye: '#3a2a22', coat: '#6a9ac8', trim: '#f0e0b0', shirt: '#f4ecda', pants: '#3a3a5a', boots: '#3a2a2a', coatLen: 'short', small: true },
  singer: { name: 'Singer', skin: '#f4dcc8', hair: '#b8283a', hairStyle: 'long', eye: '#7a3a5a', coat: '#f0e4d0', trim: '#e0b850', shirt: '#f8f0e0', pants: '#f0e4d0', boots: '#c8b090', coatLen: 'dress' },
  choirF: { name: 'Choirfolk', skin: '#dcc0a0', hair: '#c8a860', hairStyle: 'long', eye: '#487858', coat: '#4a9a7a', trim: '#e6cf8a', shirt: '#d8eede', pants: '#2e6652', boots: '#4a3a2a', coatLen: 'dress' },
  choirM: { name: 'Choirfolk', skin: '#c8a07a', hair: '#7a5a3a', hairStyle: 'short', eye: '#3a4a3a', hat: 'hood', hatCol: '#4a9a7a', coat: '#4a9a7a', trim: '#e6cf8a', shirt: '#d8eede', pants: '#2e6652', boots: '#4a3a2a', coatLen: 'dress' },
  avatarA: { name: 'Avatar', skin: '#e0c8d8', hair: '#ff5ab8', hairStyle: 'wild', eye: '#ff5ab8', coat: '#241a3a', trim: '#ff5ab8', shirt: '#120c22', pants: '#120c22', boots: '#ff5ab8', coatLen: 'short', glitch: true, visor: true },
  avatarB: { name: 'Avatar', skin: '#c8d8e0', hair: '#f0e040', hairStyle: 'short', eye: '#f0e040', coat: '#1a3a2a', trim: '#f0e040', shirt: '#0c2216', pants: '#0c2216', boots: '#f0e040', coatLen: 'long', glitch: true },
  avatarC: { name: 'Avatar', skin: '#dcd0c8', hair: '#8a7aff', hairStyle: 'bun', eye: '#8a7aff', coat: '#2a2a5a', trim: '#8a7aff', shirt: '#14143a', pants: '#14143a', boots: '#8a7aff', coatLen: 'dress', glitch: true },
};

const Art = { cache: {} };

/* -------------------------------------------------------------------------
   Field sprite: 16x24 chibi-proportion RPG walker
   ------------------------------------------------------------------------- */
function drawHatField(g, o, dir) {
  const c = o.hatCol || o.coat, side = dir === 'left';
  const cx = side ? 7 : 8;
  switch (o.hat) {
    case 'bowler':
      g.r(cx - 3, 1, 6, 2, c); g.r(cx - 2, 0, 4, 1, c); g.r(cx - 5, 3, 10, 1, shadeC(c, -0.1)); g.r(cx - 3, 2, 6, 1, o.trim || c);
      break;
    case 'tophat':
      g.r(cx - 3, -1, 6, 4, c); g.r(cx - 5, 3, 10, 1, shadeC(c, -0.1)); g.r(cx - 3, 2, 6, 1, o.trim || '#c8283e');
      break;
    case 'veil':
      g.r(cx - 4, 1, 8, 2, c); g.r(cx - 2, 0, 5, 1, c); g.p(cx + 3, -1, o.trim); g.p(cx + 4, -2, o.trim); g.r(cx - 4, 3, 8, 1, shadeC(c, .1));
      break;
    case 'hood':
      g.r(cx - 5, 1, 10, 3, c); g.r(cx - 4, 0, 8, 1, c); g.r(cx - 5, 4, 2, 5, c); g.r(cx + 3, 4, 2, 5, c);
      break;
    case 'beret':
      g.r(cx - 4, 1, 8, 2, c); g.r(cx - 3, 0, 6, 1, c); g.p(cx + 1, -1, c); g.p(cx + 1, 0, o.trim);
      break;
    case 'cap':
      g.r(cx - 4, 1, 8, 2, c); g.r(cx - 5, 3, 10, 1, shadeC(c, -0.15)); g.p(cx, 2, o.trim);
      break;
  }
}

function drawHairField(g, o, dir, st, layer) {
  const h = o.hair, hd = shadeC(h, -0.2), hl = shadeC(h, 0.25), style = o.hairStyle;
  if (style === 'none') return;
  const down = dir === 'down', up = dir === 'up', side = dir === 'left';
  const hatted = !!o.hat && o.hat !== 'veil';
  if (layer === 'back') {
    if (style === 'long') {
      if (down) g.r(4, 4, 8, 9, hd);
      if (up) g.r(4, 2, 8, 11, h);
      if (side) g.r(7, 3, 4, 9, hd);
    }
    if (style === 'ponytail') {
      if (up) { g.r(7, 8, 2, 6, h); g.p(7, 14, hd); g.p(8, 14, hd); }
      if (side) { const sw = st; g.r(10, 4, 2, 4, hd); g.r(11 + (sw > 0 ? 1 : 0), 7, 2, 5, hd); }
      if (down) { g.r(12, 5, 2, 6, hd); g.p(12, 11, h); }
    }
    if (style === 'bun' && !down) g.r(6, 0, 4, 2, h);
    return;
  }
  // front layer
  if (down) {
    if (!hatted) {
      g.r(4, 2, 8, 3, h); g.r(3, 3, 1, 4, h); g.r(12, 3, 1, 4, h);
      g.r(5, 5, 2, 1, h); g.r(9, 5, 1, 1, h); g.p(6, 2, hl); g.p(7, 2, hl); g.p(5, 3, hl);
    } else { g.r(4, 4, 8, 1, h); g.r(4, 5, 1, 2, h); g.r(11, 5, 1, 2, h); }
    if (style === 'long') { g.r(4, 5, 1, 6, h); g.r(11, 5, 1, 6, h); }
    if (style === 'bun') { g.r(6, 0, 4, 2, h); g.p(7, 0, hl); }
    if (style === 'wild') { g.p(4, 1, h); g.p(7, 0, h); g.p(9, 0, h); g.p(11, 1, h); g.p(3, 5, h); g.p(12, 5, h); g.p(6, 1, hl); }
  } else if (up) {
    if (style !== 'long') g.r(4, 2, 8, 7, h);
    if (style === 'wild') { g.p(4, 1, h); g.p(7, 0, h); g.p(9, 0, h); g.p(11, 1, h); g.p(6, 2, hl); }
    g.p(6, 3, hl); g.p(7, 3, hl);
  } else if (side) {
    if (!hatted) { g.r(4, 2, 7, 3, h); g.r(7, 5, 4, 3, h); g.r(4, 4, 1, 1, h); g.p(5, 2, hl); g.p(6, 2, hl); }
    else { g.r(6, 4, 5, 1, h); g.r(8, 5, 3, 3, h); }
    if (style === 'wild') { g.p(5, 1, h); g.p(8, 1, h); g.p(10, 2, h); g.p(4, 3, h); g.p(11, 4, h); }
    if (style === 'bun') g.r(8, 0, 4, 2, h);
  }
}

function fieldSprite(o, dir, frame) {
  const g = new Pix(16, 24);
  const S = o.skin, Sd = shadeC(S, -0.14);
  const coat = o.coat, coatD = shadeC(coat, -0.22), trim = o.trim || shadeC(coat, 0.3);
  const pants = o.pants || '#2a2440', boots = o.boots || '#2a1f2a';
  const up = dir === 'up', side = dir === 'left', down = dir === 'down';
  const st = frame === 0 ? 0 : frame === 1 ? 1 : -1;
  const yo = o.small ? 2 : 0; // small chars: squash by drawing everything offset
  g.x.save(); g.x.translate(0, yo);

  // cape (behind body)
  if (o.cape && (up || side)) { g.r(3, 9, 10, 12, o.cape); g.r(3, 20, 10, 1, shadeC(o.cape, -0.2)); }

  // legs
  if (!side) {
    const ll = 6 + (st === 1 ? 1 : 0) - (st === -1 ? 1 : 0), rl = 6 - (st === 1 ? 1 : 0) + (st === -1 ? 1 : 0);
    g.r(5, 16, 3, ll, pants); g.r(5, 16 + ll - 2, 3, 2, boots);
    g.r(8, 16, 3, rl, shadeC(pants, -0.08)); g.r(8, 16 + rl - 2, 3, 2, boots);
  } else {
    const fx = 6 - 2 * st, bx = 7 + 2 * st;
    g.r(bx, 16, 3, 6, shadeC(pants, -0.18)); g.r(bx, 20, 3, 2, shadeC(boots, -0.15));
    g.r(fx, 16, 3, 6, pants); g.r(fx, 20, 3, 2, boots); g.p(fx - 1, 21, boots);
  }

  // torso + coat
  const sway = st;
  if (!side) {
    g.r(4, 9, 8, 7, coat);
    if (o.coatLen === 'long') { g.r(4, 16, 8, 3, coat); g.r(3 + (sway > 0 ? 1 : 0), 19, 10, 1, coatD); g.r(3, 18, 10, 1, coat); g.r(5, 16, 1, 3, coatD); g.r(10, 16, 1, 3, coatD); }
    if (o.coatLen === 'dress') { g.r(3, 16, 10, 5, coat); g.r(2, 20, 12, 1, coatD); g.r(3 + sway, 21, 10, 1, trim); g.r(7, 16, 2, 5, shadeC(coat, 0.12)); }
    if (o.coatLen === 'short') { g.r(4, 15, 8, 1, coatD); }
    if (down) {
      g.r(7, 9, 2, 5, o.shirt || '#eee'); g.p(7, 14, trim); g.p(8, 14, trim);
      g.r(4, 14, 8, 1, trim); g.p(7, 11, trim); g.p(8, 12, trim);
      if (o.glitch) { g.p(5, 10, trim); g.p(10, 12, trim); g.p(6, 13, trim); }
    }
    if (up && o.glitch) { g.p(6, 11, trim); g.p(9, 13, trim); }
    // arms
    const la = st === 1 ? 1 : st === -1 ? -1 : 0;
    g.r(2, 10 - la, 2, 5, coatD); g.r(2, 15 - la, 2, 1, S);
    g.r(12, 10 + la, 2, 5, coatD); g.r(12, 15 + la, 2, 1, S);
    g.r(3, 10, 1, 1, trim); g.r(12, 10, 1, 1, trim);
    // scarf / collar
    if (o.scarf) { g.r(5, 8, 6, 2, o.scarf); if (up) g.r(4, 9, 8, 1, o.scarf); if (down) g.p(10, 10, o.scarf); }
    else if (down) { g.r(6, 8, 4, 1, o.shirt || '#eee'); }
  } else {
    g.r(5, 9, 6, 7, coat);
    if (o.coatLen === 'long') { g.r(4, 16, 8, 3, coat); g.r(4 + (sway > 0 ? 1 : 0), 19, 8, 1, coatD); }
    if (o.coatLen === 'dress') { g.r(3, 16, 10, 5, coat); g.r(2, 20, 12, 1, coatD); g.r(3 + sway, 21, 10, 1, trim); }
    if (o.coatLen === 'short') g.r(5, 15, 6, 1, coatD);
    g.r(5, 14, 6, 1, trim);
    if (o.scarf) g.r(5, 8, 5, 2, o.scarf);
    // arm (nearest)
    const ax = 6 - st;
    g.r(ax, 10, 3, 5, coatD); g.r(ax, 15, 3, 1, S); g.r(ax, 10, 3, 1, trim);
    if (o.glitch) { g.p(9, 11, trim); g.p(8, 13, trim); }
  }

  // head
  if (down) {
    g.r(5, 3, 6, 5, S); g.r(6, 8, 4, 1, S); g.r(5, 7, 1, 1, Sd); g.r(10, 7, 1, 1, Sd);
    drawHairField(g, o, dir, st, 'back');
    if (!o.mask) {
      g.p(6, 5, o.eye); g.p(9, 5, o.eye); g.p(6, 6, shadeC(o.eye, 0.4)); g.p(9, 6, shadeC(o.eye, 0.4));
      if (o.blush) { g.p(5, 6, '#f08a8a'); g.p(10, 6, '#f08a8a'); }
      g.p(7, 7, Sd); g.p(8, 7, Sd);
    } else { g.r(5, 3, 6, 5, '#f6f0e6'); g.r(6, 5, 1, 1, '#c8283e'); g.r(9, 5, 1, 1, '#c8283e'); g.p(7, 7, '#c8283e'); g.p(8, 7, '#c8283e'); }
    if (o.beard) { g.r(6, 7, 4, 2, o.beard); g.p(7, 7, S); g.p(8, 7, S); }
    if (o.visor) { g.r(5, 4, 6, 2, o.trim); g.r(6, 5, 4, 1, '#0b1e26'); g.p(6, 5, '#fff'); g.p(9, 5, '#fff'); }
    drawHairField(g, o, dir, st, 'front');
    if (o.goggles) { g.r(4, 3, 8, 1, o.goggles); g.p(6, 3, '#cfeaf0'); g.p(9, 3, '#cfeaf0'); }
  } else if (up) {
    g.r(5, 3, 6, 5, S); drawHairField(g, o, dir, st, 'back'); drawHairField(g, o, dir, st, 'front');
    if (o.goggles) g.r(4, 4, 8, 1, o.goggles);
  } else {
    g.r(4, 3, 6, 5, S); g.r(5, 8, 4, 1, S); g.p(3, 5, S);
    drawHairField(g, o, dir, st, 'back');
    if (!o.mask) { g.p(5, 5, o.eye); g.p(5, 6, shadeC(o.eye, 0.4)); if (o.blush) g.p(6, 6, '#f08a8a'); }
    else { g.r(4, 3, 6, 5, '#f6f0e6'); g.p(5, 5, '#c8283e'); }
    if (o.beard) g.r(4, 7, 4, 2, o.beard);
    if (o.visor) { g.r(4, 4, 5, 2, o.trim); g.p(5, 5, '#fff'); }
    drawHairField(g, o, dir, st, 'front');
    if (o.goggles) { g.r(4, 3, 6, 1, o.goggles); g.p(5, 3, '#cfeaf0'); }
  }
  if (o.hat) drawHatField(g, o, dir);
  g.x.restore();
  return g.finish({ vshade: 0.1 });
}

Art.field = function (id, dir, frame) {
  const key = `f:${id}:${dir}:${frame}`;
  if (this.cache[key]) return this.cache[key];
  const o = LOOKS[id] || LOOKS.citizenM;
  const c = dir === 'right' ? flipH(this.field(id, 'left', frame)) : fieldSprite(o, dir, frame);
  return (this.cache[key] = c);
};

/* -------------------------------------------------------------------------
   Battle sprite: side view facing LEFT, posed by a small skeleton.
   Canvas is 44x40 with feet origin at (CX, GY).
   ------------------------------------------------------------------------- */
const BCX = 28, BGY = 39, BW = 44, BH = 42;

function bpose(name, f) {
  const bob = f === 1 ? 1 : 0;
  const P = {
    idle: {
      head: [0, -28 + bob], top: [0, -23 + bob], hip: [0, -12],
      legF: [[-1, -12], [-2, -6], [-4, 0]], legB: [[1, -12], [2, -6], [4, 0]],
      armF: [[-2, -22 + bob], [-5, -17 + bob], [-7, -15 + bob]], armB: [[2, -22 + bob], [4, -17 + bob], [2, -14 + bob]],
      wd: [-0.55, 0.85], look: 0,
    },
    attack: {
      head: [-4, -27], top: [-2, -22], hip: [0, -12],
      legF: [[-1, -12], [-7, -8], [-10, 0]], legB: [[1, -12], [5, -6], [9, 0]],
      armF: [[-4, -21], [-9, -20], [-14, -20]], armB: [[0, -21], [3, -19], [4, -22]],
      wd: [-1, 0], look: 0, lean: -1,
    },
    cast: {
      head: [0, -29], top: [0, -23], hip: [0, -12],
      legF: [[-1, -12], [-3, -6], [-5, 0]], legB: [[1, -12], [3, -6], [5, 0]],
      armF: [[-2, -22], [-6, -27], [-6, -34]], armB: [[2, -22], [6, -27], [6, -34]],
      wd: [0, -1], look: -1,
    },
    hurt: {
      head: [4, -26], top: [3, -21], hip: [1, -12],
      legF: [[0, -12], [-3, -6], [-6, 0]], legB: [[2, -12], [6, -6], [9, 0]],
      armF: [[1, -20], [-3, -19], [-4, -24]], armB: [[5, -20], [9, -17], [10, -21]],
      wd: [-0.5, 0.8], look: 2,
    },
    win: {
      head: [0, -29 + bob], top: [0, -23 + bob], hip: [0, -12],
      legF: [[-1, -12], [-2, -6], [-4, 0]], legB: [[1, -12], [2, -6], [4, 0]],
      armF: [[-2, -22], [-5, -28], [-6, -35]], armB: [[2, -22 + bob], [4, -17 + bob], [2, -14 + bob]],
      wd: [0, -1], look: -1,
    },
    guard: {
      head: [-2, -24], top: [-1, -19], hip: [0, -11],
      legF: [[-1, -11], [-6, -6], [-8, 0]], legB: [[1, -11], [6, -6], [9, 0]],
      armF: [[-3, -18], [-8, -21], [-4, -25]], armB: [[1, -18], [-5, -17], [-9, -21]],
      wd: [-1, -0.3], look: 1,
    },
  };
  return P[name] || P.idle;
}

function limb(g, a, b, c, col, colD, w) {
  g.line(a[0], a[1], b[0], b[1], col, w); g.line(b[0], b[1], c[0], c[1], colD || col, w);
}

function drawWeapon(g, o, hand, dir, pose) {
  const [hx, hy] = hand, [dx, dy] = dir;
  const w = o.weapon;
  if (w === 'rapier') {
    const len = pose === 'attack' ? 17 : 12;
    const ex = hx + dx * len, ey = hy + dy * len;
    g.line(hx, hy, ex, ey, '#dfe6f0'); g.p(ex, ey, '#ffffff');
    g.line(hx - dy * 3, hy + dx * 3, hx + dy * 3, hy - dx * 3, '#ecc868');
    g.p(hx - dx * -1, hy - dy * -1, '#8a5a2a');
    if (pose === 'attack') { g.line(ex + 2, ey - 3, ex + 6, ey - 6, '#ffb0b8'); g.line(ex + 3, ey + 3, ex + 7, ey + 5, '#ffb0b8'); }
  } else if (w === 'revolver') {
    g.r(hx - 4, hy - 1, 6, 3, '#3a3440'); g.r(hx - 6, hy - 1, 3, 2, '#c9964a'); g.r(hx - 1, hy + 1, 2, 3, '#5a3a2a');
    if (pose === 'attack') { g.r(hx - 11, hy - 2, 4, 4, '#fff3b0'); g.r(hx - 9, hy - 1, 5, 2, '#ffffff'); g.p(hx - 13, hy, '#ffd060'); }
  } else if (w === 'parasol') {
    if (pose === 'cast' || pose === 'win') {
      g.line(hx, hy, hx, hy - 12, '#8a5a2a');
      g.ell(hx, hy - 12, 10, 5, o.trim); g.ell(hx, hy - 11, 10, 4, o.hatCol || '#241a30');
      for (let i = -8; i <= 8; i += 4) g.line(hx, hy - 15, hx + i, hy - 10, o.trim);
      g.p(hx, hy - 17, '#f0e6f8');
    } else {
      g.line(hx, hy, hx + dx * 12, hy + dy * 12, '#8a5a2a');
      g.poly([[hx + dx * 12, hy + dy * 12], [hx + dx * 5 - dy * 3, hy + dy * 5 + dx * 3], [hx + dx * 5 + dy * 3, hy + dy * 5 - dx * 3]], o.hatCol || '#241a30');
      g.p(hx + dx * 12, hy + dy * 12, o.trim);
    }
  } else if (w === 'glitchstaff') {
    const ex = hx + dx * 14, ey = hy + dy * 14;
    g.line(hx - dx * 4, hy - dy * 4, ex, ey, '#1c4a56'); g.line(hx, hy, ex, ey, '#30e2d2');
    g.poly([[ex, ey - 4], [ex + 3, ey], [ex, ey + 4], [ex - 3, ey]], '#c8fff8');
    g.p(ex + 5, ey - 4, '#ff5ab8'); g.p(ex - 6, ey + 3, '#ff5ab8'); g.p(ex + 4, ey + 6, '#30e2d2');
    if (pose === 'attack') for (let i = 0; i < 6; i++) g.p(ex - 3 - i * 2, ey + ((i * 7) % 5) - 2, i % 2 ? '#30e2d2' : '#ff5ab8');
  } else if (w === 'brush') {
    const ex = hx + dx * 22, ey = hy + dy * 22;
    g.line(hx - dx * 4, hy - dy * 4, ex, ey, '#e8dfd0', 2);
    g.poly([[ex, ey], [ex + dx * 6 - dy * 3, ey + dy * 6 + dx * 3], [ex + dx * 6 + dy * 3, ey + dy * 6 - dx * 3]], '#c8283e');
  }
}

function drawHairBattle(g, o, hd, layer, pose) {
  const h = o.hair, hdk = shadeC(h, -0.2), hl = shadeC(h, 0.25), style = o.hairStyle;
  const [x, y] = hd;
  if (style === 'none') return;
  const swing = pose === 'attack' ? -1 : pose === 'hurt' ? 2 : 0;
  if (layer === 'back') {
    if (style === 'long') g.poly([[x + 1, y - 4], [x + 6, y - 2], [x + 8 + swing, y + 11], [x + 2 + swing, y + 12], [x - 1, y + 3]], hdk);
    if (style === 'ponytail') { g.line(x + 3, y - 3, x + 8 + swing, y + 2, hdk, 3); g.line(x + 8 + swing, y + 2, x + 9 + swing * 2, y + 11, h, 3); g.line(x + 9 + swing * 2, y + 11, x + 8 + swing * 2, y + 14, hdk, 2); }
    if (style === 'bun') g.ell(x + 4, y - 6, 3, 3, h);
  } else {
    const hatted = o.hat && o.hat !== 'veil';
    if (!hatted) {
      g.ell(x + 0.5, y - 2.5, 5.5, 4.2, h); g.r(x + 2, y - 2, 4, 5, h);
      g.p(x - 2, y - 5, hl); g.p(x - 1, y - 6, hl); g.p(x, y - 6, hl);
      g.r(x - 5, y - 3, 2, 2, h);
      if (style === 'wild') { g.poly([[x - 4, y - 5], [x - 8, y - 9], [x - 2, y - 7]], h); g.poly([[x, y - 7], [x - 1, y - 12], [x + 3, y - 7]], h); g.poly([[x + 3, y - 6], [x + 8, y - 10], [x + 6, y - 4]], h); g.poly([[x + 5, y - 2], [x + 10, y - 3], [x + 6, y + 1]], hdk); }
      if (style === 'long') g.r(x - 4, y - 3, 1, 5, h);
    } else {
      g.r(x - 4, y - 2, 9, 2, h); g.r(x + 2, y - 2, 4, 6, h);
    }
  }
}

function drawHatBattle(g, o, hd) {
  const [x, y] = hd, c = o.hatCol || o.coat, hat = o.hat;
  if (!hat) return;
  if (hat === 'bowler') { g.ell(x, y - 5, 5, 4, c); g.r(x - 8, y - 3, 15, 2, shadeC(c, -0.1)); g.r(x - 5, y - 4, 10, 1, o.trim); }
  if (hat === 'tophat') { g.r(x - 5, y - 15, 10, 12, c); g.r(x - 8, y - 4, 16, 2, shadeC(c, -0.1)); g.r(x - 5, y - 6, 10, 2, o.trim); }
  if (hat === 'veil') { g.ell(x + 1, y - 6, 6, 3, c); g.line(x + 5, y - 8, x + 10, y - 14, o.trim, 1); g.p(x + 10, y - 14, '#fff'); g.r(x - 4, y - 4, 10, 1, shadeC(c, 0.1)); }
  if (hat === 'hood') { g.ell(x + 1, y - 2, 7, 7, c); g.r(x - 4, y, 3, 4, S_(o)); }
  if (hat === 'beret') { g.ell(x, y - 6, 6, 3, c); g.p(x + 1, y - 10, o.trim); }
  if (hat === 'cap') { g.ell(x, y - 5, 5, 3, c); g.r(x - 8, y - 3, 5, 1, shadeC(c, -0.2)); }
}
const S_ = o => o.skin;

function battleSprite(o, pose, frame) {
  const g = new Pix(BW, BH);
  const P = bpose(pose, frame);
  const X = (p) => [BCX + p[0], BGY + p[1]];
  const S = o.skin, coat = o.coat, coatD = shadeC(coat, -0.22), pants = o.pants || '#2a2440', boots = o.boots || '#2a1f2a';
  const trim = o.trim || shadeC(coat, 0.3);
  const head = X(P.head), top = X(P.top), hip = X(P.hip);
  const dress = o.coatLen === 'dress';

  if (o.cape) g.poly([[top[0] + 2, top[1]], [top[0] + 9, top[1] + 18], [hip[0] + 4, BGY - 2], [top[0] - 2, top[1]]], o.cape);
  // back arm + back leg
  limb(g, X(P.armB[0]), X(P.armB[1]), X(P.armB[2]), shadeC(coat, -0.2), null, 3);
  g.r(X(P.armB[2])[0] - 1, X(P.armB[2])[1] - 1, 3, 3, shadeC(S, -0.12));
  if (!dress) {
    limb(g, X(P.legB[0]), X(P.legB[1]), X(P.legB[2]), shadeC(pants, -0.2), null, 3);
    g.r(X(P.legB[2])[0] - 3, X(P.legB[2])[1] - 2, 6, 3, shadeC(boots, -0.2));
  }
  // torso
  g.poly([[top[0] - 4, top[1]], [top[0] + 4, top[1]], [hip[0] + 4, hip[1]], [hip[0] - 4, hip[1]]], coat);
  g.r(top[0] - 1, top[1] + 1, 2, hip[1] - top[1] - 1, o.shirt || '#eee');
  g.r(hip[0] - 4, hip[1] - 1, 8, 2, trim);
  if (o.glitch) { g.p(top[0] + 2, top[1] + 4, trim); g.p(top[0] - 2, top[1] + 7, trim); g.p(top[0] + 1, top[1] + 9, trim); }
  // coat skirts / dress
  const sw = pose === 'attack' ? 2 : pose === 'hurt' ? -2 : (frame === 1 ? 1 : 0);
  if (o.coatLen === 'long') g.poly([[hip[0] - 5, hip[1] - 1], [hip[0] + 5, hip[1] - 1], [hip[0] + 7 + sw, hip[1] + 11], [hip[0] - 6 + sw, hip[1] + 11]], coat);
  if (dress) {
    g.poly([[hip[0] - 5, hip[1] - 1], [hip[0] + 5, hip[1] - 1], [hip[0] + 10 + sw, BGY - 2], [hip[0] - 10 + sw, BGY - 2]], coat);
    g.line(hip[0] - 10 + sw, BGY - 2, hip[0] + 10 + sw, BGY - 2, trim); g.line(hip[0] - 3, hip[1] + 2, hip[0] - 5 + sw, BGY - 3, shadeC(coat, 0.15));
  }
  if (o.coatLen === 'short') g.r(hip[0] - 4, hip[1], 8, 2, coatD);
  if (o.coatLen === 'long') g.line(hip[0] - 6 + sw, hip[1] + 11, hip[0] + 7 + sw, hip[1] + 11, trim);
  // front leg
  if (!dress) {
    limb(g, X(P.legF[0]), X(P.legF[1]), X(P.legF[2]), pants, null, 3);
    g.r(X(P.legF[2])[0] - 4, X(P.legF[2])[1] - 2, 6, 3, boots);
  }
  // head
  g.ell(head[0], head[1], 4.6, 5, S);
  g.r(head[0] - 2, head[1] + 4, 4, 3, shadeC(S, -0.1)); // neck
  drawHairBattle(g, o, head, 'back', pose);
  g.ell(head[0], head[1], 4.6, 5, S);
  const ex = head[0] - 2 + (P.look === 2 ? 1 : 0), ey = head[1] + (P.look === -1 ? -1 : 0);
  if (o.mask) { g.ell(head[0], head[1], 4.6, 5, '#f6f0e6'); g.r(ex - 1, ey, 2, 2, '#c8283e'); g.r(ex - 1, ey + 3, 3, 1, '#c8283e'); }
  else if (pose === 'hurt') { g.line(ex - 1, ey - 1, ex + 1, ey + 1, '#3a2030'); g.line(ex + 1, ey - 1, ex - 1, ey + 1, '#3a2030'); }
  else { g.r(ex, ey, 2, 2, o.eye); g.p(ex, ey, '#fff'); if (o.blush) g.p(ex + 2, ey + 2, '#f08a8a'); }
  if (o.beard) g.r(head[0] - 3, head[1] + 2, 5, 3, o.beard);
  if (o.visor) { g.r(head[0] - 5, head[1] - 2, 7, 3, o.trim); g.r(head[0] - 4, head[1] - 1, 5, 1, '#0b1e26'); g.p(head[0] - 3, head[1] - 1, '#fff'); }
  drawHairBattle(g, o, head, 'front', pose);
  if (o.goggles) { g.r(head[0] - 5, head[1] - 4, 9, 2, o.goggles); g.r(head[0] - 4, head[1] - 4, 2, 2, '#cfeaf0'); }
  drawHatBattle(g, o, head);
  // front arm + weapon
  const hand = X(P.armF[2]);
  if (o.weapon && P.wd[1] > 0.5 && o.weapon !== 'revolver') drawWeapon(g, o, hand, P.wd, pose);
  limb(g, X(P.armF[0]), X(P.armF[1]), hand, coat, shadeC(coat, -0.1), 3);
  g.r(hand[0] - 1, hand[1] - 1, 3, 3, S);
  if (o.weapon && !(P.wd[1] > 0.5 && o.weapon !== 'revolver')) drawWeapon(g, o, hand, P.wd, pose);
  return g.finish({ vshade: 0.08 });
}

Art.battle = function (id, pose = 'idle', frame = 0) {
  const key = `b:${id}:${pose}:${frame}`;
  if (this.cache[key]) return this.cache[key];
  const o = LOOKS[id] || LOOKS.citizenM;
  let c;
  const ext = Assets.has('battle_' + id) && pose === 'idle' ? Assets.fit('battle_' + id, 48, 64) : null;
  if (ext) c = ext;
  else if (pose === 'down') {
    const src = this.battle(id, 'hurt', 0);
    const [cc, x] = mkCanvas(src.height, src.width);
    x.translate(cc.width / 2, cc.height / 2); x.rotate(-Math.PI / 2); x.drawImage(src, -src.width / 2, -src.height / 2);
    c = tint(cc, '#150d1f', 0.35);
  } else c = battleSprite(o, pose, frame);
  return (this.cache[key] = c);
};
Art.battleAnchor = { x: BCX + 1, y: BGY + 2 };

/* -------------------------------------------------------------------------
   Portrait 64x64 — expressive bust with per-hairstyle shapes.
   ------------------------------------------------------------------------- */
function portraitArt(o, expr) {
  const g = new Pix(64, 64);
  const S = o.skin, Sd = shadeC(S, -0.16), Sl = shadeC(S, 0.12);
  const coat = o.coat, trim = o.trim || '#e8c868';
  const h = o.hair, hd = shadeC(h, -0.25), hl = shadeC(h, 0.28);
  const style = o.hairStyle;
  const sm = o.small ? 1 : 0;
  // shoulders
  g.poly([[4, 64], [8, 52], [22, 46], [42, 46], [56, 52], [60, 64]], coat);
  g.poly([[22, 46], [32, 58], [42, 46], [38, 46], [32, 52], [26, 46]], o.shirt || '#eee');
  g.line(8, 52, 22, 46, trim); g.line(56, 52, 42, 46, trim);
  if (o.scarf) { g.r(20, 44, 24, 5, o.scarf); g.r(38, 48, 6, 8, shadeC(o.scarf, -0.12)); }
  if (o.glitch) { for (let i = 0; i < 9; i++) g.p(10 + ((i * 17) % 44), 54 + ((i * 5) % 9), trim); g.r(12, 58, 8, 1, trim); g.r(44, 55, 6, 1, trim); }
  if (o.cape) { g.poly([[2, 64], [6, 50], [14, 48], [12, 64]], o.cape); g.poly([[62, 64], [58, 50], [50, 48], [52, 64]], o.cape); }
  // back hair
  if (style === 'long') g.poly([[15, 22], [22, 8], [42, 8], [49, 22], [51, 52], [44, 56], [40, 44], [24, 44], [20, 56], [13, 52]], hd);
  if (style === 'ponytail') { g.poly([[44, 14], [56, 22], [58, 44], [52, 58], [50, 44], [46, 26]], hd); g.ell(53, 46, 4, 8, h); }
  if (style === 'bun') g.ell(32, 5, 7, 6, h);
  // neck
  g.r(28, 40, 8, 8, Sd);
  // face
  g.ell(32, 30 + sm, 13, 15, S);
  g.poly([[19, 34], [45, 34], [40, 45 + sm], [32, 47 + sm], [24, 45 + sm]], S);
  g.r(22, 38, 2, 2, Sd); g.r(40, 38, 2, 2, Sd);
  g.ell(28, 24, 5, 3, Sl);
  // ears
  g.ell(19, 32, 2, 3, S); g.ell(45, 32, 2, 3, S);
  // eyes
  const ey = 31 + sm * 2;
  const eyeC = o.eye;
  const drawEye = (cx, side) => {
    const shock = expr === 'shock', angry = expr === 'angry', sad = expr === 'sad', happy = expr === 'happy';
    const rx = shock ? 4.2 : 3.6, ry = happy ? 1.6 : (shock ? 3.8 : 2.8 + sm);
    if (o.mask) { g.ell(cx, ey, 3, 2, '#c8283e'); return; }
    g.ell(cx, ey, rx, ry, '#fdfbf7');
    if (!happy) {
      g.ell(cx + (side * 0.3), ey + 0.3, 2.2, Math.min(ry, 2.6), eyeC);
      g.ell(cx + side * 0.3, ey + 0.4, 1, 1.5, '#120a18');
      g.p(cx - 1, ey - 1, '#ffffff'); g.p(cx, ey - 1, '#ffffff'); g.p(cx + 1, ey + 1, shadeC(eyeC, 0.5));
    } else { g.r(cx - 3, ey - 1, 7, 1, '#2a1a28'); g.r(cx - 2, ey, 5, 1, eyeC); }
    // lid
    g.r(cx - 4, Math.round(ey - ry - 1), 9, 1, '#1a1020');
    if (sad) g.p(cx + side * 3, Math.round(ey - ry), '#1a1020');
    // lashes
    g.p(cx + side * 4, Math.round(ey - ry), '#1a1020');
    // brows
    const by = Math.round(ey - ry - 4);
    if (angry) g.line(cx - side * 3, by + 3, cx + side * 4, by, '#1a1020', 1);
    else if (sad) g.line(cx - side * 4, by + 2, cx + side * 3, by, '#1a1020');
    else if (shock) g.line(cx - 3, by - 2, cx + 3, by - 2, hd);
    else g.line(cx - 3, by + 1, cx + 3, by, hd);
  };
  drawEye(25, 1); drawEye(39, -1);
  if (o.blush) { g.r(21, 37, 4, 1, '#f08a8a'); g.r(39, 37, 4, 1, '#f08a8a'); }
  // nose + mouth
  g.p(32, 37, Sd); g.p(32, 38, Sd);
  const my = 42 + sm;
  if (expr === 'happy') { g.line(27, my - 1, 30, my + 1, '#7a2a3a'); g.line(30, my + 1, 34, my + 1, '#7a2a3a'); g.line(34, my + 1, 37, my - 1, '#7a2a3a'); g.r(30, my + 1, 4, 1, '#fff'); }
  else if (expr === 'sad') { g.line(28, my + 1, 31, my - 1, '#7a2a3a'); g.line(31, my - 1, 36, my + 1, '#7a2a3a'); }
  else if (expr === 'angry') { g.r(28, my, 8, 2, '#3a1020'); g.r(29, my, 6, 1, '#fff'); }
  else if (expr === 'shock') { g.ell(32, my + 1, 2.5, 3, '#3a1020'); g.p(31, my, '#c04a5a'); }
  else g.line(28, my, 36, my, '#7a2a3a');
  if (o.mask) { g.r(28, my - 1, 8, 3, '#c8283e'); g.ell(32, 25, 13, 12, '#f6f0e6'); g.ell(25, ey, 3, 2, '#c8283e'); g.ell(39, ey, 3, 2, '#c8283e'); g.line(28, 44, 36, 44, '#c8283e'); g.p(32, 39, '#e0d6c8'); }
  if (o.beard) { g.poly([[20, 36], [44, 36], [40, 56], [32, 62], [24, 56]], o.beard); g.r(28, 39, 8, 2, Sd); g.line(27, 40, 37, 40, '#7a2a3a'); }
  // front hair
  const hatted = o.hat && o.hat !== 'veil';
  if (!hatted && style !== 'none') {
    g.ell(32, 17, 16, 11, h);
    g.poly([[16, 20], [20, 32], [22, 20]], h); g.poly([[48, 20], [44, 32], [42, 20]], h);
    // fringe
    g.poly([[17, 26], [22, 15], [32, 14], [30, 26], [26, 20]], h);
    g.poly([[32, 14], [46, 18], [47, 27], [40, 20], [36, 26]], h);
    g.line(24, 10, 30, 8, hl, 2); g.line(34, 9, 42, 12, hl, 2);
    if (style === 'wild') {
      g.poly([[16, 18], [10, 8], [24, 12]], h); g.poly([[26, 10], [30, -1], [38, 9]], h); g.poly([[40, 10], [52, 4], [48, 20]], h);
      g.line(30, 3, 32, 8, hl);
    }
    if (style === 'long') { g.poly([[15, 22], [19, 44], [22, 44], [21, 24]], h); g.poly([[49, 22], [45, 44], [42, 44], [43, 24]], h); }
    if (style === 'ponytail') { g.line(45, 15, 50, 22, hl, 2); }
    if (style === 'short') { g.line(20, 20, 24, 24, h, 2); g.line(44, 20, 40, 24, h, 2); }
  }
  if (o.hat) {
    const c = o.hatCol || coat;
    if (o.hat === 'bowler') { g.ell(32, 12, 15, 9, c); g.r(14, 18, 36, 3, shadeC(c, -0.12)); g.r(17, 15, 30, 3, trim); if (style === 'short') { g.r(18, 21, 4, 8, h); g.r(42, 21, 4, 8, h); } }
    if (o.hat === 'tophat') { g.r(19, -1, 26, 18, c); g.r(12, 17, 40, 4, shadeC(c, -0.1)); g.r(19, 12, 26, 4, trim); }
    if (o.hat === 'veil') { g.ell(30, 10, 17, 6, c); g.poly([[42, 8], [54, 0], [50, 12]], trim); g.line(20, 15, 44, 15, shadeC(c, 0.15)); g.p(53, 1, '#fff'); if (style === 'long') g.poly([[15, 22], [19, 44], [22, 44], [21, 24]], h), g.poly([[49, 22], [45, 44], [42, 44], [43, 24]], h); g.ell(32, 17, 15, 6, h); g.ell(30, 10, 17, 5, c); }
    if (o.hat === 'hood') { g.ell(32, 22, 22, 24, c); g.ell(32, 30, 13, 15, S); g.poly([[19, 34], [45, 34], [40, 45], [32, 47], [24, 45]], S); drawEye(25, 1); drawEye(39, -1); g.line(28, my, 36, my, '#7a2a3a'); g.r(30, 37, 3, 1, Sd); if (o.beard) { g.poly([[20, 38], [44, 38], [40, 58], [32, 64], [24, 58]], o.beard); g.line(27, 41, 37, 41, '#7a2a3a'); } g.r(14, 8, 36, 3, c); g.line(22, 12, 42, 12, trim); }
    if (o.hat === 'beret') { g.ell(30, 10, 17, 7, c); g.p(44, 5, trim); g.r(41, 2, 4, 3, trim); g.r(18, 16, 28, 2, shadeC(c, -0.15)); }
    if (o.hat === 'cap') { g.ell(32, 11, 15, 8, c); g.r(14, 17, 36, 3, shadeC(c, -0.2)); g.r(30, 12, 4, 4, trim); }
  }
  if (o.goggles) { g.r(17, 15, 30, 4, o.goggles); g.ell(26, 17, 5, 4, '#cfeaf0'); g.ell(38, 17, 5, 4, '#cfeaf0'); g.ell(26, 17, 3, 3, '#4a9ac0'); g.ell(38, 17, 3, 3, '#4a9ac0'); g.p(25, 16, '#fff'); g.p(37, 16, '#fff'); }
  if (o.visor) { g.r(17, 27, 30, 8, trim); g.r(19, 28, 26, 6, '#0b1e26'); g.r(21, 30, 8, 2, '#c8fff8'); g.r(35, 30, 8, 2, '#c8fff8'); g.p(22, 29, '#fff'); g.p(36, 29, '#fff'); }
  if (expr === 'sad') { g.r(24, 36, 1, 3, '#a8d8ff'); }
  return g.finish({ vshade: 0.06 });
}

Art.portrait = function (id, expr = 'n') {
  const key = `p:${id}:${expr}`;
  if (this.cache[key]) return this.cache[key];
  const o = LOOKS[id];
  if (!o) return null;
  let c = null;
  if (Assets.has('portrait_' + id)) c = Assets.fit('portrait_' + id, 64, 64, 'cover');
  if (!c) c = portraitArt(o, expr);
  return (this.cache[key] = c);
};
