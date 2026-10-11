// Musique chiptune originale + effets sonores, générés avec la Web Audio API.
const SND = (() => {
  let ctx = null, master, musicBus, sfxBus, noiseBuf, pulse12, pulse25;
  let muted = false;
  try { muted = localStorage.getItem('dbq_mute') === '1'; } catch (e) { /* stockage indisponible */ }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    pulse12 = makePulse(0.125); pulse25 = makePulse(0.25);
    if (pendingSong) { const s = pendingSong; pendingSong = null; playMusic(s, true); }
  }
  function makePulse(duty) {
    const n = 64, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('dbq_mute', muted ? '1' : '0'); } catch (e) { /* ignore */ }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.02);
    return muted;
  }

  // ---------- Partitions (compositions originales) ----------
  // Jeton : NOTE[:durée en doubles-croches] ; '-' = silence. Batterie : k, s, h.
  const SONGS = {
    title: {
      bpm: 116, ch: [
        { w: 'p25', v: 0.16, d: 2, n: 'D5 G5 A5 B5:6 A5 G5 A5:4 D5:4 -:8 E5 F#5 G5 A5:6 G5 F#5 G5:8 -:8 G5 A5 B5 D6:6 C6 B5 A5:4 G5:4 -:8 E5 F#5 G5 D6:6 C6 B5 C6:4 B5:4 A5:8' },
        { w: 'tri', v: 0.32, d: 4, n: 'G2 D3 G2 D3 C3 G3 C3 G3 E2 B2 E2 B2 D3 A3 D3 A3 G2 D3 G2 D3 C3 G3 C3 G3 A2 E3 A2 E3 D3 A3 D3 F#3' },
        { w: 'p12', v: 0.07, d: 2, n: 'B4 D5 G5 D5 B4 D5 G5 D5 C5 E5 G5 E5 C5 E5 G5 E5 B4 E5 G5 E5 B4 E5 G5 E5 A4 D5 F#5 D5 A4 D5 F#5 D5 B4 D5 G5 D5 B4 D5 G5 D5 C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 A5 E5 C5 E5 A5 E5 A4 D5 F#5 D5 A4 D5 F#5 D5' },
        { w: 'drum', v: 0.5, d: 2, n: 'k h s h k k s h k h s h k k s h k h s h k k s h k h s h k k s s' },
      ]
    },
    field: {
      bpm: 138, ch: [
        { w: 'p25', v: 0.15, d: 2, n: 'E5 G5 C6:4 B5 A5 G5:4 A5 C6 E6:4 D6 C6 A5:4 F5 A5 C6:3 A5:1 G5 F5 E5:4 D5 E5 G5:4 B5:4 D6:4 E6:4 D6 C6 G5:4 E5:4 A5 B5 C6:4 E6:4 C6:4 A5 C6 F6:4 D6 B5 G5:4 C6:6 G5 C6:8' },
        { w: 'tri', v: 0.3, d: 2, n: 'C3 C4 G3 C4 C3 C4 G3 C4 A2 A3 E3 A3 A2 A3 E3 A3 F2 F3 C3 F3 F2 F3 C3 F3 G2 G3 D3 G3 G2 G3 D3 G3 C3 C4 G3 C4 C3 C4 G3 C4 A2 A3 E3 A3 A2 A3 E3 A3 F2 F3 C3 F3 G2 G3 D3 G3 C3 C4 G3 C4 C3 G3 E3 G3' },
        { w: 'p12', v: 0.06, d: 2, n: '- E4 - G4 - E4 - G4 - E4 - A4 - E4 - A4 - F4 - A4 - F4 - A4 - D4 - G4 - D4 - G4 - E4 - G4 - E4 - G4 - E4 - A4 - E4 - A4 - F4 - A4 - D4 - G4 - E4 - G4 - E4 - G4' },
        { w: 'drum', v: 0.45, d: 2, n: 'k h s h k k s h k h s h k k s h k h s h k k s h k h s h k k s s k h s h k k s h k h s h k k s h k h s h k k s h k h s h k s s s' },
      ]
    },
    forest: {
      bpm: 112, ch: [
        { w: 'p25', v: 0.14, d: 2, n: 'A4 C5 E5:4 D5 C5 D5:4 E5:4 -:12 G4 B4 D5:4 C5 B4 C5:4 A4:4 -:12 F4 A4 C5:4 B4 A4 B4:4 G4:4 -:12 G4 E4 G#4 B4:4 E5:4 D5:4 B4:14' },
        { w: 'tri', v: 0.3, d: 4, n: 'A2 E3 A2 E3 G2 D3 G2 D3 F2 C3 F2 C3 E2 B2 E2 G#2' },
        { w: 'p12', v: 0.05, d: 2, n: 'A3 E4 A4 E4 A3 E4 A4 E4 G3 D4 G4 D4 G3 D4 G4 D4 F3 C4 F4 C4 F3 C4 F4 C4 E3 B3 E4 B3 E3 B3 G#4 B3' },
        { w: 'drum', v: 0.3, d: 2, n: 'k - h - s - h h k - h - s - h - k - h - s - h h k - h - s h s h' },
      ]
    },
    village: {
      bpm: 100, ch: [
        { w: 'p25', v: 0.14, d: 2, n: 'C5:4 F5:4 A5:6 G5:2 F5:4 D5:4 A4:8 A#4:4 D5:4 F5:4 G5 A5 G5:6 F5:2 E5:4 C5:4 C5:4 F5:4 A5:4 C6:4 D6:4 C6 A5 F5:8 A#5:4 A5 G5 F5:4 E5 G5 F5:12 -:4' },
        { w: 'tri', v: 0.3, d: 4, n: 'F2 C3 A2 C3 D2 A2 F2 A2 A#1 F2 D2 F2 C2 G2 E2 G2 F2 C3 A2 C3 D2 A2 F2 A2 A#1 F2 C2 G2 F2 C3 F2:8' },
        { w: 'p12', v: 0.05, d: 2, n: 'A4 C5 F5 C5 A4 C5 F5 C5 F4 A4 D5 A4 F4 A4 D5 A4 F4 A#4 D5 A#4 F4 A#4 D5 A#4 E4 G4 C5 G4 E4 G4 C5 G4 A4 C5 F5 C5 A4 C5 F5 C5 F4 A4 D5 A4 F4 A4 D5 A4 F4 A#4 D5 A#4 E4 G4 C5 G4 A4 C5 F5 C5 A4 C5 F5 C5' },
        { w: 'drum', v: 0.25, d: 4, n: 'k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s s' },
      ]
    },
    desert: {
      bpm: 120, ch: [
        { w: 'p25', v: 0.14, d: 2, n: 'D5:3 D#5:1 F#5:4 G5:2 F#5:2 D#5:4 D5:3 C5:1 D5:4 A4:8 D5:3 D#5:1 F#5:4 A5:2 G5:2 F#5:4 G5:2 F#5:2 D#5:2 C5:2 D5:8' },
        { w: 'tri', v: 0.3, d: 2, n: 'D2 D2 A2 D2 D2 A2 C3 A2 D2 D2 A2 D2 D2 A2 C3 A2 D2 D2 A2 D2 D2 A2 C3 A2 C2 C2 G2 C2 D2 D2 A2 D2' },
        { w: 'drum', v: 0.35, d: 2, n: 'k - h k s - h - k - h k s h h - k - h k s - h - k k h k s s s -' },
      ]
    },
    castle: {
      bpm: 108, ch: [
        { w: 'p25', v: 0.14, d: 2, n: 'E5:4 G5 F#5 E5:4 B4:4 C5:4 E5 D5 C5:4 G4:4 A4:4 C5 B4 A4 C5 E5:4 D#5:4 F#5:4 B5:6 -:2 E5 F#5 G5:4 A5 G5 F#5:4 E5 D5 C5:4 E5:4 G5:4 A5:4 G5 F#5 E5:4 C5:4 B4:4 D#5:4 F#5:4 B4:4' },
        { w: 'tri', v: 0.32, d: 8, n: 'E2 B2 C2 G2 A1 E2 B1 F#2 E2 B2 C2 G2 A1 E2 B1 F#2' },
        { w: 'drum', v: 0.3, d: 4, n: 'k - s k k - s k k - s k k - s s k - s k k - s k k - s k k s s s' },
      ]
    },
    battle: {
      bpm: 162, ch: [
        { w: 'p25', v: 0.15, d: 2, n: 'A5 A5:1 A5:1 C6 A5 E6:3 D6:1 C6 B5 C6 C6:1 C6:1 A5 F5 A5:3 C6:1 F6 E6 D6 B5 G5 B5 D6:3 E6:1 D6 B5 E6:4 D6 C6 B5:4 G#5:4 A5:3 E5:1 A5 B5 C6:3 B5:1 A5 C6 F6:4 E6 D6 C6:4 A5:4 B5 C6 D6 E6 F6 E6 D6 B5 E6:8 G#5:4 B5:4' },
        { w: 'tri', v: 0.32, d: 2, n: 'A2 A2 A3 A2 A2 A3 A2 G2 F2 F2 F3 F2 F2 F3 F2 E2 G2 G2 G3 G2 G2 G3 G2 A2 E2 E2 E3 E2 E2 E3 B2 G#2 A2 A2 A3 A2 A2 A3 A2 G2 F2 F2 F3 F2 F2 F3 F2 E2 G2 G2 G3 G2 G2 G3 G2 A2 E2 E2 E3 E2 E2 E3 B2 G#2' },
        { w: 'p12', v: 0.05, d: 1, n: 'A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 F5 C5 A4 C5 F5 C5 A4 C5 F5 C5 A4 C5 F5 C5 B4 D5 G5 D5 B4 D5 G5 D5 B4 D5 G5 D5 B4 D5 G5 D5 B4 E5 G#5 E5 B4 E5 G#5 E5 B4 E5 G#5 E5 B4 E5 G#5 E5' },
        { w: 'drum', v: 0.45, d: 1, n: 'k:2 h h s:2 h:2 k k h:2 s:2 h h k:2 h h s:2 h:2 k k h:2 s:2 s s' },
      ]
    },
    boss: {
      bpm: 150, ch: [
        { w: 'p25', v: 0.16, d: 2, n: 'D5 F5 A5 D6:4 C6 A5 F5 A#5:4 A5 G5 F5 G5 A5:4 G5 A5 A#5 C6:4 A#5 A5 G5 A5:4 C#6:4 E6:4 A5:4 D6:3 C6:1 A5 F5 D6:3 E6:1 F6:4 F6 E6 D6 A#5 D6:4 F6:4 E6 D6 C6 G5 C6 D6 E6:4 C#6:4 E6:4 A6:8' },
        { w: 'tri', v: 0.34, d: 2, n: 'D2 D3 D2 D3 D2 D3 C3 A2 A#1 A#2 A#1 A#2 A#1 A#2 A2 F2 C2 C3 C2 C3 C2 C3 A#2 G2 A1 A2 A1 A2 A1 A2 C#3 E3 D2 D3 D2 D3 D2 D3 C3 A2 A#1 A#2 A#1 A#2 A#1 A#2 A2 F2 C2 C3 C2 C3 C2 C3 A#2 G2 A1 A2 A1 A2 A1 A2 C#3 E3' },
        { w: 'p12', v: 0.05, d: 1, n: 'D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A#4 F4 D4 F4 A#4 F4 D4 F4 A#4 F4 D4 F4 A#4 F4 E4 G4 C5 G4 E4 G4 C5 G4 E4 G4 C5 G4 E4 G4 C5 G4 E4 A4 C#5 A4 E4 A4 C#5 A4 E4 A4 C#5 A4 E4 A4 C#5 A4' },
        { w: 'drum', v: 0.5, d: 1, n: 'k h h k s:2 h k k h h k s:2 h:2 k h h k s:2 h k k h h k s:2 s s' },
      ]
    },
    victory: {
      bpm: 150, loop: false, ch: [
        { w: 'p25', v: 0.17, d: 2, n: 'E5 G5 C6:4 G5 C6 E6:8 -:2 D6 E6 F6 E6:4 D6:4 C6:12 -:4' },
        { w: 'p12', v: 0.08, d: 2, n: 'C5 E5 G5:4 E5 G5 C6:8 -:2 B5 C6 D6 C6:4 B5:4 G5:12 -:4' },
        { w: 'tri', v: 0.3, d: 4, n: 'C3 G3 C3 G3 F2 C3 G2 B2 C3:12 -:4' },
        { w: 'drum', v: 0.4, d: 2, n: 'k k s:4 k k s:6 k h s h k s k:12 -:4' },
      ]
    },
    shenron: {
      bpm: 76, ch: [
        { w: 'tri', v: 0.25, d: 8, n: 'A4 E5 D5 F5 C5:4 A4:4 F5 E5:12 G#4:4 A4 C5 D5 A5 G5:4 F5:4 E5 E5:16' },
        { w: 'tri', v: 0.3, d: 16, n: 'A1 D2 F1 E1 A1 D2 C2 E1' },
        { w: 'p12', v: 0.045, d: 2, n: 'A3 E4 A4 C5 E5 C5 A4 E4 D4 F4 A4 D5 F5 D5 A4 F4 F3 C4 F4 A4 C5 A4 F4 C4 E3 B3 E4 G#4 B4 G#4 E4 B3 A3 E4 A4 C5 E5 C5 A4 E4 D4 F4 A4 D5 F5 D5 A4 F4 C4 E4 G4 C5 E5 C5 G4 E4 E3 B3 E4 G#4 B4 G#4 E4 B3' },
      ]
    },
    gameover: {
      bpm: 80, loop: false, ch: [
        { w: 'p25', v: 0.14, d: 4, n: 'A4 G4 F4 E4:12 -:8' },
        { w: 'tri', v: 0.3, d: 8, n: 'D3 C3 A2:8 -:8' },
      ]
    },
  };

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parse(str, defLen) {
    const out = [];
    for (const tok of str.trim().split(/\s+/)) {
      const [n, l] = tok.split(':');
      const len = l ? parseFloat(l) : defLen;
      if (n === '-') { out.push({ m: null, len }); continue; }
      if (/^[ksh]$/.test(n)) { out.push({ m: n, len }); continue; }
      const mm = /^([A-G])(#|b)?(\d)$/.exec(n);
      if (!mm) { out.push({ m: null, len }); continue; }
      let semi = NOTE[mm[1]] + (mm[2] === '#' ? 1 : mm[2] === 'b' ? -1 : 0);
      out.push({ m: (parseInt(mm[3], 10) + 1) * 12 + semi, len });
    }
    return out;
  }
  for (const k in SONGS) for (const c of SONGS[k].ch) c.seq = parse(c.n, c.d);

  let current = null, pendingSong = null, timer = null;
  function playMusic(name, force) {
    if (!ctx) { pendingSong = name; return; }
    if (current && current.name === name && !force) return;
    stopMusic();
    const song = SONGS[name];
    if (!song) return;
    const step = 60 / song.bpm / 4;
    const t0 = ctx.currentTime + 0.08;
    const gain = ctx.createGain(); gain.gain.value = 1; gain.connect(musicBus);
    current = { name, song, step, gain, chans: song.ch.map(c => ({ c, i: 0, t: t0 })) };
    timer = setInterval(schedule, 25);
    schedule();
  }
  function stopMusic(fade) {
    if (timer) { clearInterval(timer); timer = null; }
    if (current) {
      const g = current.gain;
      try {
        g.gain.setTargetAtTime(0, ctx.currentTime, fade ? 0.3 : 0.02);
        setTimeout(() => g.disconnect(), fade ? 1500 : 200);
      } catch (e) { /* ignore */ }
    }
    current = null;
  }
  function schedule() {
    if (!current) return;
    const ahead = ctx.currentTime + 0.15;
    for (const ch of current.chans) {
      const seq = ch.c.seq;
      while (ch.t < ahead) {
        if (ch.i >= seq.length) {
          if (current.song.loop === false) { ch.t = Infinity; break; }
          ch.i = 0;
        }
        const n = seq[ch.i++];
        const dur = n.len * current.step;
        if (n.m !== null) playNote(ch.c, n.m, ch.t, dur, current.gain);
        ch.t += dur;
      }
    }
  }
  function playNote(c, m, t, dur, out) {
    if (c.w === 'drum') return drum(m, t, c.v, out);
    const o = ctx.createOscillator();
    if (c.w === 'tri') o.type = 'triangle';
    else if (c.w === 'sine') o.type = 'sine';
    else o.setPeriodicWave(c.w === 'p12' ? pulse12 : pulse25);
    o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
    const g = ctx.createGain();
    const v = c.v;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.006);
    g.gain.exponentialRampToValueAtTime(Math.max(v * 0.55, 0.0001), t + Math.min(0.12, dur * 0.6));
    g.gain.setValueAtTime(Math.max(v * 0.55, 0.0001), t + dur * 0.85);
    g.gain.linearRampToValueAtTime(0, t + dur * 0.98);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur);
  }
  function noise(t, dur, vol, hp, out, lp) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    if (lp) { const l = ctx.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lp; f.connect(l); l.connect(g); }
    else f.connect(g);
    g.connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function drum(kind, t, v, out) {
    if (kind === 'k') {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      const g = ctx.createGain(); g.gain.setValueAtTime(v * 1.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.15);
    } else if (kind === 's') noise(t, 0.13, v * 0.5, 1200, out);
    else noise(t, 0.035, v * 0.25, 7000, out);
  }

  // ---------- Effets sonores ----------
  function tone(type, f0, f1, dur, vol, delay = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    if (type === 'p25') o.setPeriodicWave(pulse25);
    else if (type === 'p12') o.setPeriodicWave(pulse12);
    else o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }
  const FX = {
    cursor: () => tone('p25', 1200, 1200, 0.04, 0.12),
    confirm: () => { tone('p25', 880, 880, 0.05, 0.14); tone('p25', 1320, 1320, 0.08, 0.14, 0.05); },
    cancel: () => { tone('p25', 660, 440, 0.1, 0.12); },
    buzz: () => tone('p25', 150, 120, 0.15, 0.12),
    hit: () => { noise(ctx.currentTime, 0.12, 0.5, 400, sfxBus, 4000); tone('square', 220, 60, 0.12, 0.16); },
    bighit: () => { noise(ctx.currentTime, 0.35, 0.7, 100, sfxBus, 3000); tone('square', 160, 30, 0.35, 0.22); },
    miss: () => noise(ctx.currentTime, 0.18, 0.18, 3000, sfxBus),
    swing: () => noise(ctx.currentTime, 0.1, 0.2, 2000, sfxBus),
    charge: () => { tone('p12', 200, 1400, 0.7, 0.1); tone('sine', 100, 700, 0.7, 0.12); },
    beam: () => { noise(ctx.currentTime, 0.9, 0.35, 300, sfxBus, 2500); tone('sawtooth', 120, 80, 0.9, 0.12); },
    blast: () => { tone('p25', 900, 200, 0.25, 0.14); noise(ctx.currentTime, 0.2, 0.25, 1500, sfxBus); },
    heal: () => { [0, 0.07, 0.14, 0.21].forEach((d, i) => tone('sine', 660 * Math.pow(1.26, i), 660 * Math.pow(1.26, i), 0.2, 0.14, d)); },
    item: () => { tone('p25', 988, 988, 0.08, 0.13); tone('p25', 1319, 1319, 0.2, 0.13, 0.08); },
    ball: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone('p25', f, f, 0.25, 0.12, i * 0.09)); },
    levelup: () => { [523, 659, 784, 1047].forEach((f, i) => tone('p25', f, f, 0.12, 0.13, i * 0.07)); tone('p25', 1568, 1568, 0.4, 0.12, 0.3); },
    encounter: () => { tone('p25', 440, 880, 0.1, 0.16); tone('p25', 660, 1320, 0.12, 0.16, 0.1); tone('p25', 880, 1760, 0.18, 0.14, 0.2); },
    save: () => { [784, 988, 1175, 1568].forEach((f, i) => tone('sine', f, f, 0.3, 0.12, i * 0.1)); },
    door: () => { noise(ctx.currentTime, 0.15, 0.2, 200, sfxBus, 1200); },
    flash: () => { tone('sine', 2000, 4000, 0.5, 0.12); noise(ctx.currentTime, 0.4, 0.2, 5000, sfxBus); },
    disc: () => { tone('p12', 1500, 1700, 0.6, 0.08); tone('p12', 1700, 1500, 0.6, 0.06, 0.05); },
    roar: () => { tone('sawtooth', 120, 50, 0.6, 0.18); noise(ctx.currentTime, 0.6, 0.3, 200, sfxBus, 1200); },
    thunder: () => { noise(ctx.currentTime, 1.4, 0.6, 50, sfxBus, 1800); tone('square', 60, 30, 1.2, 0.2); },
    coin: () => { tone('p25', 1319, 1319, 0.05, 0.12); tone('p25', 1760, 1760, 0.15, 0.12, 0.05); },
    jump: () => tone('p25', 300, 900, 0.12, 0.1),
  };
  function sfx(name) { if (!ctx || muted) return; const f = FX[name]; if (f) f(); }
  return { init, playMusic, stopMusic, sfx, toggleMute, isMuted: () => muted, current: () => current && current.name };
})();
