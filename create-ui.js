/* Aligned create-ui.js — turns the make-a-video chat into a full-screen conversation
 * and adds a content-type palette (Talking, Faceless, Carousel, Story reel, ...).
 * Additive + fail-safe: it wraps asstOpen() and injects UI; if anything is missing it
 * no-ops rather than breaking the app. Loaded after assistant.js. See ../README.md */
(function () {
  'use strict';
  if (window.__alignedCreateUI) return;
  window.__alignedCreateUI = true;

  // Each chip PRE-FILLS the conversation (it does not auto-send) so the customer finishes the idea.
  var TYPES = [
    ['Talking video', 'A talking video of me about '],
    ['Faceless reel', 'A faceless reel (my voice over b-roll) about '],
    ['Carousel', 'A carousel swipe post about '],
    ['Story reel', 'A story reel: b-roll with text on screen and my voiceover. The story is less of ___ and more of ___ — it is about '],
    ['Testimonial', 'A testimonial-style video about '],
    ['Before / After', 'A before-and-after video about '],
    ['Tips / How-to', 'A quick tips video about '],
    ['Founder story', 'A founder-story video about '],
    ['Put me in a scene', 'Put me in a scene: '],
    ['UGC ad', 'A UGC-style ad for my product (I will upload a product photo). My product is: ']
  ];

  function injectCss() {
    if (document.getElementById('aligned-createui-css')) return;
    var s = document.createElement('style');
    s.id = 'aligned-createui-css';
    s.textContent =
      '#asstBackdrop{position:fixed;inset:0;background:rgba(6,9,16,.62);z-index:1590;display:none;}' +
      '#asstBackdrop.show{display:block;}' +
      '.asst-panel.show{right:auto!important;bottom:auto!important;top:50%!important;left:50%!important;' +
      'transform:translate(-50%,-50%)!important;width:min(820px,96vw)!important;height:min(90vh,940px)!important;' +
      'max-height:96vh!important;border-radius:20px!important;z-index:1600;}' +
      '.asst-types{display:flex;flex-wrap:wrap;gap:8px;padding:12px 14px 10px;border-bottom:1px solid var(--line);}' +
      '.asst-types .tchip{font-size:12.5px;line-height:1;padding:8px 13px;border:1px solid var(--line);' +
      'border-radius:999px;cursor:pointer;background:rgba(255,255,255,.03);white-space:nowrap;color:var(--text,#e8ecf5);}' +
      '.asst-types .tchip:hover{border-color:#9B6BE0;background:rgba(155,107,224,.12);}' +
      '.asst-panel.show .asst-msgs{font-size:14.5px;padding:16px;}' +
      '.asst-panel .asst-foot input{font-size:14.5px;}' +
      '@media(max-width:560px){.asst-panel.show{width:100vw!important;height:100vh!important;border-radius:0!important;}}';
    document.head.appendChild(s);
  }

  function ensureBackdrop() {
    var bd = document.getElementById('asstBackdrop');
    if (!bd) {
      bd = document.createElement('div');
      bd.id = 'asstBackdrop';
      bd.addEventListener('click', function () { try { asstOpen(false); } catch (e) {} });
      document.body.appendChild(bd);
    }
    return bd;
  }

  function pickType(seed) {
    try { asstOpen(true); } catch (e) {}
    setTimeout(function () {
      var i = document.getElementById('asstInput');
      if (i) { i.value = seed; i.focus(); try { i.setSelectionRange(seed.length, seed.length); } catch (_) {} }
    }, 40);
  }
  window.alignedPickType = pickType;

  function ensureChips() {
    var panel = document.getElementById('asstPanel');
    if (!panel || panel.querySelector('.asst-types')) return;
    var head = panel.querySelector('.asst-head');
    var bar = document.createElement('div');
    bar.className = 'asst-types';
    TYPES.forEach(function (t) {
      var c = document.createElement('span');
      c.className = 'tchip';
      c.textContent = t[0];
      c.addEventListener('click', function () { pickType(t[1]); });
      bar.appendChild(c);
    });
    if (head && head.nextSibling) panel.insertBefore(bar, head.nextSibling);
    else panel.insertBefore(bar, panel.firstChild);
  }

  function wrap() {
    if (typeof window.asstOpen !== 'function') return false;
    if (window.asstOpen.__cuiWrapped) return true;
    var orig = window.asstOpen;
    window.asstOpen = function (open) {
      injectCss();
      var r = orig.apply(this, arguments);
      try {
        ensureBackdrop().classList.toggle('show', open !== false);
        if (open !== false) ensureChips();
      } catch (e) {}
      return r;
    };
    window.asstOpen.__cuiWrapped = true;
    return true;
  }

  if (!wrap()) {
    var n = 0;
    var iv = setInterval(function () { if (wrap() || ++n > 50) clearInterval(iv); }, 100);
  }
})();
