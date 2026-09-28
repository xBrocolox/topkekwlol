'use strict';
/* ==========================================================================
   VERMILION REQUIEM — story.js
   Map scripts, NPCs, cutscenes, boss encounters, battle hooks, time gates.
   ========================================================================== */

const S = (name, text, expr) => Dlg.say(name, text, { expr });
const N = text => Dlg.narrate(text);
function codex(id) {
  if (Game.flag('cdx_' + id)) return;
  Game.setFlag('cdx_' + id);
  const c = CODEX.find(x => x.id === id); if (c) Toast.add('Terminal entry: ' + c.title, UI.cy);
}
const avgLv = () => Math.max(2, Math.floor(Object.values(Game.S.chars).reduce((s, c) => s + c.lv, 0) / Object.keys(Game.S.chars).length));

/* free-standing boss sprite in the field (before the fight) */
Field.addBossSprite = function (id, tx, ty) {
  const e = { kind: 'bossvis', lead: id, x: tx * 16, y: ty * 16, bob: 0, solid: false, group: [id] };
  this.ents.push(e); return e;
};
Field.addMarker = function (tx, ty) { const e = { kind: 'marker', x: tx * 16, y: ty * 16, solid: false }; this.ents.push(e); return e; };

const Story = {
  /* ---------------------------------------------------------------- utils */
  async bossFight(F, id, o = {}) {
    Snd.play('boss');
    await Gfx.fadeTo(0.0, 0.01);
    const res = await Battle.fight([id], Object.assign({ noAmbush: true, bg: F.def.bg, bgm: 'boss', xpMul: 1.4 }, o));
    Snd.play(F.def.bgm);
    return res;
  },

  async wellMenu() {
    Snd.sfx('save');
    const i = await Dlg.ask(['Rest & record', 'Record only', 'Leave'], { title: 'The Inkwell glows' });
    if (i === 2) return;
    if (i === 0) { Game.healAll(); Toast.add('HP and MP restored', UI.green); Gfx.doFlash('#ffd0b0', 0.5); }
    const P = Field.player; Game.S.x = P.x / 16; Game.S.y = P.y / 16; Game.S.dir = P.dir;
    Game.save(); Snd.sfx('save'); Toast.add('Progress recorded', UI.gold);
  },

  async gateMenu(e) {
    if (e.gk === 'lacuna') return this.lacunaGate();
    const chaos = e.gk === 'chaos';
    const dest = [];
    if (Game.flag('gate1')) dest.push(['Frame I — Vesperine, 1899', 'aurelle', 20.5, 25, 'up', 1]);
    if (Game.flag('gate2')) dest.push(['Frame II — Oriel\'s Glade, −400', 'glade', 6.5, 22.6, 'up', 2]);
    if (Game.flag('gate3')) dest.push(['Frame III — Terminus, +300', 'terminus', 18.5, 24.6, 'up', 3]);
    const here = Field.def.era;
    const list = dest.filter(d => d[5] !== here);
    if (!dest.length) { await N('A ring of pale light, dormant. The Gate waits for a reason to open.'); return; }
    if (!list.length) { await N(chaos ? 'CHAOS GATE — no other destinations registered.' : 'The Gate hums. There is nowhere else to go yet.'); return; }
    const labels = list.map(d => (chaos ? 'Λ ' : '') + d[0]).concat(['Stay']);
    await N(chaos ? 'CHAOS GATE  >> enter keywords: [ cold · root · town ]' : 'The Gate turns, slow as a clock hand. Where does the hour lead?');
    const i = await Dlg.ask(labels, { title: chaos ? 'CHAOS GATE' : 'TIME GATE' });
    if (i >= list.length) return;
    Snd.sfx('gate'); Gfx.doFlash(chaos ? '#30e2d2' : '#f4d878', 0.9);
    const d = list[i]; await wait(0.5);
    await Field.warp(d[1], d[2], d[3], d[4]);
  },

  async lacunaGate() {
    if (!Game.flag('regent_defeated')) { await N('Static. Nothing but static.'); return; }
    await N('The seam in the Datacore is open, and on the other side is nothing at all: paper-white, patient, waiting.');
    const i = await Dlg.ask(['Step through', 'Not yet'], { title: 'LACUNA' });
    if (i === 0) { Snd.sfx('gate'); Gfx.doFlash('#ffffff', 1); await wait(0.4); await Field.warp('lacuna'); }
  },

  /* ---------------------------------------------------------------- setups */
  setup: {},
  leave: {},
  hooks: {},

  /* --- battle tutorial (first fight) --- */
  async tutorial(B) {
    await N('When a gauge fills, choose a command. ATTACK opens the JUDGMENT RING.');
    await N('Press Z as the needle crosses a gold arc. Strike the white core for a CRITICAL. A miss deals nothing.');
    await N('Enemies telegraph with a closing ring. Press Z exactly as it meets the inner circle to PARRY and counter, or X to DODGE. Spiked rings are HEAVY: dodge those.');
  },

  /* --- opening cutscene --- */
  async intro() {
    const F = Field;
    Gfx.fade = 1; Gfx.fadeCol = '#000';
    Snd.play('lacuna');
    await wait(0.8);
    await N('Every painting is a promise that the world will stay.');
    await N('Someone has begun to break it.');
    Snd.play('aurelle');
    const ves = F.player, gas = F.addNPC('gas', 21.6, 9.0, 'gaspard', { dir: 'left', noTalk: true });
    ves.dir = 'right'; F.followersVisible = false;
    await Gfx.fadeTo(0, 1.4);
    await Banner.show('FRAME I — VESPERINE, 1899', 'The Gilded Hour', 3.2);
    await S('Gaspard', 'Fifty thousand lanterns, and every last one of them lit by somebody who is not you.', 'happy');
    await S('Vesper', 'I\'m a Chronicler\'s apprentice, Gas. My job is to write the lanterns down, not carry them.');
    await S('Gaspard', 'And a fine job you do. Your handwriting is a crime against the Municipal Guild.', 'happy');
    await S('Vesper', 'The Guild\'s almanac says tonight is the Vermilion Hour. The sky is supposed to burn.');
    await S('Gaspard', 'The almanac also says my workshop isn\'t a fire hazard.');
    await S('Vesper', '...It is doing it again.', 'shock');
    await N('The Halo on Vesper\'s finger flickers, a thin ring of red light with no source.');
    await S('Vesper', 'The Ring. It only ever does this right before--');
    Snd.sfx('encounter'); Gfx.doFlash('#ffffff', 1); Gfx.doShake(8);
    await N('A bell tolls, somewhere above the city, and the sky goes white in patches like paper losing its ink.');
    const wisps = F.addEnemy(24.5, 10.5, ['wisp', 'wisp']); wisps.state = 'stun'; wisps.stun = 99;
    const cur = F.addNPC('cur', 20.5, 6.2, 'curator', { dir: 'down', noTalk: true, solid: false });
    await F.camTo(20.5, 8, 0.9);
    await S('The Curator', 'Seventh bell. Again.', 'n');
    await S('Vesper', 'Who are you?');
    await S('The Curator', 'Hold still, little chronicler. It hurts less when the subject holds still.');
    await S('Gaspard', 'VES! Behind me!', 'angry');
    F.puff(cur.x, cur.y - 10, '#ffffff', 22); Snd.sfx('kill'); F.removeEnt(cur);
    wisps.stun = 0; wisps.state = 'chase'; wisps.alert = 0;
    await F.followCam(0.6);
    F.removeEnt(gas); F.followersVisible = true;
    await S('Gaspard', 'Wisps! Blank as a burnt page. Fire hurts them, and so does everything else. Stay sharp!', 'angry');
    Game.busy--; // hand control to the field so the fight starts through normal encounter logic
    F.encCd = 0;
    await new Promise(res => { F.afterBattle = res; });
    Game.busy++;
    Game.setFlag('tut_done');
    await S('Gaspard', 'Wisps. In the middle of the Lantern Festival. Tell me I hit my head.', 'shock');
    await S('Vesper', 'Gas... whose stall was that? The one by the fountain.');
    await S('Gaspard', 'The bakery? That was... that was...', 'sad');
    await S('Vesper', 'I can remember the stall. I can\'t remember who ran it.', 'sad');
    await S('Gaspard', 'Madame... no. No, I can\'t either.', 'sad');
    await N('Where the stall stood, the cobbles are blank as unpainted canvas.');
    await S('Vesper', 'Three nights ago a soprano vanished from the Opéra. The Guild sealed the doors and the files on her were empty.', 'n');
    await S('Gaspard', 'Empty like that stall.');
    await S('Vesper', 'The Halo is pulling toward the Opéra. Come on.');
    Toast.add('Objective: investigate the Opéra Vesperine', UI.gold);
    Toast.add('Tip: press Z near a roaming enemy to strike and stun it', UI.cy);
    Game.setFlag('intro_done');
      Toast.add('Dual Tech unlocked: Crossfire Waltz', '#f4d878');
    Snd.play('aurelle');
  },
};

/* ==========================================================================
   AURELLE
   ========================================================================== */
Story.setup.aurelle = function (F) {
  F.addNPC('merch_a', 5.5, 12.6, 'merchant', {
    talk: async () => { await S('Merchant', 'Tonics, ether, and rope enough to hang your worries. What\'ll it be?'); await Shop.open('aurelle'); await S('Merchant', 'Mind the dark after the Seventh Bell.'); },
  });
  F.addNPC('clock', 34.5, 15.7, 'citizenM', {
    talk: async () => {
      await S('Old Clockmaker', 'Ah, you\'re the Chronicler girl. Tell young Gaspard the third gear is in the drawer, not the jar. He never listens.');
      await S('Old Clockmaker', 'Clocks are honest things. They know exactly how much time they have. Would that we did.');
      if (!Game.flag('cdx_gaspard')) { codex('gaspard'); }
    },
  });
  F.addNPC('girl', 14.5, 10.6, 'child', {
    talk: async () => {
      if (!Game.flag('intro_done')) { await S('Girl', 'Mama says lanterns keep the bad things away. Do you have a lantern?'); return; }
      await S('Girl', 'There was a lady at the bread stall. Now there\'s just white. Why is nobody sad?');
      await S('Vesper', 'Because they can\'t remember there\'s something to be sad about.', 'sad');
    },
  });
  F.addNPC('lady', 26.5, 16.6, 'citizenF', {
    talk: async () => {
      if (!Game.flag('intro_done')) { await S('Citizen', 'The Seventh Bell rings at nightfall, and the whole city holds its breath. Silly superstition, of course.'); return; }
      await S('Citizen', 'Did the bell just ring? I had a name on my tongue. It was a lovely name.', 'sad');
    },
  });
  F.addNPC('rumor', 8.5, 19.6, 'citizenM', {
    talk: async () => { await S('Stagehand', 'The Opéra\'s been shut three days. Somebody sings in there at night. I say "somebody" because nobody ought to be inside.'); if (Game.flag('intro_done')) await S('Stagehand', 'They keep the stage door chained. But the Halo\'s... the Guild says you carry one. Maybe it will open for you.'); },
  });
  F.addNPC('guard', 19.6, 4.9, 'guard', {
    talk: async () => {
      if (!Game.flag('intro_done')) await S('Guard', 'Opéra\'s closed by order of the Guild. Move along, citizen.');
      else if (!Game.flag('cosette_defeated')) await S('Guard', 'Chronicler. The chain\'s off the door. I never took it off, and I can\'t tell you why I let you pass. Go on.');
      else await S('Guard', 'The singing stopped last night. Odd. I almost miss it.');
    },
  });
  F.addWell(26.5, 8.6);
  F.addChest(3.5, 16.5, 'aur_1', 'tonic', 2);
  F.addChest(36.5, 16.5, 'aur_2', 'cdx_gaslight');
  F.addChest(6.5, 6.6, 'aur_3', 'ether', 1);
  F.addChest(33.5, 21.5, 'aur_4', 'smoke', 1);
  F.addGate(20.5, 26.4, 'time');
  const ex = F.addExit(21, 3, 2, 1, 'opera', 15, 20.5, 'up', () => Game.flag('intro_done'));
  ex.deny = () => Game.cutscene(async () => { await N('The Opéra doors are chained. A Guild notice: CLOSED BY ORDER.'); F.player.y += 16; F.pushTrail(); });
  // roaming wisps during the festival are not present; the world is quiet until the bell
};

/* ==========================================================================
   OPERA
   ========================================================================== */
Story.setup.opera = function (F) {
  const done = Game.flag('cosette_defeated');
  F.addWell(4.5, 19.6);
  F.addChest(27, 12.6, 'op_1', 'hi_tonic', 1);
  F.addChest(3.5, 6.6, 'op_2', 'cdx_diva');
  F.addChest(26.5, 19.6, 'op_3', 'ether', 2);
  if (!done) { F.addEnemy(8.5, 14.5, ['phantom', 'phantom']); F.addEnemy(21.5, 16.5, ['phantom', 'wisp', 'wisp']); F.addEnemy(11.5, 19.5, ['phantom', 'phantom']); }
  if (!Game.flag('ilse_joined')) {
    const il = F.addNPC('ilse', 15.5, 16.0, 'ilse', { dir: 'down', noTalk: true });
    F.addTrigger('ilse_meet', 13, 17, 5, 3, async () => {
      F.faceTo(il, F.player);
      await S('Ilse', 'You can hear her too, can\'t you?');
      await S('Vesper', 'Hear who?', 'n');
      await S('Ilse', 'Cosette. Verlaine. Soprano. Nine performances, no encore. Everyone else has forgotten her. The Lacuna took the name and left the aria.');
      await S('Ilse', 'It has been singing for three nights and I cannot make it stop.', 'sad');
      await S('Gaspard', 'And you are?');
      await S('Ilse', 'Ilse Mourne. I speak with the dead. Lately I speak with the erased, which is worse. The dead at least remember being someone.');
      await S('Gaspard', 'A medium.', 'n');
      await S('Ilse', 'A specialist. Do you want the stage or not?', 'angry');
      await S('Vesper', 'The Halo led me here. I think it led you to me.');
      await S('Ilse', 'Then keep your ears open and your sword closed until I say. The last person who charged the stage is still on it.');
      Game.addMember('ilse', avgLv());
      F.removeEnt(il);
      Game.setFlag('ilse_joined'); Game.setFlag('met_ilse');
      Toast.add('Ilse joined the party!', UI.vio);
      Toast.add('Dual Techs unlocked: Vermilion Eclipse, Powder & Prayer', '#f4d878');
    });
  }
  if (!done) {
    const co = F.addBossSprite('cosette', 15, 8.4);
    F.addTrigger('cosette', 10, 9, 10, 2, async () => {
      await F.camTo(15, 7, 0.8);
      await S('Cosette', 'Nine performances... and the tenth begins now.');
      await S('Ilse', 'She doesn\'t know she\'s a memory. She can\'t stop.', 'sad');
      await S('Vesper', 'Then we finish the aria.');
      await F.followCam(0.5);
      const res = await Story.bossFight(F, 'cosette', { bg: 'opera' });
      if (res !== 'win') return;
      F.removeEnt(co);
      Game.setFlag('cosette_defeated'); codex('diva');
      Game.busy++;
      await wait(0.4);
      await S('Cosette', 'Was it... a good performance?', 'sad');
      await S('Ilse', 'The best I\'ve ever heard, Cosette. Encore.', 'happy');
      await N('The echo lifts from the stage like a breath on cold glass. Where she stood, a small silver locket.');
      await S('Gaspard', 'Cold draft. Behind the curtains, there\'s a stair going down.');
      await S('Vesper', 'Under the stage?');
      await S('Gaspard', 'Of course it\'s under the stage.');
      Toast.add('Objective: descend beneath the Opéra', UI.gold);
      Game.busy--;
    }, { cond: () => !Game.flag('cosette_defeated') && Game.flag('ilse_joined') });
  }
  F.addExit(14, 22, 2, 1, 'aurelle', 21.9, 5.3, 'down');
  const ex = F.addExit(14, 3, 2, 1, 'catacombs', undefined, undefined, 'down', () => Game.flag('cosette_defeated'));
  ex.deny = () => Game.cutscene(async () => { await N('The backstage door is bolted from the other side... by something that is still singing.'); F.player.y += 16; F.pushTrail(); });
};

Story.hooks.cosette_half = async function (B) {
  await S('Cosette', 'Please... someone say my name. Someone remember it.', 'sad');
  await S('Ilse', 'Cosette Verlaine. Soprano. Nine performances. I remember you!', 'shock');
  await S('Cosette', 'Then sing with me.');
};

/* ==========================================================================
   CATACOMBS
   ========================================================================== */
Story.leave.catacombs = { to: 'opera', x: 15, y: 5.6, dir: 'down' };
Story.setup.catacombs = function (F) {
  const g = F.def.gen, L = g.last;
  F.addMarker(g.first.x + 2, g.first.y + 2);
  F.addExit(g.first.x + 1, g.first.y + 1, 2, 2, null, 0, 0);
  if (!Game.flag('warden_defeated')) {
    const w = F.addBossSprite('warden', L.cx + 0.5, L.cy - 1);
    F.addTrigger('warden', L.cx - 2, L.cy - 1, 5, 4, async () => {
      await F.camTo(L.cx + 0.5, L.cy - 2, 0.9);
      await N('The chamber is a clock: gears the size of houses, all stopped. In the centre, a golden guardian stands with a hammer across its knees.');
      await S('Gilded Warden', 'FIRST GATE. FIRST GUEST. IDENTIFY.');
      await S('Vesper', 'The Halo... it\'s answering it.', 'shock');
      await S('Gilded Warden', 'HALO. JUDGMENT. BEARER ACCEPTED? NEGATIVE. TEST REQUIRED.');
      await S('Gaspard', 'Oh, come on. It has a bell in its chest. That\'s a design flaw.', 'angry');
      await F.followCam(0.5);
      const res = await Story.bossFight(F, 'warden', { bg: 'catacombs' });
      if (res !== 'win') return;
      F.removeEnt(w);
      Game.setFlag('warden_defeated'); Game.setFlag('gate1'); codex('halo');
      Game.busy++;
      await S('Gilded Warden', 'GATE... OPEN. THE HOUR IS ALWAYS... NOW.', 'n');
      await N('The Warden folds into itself, and the ring of gears behind it begins, slowly, to turn.');
      Story.placeGate(F);
      Gfx.doFlash('#f4d878', 0.8); Snd.sfx('gate');
      await S('Gaspard', 'A door. Under a theatre. To four hundred years ago.');
      await S('Vesper', 'You have repaired automata that thought they were people, Gas. This is not the strangest thing.', 'happy');
      await S('Ilse', 'It\'s the Gate the Choir made. The Curator will be in every Frame. We have to go where she has not finished yet.');
      Toast.add('Time Gate opened: Frame II — the Verdigris Age', UI.gold);
      Game.busy--;
    }, { cond: () => !Game.flag('warden_defeated') });
  } else Story.placeGate(F);
};
Story.placeGate = function (F) { const L = F.def.gen.last; F.addGate(L.cx + 0.5, L.cy + 0.5, 'time'); };
Story.hooks.warden_half = async function () {
  await S('Gilded Warden', 'TEST EXCEEDS PARAMETERS. ESCALATING. TOLL... TOLL...', 'angry');
  await S('Tally', '', 'n').catch(() => {});
};
Story.hooks.warden_half = async function () { await S('Gilded Warden', 'TEST EXCEEDS PARAMETERS. ESCALATING. TOLL. TOLL. TOLL.'); await S('Gaspard', 'When the bell starts to glow, brace for the toll! Stay on your feet!', 'angry'); };

/* ==========================================================================
   GLADE (Frame II)
   ========================================================================== */
Story.setup.glade = function (F) {
  const oriel = F.addNPC('oriel', 18.5, 9.4, 'oriel', {
    talk: async () => {
      if (!Game.flag('chorister_defeated')) {
        await S('Oriel', 'The wood lies north, and the temple beyond it. The Marionette keeps the Sunken Score. Bring it back, or bring yourselves back, in that order of preference.');
        await S('Ilse', 'A blessing?', 'n');
        await S('Oriel', 'A warning. The blessing is that the shop on the east side sells excellent tonics.', 'happy');
      } else await S('Oriel', 'You carry the Score. I can hear it from here. The road it draws leads forward: to the place where the Loom becomes a machine. Go gently.');
    },
  });
  F.addNPC('choirF1', 8.5, 9.6, 'choirF', { talk: async () => { await S('Choirwoman', 'We sing every morning so that the sun remembers to come up. It seems to like the attention.'); } });
  F.addNPC('choirM1', 28.5, 9.6, 'choirM', { talk: async () => { await S('Chorister', 'Beware the Marionette. Its strings were cut when I was a boy. It has never once stopped singing.'); } });
  F.addNPC('child2', 14.5, 19.6, 'child', { talk: async () => { await S('Child', 'The old man says you\'re from the future. Is it nice? Do we still have the good soup?'); await S('Gaspard', 'Some things, kid, never change.', 'happy'); } });
  F.addNPC('merch_g', 30.5, 13.7, 'choirM', { talk: async () => { await S('Merchant', 'Moss-wrapped tonics, ether that tastes of rain. Fair prices for the friends of the Halo.'); await Shop.open('glade'); } });
  F.addWell(8.6, 19.6);
  F.addChest(3.5, 10.6, 'gl_1', 'hi_tonic', 2);
  F.addChest(31.5, 22.6, 'gl_2', 'feather', 1);
  F.addGate(6.5, 24.4, 'time');
  F.addExit(16, 0, 4, 2, 'woods', undefined, undefined, 'up');
  if (!Game.flag('oriel_met')) {
    F.addTrigger('oriel_intro', 14, 16, 8, 5, async () => {
      await Banner.show('FRAME II — THE VERDIGRIS AGE', 'Four hundred years before', 3.0);
      await F.camTo(18.5, 12, 0.8);
      await S('Oriel', 'Halo-bearer. Four hundred years I have kept this glade for your arrival, and you are late.');
      await S('Vesper', 'I\'ve been alive nineteen years.');
      await S('Oriel', 'Yes. That is the trouble with Halos.');
      await S('Oriel', 'We are the Choir. We remembered the world so loudly that it stayed. The Loom is the shape of that song: everything is threaded through it.');
      await S('Oriel', 'But a song that never ends becomes noise, and someone will always want to finish it.');
      await S('Ilse', 'The Curator.', 'n');
      await S('Oriel', 'A Varnisher. She seals a world in the moment she loves best. She has come to the end of every Frame, and she will come to this one tomorrow.');
      await S('Oriel', 'Beneath the temple sleeps the Sunken Score, the seal that once held her back. The Marionette guards it. We cut its strings and it kept singing.');
      await S('Gaspard', 'Wonderful. A haunted puppet.', 'n');
      await S('Oriel', 'Ilse Mourne. You carry more grief than name. In this Frame we do not fear such things. We let them wear feathers.');
      await S('Ilse', '...I would rather not.', 'sad');
      await S('Oriel', 'Nobody would rather. It is why it works.');
      Gfx.doFlash('#b070ff', 0.6);
      Game.setFlag('fusion'); Game.setFlag('oriel_met'); codex('halo'); codex('varnish'); codex('ring');
      Toast.add('Ilse can now FUSE when her Malice gauge is full', UI.vio);
      await F.followCam(0.6);
    });
  }
};
Story.hooks.chorister_half = async function () {
  await S('Chorister Marionette', 'WE DID NOT MAKE THE WORLD. WE REMEMBERED IT.', 'n');
  await S('Ilse', 'It is singing the Score\'s last bar. When the strings tighten, it fires. Strike it as it charges!', 'angry');
};

/* --- woods & temple --- */
Story.leave.woods = { to: 'glade', x: 17.6, y: 3.8, dir: 'down' };
Story.setup.woods = function (F) {
  const g = F.def.woods;
  F.addMarker(g.start.x - 1, g.start.y);
  F.addExit(g.start.x - 3, g.start.y - 2, 3, 4, null, 0, 0);
  F.addExit(g.goal.x - 1, g.goal.y - 1, 3, 3, 'temple', undefined, undefined, 'up');
  F.addMarker(g.goal.x + 0.5, g.goal.y + 0.5);
  F.addWell(g.start.x + 3.5, g.start.y - 1.5);
};
Story.leave.temple = { to: 'woods', x: 0, y: 0, dir: 'down' };
Story.setup.temple = function (F) {
  const g = F.def.gen, L = g.last, w = MAPDEFS.woods.woods;
  Story.leave.temple = { to: 'woods', x: w.goal.x + 0.5, y: w.goal.y + 2.6, dir: 'down' };
  F.addMarker(g.first.x + 2, g.first.y + 2);
  F.addExit(g.first.x + 1, g.first.y + 1, 2, 2, null, 0, 0);
  if (!Game.flag('chorister_defeated')) {
    const c = F.addBossSprite('chorister', L.cx + 0.5, L.cy - 1);
    F.addTrigger('chorister', L.cx - 2, L.cy - 1, 5, 4, async () => {
      await F.camTo(L.cx + 0.5, L.cy - 2, 0.9);
      await N('Beneath the rose window, a seraph of white porcelain hangs from strings that lead up into the dark, and none of them are attached to anything.');
      await S('Chorister Marionette', 'WE DID NOT MAKE THE WORLD.');
      await S('Vesper', 'It\'s not talking to us. It\'s singing to the ceiling.', 'sad');
      await S('Ilse', 'Then we sing louder.', 'angry');
      await F.followCam(0.5);
      const res = await Story.bossFight(F, 'chorister', { bg: 'temple' });
      if (res !== 'win') return;
      F.removeEnt(c);
      Game.setFlag('chorister_defeated'); Game.setFlag('gate2'); Game.setFlag('gate3'); codex('score'); codex('hour');
      Game.busy++;
      await N('The Marionette loosens, all at once, like a held breath. Its chest opens and a slender scroll of light drifts out. The Sunken Score.');
      await S('Ilse', 'It shows the road. Oriel was right. There is a Frame beyond this one, and it is... cold.', 'shock');
      await S('Gaspard', 'How cold?');
      await S('Ilse', 'It runs on electricity.');
      Story.placeTempleGate(F);
      Toast.add('Time Gate route opened: Frame III — Terminus', UI.gold);
      Game.busy--;
    }, { cond: () => !Game.flag('chorister_defeated') });
  } else Story.placeTempleGate(F);
};
Story.placeTempleGate = function (F) { const L = F.def.gen.last; F.addGate(L.cx + 0.5, L.cy + 0.5, 'time'); };

/* ==========================================================================
   TERMINUS (Frame III)
   ========================================================================== */
Story.setup.terminus = function (F) {
  F.addNPC('aura', 18.5, 10.4, 'aura', {
    talk: async () => {
      await S('Aura', 'You\'re not on the player list. Are you real? Sorry. Are you... rendering?');
      await S('Aura', 'I keep a log of everyone who leaves. It is very short. Nobody logs out anymore.', 'sad');
      codex('aura');
    },
  });
  F.addNPC('av1', 5.6, 15.6, 'avatarA', { talk: async () => { await S('Avatar', 'Server population: 206. Server capacity: yes.'); } });
  F.addNPC('av2', 29.5, 8.6, 'avatarC', { talk: async () => { await S('Avatar', 'They say the Datacore used to be the Loom\'s memory. Now it just deletes things. Politely, at first.'); } });
  F.addNPC('merch_t', 28.5, 16.6, 'avatarB', { talk: async () => { await S('Vendor', 'Patches, packets, and legally distinct elixirs.'); await Shop.open('terminus'); } });
  F.addWell(27.6, 20.6);
  F.addChest(3.5, 20.5, 'tm_1', 'hi_ether', 2);
  F.addChest(32.5, 20.5, 'tm_2', 'mega_tonic', 1);
  F.addChest(4.5, 6.6, 'tm_3', 'cdx_loom');
  F.addGate(18.5, 26.4, 'chaos');
  const ex = F.addExit(17, 3, 2, 1, 'datacore', undefined, undefined, 'up', () => Game.flag('tally_joined'));
  ex.deny = () => Game.cutscene(async () => { await N('The Datacore gate is locked: ACCESS DENIED. A small note: "you need an admin. (i am an admin. find me.) —T"'); F.player.y += 16; F.pushTrail(); });
  if (!Game.flag('tally_joined')) {
    const ta = F.addNPC('tally', 10.5, 13.4, 'tally', { dir: 'right', noTalk: true });
    F.addTrigger('tally_meet', 12, 15, 12, 4, async () => {
      await Banner.show('FRAME III — TERMINUS', 'Three hundred years after', 3.0);
      const aura = F.byId('aura'); if (aura) F.faceTo(aura, F.player);
      await S('Aura', 'Wait. You\'re not in the player list.');
      await S('Vesper', 'Where are we?');
      await S('Aura', 'Terminus. Root Town. The last server. Two hundred and six of us left, and we are told the Loom is dying.');
      F.faceTo(ta, F.player);
      await S('Tally', 'Whoa whoa whoa, unregistered Halo incoming! Is that a *Judgment* Ring? That is an admin-tier drop, that is, hi. Hi! I\'m Tally.', 'shock');
      await S('Tally', 'Wavemaster. Level cap. Logged in for three hundred years, which is a bug I have been meaning to report.', 'happy');
      await S('Ilse', 'You have been here three centuries?', 'shock');
      await S('Tally', 'Two hundred and ninety-eight. I lost count somewhere around the Great Lag. Do you have any idea how boring a dying server is?');
      await S('Gaspard', 'We\'re chasing a woman in a mask who erases things.');
      await S('Tally', 'The Curator. She has been writing DELETE across the Datacore for a year. The Null Regent is her hands.', 'angry');
      await S('Tally', 'You need to get past it. I know a back door, but the door only opens for a Halo. Plus, I really want to see the look on her face.');
      await S('Vesper', 'You\'re coming with us?');
      await S('Tally', 'Are you kidding? I have been waiting three hundred years for a quest.', 'happy');
      Game.addMember('tally', avgLv());
      F.removeEnt(ta);
      Game.setFlag('tally_joined'); codex('loom');
      Toast.add('Tally joined the party!', UI.cy);
      Toast.add('Party now holds four: arrange it in Menu → Party', UI.gold);
      Toast.add('New Techs: Time Loop, Overclock Barrage, Requiem Protocol, CHRONO REQUIEM', '#f4d878');
    });
  }
};
Story.leave.datacore = { to: 'terminus', x: 18, y: 5.6, dir: 'down' };
Story.setup.datacore = function (F) {
  const g = F.def.gen, L = g.last;
  F.addMarker(g.first.x + 2, g.first.y + 2);
  F.addExit(g.first.x + 1, g.first.y + 1, 2, 2, null, 0, 0);
  if (!Game.flag('regent_defeated')) {
    const r = F.addBossSprite('regent', L.cx + 0.5, L.cy - 1);
    F.addTrigger('regent', L.cx - 2, L.cy - 1, 5, 4, async () => {
      await F.camTo(L.cx + 0.5, L.cy - 2, 0.9);
      await N('A black cube the size of a house hangs over the room, its one red eye rolling slowly to face you.');
      await S('Null Regent', 'DELETE. DELETE. DELETE.');
      await S('Tally', 'That\'s it. The Loom\'s deletion daemon. She promoted it.', 'shock');
      await S('Tally', 'When it starts charging Format Drive, hit it with Data Drain or Rootkit! Interrupt it or we lose the whole frame!', 'angry');
      await F.followCam(0.5);
      const res = await Story.bossFight(F, 'regent', { bg: 'datacore' });
      if (res !== 'win') return;
      F.removeEnt(r);
      Game.setFlag('regent_defeated');
      Game.busy++;
      await N('The Regent\'s eye closes, and for a moment every screen in the Datacore shows the same word: SAVED.');
      await S('Tally', 'It\'s... not deleting. It\'s just keeping everything. Oh, that is so much worse.', 'sad');
      await S('The Curator', 'Yes.', 'n');
      await N('The voice comes from everywhere at once. A seam of white opens in the air above the dais.');
      await S('The Curator', 'Come, then. Frame IV is only paper.');
      Story.placeLacunaGate(F);
      Toast.add('A seam to the Lacuna has opened', UI.red);
      Game.busy--;
    }, { cond: () => !Game.flag('regent_defeated') });
  } else Story.placeLacunaGate(F);
};
Story.placeLacunaGate = function (F) { const L = F.def.gen.last; F.addGate(L.cx + 0.5, L.cy + 0.5, 'lacuna'); };
Story.hooks.regent_half = async function () {
  await S('Null Regent', 'FORMAT. FORMAT. FORMAT.');
  await S('Tally', 'It\'s spinning up. Interrupt the charge, hit it with a Data Drain!', 'angry');
};

/* ==========================================================================
   LACUNA (finale)
   ========================================================================== */
Story.setup.lacuna = function (F) {
  F.addWell(12, 18.6);
  if (Game.flag('final_done')) return;
  const cu = F.addNPC('curator', 13, 6.6, 'curator', { dir: 'down', noTalk: true });
  let started = false;
  if (!Game.flag('lacuna_seen')) {
    F.addTrigger('lacuna_intro', 10, 12, 6, 2, async () => {
      Game.setFlag('lacuna_seen');
      await Banner.show('FRAME IV — LACUNA', 'The Unpainted Hour', 3.2);
    });
  }
  F.addTrigger('curator_fight', 10, 8, 7, 3, async () => {
    Snd.play('lacuna');
    await F.camTo(13, 6.5, 0.9);
    await S('The Curator', 'Nine hundred and one times I have stood here and watched you walk up that carpet.');
    await S('Vesper', 'You know me.');
    await S('The Curator', 'Better than anyone. Take the mask off, if you like. You will not be surprised.', 'n');
    await N('The mask comes away in her hand. The face beneath is Vesper\'s: older, crueller only because it is so tired. On her finger, the same red ring.');
    await S('Gaspard', 'Ves... that\'s...', 'shock');
    await S('Vesper', 'It\'s me. It\'s what I become.', 'shock');
    codex('hour');
    await S('The Curator', 'I lost you, Gaspard, in the ninth hundred. And Ilse. And every Frame between here and the Choir. So I found the moment I loved best, this night, this festival, this sky, and I decided to keep it.');
    await S('The Curator', 'Varnish, child. It is only varnish. Nobody has to grow old. Nobody has to be erased. They just stay here, in the light, forever.');
    const c = await Dlg.ask(['Refuse her', 'Ask what she is offering'], { title: 'The Curator waits' });
    if (c === 1) {
      await S('Vesper', 'What do they feel? The people you varnish?');
      await S('The Curator', 'Nothing. Which is the point.', 'n');
      await S('Vesper', 'Then it isn\'t kindness. It\'s a frame around a wall.', 'angry');
      await S('The Curator', '...Yes. I told myself that, too, once. It did not help.', 'sad');
    } else {
      await S('Vesper', 'You\'re not saving them. You\'re framing them.', 'angry');
      await S('The Curator', 'A frame is a kind of love. It says: this, this is what I want to remember.');
    }
    await S('Ilse', 'Then remember the sound of us leaving the frame.', 'angry');
    await S('Tally', 'Ves, whatever you\'re planning, plan it fast!', 'shock');
    await S('The Curator', 'Then hold still, little chronicler. It hurts less that way.');
    await F.followCam(0.4);
    F.removeEnt(cu);
    const res = await Battle.fight(['curator1'], {
      noAmbush: true, bg: 'lacuna', bgm: 'final', noEscape: true, xpMul: 1.0,
      chain: [{
        ids: ['curator2'], run: async B => {
          Snd.play('lacuna');
          Gfx.doFlash('#ffffff', 1); Gfx.doShake(10);
          await S('The Curator', 'No frame. No mask. No more Hours.');
          await S('Vesper', 'Then neither of us has anywhere to hide.', 'angry');
          Snd.play('final');
        },
      }],
    });
    if (res !== 'win') return;
    Game.setFlag('final_done');
    await Story.ending(F);
  }, { cond: () => !Game.flag('final_done') });
};

Story.ending = async function (F) {
  Game.busy++;
  Snd.play('gameover');
  await wait(0.5);
  await S('The Curator', 'Nine hundred hours, and you still choose the one that ends.', 'sad');
  await S('Vesper', 'Every hour ends. That is what makes it an hour.');
  await S('The Curator', '...I was so tired, Ves.', 'sad');
  await S('Vesper', 'I know.');
  await N('Vesper holds out her hand. After a long time, the other hand takes it. The two rings touch and become one circle of red light.');
  await S('The Curator', 'Take the next one. Please. I want to see what happens next.', 'happy');
  Gfx.doFlash('#ffffff', 1); Snd.sfx('levelup');
  await N('The Halo turns a full circle. Somewhere above the paper sky, a bell tolls, and it is not the seventh.');
  await Gfx.fadeTo(1, 1.5, '#ffffff');
  await wait(0.6);
  Snd.play('aurelle');
  await Banner.show('DAWN — VESPERINE', 'The Eighth Bell', 3.0);
  await S('Gaspard', 'Breakfast? I remember a bakery. I remember its name, now. Madame Durand.', 'happy');
  await S('Ilse', 'Cosette sang the sunrise. I could hear her. Not erased, just... finished.', 'happy');
  await S('Tally', 'Okay, so my server is still on? Rude. I was ready to log off. Guess I have to stay for the sequel.', 'happy');
  await S('Vesper', 'Write it all down, Gas. Every lantern. I\'m going to need the almanac when I\'m old.', 'happy');
  Game.busy--;
  await Main.credits();
};
