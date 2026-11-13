/* Divine Warrior: animated tarot room – shuffles the full pack like the Tarot Room page, then lays a three-card reading */
(function () {
  'use strict';
  var FACES = [
    { t: 'Past', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_17_Star.jpg?width=360', n: 'The Star' },
    { t: 'Present', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_01_Magician.jpg?width=360', n: 'The Magician' },
    { t: 'Future', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_19_Sun.jpg?width=360', n: 'The Sun' }
  ];
  var PILE = 14;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function anim(n, f, o) { try { return n.animate(f, o); } catch (e) { return null; } }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function build(stage, back) {
    var deck = el('span', 'dwtr__deck'); stage.appendChild(deck);
    var pile = [];
    for (var i = 0; i < PILE; i++) {
      var c = el('span', 'dwtr__card');
      c.innerHTML = '<span class="dwtr__in"><span class="dwtr__back"></span><span class="dwtr__face"></span></span>';
      c.style.zIndex = String(i + 1);
      deck.appendChild(c); pile.push(c);
    }
    FACES.forEach(function (f) { var im = new Image(); im.src = f.img; });
    var labels = FACES.map(function (f, i) { var l = el('span', 'dwtr__lab', f.t); deck.appendChild(l); return l; });
    return { deck: deck, pile: pile, labels: labels };
  }

  function run(stage, s, reduced) {
    var W = function () { return stage.clientWidth; };
    var cw = function () { return W() * 0.115; };
    var dealt = s.pile.slice(PILE - 3).reverse(); /* top three cards */
    var slots = [-1, 0, 1];
    function cardXY(i) { return { x: slots[i] * cw() * 1.45, y: cw() * 0.35 }; }
    function setFace(c, f) { var face = c.querySelector('.dwtr__face'); face.style.backgroundImage = 'url("' + f.img + '")'; face.setAttribute('aria-label', f.n); }
    function flip(c, toFace) {
      var inner = c.querySelector('.dwtr__in');
      return new Promise(function (res) {
        var a = anim(inner, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' });
        setTimeout(function () {
          c.classList.toggle('is-up', toFace);
          anim(inner, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
          setTimeout(res, 320);
        }, 270);
      });
    }
    function sparkle(c) {
      var r = c.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      var cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height / 2;
      for (var k = 0; k < 9; k++) {
        var sp = el('span', 'dwtr__sp', '&#10022;'); stage.appendChild(sp);
        sp.style.left = cx + 'px'; sp.style.top = cy + 'px';
        var a = k / 9 * Math.PI * 2, d = cw() * (0.9 + Math.random() * 0.5);
        anim(sp, [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(calc(-50% + ' + Math.cos(a) * d * .5 + 'px),calc(-50% + ' + Math.sin(a) * d * .5 + 'px)) scale(1.1)', opacity: 1, offset: .35 }, { transform: 'translate(calc(-50% + ' + Math.cos(a) * d + 'px),calc(-50% + ' + Math.sin(a) * d + 'px)) scale(.4)', opacity: 0 }], { duration: 1100, easing: 'ease-out' });
        setTimeout(function (n) { return function () { n.remove(); }; }(sp), 1200);
      }
      var g = el('span', 'dwtr__glow'); c.appendChild(g);
      anim(g, [{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: .55 }], { duration: 1400, fill: 'forwards' });
    }
    if (reduced) {
      dealt.forEach(function (c, i) { var p = cardXY(i); c.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)'; setFace(c, FACES[i]); c.classList.add('is-up'); s.labels[i].style.opacity = 1; });
      return;
    }
    function loop() {
      s.labels.forEach(function (l) { l.style.opacity = 0; });
      dealt.forEach(function (c) { c.classList.remove('is-up'); var g = c.querySelector('.dwtr__glow'); if (g) g.remove(); });
      s.pile.forEach(function (c) { c.getAnimations && c.getAnimations().forEach(function (a) { a.cancel(); }); c.style.transform = ''; });
      /* 1. riffle the whole pack twice, like the Tarot Room */
      var X = cw() * 0.85;
      s.pile.forEach(function (c, i) {
        var side = i % 2 ? 1 : -1;
        anim(c, [
          { transform: 'translate(0,' + (-i * .6) + 'px) rotate(0deg)' },
          { transform: 'translate(' + side * X + 'px,' + (-6 - i) + 'px) rotate(' + side * 9 + 'deg)', offset: .25 },
          { transform: 'translate(0,' + (-i * .6) + 'px) rotate(0deg)', offset: .5 },
          { transform: 'translate(' + (-side * X) + 'px,' + (-6 - i) + 'px) rotate(' + (-side * 9) + 'deg)', offset: .75 },
          { transform: 'translate(0,' + (-i * .6) + 'px) rotate(0deg)' }
        ], { duration: 900, delay: i * 25, iterations: 3, easing: 'ease-in-out' });
      });
      wait(3200).then(function () {
        /* 2. lift the pack back, deal three cards */
        var up = -cw() * 1.25;
        s.pile.forEach(function (c, i) {
          if (dealt.indexOf(c) > -1) return;
          anim(c, [{ transform: 'translate(0,' + (-i * .6) + 'px)' }, { transform: 'translate(0,' + (up - i * .6) + 'px) scale(.8)' }], { duration: 600, easing: 'ease-out', fill: 'forwards' });
        });
        return wait(500);
      }).then(function () {
        var p = Promise.resolve();
        dealt.forEach(function (c, i) {
          p = p.then(function () {
            setFace(c, FACES[i]);
            var to = cardXY(i);
            anim(c, [{ transform: 'translate(0,0) rotate(0deg)' }, { transform: 'translate(' + to.x + 'px,' + to.y + 'px) rotate(' + (slots[i] * 2) + 'deg)' }], { duration: 650, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
            var l = s.labels[i]; l.style.transform = 'translate(calc(-50% + ' + to.x + 'px),' + (to.y + cw() * 1.02) + 'px)';
            return wait(520);
          });
        });
        return p;
      }).then(function () { return wait(400); }).then(function () {
        /* 3. turn them over one by one */
        var p = Promise.resolve();
        dealt.forEach(function (c, i) {
          p = p.then(function () { return flip(c, true); }).then(function () { sparkle(c); s.labels[i].style.opacity = 1; return wait(600); });
        });
        return p;
      }).then(function () { return wait(3600); }).then(function () {
        /* 4. gather the cards and begin again */
        s.labels.forEach(function (l) { l.style.opacity = 0; });
        return Promise.all(dealt.map(function (c) { return flip(c, false); }));
      }).then(function () {
        s.pile.forEach(function (c, i) {
          anim(c, [{}, { transform: 'translate(0,' + (-i * .6) + 'px) rotate(0deg) scale(1)' }], { duration: 700, easing: 'ease-in-out', fill: 'forwards' });
        });
        return wait(1100);
      }).then(loop);
    }
    loop();
  }

  function init(stage) {
    if (stage.__dwtr) return; stage.__dwtr = true;
    var s = build(stage);
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var started = false;
    function start() { if (started) return; started = true; run(stage, s, reduced); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { start(); io.disconnect(); } }); }, { threshold: .25 });
      io.observe(stage);
    } else start();
  }
  window.DW_TAROT_ROOM_INIT = init;
  function boot() { var r = document.querySelectorAll('[data-dw-tarot-room]'); for (var i = 0; i < r.length; i++) init(r[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
