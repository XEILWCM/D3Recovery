/* Animated walkthrough of the D3Recovery architecture figure.
   Coordinates are pixels in static/images/fig4_architecture.webp (2100 x 2266). */
(function () {
  'use strict';

  var root = document.getElementById('arch');
  if (!root) return;
  var svg = document.getElementById('arch-overlay');
  var stepsEl = document.getElementById('arch-steps');
  var playBtn = document.getElementById('arch-play');
  var playText = playBtn.querySelector('.arch__play-text');
  var captionEl = document.getElementById('arch-caption');
  var stage = root.querySelector('.arch__stage');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var W = 2100, H = 2266;

  // Arrow routes traced from the figure. Each route is a list of polylines that particles follow in order.
  var FLOWS = {
    inputs:  [[[255, 265], [410, 265]]],
    forward: [[[1742, 660], [1708, 660], [1708, 188], [1560, 188]], [[1395, 188], [1232, 188]], [[1052, 188], [915, 188]], [[740, 188], [580, 188]], [[412, 188], [262, 188]]],
    reverse: [[[255, 265], [410, 265]], [[575, 265], [740, 265]],
              [[900, 265], [948, 265], [948, 397], [425, 397], [425, 552]], [[487, 650], [535, 650]], [[560, 663], [1440, 663]], [[1440, 650], [1488, 650]],
              [[1547, 555], [1547, 397], [1000, 397], [1000, 265], [1050, 265]], [[1228, 265], [1390, 265]], [[1555, 265], [1735, 265]]],
    energy:  [[[1915, 228], [1992, 228]], [[1915, 697], [1992, 697]]],
    a_x0:    [[[257, 1283], [438, 1283]], [[605, 1262], [700, 1262]], [[780, 1256], [862, 1256]], [[1020, 1257], [1045, 1257], [1045, 1343], [1090, 1343]]],
    a_c:     [[[257, 1563], [312, 1563], [312, 1493], [438, 1493]], [[605, 1470], [700, 1470]], [[782, 1465], [862, 1465]], [[1020, 1463], [1047, 1463], [1047, 1390], [1090, 1390]]],
    a_cross: [[[640, 1262], [640, 1395], [718, 1395], [718, 1418]], [[665, 1470], [665, 1330], [728, 1330], [728, 1300]]],
    a_mid:   [[[1225, 1362], [1308, 1362]], [[1268, 1362], [1268, 1268]], [[1375, 1278], [1375, 1232], [1325, 1232]], [[1292, 1192], [1480, 1192], [1480, 1350]], [[1440, 1362], [1540, 1362]], [[1662, 1338], [1818, 1338]]],
    a_out:   [[[1973, 1338], [2015, 1338], [2015, 1488], [1752, 1488], [1752, 1575], [1846, 1575]]],
    a_block: [[[257, 1858], [348, 1858], [348, 1620], [1197, 1620], [1197, 1540], [1248, 1540]], [[1160, 1620], [1160, 1398]], [[1413, 1540], [1470, 1540]], [[1582, 1540], [1605, 1540], [1605, 1394]]],
    b_in:    [[[257, 1356], [332, 1356], [332, 1832], [453, 1832]], [[257, 1639], [315, 1639], [315, 1908], [453, 1908]], [[257, 1872], [295, 1872], [295, 2014], [763, 2014]]],
    b_mid:   [[[575, 1871], [763, 1871]], [[872, 1909], [970, 1909]], [[1033, 1907], [1152, 1907], [1152, 1811], [1238, 1811]], [[1152, 1907], [1152, 1988], [1238, 1988]]],
    b_out:   [[[1375, 1811], [1848, 1811]], [[1375, 1988], [1676, 1988]]],
    b_reg:   [[[1660, 2004], [1660, 2147], [452, 2147]]]
  };

  var C = { fwd: '#d64541', rev: '#e39b12', energy: '#3d7bd9', a: '#8b55cc', b: '#3f9b3f', reg: '#c0392b', glow: '#ffffff' };

  // Each step spotlights up to three regions (x, y, w, h), animates routes and pulses key nodes.
  var STEPS = [
    { short: 'Inputs',
      title: 'Stage 1 inputs',
      text: 'Stage 1 starts from Gaussian noise <i>x</i><sub>T</sub>. It is conditioned on the observed ICS SiPM pattern <i>C</i> and on block ID embeddings <i>E</i><sub>D</sub>, which encode where the detector block sits in the scanner.',
      holes: [[40, 66, 270, 910]],
      flows: [],
      glows: [['rect', 88, 143, 164, 164], ['rect', 88, 421, 164, 164], ['rect', 84, 694, 176, 134]] },
    { short: 'Forward',
      title: 'Forward diffusion, used in training',
      text: 'During training we add Gaussian noise to the ground-truth first-interaction pattern <i>x</i><sub>0</sub> over 100 timesteps, until only noise remains. The model learns to undo each step.',
      holes: [[82, 116, 1492, 236], [1690, 170, 36, 500], [1732, 604, 176, 178]],
      flows: [['forward', C.fwd]],
      glows: [['rect', 1738, 611, 162, 164]] },
    { short: 'Reverse',
      title: 'Reverse diffusion with the U-Net',
      text: 'At each step a U-Net takes the noisy pattern <i>x</i><sub>t</sub> together with <i>C</i> and <i>E</i><sub>D</sub> and predicts the cleaner <i>x</i><sub>t&minus;1</sub>. Repeating this turns pure noise into the first-interaction pattern.',
      holes: [[82, 116, 1668, 236], [340, 372, 1290, 476]],
      flows: [['reverse', C.rev]],
      glows: [['rect', 531, 461, 915, 375]] },
    { short: 'Output',
      title: 'Stage 1 output',
      text: 'The result is the recovered SiPM pattern <i>x&#770;</i><sub>0</sub> of the first interaction and its deposited energy <i>&Ecirc;</i>. In training it is compared with the ground truth <i>x</i><sub>0</sub> and energy <i>E</i>.',
      holes: [[1662, 68, 410, 808]],
      flows: [['energy', C.energy]],
      glows: [['rect', 1738, 143, 164, 164], ['spin', 1815, 490, 50]] },
    { short: 'Stage 2a',
      title: 'Stage 2a, CrystalAttentionNet',
      text: 'ResNet encoders read the recovered and the ICS patterns, cross-attention lets each attend to the other, and the network outputs a 16 &times; 16 probability map over crystals. Its peak is the crystal ID.',
      holes: [[40, 1195, 265, 867], [355, 1113, 1717, 597]],
      flows: [['a_x0', C.a], ['a_c', C.a], ['a_cross', C.a], ['a_mid', C.a], ['a_out', C.a], ['a_block', C.a]],
      glows: [['rect', 1816, 1256, 164, 164], ['circle', 1910, 1575, 66]] },
    { short: 'Stage 2b',
      title: 'Stage 2b, GuidedDepthNet',
      text: 'A dual grid encoder and MLP layers regress the depth of interaction. The crystal ID head is used only during training, as a regularizer that keeps depth estimates consistent with the crystal.',
      holes: [[40, 1195, 265, 867], [359, 1706, 1717, 546]],
      flows: [['b_in', C.b], ['b_mid', C.b], ['b_out', C.b], ['b_reg', C.reg]],
      glows: [['circle', 1912, 1812, 68], ['rect', 1672, 1939, 384, 97]] }
  ];

  var STEP_MS = 6500, TWEEN_MS = 520, SPEED = 300, SPACING = 210;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // ---------------------------------------------------------------- overlay
  var defs = el('defs', {}, svg);
  var mask = el('mask', { id: 'arch-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
  el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, mask);
  var holeEls = [0, 1, 2].map(function () { return el('rect', { rx: 34, ry: 34, fill: '#000' }, mask); });
  var dim = el('rect', { class: 'arch__dim', x: 0, y: 0, width: W, height: H, mask: 'url(#arch-mask)' }, svg);
  var ringEls = [0, 1, 2].map(function () { return el('rect', { class: 'arch__ring', rx: 34, ry: 34, 'vector-effect': 'non-scaling-stroke' }, svg); });
  var routesLayer = el('g', { class: 'arch__routes' }, svg);
  var glowLayer = el('g', { class: 'arch__glows' }, svg);
  var dotsLayer = el('g', { class: 'arch__dots' }, svg);

  // Route geometry, measured once
  function measure(route) {
    var segs = [], total = 0;
    route.forEach(function (line) {
      for (var i = 1; i < line.length; i++) {
        var a = line[i - 1], b = line[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        segs.push({ a: a, b: b, len: len, start: total });
        total += len;
      }
    });
    return { segs: segs, total: total };
  }
  function pointAt(m, d) {
    d = ((d % m.total) + m.total) % m.total;
    for (var i = 0; i < m.segs.length; i++) {
      var s = m.segs[i];
      if (d <= s.start + s.len) {
        var t = s.len ? (d - s.start) / s.len : 0;
        return [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t];
      }
    }
    var last = m.segs[m.segs.length - 1];
    return last.b;
  }
  var MEAS = {};
  Object.keys(FLOWS).forEach(function (k) { MEAS[k] = measure(FLOWS[k]); });

  // ------------------------------------------------------------------ state
  var current = -1, playing = !reduceMotion, hovering = false, visible = false, started = false;
  var elapsed = 0, lastNow = 0, dots = [], rafId = 0, holeTween = null, $steps = [];
  var holeState = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

  function holesFor(i) {
    var hs = STEPS[i].holes.slice(0, 3);
    // Park unused slots inside the first hole so they shrink away when tweened
    while (hs.length < 3) { var f = hs[0]; hs.push([f[0] + f[2] / 2, f[1] + f[3] / 2, 0, 0]); }
    return hs;
  }
  function applyHoles(hs) {
    hs.forEach(function (h, j) {
      holeState[j] = h.slice();
      [holeEls[j], ringEls[j]].forEach(function (r) {
        r.setAttribute('x', h[0]); r.setAttribute('y', h[1]);
        r.setAttribute('width', Math.max(0, h[2])); r.setAttribute('height', Math.max(0, h[3]));
      });
      ringEls[j].style.opacity = h[2] > 4 ? '' : '0';
    });
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function buildStep(i) {
    routesLayer.textContent = '';
    glowLayer.textContent = '';
    dotsLayer.textContent = '';
    dots = [];
    var s = STEPS[i];
    s.flows.forEach(function (f) {
      var route = FLOWS[f[0]], m = MEAS[f[0]], color = f[1];
      route.forEach(function (line) {
        el('polyline', { points: line.map(function (p) { return p.join(','); }).join(' '), stroke: color, class: 'arch__route', 'vector-effect': 'non-scaling-stroke' }, routesLayer);
      });
      if (reduceMotion) return;
      var n = Math.max(1, Math.round(m.total / SPACING));
      for (var k = 0; k < n; k++) {
        var g = el('g', { class: 'arch__dot' }, dotsLayer);
        var halo = el('circle', { r: 26, fill: color, opacity: .22 }, g);
        var core = el('circle', { r: 12, fill: color, stroke: '#fff', 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke' }, g);
        dots.push({ g: g, m: m, offset: k * m.total / n, halo: halo, core: core });
      }
    });
    sizeDots();
    s.glows.forEach(function (gl) {
      var ns = { 'vector-effect': 'non-scaling-stroke' };
      if (gl[0] === 'rect') el('rect', Object.assign({ class: 'arch__glow', x: gl[1], y: gl[2], width: gl[3], height: gl[4], rx: 16 }, ns), glowLayer);
      else if (gl[0] === 'circle') el('circle', Object.assign({ class: 'arch__glow', cx: gl[1], cy: gl[2], r: gl[3] }, ns), glowLayer);
      else if (gl[0] === 'spin') el('circle', Object.assign({ class: 'arch__spin', cx: gl[1], cy: gl[2], r: gl[3] }, ns), glowLayer);
    });
  }

  // Keep particles about 5 px across on screen whatever the figure's rendered width
  function sizeDots() {
    var k = W / Math.max(1, stage.clientWidth);
    var r = Math.max(12, 2.6 * k);
    dots.forEach(function (d) { d.core.setAttribute('r', r.toFixed(1)); d.halo.setAttribute('r', (r * 2.2).toFixed(1)); });
  }
  window.addEventListener('resize', sizeDots);

  function go(i) {
    var from = holeState.map(function (h) { return h.slice(); });
    var to = holesFor(i);
    var firstShow = current === -1;
    current = i;
    elapsed = 0;
    buildStep(i);
    root.classList.add('is-touring');
    if (firstShow || reduceMotion) { applyHoles(to); holeTween = null; }
    else holeTween = { from: from, to: to, t0: performance.now() };
    $steps.forEach(function (b, k) {
      b.setAttribute('aria-pressed', String(k === i));
      b.style.setProperty('--p', k === i ? 0 : 0);
    });
    captionEl.innerHTML = '<strong>' + (i + 1) + '. ' + STEPS[i].title + '</strong> ' + STEPS[i].text;
    kick();
  }

  // --------------------------------------------------------------- controls
  $steps = STEPS.map(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'arch__step';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Step ' + (i + 1) + ', ' + s.title);
    b.innerHTML = '<span class="arch__num">' + (i + 1) + '</span><span class="arch__label">' + s.short + '</span><span class="arch__progress" aria-hidden="true"></span>';
    b.addEventListener('click', function () {
      captionEl.setAttribute('aria-live', 'polite');
      setPlaying(false);
      go(i);
    });
    stepsEl.appendChild(b);
    return b;
  });

  function setPlaying(p) {
    playing = !!p && !reduceMotion;
    playBtn.setAttribute('aria-pressed', String(playing));
    playBtn.classList.toggle('is-playing', playing);
    if (reduceMotion) {
      // Without motion the button steps through the walkthrough instead of playing it
      playText.textContent = 'Next step';
      playBtn.setAttribute('aria-label', 'Show the next step');
      playBtn.removeAttribute('aria-pressed');
      return;
    }
    playText.textContent = playing ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-label', playing ? 'Pause the walkthrough' : 'Play the walkthrough');
    if (playing && current < 0 && visible) go(0);
    kick();
  }
  playBtn.addEventListener('click', function () {
    if (reduceMotion) { go((current + 1) % STEPS.length); return; }
    setPlaying(!playing);
  });

  // Holding the pointer over the figure pauses the countdown so there is time to look
  stage.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovering = true; });
  stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hovering = false; });

  // ------------------------------------------------------------------- loop
  function frame(now) {
    rafId = 0;
    if (!visible) return;
    var dt = lastNow ? Math.min(100, now - lastNow) : 0;
    lastNow = now;
    if (holeTween) {
      var t = Math.min(1, (now - holeTween.t0) / TWEEN_MS), e = ease(t);
      applyHoles(holeTween.to.map(function (h, j) {
        var f = holeTween.from[j];
        return [f[0] + (h[0] - f[0]) * e, f[1] + (h[1] - f[1]) * e, f[2] + (h[2] - f[2]) * e, f[3] + (h[3] - f[3]) * e];
      }));
      if (t >= 1) holeTween = null;
    }
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i], p = pointAt(d.m, d.offset + now / 1000 * SPEED);
      d.g.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')');
    }
    if (playing && current >= 0) {
      if (!hovering) elapsed += dt;
      var prog = Math.min(1, elapsed / STEP_MS);
      $steps[current].style.setProperty('--p', prog.toFixed(3));
      if (prog >= 1) go((current + 1) % STEPS.length);
    }
    if (dots.length || holeTween || playing) rafId = requestAnimationFrame(frame);
    else lastNow = 0;
  }
  function kick() { if (!rafId && visible) { lastNow = 0; rafId = requestAnimationFrame(frame); } }

  setPlaying(playing);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !started && !reduceMotion) { started = true; go(0); }
      if (visible) kick();
    }, { threshold: 0.25 }).observe(stage);
  } else {
    visible = true;
    if (!reduceMotion) go(0);
  }
})();
