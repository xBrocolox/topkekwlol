'use strict';
/* ==========================================================================
   VERMILION REQUIEM — audio.js
   100% procedural sound: a tiny synth (pluck / pad / organ / choir formants /
   bell / bass / lead / drums), a reverb bus, a step sequencer that expands
   chord + melody specs into looping tracks, and synthesized SFX.
   Nothing is sampled, nothing is downloaded.
   ========================================================================== */

const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MODES = {
  minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11],
};
function midiOf(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name); if (!m) return 60;
  return 12 * (parseInt(m[3], 10) + 1) + NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function chordTones(name, oct) {
  const m = /^([A-G])([#b]?)(m7|maj7|m|dim|7|sus2|sus4|)$/.exec(name); if (!m) return [midiOf('C' + oct)];
  const root = 12 * (oct + 1) + NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const q = { '': [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus2: [0, 2, 7], sus4: [0, 5, 7] }[m[3]];
  return q.map(i => root + i);
}

const Snd = {
  ac: null, master: null, mus: null, sfxG: null, wet: null, curName: null, cur: null, timer: null, started: false, noiseBuf: null,

  init() {
    if (this.ac) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ac = new AC();
      const ac = this.ac;
      this.master = ac.createGain(); this.master.gain.value = 0.7;
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
      this.master.connect(comp); comp.connect(ac.destination);
      this.mus = ac.createGain(); this.mus.gain.value = Game.settings.music;
      this.sfxG = ac.createGain(); this.sfxG.gain.value = Game.settings.sfx;
      this.mus.connect(this.master); this.sfxG.connect(this.master);
      // reverb
      const len = ac.sampleRate * 2.4, buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      const conv = ac.createConvolver(); conv.buffer = buf;
      this.wet = ac.createGain(); this.wet.gain.value = 0.3;
      conv.connect(this.wet); this.wet.connect(this.master);
      this.revIn = ac.createGain(); this.revIn.connect(conv);
      this.sfxRev = ac.createGain(); this.sfxRev.gain.value = 0.25; this.sfxRev.connect(this.revIn);
      // noise buffer
      const nl = ac.sampleRate * 1, nb = ac.createBuffer(1, nl, ac.sampleRate), nd = nb.getChannelData(0);
      for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
      this.noiseBuf = nb;
    } catch (e) { console.warn('audio unavailable', e); this.ac = null; }
  },
  unlock() {
    this.init();
    if (this.ac && this.ac.state === 'suspended') this.ac.resume();
    if (!this.started && this.ac) { this.started = true; if (this.pending) { const p = this.pending; this.pending = null; this.play(p.n, p.o); } }
  },
  setVolumes() { if (!this.ac) return; this.mus.gain.value = Game.settings.music; this.sfxG.gain.value = Game.settings.sfx; },

  /* -------------------------------------------------------------- voices */
  env(g, t, a, peak, dur, r) {
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + Math.max(a, dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
  },
  osc(type, f, t, end, dest, detune = 0) {
    const o = this.ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(end); return o;
  },
  out(g, send = 0.3, bus) {
    g.connect(bus || this.mus);
    if (send > 0) { const s = this.ac.createGain(); s.gain.value = send; g.connect(s); s.connect(this.revIn); }
  },
  voice(inst, f, t, d, v, bus) {
    const ac = this.ac; if (!ac) return;
    const g = ac.createGain(); const end = t + d + 1.2;
    switch (inst) {
      case 'pluck': {
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3600, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
        this.osc('triangle', f, t, end, lp); const s = ac.createGain(); s.gain.value = 0.35; this.osc('square', f, t, end, s); s.connect(lp);
        lp.connect(g); this.env(g, t, 0.004, v * 0.55, 0.02, Math.min(0.9, d * 0.9 + 0.25)); this.out(g, 0.3, bus); break;
      }
      case 'pad': {
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.4;
        this.osc('sawtooth', f, t, end, lp, -7); this.osc('sawtooth', f, t, end, lp, 7); this.osc('triangle', f / 2, t, end, lp);
        lp.connect(g); this.env(g, t, 0.35, v * 0.22, d, 0.9); this.out(g, 0.5, bus); break;
      }
      case 'strings': {
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
        this.osc('sawtooth', f, t, end, lp, -9); this.osc('sawtooth', f, t, end, lp, 9);
        const lfo = ac.createOscillator(); lfo.frequency.value = 5.2; const lg = ac.createGain(); lg.gain.value = 6; lfo.connect(lg);
        lp.connect(g); this.env(g, t, 0.2, v * 0.2, d, 0.5); this.out(g, 0.45, bus); break;
      }
      case 'bass': {
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
        this.osc('sawtooth', f, t, end, lp); const s = ac.createGain(); s.gain.value = 0.8; this.osc('sine', f, t, end, s); s.connect(g);
        lp.connect(g); this.env(g, t, 0.01, v * 0.5, d * 0.85, 0.15); this.out(g, 0.05, bus); break;
      }
      case 'lead': {
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
        const o = this.osc('square', f, t, end, lp); const o2 = this.osc('sawtooth', f, t, end, lp, 6);
        const lfo = ac.createOscillator(); lfo.frequency.value = 5.5; const lg = ac.createGain(); lg.gain.value = 5; lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune); lfo.start(t); lfo.stop(end);
        lp.connect(g); this.env(g, t, 0.02, v * 0.2, d, 0.25); this.out(g, 0.35, bus); break;
      }
      case 'flute': {
        this.osc('sine', f, t, end, g); const s = ac.createGain(); s.gain.value = 0.25; this.osc('triangle', f * 2, t, end, s); s.connect(g);
        this.env(g, t, 0.06, v * 0.4, d, 0.3); this.out(g, 0.4, bus); break;
      }
      case 'organ': {
        [[1, 1], [2, 0.6], [3, 0.4], [4, 0.3], [6, 0.18], [8, 0.1]].forEach(([h, w]) => { const s = ac.createGain(); s.gain.value = w; this.osc('sine', f * h, t, end, s); s.connect(g); });
        this.env(g, t, 0.05, v * 0.16, d, 0.3); this.out(g, 0.55, bus); break;
      }
      case 'choir': {
        const src = ac.createGain();
        this.osc('sawtooth', f, t, end, src, -5); this.osc('sawtooth', f, t, end, src, 5);
        const lfo = ac.createOscillator(); lfo.frequency.value = 5; const lg = ac.createGain(); lg.gain.value = 9; lfo.connect(lg);
        [[800, 6, 1], [1150, 8, 0.5], [2900, 12, 0.25]].forEach(([fr, q, w]) => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = q; const gg = ac.createGain(); gg.gain.value = w; src.connect(bp); bp.connect(gg); gg.connect(g); });
        this.env(g, t, 0.4, v * 0.55, d, 0.9); this.out(g, 0.6, bus); break;
      }
      case 'bell': {
        const car = this.osc('sine', f, t, end, g); const mod = ac.createOscillator(); mod.frequency.value = f * 3.5; const mg = ac.createGain(); mg.gain.setValueAtTime(f * 2.4, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.2); mod.connect(mg); mg.connect(car.frequency); mod.start(t); mod.stop(end);
        this.env(g, t, 0.003, v * 0.4, 0.02, 1.5); this.out(g, 0.55, bus); break;
      }
    }
  },
  drum(kind, t, v, bus) {
    const ac = this.ac; if (!ac) return;
    const g = ac.createGain();
    if (kind === 'kick') { const o = ac.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); o.connect(g); o.start(t); o.stop(t + 0.3); this.env(g, t, 0.002, v * 0.9, 0.05, 0.2); }
    else if (kind === 'snare' || kind === 'hat' || kind === 'tom') {
      const n = ac.createBufferSource(); n.buffer = this.noiseBuf;
      const f = ac.createBiquadFilter(); f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : kind === 'snare' ? 1900 : 300; f.Q.value = 0.8;
      n.connect(f); f.connect(g); n.start(t, Math.random() * 0.5, 0.25);
      if (kind === 'snare' || kind === 'tom') { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = kind === 'snare' ? 190 : 110; const og = ac.createGain(); og.gain.value = 0.5; o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.2); }
      this.env(g, t, 0.001, v * (kind === 'hat' ? 0.25 : 0.55), kind === 'hat' ? 0.02 : 0.06, kind === 'hat' ? 0.05 : 0.14);
    }
    this.out(g, kind === 'snare' ? 0.2 : 0.03, bus);
  },

  /* ------------------------------------------------------------ sequencer */
  build(tr) {
    const spb = tr.spb || 16, bars = tr.chords.length, total = bars * spb, ev = Array.from({ length: total }, () => []);
    const scale = MODES[tr.mode || 'minor'], keyRoot = 12 * ((tr.koct || 4) + 1) + NOTE_IDX[tr.key[0]] + (tr.key[1] === '#' ? 1 : tr.key[1] === 'b' ? -1 : 0);
    const deg = tok => {
      const m = /^(\d)('*)(,*)$/.exec(tok); if (!m) return null;
      const d = parseInt(m[1], 10) - 1, oct = m[2].length - m[3].length;
      return keyRoot + scale[d % 7] + 12 * Math.floor(d / 7) + 12 * oct;
    };
    for (const L of tr.layers) {
      const v = L.vol === undefined ? 0.5 : L.vol;
      for (let b = 0; b < bars; b++) {
        const base = b * spb, ch = chordTones(tr.chords[b], L.oct || 3);
        if (L.style === 'hold') { ev[base].push({ inst: L.inst, m: ch.slice(0, L.n || 3), d: spb * (L.len || 1), v }); }
        else if (L.style === 'arp') {
          const notes = ch.concat(ch.map(x => x + 12)), rate = L.rate || 2, pat = L.pat || [0, 1, 2, 3, 2, 1];
          for (let s = 0, k = 0; s < spb; s += rate, k++) { const idx = pat[k % pat.length]; ev[base + s].push({ inst: L.inst, m: [notes[idx % notes.length]], d: rate * (L.legato || 1.2), v }); }
        } else if (L.style === 'bass') {
          const root = ch[0], pat = L.pat || 'x.......x.......';
          for (let s = 0; s < spb; s++) { const c = pat[s % pat.length]; if (c === 'x') ev[base + s].push({ inst: L.inst || 'bass', m: [root], d: L.dur || 2, v }); else if (c === 'o') ev[base + s].push({ inst: L.inst || 'bass', m: [root + 12], d: L.dur || 2, v: v * 0.8 }); else if (c === '5') ev[base + s].push({ inst: L.inst || 'bass', m: [root + 7], d: L.dur || 2, v: v * 0.9 }); }
        } else if (L.style === 'melody') {
          const bar = (L.notes[b % L.notes.length] || '').split(/\s+/), res = L.res || 2;
          let last = null;
          bar.forEach((tok, i) => {
            if (tok === '.') { last = null; return; }
            if (tok === '_') { if (last) last.d += res; return; }
            const m = deg(tok); if (m === null) return;
            last = { inst: L.inst, m: [m + (L.shift || 0)], d: res * 0.95, v }; ev[base + i * res].push(last);
          });
        } else if (L.style === 'drums') {
          for (const k of ['kick', 'snare', 'hat', 'tom']) { const p = L[k]; if (!p) continue; for (let s = 0; s < spb; s++) if (p[s % p.length] === 'x') ev[base + s].push({ drum: k, v: L.vol === undefined ? 0.6 : L.vol }); else if (p[s % p.length] === 'o') ev[base + s].push({ drum: k, v: (L.vol === undefined ? 0.6 : L.vol) * 0.5 }); }
        } else if (L.style === 'sparkle') {
          // sparse random bells from chord tones (deterministic per bar)
          const rr = new RNG(b * 131 + 7), notes = ch.concat(ch.map(x => x + 12)).concat(ch.map(x => x + 24));
          for (let s = 0; s < spb; s += 2) if (rr.chance(L.prob || 0.3)) ev[base + s].push({ inst: L.inst || 'bell', m: [rr.pick(notes)], d: 4, v });
        }
      }
    }
    return { ev, total, spb, stepDur: 60 / tr.bpm / (spb === 12 ? 3 : 4) };
  },

  play(name, o = {}) {
    if (name === this.curName && !o.once) return;
    if (!this.ac || this.ac.state === 'suspended' && !this.started) { this.pending = { n: name, o }; this.curName = name; if (!this.ac) return; }
    this.stop();
    const tr = TRACKS[name]; this.curName = name; if (!tr || !this.ac) return;
    if (!this.compiled) this.compiled = {};
    const c = this.compiled[name] || (this.compiled[name] = this.build(tr));
    const g = this.ac.createGain(); g.gain.value = 1; g.connect(this.mus);
    this.cur = { name, c, step: 0, t: this.ac.currentTime + 0.08, bus: g, once: !!o.once, tr };
    this.timer = setInterval(() => this.tick(), 40);
    this.tick();
  },
  tick() {
    const s = this.cur; if (!s || !this.ac) return;
    const ac = this.ac;
    while (s.t < ac.currentTime + 0.22) {
      const evs = s.c.ev[s.step];
      for (const e of evs) {
        if (e.drum) this.drum(e.drum, s.t, e.v, s.bus);
        else for (const m of e.m) this.voice(e.inst, mtof(m), s.t, e.d * s.c.stepDur, e.v, s.bus);
      }
      s.t += s.c.stepDur; s.step++;
      if (s.step >= s.c.total) { if (s.once) { this.stopTimerSoon(); return; } s.step = 0; }
    }
  },
  stopTimerSoon() { clearInterval(this.timer); this.timer = null; },
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.cur && this.ac) { const b = this.cur.bus, t = this.ac.currentTime; try { b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0.0001, t + 0.5); setTimeout(() => { try { b.disconnect(); } catch (e) { /* ignore */ } }, 1800); } catch (e) { /* ignore */ } }
    this.cur = null;
  },


  /* Test helper: render `secs` of a track offline and report peak / rms / NaN. */
  async renderTest(name, secs = 8) {
    const tr = TRACKS[name]; if (!tr) return null;
    const sr = 22050, off = new OfflineAudioContext(2, sr * secs, sr);
    const saved = { ac: this.ac, master: this.master, mus: this.mus, sfxG: this.sfxG, revIn: this.revIn, noiseBuf: this.noiseBuf };
    this.ac = off; this.master = off.createGain(); this.master.connect(off.destination);
    this.mus = off.createGain(); this.mus.connect(this.master); this.sfxG = this.mus;
    const conv = off.createConvolver(), len = sr * 1.2, buf = off.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    conv.buffer = buf; this.revIn = off.createGain(); this.revIn.connect(conv); conv.connect(this.master);
    const nl = sr, nb = off.createBuffer(1, nl, sr), nd = nb.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1; this.noiseBuf = nb;
    const c = this.build(tr); let t = 0.05, step = 0;
    while (t < secs) {
      for (const e of c.ev[step]) { if (e.drum) this.drum(e.drum, t, e.v, this.mus); else for (const m of e.m) this.voice(e.inst, mtof(m), t, e.d * c.stepDur, e.v, this.mus); }
      t += c.stepDur; step = (step + 1) % c.total;
    }
    const out = await off.startRendering(), d = out.getChannelData(0);
    let peak = 0, sum = 0, nan = 0; for (let i = 0; i < d.length; i++) { const v = d[i]; if (v !== v) nan++; else { peak = Math.max(peak, Math.abs(v)); sum += v * v; } }
    Object.assign(this, saved);
    return { name, peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), nan, bars: tr.chords.length, bpm: tr.bpm };
  },

  /* ------------------------------------------------------------------ SFX */
  tone(type, f0, f1, dur, v = 0.3, delay = 0, send = 0.1) {
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime + delay, g = ac.createGain();
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    o.connect(g); o.start(t); o.stop(t + dur + 0.1); this.env(g, t, 0.003, v, dur * 0.5, dur * 0.5); this.out(g, send, this.sfxG);
  },
  noise(dur, f0, f1, v = 0.3, type = 'bandpass', delay = 0, q = 1) {
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime + delay, g = ac.createGain();
    const n = ac.createBufferSource(); n.buffer = this.noiseBuf; const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    n.connect(f); f.connect(g); n.start(t, Math.random() * 0.4, dur + 0.1); this.env(g, t, 0.003, v, dur * 0.4, dur * 0.6); this.out(g, 0.12, this.sfxG);
  },
  sfx(name, arg) {
    if (!this.ac || this.ac.state !== 'running') return;
    const T = (...a) => this.tone(...a), N = (...a) => this.noise(...a);
    switch (name) {
      case 'blip': T('square', 880, 880, 0.04, 0.08); break;
      case 'ok': T('square', 660, 660, 0.05, 0.1); T('square', 990, 990, 0.07, 0.1, 0.05); break;
      case 'back': T('square', 600, 400, 0.08, 0.09); break;
      case 'no': T('sawtooth', 160, 120, 0.12, 0.12); break;
      case 'talk': { const h = hashStr(arg || 'x'); T('triangle', 240 + (h % 180) + Math.random() * 30, 240 + (h % 180), 0.035, 0.05, 0, 0.02); break; }
      case 'swing': N(0.16, 900, 3200, 0.16, 'bandpass'); break;
      case 'hit': N(0.09, 1800, 300, 0.32, 'bandpass'); T('sine', 180, 60, 0.12, 0.4); if (arg === 'shot') N(0.05, 4000, 800, 0.3, 'highpass'); break;
      case 'crit': N(0.12, 2600, 300, 0.4, 'bandpass'); T('sine', 200, 50, 0.16, 0.5); T('triangle', 1400, 2100, 0.2, 0.14); break;
      case 'hurt': N(0.12, 900, 150, 0.4, 'lowpass'); T('sine', 130, 50, 0.18, 0.5); break;
      case 'parry': T('sine', 1760, 1760, 0.4, 0.22, 0, 0.5); T('sine', 2637, 2637, 0.3, 0.14, 0.01, 0.5); N(0.08, 6000, 2000, 0.3, 'highpass'); T('triangle', 880, 880, 0.3, 0.16); break;
      case 'dodge': N(0.2, 500, 2600, 0.18, 'bandpass'); break;
      case 'block': T('sine', 240, 100, 0.14, 0.4); T('sine', 1320, 1320, 0.15, 0.12); break;
      case 'miss': T('triangle', 260, 150, 0.12, 0.1); break;
      case 'ring': [0, 1, 2, 3].forEach(i => T('sine', 523 * Math.pow(1.26, i), 523 * Math.pow(1.26, i), 0.08, 0.08, i * 0.05)); break;
      case 'ready': T('sine', 1568, 1568, 0.08, 0.06); break;
      case 'kill': N(0.4, 2400, 200, 0.4, 'bandpass'); T('sine', 300, 40, 0.4, 0.4); break;
      case 'death': T('sawtooth', 300, 60, 0.7, 0.2); N(0.5, 1200, 100, 0.3, 'lowpass'); break;
      case 'heal': [0, 1, 2, 3, 4].forEach(i => T('sine', 660 * Math.pow(1.19, i), 660 * Math.pow(1.19, i), 0.15, 0.09, i * 0.06, 0.4)); break;
      case 'buff': T('sine', 587, 587, 0.12, 0.1, 0, 0.3); T('sine', 880, 880, 0.2, 0.1, 0.09, 0.3); break;
      case 'levelup': [523, 659, 784, 1046, 1318].forEach((f, i) => T('triangle', f, f, 0.3, 0.14, i * 0.09, 0.5)); break;
      case 'chest': [660, 784, 988, 1318].forEach((f, i) => T('square', f, f, 0.12, 0.09, i * 0.07)); break;
      case 'encounter': N(0.6, 200, 4000, 0.4, 'bandpass'); T('sawtooth', 90, 45, 0.6, 0.3); break;
      case 'alert': T('square', 1200, 1200, 0.07, 0.1); T('square', 1600, 1600, 0.07, 0.1, 0.08); break;
      case 'charge': T('sawtooth', 80, 640, 1.3, 0.14, 0, 0.3); N(1.2, 300, 3000, 0.1, 'bandpass'); break;
      case 'interrupt': N(0.3, 6000, 200, 0.4, 'highpass'); T('square', 1500, 100, 0.3, 0.25); T('sine', 90, 40, 0.3, 0.5); break;
      case 'telegraph': T('sine', 330, 330, 0.06, 0.07); break;
      case 'telegraphH': T('sine', 110, 110, 0.5, 0.25, 0, 0.5); T('triangle', 220, 220, 0.4, 0.1); break;
      case 'fuse': [110, 165, 220, 277, 330].forEach((f, i) => T('sawtooth', f, f * 1.02, 1.4, 0.09, i * 0.05, 0.6)); N(1.2, 200, 3000, 0.2, 'bandpass'); break;
      case 'glitch': for (let i = 0; i < 5; i++) T('square', 200 + Math.random() * 1600, 200 + Math.random() * 1600, 0.04, 0.09, i * 0.04); break;
      case 'flee': N(0.5, 300, 2400, 0.3, 'bandpass'); break;
      case 'save': [523, 659, 784].forEach((f, i) => T('sine', f, f, 0.5, 0.12, i * 0.1, 0.6)); break;
      case 'gate': T('sawtooth', 60, 400, 1.2, 0.15, 0, 0.5); [392, 587, 784].forEach((f, i) => T('sine', f, f, 0.8, 0.1, 0.5 + i * 0.12, 0.7)); break;
      case 'step': N(0.03, 800, 400, 0.05, 'bandpass'); break;
    }
  },
};

/* --------------------------------------------------------------------------
   Track specs. spb = steps per bar (16 = 4/4 sixteenths, 12 = 3/4).
   melody tokens are scale degrees: 5 = 5th, 1' = octave up, 3, = octave down.
   -------------------------------------------------------------------------- */
const TRACKS = {
  title: {
    bpm: 66, spb: 16, key: 'A', mode: 'minor', koct: 4,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'Em'],
    layers: [
      { style: 'hold', inst: 'choir', oct: 3, vol: 0.5, n: 3 }, { style: 'hold', inst: 'organ', oct: 2, vol: 0.5, n: 2 },
      { style: 'arp', inst: 'bell', oct: 4, vol: 0.35, rate: 4, pat: [0, 2, 1, 2, 3, 2, 1, 2] },
      { style: 'bass', inst: 'bass', oct: 2, vol: 0.5, pat: 'x.......x.......', dur: 6 },
      {
        style: 'melody', inst: 'lead', vol: 0.7, res: 2, notes: [
          "5 _ 3 _ 1 _ 3 5", "6 _ _ _ 5 _ 3 _", "3' _ 5 _ 7 _ 5 _", "7 _ 2' _ 4' _ 2' 7", "5' _ 3' _ 1' _ 3' 5'", "6' _ _ _ 5' _ 3' _", "4' _ 6 _ 1' _ 6 4", "5 _ 7 _ 2' _ _ _"],
      },
      { style: 'sparkle', inst: 'bell', oct: 5, vol: 0.2, prob: 0.25 },
    ],
  },
  aurelle: {
    bpm: 100, spb: 12, key: 'D', mode: 'minor', koct: 4,
    chords: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'Dm', 'Bb', 'C', 'Gm', 'Dm', 'Bb', 'Am'],
    layers: [
      { style: 'bass', inst: 'bass', oct: 2, vol: 0.55, pat: 'x...........', dur: 3 },
      { style: 'arp', inst: 'pluck', oct: 4, vol: 0.5, rate: 4, pat: [1, 2, 1, 2, 1, 2, 1, 2].map((x, i) => (i % 3 === 0 ? -99 : x)).filter(x => x > 0) },
      { style: 'hold', inst: 'strings', oct: 3, vol: 0.5, n: 3 },
      {
        style: 'melody', inst: 'flute', vol: 0.7, res: 2, notes: [
          "5 _ 3 _ 1 3", "6 _ 5 _ 3 _", "3' _ 1' _ 7 _", "7 _ 2' _ 4' _", "5 _ 3 _ 1 3", "6 _ 5 _ 3 5", "7 _ 2' _ 4' _", "5 _ _ _ . .",
          "4' _ 6 _ 4 6", "5' _ 3' _ 1' 3'", "6' _ 5' _ 3' _", "7 _ 2' _ 4' _", "4' _ 6 _ 1' _", "5' _ 3' _ 1' _", "6' _ 5' _ 3' 5'", "1' _ _ _ . ."],
      },
      { style: 'drums', kick: 'x...........', hat: '..o...o.....', vol: 0.25 },
    ],
  },
  opera: {
    bpm: 72, spb: 12, key: 'E', mode: 'minor', koct: 4,
    chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'.replace('B', 'Bm')],
    layers: [
      { style: 'hold', inst: 'organ', oct: 2, vol: 0.6, n: 3 }, { style: 'hold', inst: 'choir', oct: 3, vol: 0.5, n: 3 },
      { style: 'arp', inst: 'bell', oct: 5, vol: 0.3, rate: 4, pat: [0, 1, 2, 1] },
      { style: 'bass', inst: 'bass', oct: 2, vol: 0.4, pat: 'x...........', dur: 8 },
      {
        style: 'melody', inst: 'flute', vol: 0.55, res: 2, notes: [
          "5 _ _ _ 3 _", "6 _ 5 _ 3 _", "7 _ 2' _ 5 _", "4' _ 2' _ 7 _", "5 _ _ _ 3 5", "6 _ 1' _ 6 _", "4' _ 3' _ 1' _", "2' _ _ _ 7 _"],
      },
    ],
  },
  catacombs: {
    bpm: 60, spb: 16, key: 'D', mode: 'minor', koct: 3,
    chords: ['Dm', 'Dm', 'Bb', 'Gm', 'Dm', 'Dm', 'Gm', 'A'.replace('A', 'Am')],
    layers: [
      { style: 'hold', inst: 'pad', oct: 2, vol: 0.6, n: 3 }, { style: 'bass', inst: 'bass', oct: 1, vol: 0.5, pat: 'x...............', dur: 10 },
      { style: 'sparkle', inst: 'bell', oct: 4, vol: 0.32, prob: 0.22 },
      { style: 'drums', tom: 'x.......o.......', vol: 0.3 },
    ],
  },
  glade: {
    bpm: 84, spb: 16, key: 'G', mode: 'major', koct: 4,
    chords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'D'],
    layers: [
      { style: 'arp', inst: 'pluck', oct: 3, vol: 0.5, rate: 2, pat: [0, 1, 2, 1, 3, 2, 1, 2] },
      { style: 'hold', inst: 'pad', oct: 3, vol: 0.4, n: 3 }, { style: 'bass', inst: 'bass', oct: 2, vol: 0.4, pat: 'x.......5.......', dur: 5 },
      {
        style: 'melody', inst: 'flute', vol: 0.65, res: 2, notes: [
          "5 _ 3 _ 2 3 5 _", "3 _ 2 _ 1 _ 6, _", "1' _ 7 _ 5 _ 3 _", "2' _ 1' _ 7 _ 5 _", "5 _ 3 _ 2 3 5 _", "3' _ 2' _ 1' _ 6 _", "5 _ 3 _ 1' _ 5 _", "2' _ _ _ . . . ."],
      },
      { style: 'drums', hat: '..o...o...o...o.', vol: 0.15 },
    ],
  },
  woods: {
    bpm: 92, spb: 16, key: 'A', mode: 'dorian', koct: 4,
    chords: ['Am', 'G', 'F', 'G', 'Am', 'G', 'Dm', 'Am'],
    layers: [
      { style: 'hold', inst: 'choir', oct: 3, vol: 0.35, n: 3 },
      { style: 'arp', inst: 'pluck', oct: 4, vol: 0.4, rate: 2, pat: [0, 2, 1, 3, 2, 1] },
      { style: 'bass', inst: 'bass', oct: 2, vol: 0.45, pat: 'x...x...x..5x...', dur: 3 },
      { style: 'sparkle', inst: 'bell', oct: 5, vol: 0.2, prob: 0.2 },
      { style: 'drums', kick: 'x.......x.......', hat: 'o.o.o.o.o.o.o.o.', vol: 0.2 },
    ],
  },
  temple: {
    bpm: 62, spb: 16, key: 'D', mode: 'minor', koct: 4,
    chords: ['Dm', 'Bb', 'Gm', 'Am', 'Dm', 'Bb', 'C', 'Am'],
    layers: [
      { style: 'hold', inst: 'choir', oct: 3, vol: 0.6, n: 3 }, { style: 'hold', inst: 'organ', oct: 2, vol: 0.55, n: 3 },
      { style: 'arp', inst: 'bell', oct: 5, vol: 0.28, rate: 4, pat: [0, 1, 2, 3] },
      { style: 'bass', inst: 'bass', oct: 1, vol: 0.5, pat: 'x...............', dur: 12 },
      {
        style: 'melody', inst: 'choir', vol: 0.55, res: 4, notes: [
          "5 _ 3 _", "6 _ 5 _", "4' _ 2' _", "1' _ 7 _", "5 _ 3 _", "6 _ 5 _", "7 _ 2' _", "5 _ _ _"],
      },
      { style: 'drums', tom: 'x...............', vol: 0.25 },
    ],
  },
  terminus: {
    bpm: 112, spb: 16, key: 'E', mode: 'minor', koct: 4,
    chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'.replace('B', 'Bm')],
    layers: [
      { style: 'arp', inst: 'lead', oct: 4, vol: 0.35, rate: 1, pat: [0, 1, 2, 3, 2, 1, 0, 2], legato: 0.9 },
      { style: 'bass', inst: 'bass', oct: 2, vol: 0.5, pat: 'x.x.x.x.x.x.x.x.', dur: 1.5 },
      { style: 'hold', inst: 'pad', oct: 3, vol: 0.5, n: 3 },
      {
        style: 'melody', inst: 'lead', vol: 0.45, res: 2, notes: [
          "5 _ _ _ 7 _ 5 _", "3' _ _ _ 1' _ 7 _", "5 _ _ _ 7 _ 2' _", "4' _ 2' _ 7 _ 5 _", "5 _ _ _ 7 _ 5 _", "3' _ 5' _ 3' _ 1' _", "6 _ 1' _ 3' _ 1' _", "7 _ 2' _ 4' _ 2' _"],
      },
      { style: 'drums', kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'o.x.o.x.o.x.o.x.', vol: 0.4 },
    ],
  },
  datacore: {
    bpm: 128, spb: 16, key: 'C', mode: 'minor', koct: 4,
    chords: ['Cm', 'Ab', 'Bb', 'Gm', 'Cm', 'Ab', 'Fm', 'G'.replace('G', 'Gm')],
    layers: [
      { style: 'bass', inst: 'bass', oct: 1, vol: 0.55, pat: 'x.xxx.x.x.xxx.x.', dur: 1 },
      { style: 'arp', inst: 'lead', oct: 4, vol: 0.3, rate: 1, pat: [0, 2, 1, 3, 0, 3, 2, 1], legato: 0.8 },
      { style: 'hold', inst: 'strings', oct: 3, vol: 0.4, n: 3 },
      { style: 'drums', kick: 'x..x..x...x.x...', snare: '....x.......x..x', hat: 'xxxxxxxxxxxxxxxx', vol: 0.4 },
    ],
  },
  lacuna: {
    bpm: 52, spb: 16, key: 'A', mode: 'minor', koct: 4,
    chords: ['Am', 'F', 'C', 'Em', 'Am', 'F', 'Dm', 'E'.replace('E', 'Em')],
    layers: [
      { style: 'hold', inst: 'choir', oct: 3, vol: 0.6, n: 3 }, { style: 'hold', inst: 'strings', oct: 3, vol: 0.4, n: 3 },
      { style: 'sparkle', inst: 'bell', oct: 5, vol: 0.3, prob: 0.3 },
      { style: 'arp', inst: 'bell', oct: 4, vol: 0.22, rate: 8, pat: [0, 2, 1] },
      { style: 'bass', inst: 'bass', oct: 1, vol: 0.4, pat: 'x...............', dur: 14 },
    ],
  },
  battle: {
    bpm: 150, spb: 16, key: 'A', mode: 'minor', koct: 4,
    chords: ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'Dm', 'Em'],
    layers: [
      { style: 'bass', inst: 'bass', oct: 2, vol: 0.55, pat: 'x.xxx.x.x.xxx.o.', dur: 1 },
      { style: 'arp', inst: 'pluck', oct: 4, vol: 0.32, rate: 1, pat: [0, 1, 2, 1, 0, 2, 1, 3], legato: 0.9 },
      { style: 'hold', inst: 'strings', oct: 3, vol: 0.4, n: 3 },
      {
        style: 'melody', inst: 'lead', vol: 0.5, res: 2, notes: [
          "5 _ 5 3 5 _ 6 5", "5 _ 3 _ 1 _ 3 _", "6 _ 6 5 6 _ 1' 6", "7 _ 5 _ 2' _ 7 _", "5' _ 5 3' 5' _ 6' 5'", "3' _ 1' _ 3' _ 5' _", "4' _ 6 _ 1' _ 6 4", "5 _ 7 _ 2' _ 7 5"],
      },
      { style: 'drums', kick: 'x...x..xx...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xx', vol: 0.45 },
    ],
  },
  boss: {
    bpm: 158, spb: 16, key: 'D', mode: 'minor', koct: 4,
    chords: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'Bb', 'A'.replace('A', 'Am')],
    layers: [
      { style: 'hold', inst: 'organ', oct: 2, vol: 0.6, n: 3 }, { style: 'hold', inst: 'choir', oct: 3, vol: 0.45, n: 3 },
      { style: 'bass', inst: 'bass', oct: 2, vol: 0.6, pat: 'x.xxx.x.x.xxx.x.', dur: 1 },
      { style: 'arp', inst: 'pluck', oct: 4, vol: 0.3, rate: 1, pat: [0, 2, 1, 3, 2, 1, 3, 2], legato: 0.8 },
      {
        style: 'melody', inst: 'lead', vol: 0.55, res: 2, notes: [
          "1' _ 1' 7 1' _ 2' 1'", "5 _ 7 _ 1' _ 7 5", "6 _ 6 5 6 _ 1' 6", "7 _ 2' _ 4' _ 2' 7", "1' _ 1' 7 1' _ 2' 3'", "4' _ 2' _ 7 _ 4 _", "6 _ 1' _ 3' _ 1' 6", "5 _ 7 _ 2' _ 3' _"],
      },
      { style: 'drums', kick: 'x..xx..xx..xx.x.', snare: '....x.......x.x.', hat: 'xxxxxxxxxxxxxxxx', tom: '..............xx', vol: 0.5 },
    ],
  },
  final: {
    bpm: 148, spb: 16, key: 'C', mode: 'minor', koct: 4,
    chords: ['Cm', 'Ab', 'Eb', 'Bb', 'Cm', 'Ab', 'Fm', 'G'.replace('G', 'Gm')],
    layers: [
      { style: 'hold', inst: 'choir', oct: 3, vol: 0.6, n: 3 }, { style: 'hold', inst: 'organ', oct: 2, vol: 0.55, n: 3 },
      { style: 'bass', inst: 'bass', oct: 2, vol: 0.6, pat: 'x.xxx.xxx.xxx.x.', dur: 1 },
      { style: 'arp', inst: 'lead', oct: 4, vol: 0.26, rate: 1, pat: [0, 1, 2, 3, 2, 1, 3, 2], legato: 0.8 },
      {
        style: 'melody', inst: 'choir', vol: 0.6, res: 4, notes: [
          "5 _ 3 _", "1' _ 6 _", "5 _ 7 _", "2' _ 4' _", "5' _ 3' _", "1' _ 6 _", "4' _ 6 _", "5 _ 7 _"],
      },
      {
        style: 'melody', inst: 'lead', vol: 0.4, res: 2, notes: [
          "1' _ 5' _ 3' _ 5' _", "6' _ 3' _ 1' _ 3' _", "5' _ 2' _ 7 _ 2' _", "4' _ 2' _ 7 _ 5 _", "1' _ 5' _ 3' _ 5' _", "6' _ 3' _ 1' _ 3' _", "4' _ 1' _ 6 _ 1' _", "5 _ 7 _ 2' _ 4' _"],
      },
      { style: 'drums', kick: 'x..xx..xx..xx.x.', snare: '....x.......x.xx', hat: 'xxxxxxxxxxxxxxxx', tom: '..............xx', vol: 0.5 },
    ],
  },
  victory: {
    bpm: 132, spb: 16, key: 'C', mode: 'major', koct: 4,
    chords: ['C', 'F', 'G', 'C'],
    layers: [
      { style: 'hold', inst: 'organ', oct: 3, vol: 0.5, n: 3 }, { style: 'bass', inst: 'bass', oct: 2, vol: 0.5, pat: 'x...x...x...x...', dur: 3 },
      {
        style: 'melody', inst: 'lead', vol: 0.6, res: 2, notes: [
          "5 5 5 _ 1' _ 3' _", "4' _ 6' _ 1'' _ 6' _", "7 7 7 _ 2' _ 5' _", "1' _ _ _ _ _ . ."],
      },
      { style: 'drums', kick: 'x.......x.......', snare: '....x.......x...', vol: 0.4 },
    ],
  },
  gameover: {
    bpm: 54, spb: 16, key: 'A', mode: 'minor', koct: 4,
    chords: ['Am', 'F', 'Dm', 'Am'],
    layers: [
      { style: 'hold', inst: 'choir', oct: 3, vol: 0.6, n: 3 }, { style: 'hold', inst: 'strings', oct: 3, vol: 0.4, n: 3 },
      { style: 'melody', inst: 'flute', vol: 0.5, res: 4, notes: ["3 _ 2 _", "1 _ 6, _", "4 _ 3 _", "1 _ _ _"] },
    ],
  },
};
