'use strict';
/* ==========================================================================
   VERMILION REQUIEM — input.js
   Keyboard, gamepad and touch unified into named actions with edge
   detection and menu-style key repeat.
   ========================================================================== */

const Input = {
  keyMap: {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Enter: 'ok', Space: 'ok', KeyJ: 'ok',
    KeyX: 'cancel', Escape: 'cancel', Backspace: 'cancel', KeyK: 'cancel',
    KeyC: 'menu', Tab: 'menu', KeyM: 'menu', KeyQ: 'l', KeyE: 'r',
    ShiftLeft: 'run', ShiftRight: 'run',
  },
  held: {}, pend: {}, pressed: {}, hold: {}, virt: {}, padPrev: {},
  lastDevice: 'kb',
  dirs: ['up', 'down', 'left', 'right'],

  init() {
    addEventListener('keydown', e => {
      const a = this.keyMap[e.code];
      if (!a) return;
      e.preventDefault();
      this.lastDevice = 'kb';
      if (!this.held[a]) this.pend[a] = true;
      this.held[a] = true;
    });
    addEventListener('keyup', e => {
      const a = this.keyMap[e.code];
      if (!a) return;
      e.preventDefault();
      this.held[a] = false;
    });
    addEventListener('blur', () => { this.held = {}; this.virt = {}; });
    this.bindTouch();
  },

  bindTouch() {
    const root = document.getElementById('touch');
    if (!root) return;
    const set = (a, v) => {
      if (v && !this.virt[a]) this.pend[a] = true;
      this.virt[a] = v;
    };
    root.querySelectorAll('[data-a]').forEach(el => {
      const a = el.dataset.a;
      const on = e => { e.preventDefault(); this.lastDevice = 'touch'; root.classList.add('on'); set(a, true); el.classList.add('down'); };
      const off = e => { e.preventDefault(); set(a, false); el.classList.remove('down'); };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('pointerleave', off);
      el.addEventListener('contextmenu', e => e.preventDefault());
    });
    addEventListener('touchstart', () => { this.lastDevice = 'touch'; root.classList.add('on'); }, { passive: true, once: true });
  },

  /* called once at the start of every fixed update */
  begin(dt) {
    this.pressed = this.pend;
    this.pend = {};
    this.pollPad();
    for (const d of this.dirs) {
      if (this.isDown(d)) {
        this.hold[d] = (this.hold[d] || 0) + dt;
        // auto-repeat: 0.32s delay then every 0.09s
        if (this.pressed[d]) this.hold[d] = 0.0001;
        else if (this.hold[d] > 0.32) {
          const prev = this.hold[d] - dt;
          if (Math.floor((this.hold[d] - 0.32) / 0.09) !== Math.floor((prev - 0.32) / 0.09)) this.pressed[d + 'R'] = true;
        }
      } else this.hold[d] = 0;
    }
  },

  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && [...pads].find(p => p && p.connected);
    if (!gp) return;
    const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const now = {
      up: b(12) || ay < -0.5, down: b(13) || ay > 0.5,
      left: b(14) || ax < -0.5, right: b(15) || ax > 0.5,
      ok: b(0), cancel: b(1), menu: b(3) || b(9), run: b(2) || b(5), l: b(4), r: b(5),
    };
    for (const k in now) {
      if (now[k] && !this.padPrev[k]) { this.pressed[k] = true; this.lastDevice = 'pad'; }
      this.padPrev[k] = now[k];
    }
    this.padNow = now;
  },

  isDown(a) { return !!(this.held[a] || this.virt[a] || (this.padNow && this.padNow[a])); },
  /* edge-triggered */
  hit(a) { return !!this.pressed[a]; },
  /* edge-triggered with key repeat, for menu cursors */
  rep(a) { return !!(this.pressed[a] || this.pressed[a + 'R']); },
  /* swallow all pending input (used after scene changes) */
  flush() { this.pressed = {}; this.pend = {}; },
};
