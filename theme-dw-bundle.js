/* Divine Warrior: Build your sacred bundle (product picker + live saving tray) */
(function () {
  'use strict';
  var TIERS = [{ n: 3, p: 10 }, { n: 5, p: 15 }, { n: 8, p: 20 }];
  var CATS = [
    { t: 'Gift favourites', cols: ['spiritual-gifts-for-her', 'crystal-healing-gifts', 'tarot-card-gifts'] },
    { t: 'Crystals', cols: ['crystal-healing-gifts', 'crystal-wands', 'gemstone-crystal-spheres'], skip: /candle|soap|incense/i },
    { t: 'Candles', cols: ['ritual-spell-candles', 'crystal-candles-collection', 'hop-hare-crystal-magic-flower-candle'], keep: /candle/i },
    { t: 'Tarot and runes', cols: ['tarot-cards-uk', 'oracle-cards-collection', 'rune-stones-uk'] },
    { t: 'Self-care', cols: ['self-care-pamper-gift-sets', 'aromatherapy', 'bath-body-collection'] },
    { t: 'Jewellery', cols: ['jewellery-collection', 'gemstone-power-bracelets'] },
    { t: 'Witchcraft', cols: ['sacred-altar-cleansing', 'ancient-witch-spell-incense', 'ritual-goblets'] },
    { t: 'Home', cols: ['gemstone-enchantment-lights', 'enchanted-gemstone-gardens', 'altar-dishes'] },
    { t: 'Journals', cols: ['journals-notebooks', 'grimoire-spell-book-journal'] }
  ];
  var cache = {};
  function fetchCol(h) {
    if (cache[h]) return cache[h];
    var all = [];
    function page(n) {
      return fetch('/collections/' + h + '/products.json?limit=250&page=' + n, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : { products: [] }; })
        .then(function (j) { var ps = j.products || []; all = all.concat(ps); return (ps.length === 250 && n < 6) ? page(n + 1) : all; });
    }
    cache[h] = page(1).catch(function () { return all; });
    return cache[h];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(p) { return '£' + (p / 100).toFixed(2); }
  function img(p) { var i = p.images && p.images[0]; if (!i) return ''; var s = i.src; return s + (s.indexOf('?') > -1 ? '&' : '?') + 'width=400'; }

  function tierFor(c) { var t = null; TIERS.forEach(function (x) { if (c >= x.n) t = x; }); return t; }
  function nextTier(c) { for (var i = 0; i < TIERS.length; i++) if (c < TIERS[i].n) return TIERS[i]; return null; }
  function hint(c) {
    var t = tierFor(c), nx = nextTier(c);
    if (!t) return 'Add ' + (nx.n - c) + ' more item' + (nx.n - c === 1 ? '' : 's') + ' to save ' + nx.p + '%';
    if (!nx) return '✦ ' + t.p + '% off unlocked – your best saving ✦';
    return '✦ ' + t.p + '% off unlocked ✦ Add ' + (nx.n - c) + ' more to save ' + nx.p + '%';
  }

  function init(root) {
    if (root.__dwb) return; root.__dwb = true;
    var chips = root.querySelector('[data-dwb-chips]'), grid = root.querySelector('[data-dwb-grid]'), more = root.querySelector('[data-dwb-more]');
    var countEl = root.querySelector('[data-dwb-count]'), fill = root.querySelector('[data-dwb-fill]'), hintEl = root.querySelector('[data-dwb-hint]');
    var tiers = root.querySelectorAll('[data-dwb-tiers] .dwb__tier');
    var list = [], shown = 0, inCart = {};

    function paintTray(cart) {
      var c = cart.item_count || 0, t = tierFor(c), last = TIERS[TIERS.length - 1].n;
      inCart = {}; (cart.items || []).forEach(function (it) { inCart[it.variant_id] = (inCart[it.variant_id] || 0) + it.quantity; });
      var save = t ? Math.round(cart.total_price * t.p / 100) : 0;
      countEl.innerHTML = 'Your bundle &middot; <b>' + c + ' item' + (c === 1 ? '' : 's') + '</b> &middot; ' + money(cart.total_price) + (save ? ' &middot; <b>you save about ' + money(save) + '</b>' : '');
      fill.style.width = Math.min(100, Math.round(c / last * 100)) + '%';
      hintEl.textContent = hint(c);
      for (var i = 0; i < tiers.length; i++) tiers[i].classList.toggle('is-on', c >= +tiers[i].getAttribute('data-n'));
      var btns = grid.querySelectorAll('[data-v]');
      for (var j = 0; j < btns.length; j++) { var q = inCart[btns[j].getAttribute('data-v')]; btns[j].classList.toggle('is-added', !!q); btns[j].textContent = q ? 'Added ×' + q + ' +' : '+ Add'; }
    }
    function refresh() { return fetch('/cart.js', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(paintTray).catch(function () {}); }
    function bubble() {
      fetch('/?sections=cart-icon-bubble', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (s) {
        var el = document.getElementById('cart-icon-bubble'); if (!el || !s['cart-icon-bubble']) return;
        var d = document.createElement('div'); d.innerHTML = s['cart-icon-bubble'];
        var n = d.querySelector('.shopify-section') || d; el.innerHTML = n.innerHTML;
      }).catch(function () {});
    }
    function add(btn) {
      var v = btn.getAttribute('data-v'); btn.disabled = true;
      fetch('/cart/add.js', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: +v, quantity: 1 }] }) })
        .then(function (r) { return r.json(); })
        .then(function () { return refresh(); })
        .then(function () { btn.disabled = false; bubble(); })
        .catch(function () { btn.disabled = false; });
    }
    function card(p) {
      var av = (p.variants || []).filter(function (v) { return v.available; });
      var price = Math.min.apply(null, av.map(function (v) { return Math.round(parseFloat(v.price) * 100); }));
      var one = av.length === 1 && p.variants.length === 1;
      var b = one ? '<button type="button" class="dwb__add" data-v="' + av[0].id + '">+ Add</button>'
                  : '<a class="dwb__add" href="/products/' + p.handle + '">Choose</a>';
      return '<div class="dwb__card"><a class="dwb__img" href="/products/' + p.handle + '">' + (img(p) ? '<img loading="lazy" src="' + esc(img(p)) + '" alt="' + esc(p.title) + '">' : '') + '</a>'
        + '<a class="dwb__t" href="/products/' + p.handle + '">' + esc(p.title) + '</a>'
        + '<div class="dwb__row"><span class="dwb__p">' + (av.length > 1 ? 'From ' : '') + money(price) + '</span>' + b + '</div></div>';
    }
    function draw() {
      var next = list.slice(shown, shown + 24); shown += next.length;
      grid.insertAdjacentHTML('beforeend', next.map(card).join(''));
      more.hidden = shown >= list.length;
      refresh();
    }
    function load(cat) {
      grid.innerHTML = '<p class="dwb__msg">Gathering treasures…</p>'; more.hidden = true;
      Promise.all(cat.cols.map(fetchCol)).then(function (ls) {
        var seen = {}; list = [];
        ls.forEach(function (l) { l.forEach(function (p) {
          if (seen[p.id]) return; seen[p.id] = 1;
          var t = (p.product_type || '') + ' ' + p.title;
          if (cat.keep && !cat.keep.test(t)) return; if (cat.skip && cat.skip.test(t)) return;
          if (!(p.variants || []).some(function (v) { return v.available; })) return;
          if (/gift card/i.test(t)) return;
          list.push(p);
        }); });
        grid.innerHTML = list.length ? '' : '<p class="dwb__msg">Nothing here just now – try another category.</p>';
        shown = 0; if (list.length) draw();
      });
    }
    CATS.forEach(function (c, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'dwb__chip' + (i === 0 ? ' is-active' : ''); b.textContent = c.t; b.setAttribute('role', 'tab');
      b.addEventListener('click', function () { var a = chips.querySelector('.is-active'); if (a) a.classList.remove('is-active'); b.classList.add('is-active'); load(c); });
      chips.appendChild(b);
    });
    grid.addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (b) add(b); });
    more.addEventListener('click', draw);
    load(CATS[0]);
    refresh();
  }
  function boot() { var r = document.querySelectorAll('[data-dw-bundle]'); for (var i = 0; i < r.length; i++) init(r[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', boot);
})();
