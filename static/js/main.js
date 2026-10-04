/* D3Recovery project page interactions */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------ top nav */
  (function initNav() {
    var nav = $('#topnav');
    var trigger = $('.hero .buttons');
    if (!nav || !trigger || !('IntersectionObserver' in window)) { if (nav) nav.classList.add('is-visible'); return; }
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      nav.classList.toggle('is-visible', !e.isIntersecting && e.boundingClientRect.top < 0);
    }).observe(trigger);

    var links = {};
    $$('.topnav__links a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.toggle('is-active', k === e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  })();

  /* ------------------------------------------------ comparison sliders */
  // Each image stacks two reconstructions of the same scan, split by one handle. The pair
  // buttons choose which two, with the first one on the left and the second on the right.
  var METHODS = ['cog', 'rnet', 'd3r'];
  var METHOD_NAME = { cog: 'without recovery (CoG positioning)', rnet: 'Recovery-Net', d3r: 'D3Recovery' };
  var SHORT_NAME = { cog: 'w/o Recovery', rnet: 'Recovery-Net', d3r: 'D3Recovery' };
  var PAIRS = { 'cog-d3r': ['cog', 'd3r'], 'rnet-d3r': ['rnet', 'd3r'], 'cog-rnet': ['cog', 'rnet'] };
  var PHANTOM_NAME = { derenzo: 'Ultra-micro Derenzo phantom', hoffman: '3D Hoffman brain phantom' };
  var EVENTS_NAME = { ics: 'ICS events only', all: 'all events' };
  // Legend values under each image, from the paper. Derenzo shows the mean peak-to-valley gain over
  // w/o Recovery; Hoffman shows MAE and SSIM against the photoelectric-only reference.
  var METRICS = {
    derenzo: {
      ics: { cog: 'reference', rnet: '+13%', d3r: '+24%' },
      all: { cog: 'reference', rnet: '+14%', d3r: '+17%' }
    },
    hoffman: {
      ics: { cog: [4.208, 0.376], rnet: [3.554, 0.431], d3r: [3.457, 0.435] },
      all: { cog: [2.143, 0.691], rnet: [1.796, 0.723], d3r: [1.744, 0.724] }
    }
  };
  var compareState = { events: 'ics', pair: 'cog-d3r' };

  function updateCompare() {
    var ev = compareState.events, pair = PAIRS[compareState.pair];
    $$('.compare').forEach(function (el) {
      var ph = el.getAttribute('data-phantom');
      ['left', 'right'].forEach(function (side, k) {
        var m = pair[k], img = $('.compare__img--' + side, el);
        img.src = 'static/images/compare/' + ph + '_' + ev + '_' + m + '.webp';
        img.alt = PHANTOM_NAME[ph] + ', ' + EVENTS_NAME[ev] + ', reconstructed with ' + METHOD_NAME[m];
        $('.compare__label--' + side, el).textContent = SHORT_NAME[m];
        el.style.setProperty('--c-' + side, 'var(--m-' + m + ')');
      });
      $('.compare__handle', el).setAttribute('aria-label', PHANTOM_NAME[ph] + ', edge between ' + SHORT_NAME[pair[0]] + ' and ' + SHORT_NAME[pair[1]]);
      if (el._st) el._st.refresh();
      var legend = $('[data-metric="' + ph + '"]');
      if (!legend) return;
      METHODS.forEach(function (m) {
        var v = METRICS[ph][ev][m], item = $('.cmp-legend__item--' + m, legend);
        $('.cmp-legend__val', item).textContent = typeof v === 'string' ? v : v[0].toFixed(3) + ' · ' + v[1].toFixed(3);
        item.classList.toggle('is-dim', pair.indexOf(m) < 0);
      });
    });
  }

  // Idle motion. The handle drifts gently until someone hovers or interacts,
  // then waits AUTO.resumeAfter ms of quiet before drifting again.
  var AUTO = { amp: 7, period: 5600, rampIn: 1400, resumeAfter: 3500, afterHover: 1200 };

  function initCompare(el, index) {
    var handle = $('.compare__handle', el);
    var labels = { left: $('.compare__label--left', el), right: $('.compare__label--right', el) };
    var st = { el: el, p: 50, t0: null, phase: index * 0.9, hover: false, focus: false, visible: false, busyUntil: 0, lw: null };
    el._st = st;

    // Hide a label once its side of the image gets too narrow to hold it
    function measure() {
      var w = el.clientWidth || 1;
      st.lw = {
        w: w,
        left: labels.left.offsetLeft + labels.left.offsetWidth,   // room the left label needs from the left edge
        right: w - labels.right.offsetLeft                          // room the right label needs from the right edge
      };
    }
    function fit(label, room, need) {
      // A little hysteresis so a label does not flicker when its side hovers near the limit
      var hidden = label.classList.contains('is-hidden');
      if (!hidden && room < need) label.classList.add('is-hidden');
      else if (hidden && room > need + 12) label.classList.remove('is-hidden');
    }
    function fitLabels() {
      if (!st.lw) measure();
      var x = st.p / 100 * st.lw.w, gap = 6;
      fit(labels.left, x, st.lw.left + gap);
      fit(labels.right, st.lw.w - x, st.lw.right + gap);
    }
    function apply() {
      var pair = PAIRS[compareState.pair];
      el.style.setProperty('--p', st.p + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(st.p)));
      handle.setAttribute('aria-valuetext', SHORT_NAME[pair[0]] + ' fills the left ' + Math.round(st.p) + '%, ' + SHORT_NAME[pair[1]] + ' the rest');
      fitLabels();
    }
    function set(p) { st.p = Math.max(0, Math.min(100, p)); apply(); }
    function touched(ms) { st.busyUntil = performance.now() + (ms || AUTO.resumeAfter); st.t0 = null; }
    function width() { return el.getBoundingClientRect().width || 1; }
    st.set = set;
    st.refresh = function () { st.lw = null; apply(); };

    // Scrolling over the image scrolls the page as usual; it never moves the handle.
    // Mouse: drag the handle. Touch: a sideways swipe anywhere on the image moves it.
    // A plain click or tap never jumps the handle.
    var drag = null;
    el.addEventListener('pointerdown', function (e) {
      var isTouch = e.pointerType === 'touch';
      if (!isTouch && (e.button !== 0 || !handle.contains(e.target))) return;
      drag = { id: e.pointerId, x: e.clientX, pos: st.p, live: !isTouch, touch: isTouch };
      if (!isTouch) {
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        el.classList.add('is-dragging');
        handle.focus({ preventScroll: true });
      }
      touched();
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (!drag.live) {
        if (Math.abs(dx) < 6) return;
        // A touch is already held by the element the finger landed on (the knob or the image),
        // and its events bubble up to here, so it needs no capture of its own
        drag.live = true;
        el.classList.add('is-dragging');
      }
      touched();
      set(drag.pos + dx / width() * 100);
    });
    function end() { if (drag) touched(); drag = null; el.classList.remove('is-dragging'); }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    // Only this element losing its capture ends a drag. lostpointercapture bubbles, so the knob
    // giving up a touch must not count
    el.addEventListener('lostpointercapture', function (e) { if (e.target === el) end(); });
    // A long press must not open the context menu in the middle of a touch drag
    el.addEventListener('contextmenu', function (e) { if (drag && drag.touch) e.preventDefault(); });

    // Hovering with a mouse, or focusing the handle, holds the image still for inspection.
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { st.hover = true; touched(); } });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { st.hover = false; touched(AUTO.afterHover); } });
    handle.addEventListener('focus', function () { st.focus = true; touched(); });
    handle.addEventListener('blur', function () { st.focus = false; touched(AUTO.afterHover); });
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(st.p - step);
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(st.p + step);
      else if (e.key === 'Home') set(0);
      else if (e.key === 'End') set(100);
      else return;
      e.preventDefault();
      touched();
    });
    apply();
    return st;
  }

  function startIdleMotion(states) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var running = false;
    function frame(ts) {
      var any = false;
      states.forEach(function (st) {
        if (!st.visible) return;
        any = true;
        if (st.hover || st.focus || st.el.classList.contains('is-dragging') || performance.now() < st.busyUntil) { st.t0 = null; return; }
        if (st.t0 === null) {
          st.t0 = ts;
          st.start = st.p;
          // Smaller swings on narrow screens keep both sides wide enough for their labels
          st.amp = st.el.clientWidth < 520 ? 5 : AUTO.amp;
          st.base = Math.max(st.amp, Math.min(100 - st.amp, st.p));
        }
        var t = ts - st.t0;
        var r = Math.min(1, t / AUTO.rampIn);
        r = r * r * (3 - 2 * r);
        var target = st.base + st.amp * Math.sin(2 * Math.PI * t / AUTO.period + st.phase);
        st.set(st.start + (target - st.start) * r);
      });
      if (any) requestAnimationFrame(frame); else running = false;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target._st.visible = en.isIntersecting; });
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { threshold: 0.25 });
    states.forEach(function (st) { io.observe(st.el); });
  }

  (function initCompares() {
    var els = $$('.compare');
    if (!els.length) return;
    var states = els.map(initCompare);
    // The events buttons and the pair buttons each pick one option for both images
    function bindChoice(attr, key) {
      var btns = $$('.seg__btn[' + attr + ']');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          compareState[key] = b.getAttribute(attr);
          btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          updateCompare();
        });
      });
    }
    bindChoice('data-events', 'events');
    bindChoice('data-pair', 'pair');
    updateCompare();

    // Label widths change once web fonts arrive and when the layout resizes
    function remeasure() { states.forEach(function (st) { st.refresh(); }); }
    window.addEventListener('resize', remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

    // Warm the cache so switching events or pairs is instant
    window.addEventListener('load', function () {
      ['derenzo', 'hoffman'].forEach(function (ph) {
        ['ics', 'all'].forEach(function (ev) {
          METHODS.forEach(function (m) { var i = new Image(); i.src = 'static/images/compare/' + ph + '_' + ev + '_' + m + '.webp'; });
        });
      });
    });

    // Drift gently by default so it is obvious the images can be compared
    startIdleMotion(states);
  })();

  /* --------------------------------------------------------- talk video */
  // The browser keeps the WebVTT captions hidden and this writes the current one into the bar under the
  // video. In full screen the bar is out of sight, so the browser draws the captions over the video instead.
  (function initTalk() {
    var fig = $('#talk');
    if (!fig) return;
    var video = $('video', fig);
    var bar = $('.talk__bar', fig);
    var line = $('.talk__line', fig);
    var toggle = $('.talk__toggle', fig);
    var trackEl = $('track', fig);
    var track = trackEl ? trackEl.track : (video.textTracks && video.textTracks.length ? video.textTracks[0] : null);
    var idleText = line.textContent;
    var on = true, shown = null;

    // Cue text is plain text with <b> around highlighted words
    function cueHTML(cue) {
      return cue.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/&lt;(\/?)b&gt;/g, '<$1b>').replace(/\s*\n\s*/g, ' ');
    }
    function isFullscreen() {
      var el = document.fullscreenElement || document.webkitFullscreenElement;
      return el === video || el === fig || !!video.webkitDisplayingFullscreen;
    }
    function update() {
      var cue = null;
      if (track && track.activeCues && track.activeCues.length) cue = track.activeCues[track.activeCues.length - 1];
      var idle = !cue && video.paused && video.currentTime < 0.3;
      var html = !on ? 'Captions off' : (cue ? cueHTML(cue) : (idle ? idleText : ''));
      if (html !== shown) { line.innerHTML = html; shown = html; }
      bar.classList.toggle('is-idle', on && idle);
      bar.classList.toggle('is-off', !on);
    }
    function setMode() {
      if (track) track.mode = on && isFullscreen() ? 'showing' : 'hidden';
    }
    if (track) {
      track.mode = 'hidden';
      track.addEventListener('cuechange', update);
    }
    ['play', 'pause', 'seeked', 'ended', 'loadedmetadata'].forEach(function (ev) { video.addEventListener(ev, update); });
    document.addEventListener('fullscreenchange', setMode);
    document.addEventListener('webkitfullscreenchange', setMode);
    video.addEventListener('webkitbeginfullscreen', function () { if (track && on) track.mode = 'showing'; });
    video.addEventListener('webkitendfullscreen', function () { if (track) track.mode = 'hidden'; });
    toggle.addEventListener('click', function () {
      on = !on;
      toggle.setAttribute('aria-pressed', String(on));
      toggle.title = on ? 'Hide captions' : 'Show captions';
      setMode();
      update();
    });
    update();
  })();

  /* ------------------------------------------------- heatmap utilities */
  var DATA = window.D3R_DATA;
  function viridis(v) {
    var i = Math.max(0, Math.min(255, Math.round(v * 255)));
    return '#' + DATA.viridis.substr(i * 6, 6);
  }
  function drawHeat(el, grid) {
    var n = grid.length;
    if (!el._cells || el._cells.length !== n * n) {
      el.innerHTML = '';
      el._cells = [];
      var frag = document.createDocumentFragment();
      for (var k = 0; k < n * n; k++) { var c = document.createElement('i'); frag.appendChild(c); el._cells.push(c); }
      el.appendChild(frag);
    }
    for (var r = 0; r < n; r++) for (var c2 = 0; c2 < n; c2++) el._cells[r * n + c2].style.background = viridis(grid[r][c2]);
  }

  /* ---------------------------------------------------- Stage 1 viewer */
  (function initStage1() {
    var root = $('#stage1-viz');
    if (!root || !DATA || !DATA.stage1) { if (root) root.hidden = true; return; }
    var events = DATA.stage1;
    var STEPS = [
      { key: 'xT', short: 'x<sub>T</sub>', label: 'Noise x<sub>T</sub>', sub: 'start of reverse diffusion' },
      { key: 't99', short: 't=99', label: 'Step t = 99', sub: 'reverse diffusion' },
      { key: 't59', short: 't=59', label: 'Step t = 59', sub: 'reverse diffusion' },
      { key: 't39', short: 't=39', label: 'Step t = 39', sub: 'reverse diffusion' },
      { key: 't19', short: 't=19', label: 'Step t = 19', sub: 'reverse diffusion' },
      { key: 't4', short: 't=4', label: 'Step t = 4', sub: 'reverse diffusion' },
      { key: 'pred', short: 'x&#770;<sub>0</sub>', label: 'Recovered x&#770;<sub>0</sub>', sub: 'Stage 1 output' }
    ];
    var chips = $('#s1-events', root), strip = $('#s1-strip', root);
    var elIcs = $('#s1-ics', root), elStep = $('#s1-step', root), elGt = $('#s1-gt', root);
    // Every step's caption sits in the same grid cell and only the current one is shown,
    // so the panel keeps the height of the longest caption for every event and step
    var capBox = $('#s1-caps', root);
    capBox.classList.add('cap-stack');
    capBox.innerHTML = '';
    var caps = STEPS.map(function (s) {
      var it = document.createElement('div');
      it.className = 'cap-stack__item';
      it.innerHTML = '<b class="panel__main">' + s.label + '</b><span>' + s.sub + '</span>';
      capBox.appendChild(it);
      return it;
    });
    function plain(html) { return html.replace(/<[^>]+>/g, '').replace('&#770;', ''); }
    var playBtn = $('#s1-play', root);
    var ev = 0, step = STEPS.length - 1, timer = null, playing = false;

    events.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = 'Event ' + (i + 1);
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { selectEvent(i, true); });
      chips.appendChild(b);
    });
    var frames = STEPS.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'frame'; b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Show ' + plain(s.label));
      var h = document.createElement('div'); h.className = 'heat heat--8';
      var t = document.createElement('span'); t.innerHTML = s.short;
      b.appendChild(h); b.appendChild(t);
      b.addEventListener('click', function () { stop(); showStep(i); });
      strip.appendChild(b);
      return { btn: b, heat: h };
    });

    function selectEvent(i, user) {
      ev = i;
      $$('.chip', chips).forEach(function (c, k) { c.setAttribute('aria-pressed', String(k === i)); });
      var e = events[i];
      drawHeat(elIcs, e.ics);
      drawHeat(elGt, e.gt);
      frames.forEach(function (f, k) { drawHeat(f.heat, e[STEPS[k].key]); });
      if (user && playing) { showStep(0); schedule(); }
      else showStep(user ? STEPS.length - 1 : step);
    }
    function showStep(k) {
      step = k;
      drawHeat(elStep, events[ev][STEPS[k].key]);
      caps.forEach(function (c, j) { c.classList.toggle('is-on', j === k); });
      elStep.setAttribute('aria-label', 'Current denoising step, ' + plain(STEPS[k].label));
      frames.forEach(function (f, j) { f.btn.setAttribute('aria-pressed', String(j === k)); });
    }
    function schedule() {
      clearTimeout(timer);
      var last = step === STEPS.length - 1;
      timer = setTimeout(function () {
        if (!playing) return;
        if (last) { selectEvent((ev + 1) % events.length, false); showStep(0); }
        else showStep(step + 1);
        schedule();
      }, last ? 1800 : (step === 0 ? 900 : 650));
    }
    function play() {
      playing = true;
      playBtn.classList.add('is-playing');
      playBtn.setAttribute('aria-label', 'Pause the denoising animation');
      if (step === STEPS.length - 1) showStep(0);
      schedule();
    }
    function stop() {
      playing = false; clearTimeout(timer);
      playBtn.classList.remove('is-playing');
      playBtn.setAttribute('aria-label', 'Play the denoising animation');
    }
    playBtn.addEventListener('click', function () { if (playing) stop(); else play(); });

    selectEvent(0, false);
    showStep(STEPS.length - 1);

    if (!reduceMotion && 'IntersectionObserver' in window) {
      var started = false;
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !started) { started = true; play(); }
        else if (!vis && playing) { stop(); started = false; }
      }, { threshold: 0.45 }).observe(root);
    }
  })();

  /* ---------------------------------------------------- Stage 2 viewer */
  (function initStage2() {
    var root = $('#stage2-viz');
    if (!root || !DATA || !DATA.stage2) { if (root) root.hidden = true; return; }
    var events = DATA.stage2;
    var NAMES = ['Both stages correct', 'Stage 2 recovers', 'Stage 2 misses', 'Both miss'];
    var tabs = $('#s2-tabs', root), status = $('#s2-status', root);
    var elIcs = $('#s2-ics', root), elPred = $('#s2-pred', root), elGt = $('#s2-gt', root), elHeat = $('#s2-heat', root), elDoi = $('#s2-doi', root);
    var CHECK = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    var CROSS = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    // One status row per event, stacked in the same grid cell so switching events never
    // changes the height of the viewer
    var statusRows = events.map(function (e) {
      var v = document.createElement('div');
      v.className = 's2-status__v';
      v.innerHTML = statusHTML(e);
      status.appendChild(v);
      return v;
    });

    var tabEls = events.map(function (e, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tab'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false'); b.setAttribute('tabindex', '-1');
      b.innerHTML = '<span class="tab__dots" aria-hidden="true"><i class="tab__dot tab__dot--' + (e.s1 ? 'ok' : 'no') + '"></i><i class="tab__dot tab__dot--' + (e.s2 ? 'ok' : 'no') + '"></i></span>' + NAMES[i];
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (k) {
        if (k.key === 'ArrowRight' || k.key === 'ArrowLeft') {
          var j = (i + (k.key === 'ArrowRight' ? 1 : events.length - 1)) % events.length;
          select(j); tabEls[j].focus(); k.preventDefault();
        }
      });
      tabs.appendChild(b);
      return b;
    });

    function rc(id) { return [Math.floor((id - 1) / 16), (id - 1) % 16]; }
    function marker(cls, id) {
      var p = rc(id), m = document.createElement('span');
      m.className = 'mk ' + cls;
      m.style.left = (p[1] * 6.25) + '%';
      m.style.top = (p[0] * 6.25) + '%';
      return m;
    }
    function badge(ok, html) { return '<span class="badge badge--' + (ok ? 'ok' : 'no') + '">' + (ok ? CHECK : CROSS) + html + '</span>'; }
    function statusHTML(e) {
      var g = rc(e.cid_gt), p = rc(e.cid_pred);
      var away = Math.max(Math.abs(g[0] - p[0]), Math.abs(g[1] - p[1]));
      var crystalTxt = e.cid_gt === e.cid_pred
        ? 'Crystal correct (ID ' + e.cid_gt + ')'
        : 'Crystal ' + e.cid_pred + ' predicted, true ' + e.cid_gt + ' (' + away + ' crystal' + (away > 1 ? 's' : '') + ' away)';
      var err = Math.abs(e.doi_pred - e.doi_gt);
      return badge(e.s1, e.s1 ? 'Stage 1 pattern close to truth' : 'Stage 1 pattern off') +
        badge(e.s2, crystalTxt) +
        '<span class="badge badge--info">DOI error ' + err.toFixed(2) + ' mm</span>';
    }

    function select(i) {
      var e = events[i];
      tabEls.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.setAttribute('tabindex', k === i ? '0' : '-1'); });
      drawHeat(elIcs, e.ics); drawHeat(elPred, e.pred); drawHeat(elGt, e.gt); drawHeat(elHeat, e.heat);
      $$('.mk', elHeat).forEach(function (m) { m.remove(); });
      elHeat.appendChild(marker('mk--gt', e.cid_gt));
      elHeat.appendChild(marker('mk--pred', e.cid_pred));

      statusRows.forEach(function (r, k) { r.classList.toggle('is-on', k === i); });

      var xg = e.doi_gt / 20 * 100, xp = e.doi_pred / 20 * 100;
      var ticks = [5, 10, 15].map(function (t) { return '<span class="doi-strip__tick" style="left:' + (t / 20 * 100) + '%"></span>'; }).join('');
      elDoi.innerHTML =
        '<div class="doi-strip__label">Stage 2b depth of interaction<span>position along the 20 mm crystal</span></div>' +
        '<div class="doi-strip__track">' +
          '<div class="doi-strip__bar"></div>' + ticks +
          '<span class="doi-strip__end doi-strip__end--l">0</span><span class="doi-strip__end doi-strip__end--r">20 mm</span>' +
          '<span class="doi-strip__mk doi-strip__mk--gt" style="left:' + xg + '%"><span class="doi-strip__txt">truth ' + e.doi_gt.toFixed(2) + ' mm</span></span>' +
          '<span class="doi-strip__mk doi-strip__mk--pred" style="left:' + xp + '%"><span class="doi-strip__txt">predicted ' + e.doi_pred.toFixed(2) + ' mm</span></span>' +
        '</div>';
      elDoi.setAttribute('aria-label', 'Depth of interaction, truth ' + e.doi_gt.toFixed(2) + ' mm, predicted ' + e.doi_pred.toFixed(2) + ' mm');
    }
    select(1);
  })();

  /* ---------------------------------------------------------- citation */
  (function initBib() {
    var tabs = $$('.bib__tab');
    if (!tabs.length) return;
    function show(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.setAttribute('tabindex', on ? '0' : '-1');
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var n = tabs[(i + 1) % tabs.length]; show(n); n.focus(); e.preventDefault();
        }
      });
    });
    var btn = $('#bib-copy'), label = $('#bib-copy-text');
    btn.addEventListener('click', function () {
      var pre = $$('.bib__code').filter(function (p) { return !p.hidden; })[0];
      var text = pre ? pre.textContent : '';
      function done(ok) {
        if (!ok && pre) {
          // Copying was refused, so select the entry and let the reader copy it
          var range = document.createRange(); range.selectNodeContents(pre);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        }
        label.textContent = ok ? 'Copied' : 'Selected, press \u2318C or Ctrl+C';
        btn.classList.toggle('is-done', ok);
        setTimeout(function () { label.textContent = 'Copy'; btn.classList.remove('is-done'); }, ok ? 1800 : 4000);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallback(text)); });
      } else { done(fallback(text)); }
    });
    function fallback(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
  })();

  /* ------------------------------------------------------ author photos */
  // If a photo file is missing, drop the broken image so the initials underneath show instead.
  $$('.author__photo img').forEach(function (img) {
    function fail() { img.remove(); }
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    else img.addEventListener('error', fail);
  });

  /* ---------------------------------------------------------- lightbox */
  (function initLightbox() {
    var dlg = $('#lightbox');
    if (!dlg) return;
    var img = $('.lightbox__img', dlg);
    var supported = typeof dlg.showModal === 'function';
    $$('.zoom').forEach(function (b) {
      b.addEventListener('click', function () {
        var src = b.getAttribute('data-full');
        var inner = $('img', b);
        if (!supported) { window.open(src, '_blank', 'noopener'); return; }
        img.src = src;
        img.alt = inner ? inner.alt : '';
        dlg.showModal();
        dlg.scrollTop = 0;
      });
    });
    $('.lightbox__close', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target === img) dlg.close(); });
    dlg.addEventListener('close', function () { img.removeAttribute('src'); });
  })();
})();
