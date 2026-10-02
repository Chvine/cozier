
(function () {
  'use strict';

  var S  = window.SITE;
  var P  = window.PRODUCTS;
  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return document.querySelectorAll(s); };

  /* ── Formatters & Helpers ───────────────────────────── */
  function peso(n) { return '₱' + Number(n).toLocaleString('en-PH'); }
  function find(id) { return P.find(function (p) { return p.id == id; }); }
  function mailOk(v) { return /^\S+@\S+\.\S+$/.test(v || ''); }
  function say(el, msg, ok) {
    if (!el) return;
    el.textContent = msg;
    el.className   = 'note ' + (ok ? 'ok' : 'bad');
  }

  /* SVG fallback tee illustration when product photo is missing */
  function teesvg(p) {
    var fs = p.mark.length > 2 ? 14 : 30;
    return '<svg viewBox="0 0 200 200" aria-hidden="true" style="width:78%">'
      + '<path d="M70 30 40 45 15 85l30 15 13-15v85h84V85l13 15 30-15-25-40-30-15q-30 22-60 0z"'
      + ' fill="' + p.hex + '" stroke="rgba(0,0,0,.1)"/>'
      + '<text x="100" y="105" text-anchor="middle"'
      + ' font-family="Newsreader,Georgia,serif" font-size="' + fs + '" fill="' + p.markHex + '">' + p.mark + '</text>'
      + '</svg>';
  }

  function productImg(p, lazy) {
    return '<img data-p="' + p.id + '" src="images/' + p.id + '.jpg"'
      + ' alt="' + p.name + ', ' + p.color + '"'
      + (lazy ? ' loading="lazy"' : '') + '>';
  }

  /* Global image fallback listener */
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t.tagName === 'IMG' && t.dataset.p) {
      var found = find(t.dataset.p);
      if (found) t.outerHTML = teesvg(found);
    }
  }, true);

  /* ── State ──────────────────────────────────────────── */
  var cart = [];
  var promo = '';
  var drawerMode = 'bag';
  var doneOrder = {};

  try { cart = JSON.parse(localStorage.getItem('cozier-bag') || '[]'); } catch (e) {}

  function saveCart() {
    try { localStorage.setItem('cozier-bag', JSON.stringify(cart)); } catch (e) {}
  }

  function calc() {
    var sub  = cart.reduce(function (s, i) { return s + find(i.id).price * i.qty; }, 0);
    var disc = Math.round(sub * (S.promoCodes[promo] || 0));
    var ship = (!sub || sub >= S.freeShippingOver) ? 0 : S.shippingFee;
    return { sub: sub, disc: disc, ship: ship, total: sub - disc + ship };
  }

  /* ── API Client ─────────────────────────────────────── */
  function api(method, url, body) {
    return fetch(url, {
      method:  method,
      headers: { 'content-type': 'application/json' },
      body:    body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw Object.assign(new Error(j.error || 'Request failed'), { http: r.status });
        return j;
      });
    });
  }

  /* ── Navigation & Routing ───────────────────────────── */
  function route() {
    var hash = (location.hash || '#shop').slice(1);
    if (hash === 'collection') hash = 'shop';
    if (!document.getElementById('v-' + hash)) hash = 'shop';

    $$('.view').forEach(function (el) {
      el.classList.toggle('on', el.id === 'v-' + hash);
    });

    $$('[data-nav]').forEach(function (a) {
      a.classList.toggle('on', a.dataset.nav === hash);
    });

    if (hash !== 'shop' || !location.hash.includes('collection')) {
      window.scrollTo(0, 0);
    }

    if (hash === 'track') {
      renderLocalOrders();
    }

    if (hash !== 'about') {
      var vid = $('#aboutVid');
      if (vid && !vid.paused) vid.pause();
    }

    closeMobileMenu();
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', function () {
    var hdr = $('#hdr');
    if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 10);
  });

  /* ── Minimal Mobile Menu Toggle ─────────────────────── */
  var menuBtn    = $('#menuBtn');
  var mobileMenu = $('#mobileMenu');

  function toggleMobileMenu() {
    if (!mobileMenu) return;
    var isOpen = mobileMenu.classList.toggle('open');
    if (menuBtn) {
      menuBtn.textContent = isOpen ? 'CLOSE' : 'MENU';
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }

  function closeMobileMenu() {
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      if (menuBtn) {
        menuBtn.textContent = 'MENU';
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    }
  }

  if (menuBtn) menuBtn.addEventListener('click', toggleMobileMenu);

  if (mobileMenu) {
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        closeMobileMenu();
      }
    });
  }

  /* ── Shop Grid & Filters ────────────────────────────── */
  var activeFilter = 'all';

  function renderGrid() {
    var q       = ($('#q') || {}).value || '';
    q           = q.trim().toLowerCase();
    var sortVal = parseInt(($('#sort') || {}).value || '0');

    var results = P.filter(function (p) {
      return (activeFilter === 'all' || p.filter === activeFilter)
        && (p.name + ' ' + p.color).toLowerCase().includes(q);
    });

    if (sortVal === 1) results.sort(function (a, b) { return a.price - b.price; });
    if (sortVal === 2) results.sort(function (a, b) { return b.price - a.price; });

    var grid = $('#grid');
    if (!grid) return;

    grid.innerHTML = results.length
      ? results.map(function (p) {
          return '<article class="card">'
            + '<div class="card-img" data-view="' + p.id + '">'
            + productImg(p, true)
            + '<div class="card-quick"><button class="btn block quick-btn" data-view="' + p.id + '">Choose size</button></div>'
            + '</div>'
            + '<div class="meta">'
            + '<span class="name">' + p.name + '</span>'
            + '<span class="price">' + peso(p.price) + '</span>'
            + '</div>'
            + '<div class="sub">' + p.color + ' — ' + p.tagline + '</div>'
            + '</article>';
        }).join('')
      : '<p class="none">No tees match that search.</p>';
  }

  var qEl    = $('#q');
  var sortEl = $('#sort');
  if (qEl)    qEl.addEventListener('input', renderGrid);
  if (sortEl) sortEl.addEventListener('change', renderGrid);

  $$('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeFilter = chip.dataset.f;
      $$('.chip').forEach(function (x) {
        x.setAttribute('aria-pressed', x === chip ? 'true' : 'false');
      });
      renderGrid();
    });
  });

  var gridEl = $('#grid');
  if (gridEl) {
    gridEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-view]');
      if (t) openDialog(t.dataset.view);
    });
  }

  /* ── Product Quick View Dialog ──────────────────────── */
  var curProduct = null;

  function openDialog(id) {
    var p      = find(id);
    curProduct = { id: p.id, size: S.sizes[1], qty: 1 }; // default 'M'

    var sizeButtons = S.sizes.map(function (s) {
      return '<button data-size="' + s + '" aria-pressed="' + (s === curProduct.size) + '">' + s + '</button>';
    }).join('');

    var sizeRows = S.sizes.map(function (s, i) {
      var chest  = 21 + i;
      var length = 27 + i;
      return '<tr><td>' + s + '</td><td>' + chest + ' in</td><td>' + length + ' in</td></tr>';
    }).join('');

    $('#qv').innerHTML = '<div class="qv">'
      + '<div class="qv-pic">' + productImg(p, false) + '</div>'
      + '<div class="qv-info">'
      + '<button class="x" data-close aria-label="Close">×</button>'
      + '<h2>' + p.name + '</h2>'
      + '<p class="mute sm" style="margin:4px 0 0">' + p.color + '</p>'
      + '<p style="font-size:22px;margin:12px 0;font-family:var(--serif)">' + peso(p.price) + '</p>'
      + '<p style="margin-bottom:16px">' + p.tagline + ' Heavyweight cotton, relaxed fit.</p>'
      + '<div style="font-weight:500;font-size:13px;margin-bottom:6px">Size</div>'
      + '<div class="sizes" id="sz">' + sizeButtons + '</div>'
      + '<details style="margin:8px 0 16px"><summary style="font-size:12px;cursor:pointer;color:var(--mute)">Size guide</summary>'
      + '<table><tr><th>Size</th><th>Chest</th><th>Length</th></tr>' + sizeRows + '</table>'
      + '</details>'
      + '<div class="qty" style="margin-bottom:16px">'
      + '<button data-delta="-1" aria-label="Decrease quantity">−</button>'
      + '<span id="qn">1</span>'
      + '<button data-delta="1" aria-label="Increase quantity">+</button>'
      + '</div>'
      + '<button class="btn block" data-add-to-bag>Add to bag</button>'
      + '</div></div>';

    $('#qv').showModal();
  }

  var qvEl = $('#qv');
  if (qvEl) {
    qvEl.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (e.target === this || (btn && btn.dataset.close !== undefined)) return this.close();
      if (!btn) return;

      if (btn.dataset.size !== undefined) {
        curProduct.size = btn.dataset.size;
        $$('#sz button').forEach(function (x) {
          x.setAttribute('aria-pressed', x === btn ? 'true' : 'false');
        });
      }
      if (btn.dataset.delta !== undefined) {
        curProduct.qty = Math.min(10, Math.max(1, curProduct.qty + (+btn.dataset.delta)));
        $('#qn').textContent = curProduct.qty;
      }
      if (btn.dataset.addToBag !== undefined) {
        var existing = cart.find(function (i) { return i.id == curProduct.id && i.size === curProduct.size; });
        if (existing) existing.qty = Math.min(10, existing.qty + curProduct.qty);
        else cart.push({ id: curProduct.id, size: curProduct.size, qty: curProduct.qty });
        saveCart();
        this.close();
        openDrawer('bag');
      }
    });
  }

  /* ── Drawer (Bag & Checkout) ────────────────────────── */
  function openDrawer(mode) {
    drawerMode = mode;
    renderDrawer();
    $('#drawer').classList.add('open');
    $('#scrim').classList.add('open');
  }

  function closeDrawer() {
    $('#drawer').classList.remove('open');
    $('#scrim').classList.remove('open');
  }

  var openBagBtn  = $('#openBag');
  var closeBagBtn = $('#closeBag');
  var scrimEl     = $('#scrim');

  if (openBagBtn)  openBagBtn.addEventListener('click', function () { openDrawer('bag'); });
  if (closeBagBtn) closeBagBtn.addEventListener('click', closeDrawer);
  if (scrimEl)     scrimEl.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  function bumpCount() {
    var el = $('#count');
    if (!el) return;
    el.classList.remove('bump');
    requestAnimationFrame(function () { el.classList.add('bump'); });
    setTimeout(function () { el.classList.remove('bump'); }, 300);
  }

  function renderTotals(c) {
    return '<div class="row mute"><span>Subtotal</span><span>' + peso(c.sub) + '</span></div>'
      + (c.disc ? '<div class="row mute"><span>Promo (' + promo + ')</span><span>−' + peso(c.disc) + '</span></div>' : '')
      + '<div class="row mute"><span>Delivery</span><span>' + (c.ship ? peso(c.ship) : 'Free') + '</span></div>'
      + '<div class="row t"><span>Total</span><span>' + peso(c.total) + '</span></div>';
  }

  function renderDrawer() {
    var c   = calc();
    var dB  = $('#dB');
    var dF  = $('#dF');
    var dT  = $('#dT');
    var cnt = $('#count');

    var totalQty = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    if (cnt) cnt.textContent = totalQty;

    if (drawerMode === 'bag') {
      if (dT) dT.textContent = 'Shopping bag';
      var left = S.freeShippingOver - c.sub;
      var pct  = Math.min(100, c.sub / S.freeShippingOver * 100);

      var shipMsg = left > 0
        ? 'Add ' + peso(left) + ' more for free delivery'
        : 'You’ve unlocked free delivery';

      if (dB) dB.innerHTML = (cart.length
        ? '<div class="ship">' + shipMsg + '<div class="bar"><i style="width:' + pct + '%"></i></div></div>'
        : '')
        + (cart.length
          ? cart.map(function (item, x) {
              var p = find(item.id);
              return '<div class="line">'
                + '<div class="thumb">' + productImg(p, true) + '</div>'
                + '<div>'
                + '<div style="font-weight:500">' + p.name + '</div>'
                + '<div class="mute sm">' + p.color + ' / Size ' + item.size + '</div>'
                + '<div class="qty" style="margin-top:8px">'
                + '<button data-q="' + x + '" data-d="-1" aria-label="Decrease">−</button>'
                + '<span>' + item.qty + '</span>'
                + '<button data-q="' + x + '" data-d="1" aria-label="Increase">+</button>'
                + '</div></div>'
                + '<div style="text-align:right">'
                + '<div>' + peso(p.price * item.qty) + '</div>'
                + '<button class="link" data-r="' + x + '" style="margin-top:30px">Remove</button>'
                + '</div></div>';
            }).join('')
          : '<p class="none" style="padding:40px 0">Your bag is empty. Pick a tee and it will show up here.</p>');

      if (dF) dF.innerHTML = cart.length
        ? '<div class="promo">'
          + '<input class="field" id="pc" placeholder="Promo code" value="' + promo + '" aria-label="Promo code">'
          + '<button class="btn ghost" id="applyPromo">Apply</button></div>'
          + '<p class="note" id="pn"></p>'
          + renderTotals(c)
          + '<button class="btn block" data-go="checkout" style="margin-top:12px">Checkout</button>'
        : '<button class="btn ghost block" data-go="close">Continue shopping</button>';

      var applyBtn = $('#applyPromo');
      if (applyBtn) applyBtn.addEventListener('click', function () {
        var v = ($('#pc') || {}).value || '';
        v = v.trim().toUpperCase();
        promo = S.promoCodes[v] ? v : '';
        renderDrawer();
        var note = $('#pn');
        if (v && note) say(note, promo ? 'Code applied: 10% off.' : 'That code isn’t valid.', !!promo);
      });
    }

    else if (drawerMode === 'checkout') {
      if (dT) dT.textContent = 'Checkout';

      var payOptions = S.paymentMethods.map(function (m, idx) {
        return '<label><input type="radio" name="pay" value="' + m + '"' + (idx === 0 ? ' checked' : '') + '>' + m + '</label>';
      }).join('');

      if (dB) dB.innerHTML = '<form id="coForm" novalidate>'
        + '<label>Full name<input class="field" id="co-name" placeholder="Juan dela Cruz" autocomplete="name"></label>'
        + '<label>Mobile number<input class="field" id="co-phone" type="tel" placeholder="09XX XXX XXXX" autocomplete="tel"></label>'
        + '<label>Email address<input class="field" id="co-email" type="email" placeholder="name@example.com" autocomplete="email"></label>'
        + '<label>Delivery address<input class="field" id="co-addr" placeholder="Street, barangay, city" autocomplete="street-address"></label>'
        + '<label>Payment</label>'
        + '<div class="pay">' + payOptions + '</div>'
        + '<p class="note" id="cn" role="alert"></p>'
        + '</form>';

      if (dF) dF.innerHTML = renderTotals(c)
        + '<button class="btn block" id="placeBtn" style="margin-top:12px">Place order</button>'
        + '<button class="btn ghost block" data-go="bag" style="margin-top:8px">Back to bag</button>';

      var placeBtn = $('#placeBtn');
      if (placeBtn) placeBtn.addEventListener('click', placeOrder);
    }

    else {
      /* Thank you / Done view */
      if (dT) dT.textContent = 'Thank you';
      if (dB) dB.innerHTML = '<div style="padding:24px 0">'
        + '<h2 style="font-size:32px;margin-bottom:8px">Order Confirmed</h2>'
        + '<p>Order <b style="font-family:var(--serif);font-size:22px">' + doneOrder.no + '</b> is in. We’ll message <b>' + doneOrder.name + '</b> to confirm delivery.</p>'
        + '<p class="mute" style="margin:12px 0">Total ' + peso(doneOrder.total) + ' · ' + doneOrder.pay + '</p>'
        + (doneOrder.local
            ? '<p class="note bad" style="margin-top:16px">The order server could not be reached, so this order was saved on this device. Please message ' + S.email + ' to confirm.</p>'
            : '')
        + '<div style="margin-top:28px">'
        + '<a href="#track" id="viewInDashboard" class="btn block" style="margin-bottom:10px">View in Order Dashboard →</a>'
        + '<button class="btn ghost block" data-go="close">Keep shopping</button>'
        + '</div>'
        + '</div>';

      if (dF) dF.innerHTML = '';

      var viewDashBtn = $('#viewInDashboard');
      if (viewDashBtn) {
        viewDashBtn.addEventListener('click', function () {
          closeDrawer();
          setTimeout(function () {
            showOrderCard(doneOrder);
          }, 150);
        });
      }
    }
  }

  /* Bag quantity & remove clicks */
  var dBEl = $('#dB');
  if (dBEl) dBEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.q !== undefined) {
      var item = cart[+btn.dataset.q];
      if (item) {
        item.qty = Math.min(10, item.qty + (+btn.dataset.d));
        if (item.qty < 1) cart.splice(+btn.dataset.q, 1);
      }
    }
    if (btn.dataset.r !== undefined) cart.splice(+btn.dataset.r, 1);
    saveCart();
    bumpCount();
    renderDrawer();
  });

  /* Drawer navigation buttons */
  var dFEl = $('#dF');
  if (dFEl) dFEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-go]');
    if (!btn) return;
    var go = btn.dataset.go;
    if (go === 'close') return closeDrawer();
    drawerMode = go;
    renderDrawer();
  });

  /* ── Place Order Execution ──────────────────────────── */
  function placeOrder() {
    var name  = (($('#co-name')  || {}).value || '').trim();
    var phone = (($('#co-phone') || {}).value || '').trim();
    var email = (($('#co-email') || {}).value || '').trim();
    var addr  = (($('#co-addr')  || {}).value || '').trim();
    var payEl = document.querySelector('input[name="pay"]:checked');
    var pay   = payEl ? payEl.value : S.paymentMethods[0];
    var errEl = $('#cn');

    if (!name || !addr)                   return say(errEl, 'Add your name and delivery address.');
    if (!/^[0-9+\s\-]{7,}$/.test(phone)) return say(errEl, 'Enter a valid mobile number.');
    if (!mailOk(email))                   return say(errEl, 'Enter a valid email address.');

    var btn  = $('#placeBtn');
    var c    = calc();
    var body = {
      kind:  'order', name: name, phone: phone, email: email,
      addr:  addr, pay: pay, promo: promo,
      items: cart.map(function (i) { return { id: i.id, s: i.size, q: i.qty }; })
    };

    if (btn) { btn.disabled = true; btn.textContent = 'Placing order…'; }

    api('POST', S.apiEndpoint, body)
      .then(function (r) {
        var completed = {
          no:      r.no,
          total:   r.total,
          name:    name,
          phone:   phone,
          email:   email,
          addr:    addr,
          pay:     pay,
          items:   body.items,
          status:  S.orderStatuses[0],
          created: new Date().toISOString(),
          local:   false
        };
        saveLocalOrder(completed);
        finishOrder(completed);
      })
      .catch(function (err) {
        if (err.http && err.http < 500 && err.http !== 404) throw err;
        /* Fallback: save to localStorage on this device */
        var no = 'CZ-' + String(Date.now()).slice(-6);
        var completed = {
          no:      no,
          total:   c.total,
          name:    name,
          phone:   phone,
          email:   email,
          addr:    addr,
          pay:     pay,
          items:   body.items,
          status:  S.orderStatuses[0],
          created: new Date().toISOString(),
          local:   true
        };
        saveLocalOrder(completed);
        finishOrder(completed);
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = 'Place order'; }
        if (errEl) say(errEl, err.message);
      });
  }

  function saveLocalOrder(order) {
    try {
      var orders = JSON.parse(localStorage.getItem('cozier-orders') || '[]');
      orders.push(order);
      localStorage.setItem('cozier-orders', JSON.stringify(orders));
    } catch (e) {}
  }

  function finishOrder(d) {
    doneOrder = d;
    cart = [];
    promo = '';
    saveCart();
    drawerMode = 'done';
    renderDrawer();
  }

  /* ── Order Dashboard & Tracking ─────────────────────── */
  function showOrderCard(order) {
    var card = $('#orderCard');
    if (!card) return;
    card.classList.add('visible');

    var noEl   = $('#cardNo');
    var dateEl = $('#cardDate');
    var stEl   = $('#cardStatus');

    if (noEl)   noEl.textContent   = order.no;
    if (dateEl) dateEl.textContent = order.created
      ? new Date(order.created).toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
      : '';
    if (stEl) {
      stEl.textContent = order.status;
      stEl.className   = 'status-tag ' + (order.status || '').toLowerCase().replace(/\s+/g, '-');
    }

    /* Progress tracker steps */
    var stepIdx = S.orderStatuses.indexOf(order.status);
    if (stepIdx < 0) stepIdx = 0;

    $$('#trackerSteps .tracker-step').forEach(function (s, i) {
      s.classList.remove('done', 'active');
      if (i < stepIdx)        s.classList.add('done');
      else if (i === stepIdx) s.classList.add('active');
    });

    /* Render purchased items */
    var itemsEl = $('#cardItems');
    if (itemsEl && order.items && order.items.length) {
      itemsEl.innerHTML = order.items.map(function (item) {
        var pd  = find(item.id) || { name: 'Item #' + item.id, price: 0, color: '' };
        var qty = item.q || item.qty || 1;
        var sz  = item.s || item.size || 'M';
        return '<div class="line" style="padding:14px 0">'
          + '<div class="thumb" style="width:60px;height:60px">' + productImg(pd, true) + '</div>'
          + '<div>'
          + '<div style="font-weight:500">' + pd.name + '</div>'
          + '<div class="mute sm">' + pd.color + ' / Size ' + sz + ' × ' + qty + '</div>'
          + '</div>'
          + '<div style="font-weight:500;text-align:right">' + peso(pd.price * qty) + '</div>'
          + '</div>';
      }).join('');
    }

    /* Render totals & payment */
    var totalsEl = $('#cardTotals');
    if (totalsEl) {
      totalsEl.innerHTML = '<div class="row mute"><span>Payment Method</span><span>' + (order.pay || 'Cash on delivery') + '</span></div>'
        + '<div class="row t" style="margin-top:6px"><span>Total Amount</span><span>' + peso(order.total) + '</span></div>';
    }

    /* Render delivery info */
    var addrEl = $('#cardAddr');
    if (addrEl) {
      addrEl.innerHTML = (order.name || order.addr)
        ? '<div style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin-bottom:6px">Recipient & Delivery</div>'
          + (order.name  ? '<div>' + order.name + '</div>' : '')
          + (order.addr  ? '<div class="mute sm">' + order.addr + '</div>' : '')
          + (order.phone ? '<div class="mute sm">' + order.phone + '</div>' : '')
        : '';
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderLocalOrders() {
    var el = $('#localOrders');
    if (!el) return;
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem('cozier-orders') || '[]'); } catch (e) {}

    if (!stored.length) {
      el.innerHTML = '<p class="mute sm">No orders placed on this device yet.</p>';
      return;
    }

    el.innerHTML = stored.slice().reverse().map(function (o) {
      var d = o.created ? new Date(o.created).toLocaleDateString('en-PH', { month:'short', day:'numeric' }) : '';
      return '<div class="order-list-item" data-local-no="' + o.no + '">'
        + '<div style="display:flex;justify-content:space-between;align-items:center">'
        + '<b style="font-family:var(--serif);font-size:18px">' + o.no + '</b>'
        + '<span class="status-tag ' + (o.status || '').toLowerCase().replace(/\s+/g, '-') + '">' + o.status + '</span>'
        + '</div>'
        + '<div class="mute sm" style="margin-top:4px">' + d + ' · ' + peso(o.total) + '</div>'
        + '</div>';
    }).join('');
  }

  /* Lookup form */
  var trackForm = $('#trackForm');
  if (trackForm) {
    trackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var no  = (($('#trackNo') || {}).value || '').trim().toUpperCase();
      var ph  = (($('#trackPh') || {}).value || '').trim();
      var out = $('#tOut');

      if (!no || !ph) return say(out, 'Enter both your order number and mobile number.');

      var dig = function (s) { return String(s || '').replace(/\D/g, '').slice(-4); };

      api('GET', S.apiEndpoint + '?no=' + encodeURIComponent(no) + '&p=' + encodeURIComponent(ph))
        .then(function (r) {
          say(out, 'Order found.', true);
          showOrderCard(r);
        })
        .catch(function () {
          var stored = [];
          try { stored = JSON.parse(localStorage.getItem('cozier-orders') || '[]'); } catch (x) {}
          var found = stored.find(function (x) { return x.no === no && dig(x.phone) === dig(ph); });
          if (found) {
            say(out, 'Order found (from this device).', true);
            showOrderCard(found);
          } else {
            say(out, 'We couldn’t find that order. Check the number and the mobile number you used.');
            var card = $('#orderCard');
            if (card) card.classList.remove('visible');
          }
        });
    });
  }

  /* Click local orders to view */
  var localOrdersEl = $('#localOrders');
  if (localOrdersEl) {
    localOrdersEl.addEventListener('click', function (e) {
      var item = e.target.closest('[data-local-no]');
      if (!item) return;
      var stored = [];
      try { stored = JSON.parse(localStorage.getItem('cozier-orders') || '[]'); } catch (x) {}
      var found = stored.find(function (x) { return x.no === item.dataset.localNo; });
      if (found) showOrderCard(found);
    });
  }

  /* ── Contact & Newsletter Forms ─────────────────────── */
  function bindPostForm(form, outEl, kind, okMsg, validate) {
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form));
      data.kind = kind;
      var err = validate(data);
      if (err) { if (outEl) say(outEl, err); return; }

      api('POST', S.apiEndpoint, data)
        .then(function () {
          form.reset();
          if (outEl) say(outEl, okMsg, true);
        })
        .catch(function () {
          if (kind === 'message') {
            location.href = 'mailto:' + S.email
              + '?subject=' + encodeURIComponent('Message from ' + (data.name || ''))
              + '&body='    + encodeURIComponent((data.message || '') + '\n\n' + (data.email || ''));
          } else if (outEl) {
            say(outEl, 'Couldn’t process right now. Try again later.');
          }
        });
    });
  }

  bindPostForm($('#msgForm'), $('#mOut'), 'message', 'Message sent. We’ll reply within one working day.',
    function (d) { return (!d.name || !mailOk(d.email) || !d.message) ? 'Fill in your name, a valid email, and a message.' : ''; });

  bindPostForm($('#newsForm'), null, 'subscribe', 'You’re on the list.',
    function (d) { return mailOk(d.email) ? '' : 'Enter a valid email.'; });

  /* ── Populate Dynamic Content from Config ───────────── */
  function populate() {
    /* Brand elements */
    $$('[data-cfg="name"]').forEach(function (el) { el.textContent = S.name; });
    $$('[data-cfg="location"]').forEach(function (el) { el.textContent = S.location; });
    $$('[data-cfg="email"]').forEach(function (el) {
      el.textContent = S.email;
      if (el.tagName === 'A') el.href = 'mailto:' + S.email;
    });
    $$('[data-cfg="address"]').forEach(function (el) { el.textContent = S.address; });
    $$('[data-cfg="hours"]').forEach(function (el) { el.textContent = S.hours; });

    /* Hero */
    var heroTag  = $('#heroTag');
    var heroH1   = $('#heroHeading');
    var heroDesc = $('#heroDesc');
    var heroPks  = $('#heroPerks');

    if (heroTag)  heroTag.textContent  = S.hero.tag;
    if (heroH1)   heroH1.innerHTML    = S.hero.heading1 + '<br><span class="moss">' + S.hero.heading2 + '</span>';
    if (heroDesc) heroDesc.textContent = S.hero.desc;
    if (heroPks) {
      heroPks.innerHTML = S.hero.perks.map(function (pk) {
        return '<span>' + pk + '</span>';
      }).join('');
    }

    /* About page */
    var abTag  = $('#aboutTag');
    var abH1   = $('#aboutHeading');
    var abLead = $('#aboutLead');
    var abBody = $('#aboutBody');

    if (abTag)  abTag.textContent  = S.about.tag;
    if (abH1)   abH1.innerHTML    = S.about.heading1 + '<br><span class="moss">' + S.about.heading2 + '</span>';
    if (abLead) abLead.textContent = S.about.lead;
    if (abBody) abBody.textContent = S.about.body;

    /* About Video ("Life in motion" section) - Center & Play on Hover */
    var videoContainer = $('#aboutVideoContainer');
    if (videoContainer && S.about && S.about.video) {
      var v = S.about.video;
      videoContainer.innerHTML = '<video id="aboutVid" src="' + v.src + '" poster="' + (v.poster || '') + '" muted loop playsinline preload="auto"></video>'
        + (v.caption ? '<div class="about-video-caption">' + v.caption + '</div>' : '');

      var vid = $('#aboutVid');
      if (vid) {
        // Play immediately when user hovers into the video
        vid.addEventListener('mouseenter', function () {
          vid.play().catch(function () {});
        });

        // Pause when mouse leaves
        vid.addEventListener('mouseleave', function () {
          vid.pause();
        });

        // Click toggles play/pause or unmutes
        vid.addEventListener('click', function () {
          if (vid.paused) {
            vid.play().catch(function () {});
          } else {
            vid.pause();
          }
        });
      }
    }

    /* Standard Dark Band (Screenshot 3 layout) */
    var stdTag  = $('#stdTag');
    var stdHead = $('#stdHead');
    var stdCols = $('#stdCols');

    if (stdTag)  stdTag.textContent = S.about.standard.tag;
    if (stdHead) stdHead.innerHTML   = S.about.standard.headline;

    if (stdCols && S.about.standard.points) {
      var pts = S.about.standard.points;
      // Col 1: Point 03
      // Col 2: Point 01
      // Col 3: Point 02
      var p3 = pts.find(function(p){ return p.num === '03'; }) || pts[2];
      var p1 = pts.find(function(p){ return p.num === '01'; }) || pts[0];
      var p2 = pts.find(function(p){ return p.num === '02'; }) || pts[1];

      var c1El = $('#stdCol1');
      var c2El = $('#stdCol2');
      var c3El = $('#stdCol3');

      if (c1El && p3) {
        c1El.innerHTML = '<div class="num">' + p3.num + '</div>'
          + '<h3>' + p3.title + '</h3>'
          + '<p>' + p3.desc + '</p>';
      }
      if (c2El && p1) {
        c2El.innerHTML = '<div class="num">' + p1.num + '</div>'
          + '<h3>' + p1.title + '</h3>'
          + '<p>' + p1.desc + '</p>';
      }
      if (c3El && p2) {
        c3El.innerHTML = '<div class="num">' + p2.num + '</div>'
          + '<h3>' + p2.title + '</h3>'
          + '<p>' + p2.desc + '</p>';
      }
    }

    /* Dashboard timeline tracker steps */
    var trackerSteps = $('#trackerSteps');
    if (trackerSteps) {
      trackerSteps.innerHTML = S.orderStatuses.map(function (status) {
        return '<div class="tracker-step" data-step="' + status + '">'
          + '<div class="tracker-dot"></div>'
          + '<div class="tracker-label">' + status + '</div>'
          + '</div>';
      }).join('');
    }

    /* Newsletter */
    var nlHead = $('#nlHeadline');
    var nlSub  = $('#nlSubline');
    if (nlHead) nlHead.textContent = S.newsletter.headline;
    if (nlSub)  nlSub.textContent  = S.newsletter.subline;

    /* Footer (Screenshot 2 layout) */
    var ftTag  = $('#footerTag');
    var ftDesc = $('#footerDesc');
    var ftCol1 = $('#footerLinksCol1');
    var ftCol2 = $('#footerLinksCol2');

    if (ftTag)  ftTag.textContent  = S.footer.tagline;
    if (ftDesc) ftDesc.innerHTML    = S.footer.desc;

    if (ftCol1 && S.footer.linksCol1) {
      ftCol1.innerHTML = S.footer.linksCol1.map(function (l) {
        return '<a href="' + l.href + '">' + l.label + '</a>';
      }).join('');
    }
    if (ftCol2 && S.footer.linksCol2) {
      ftCol2.innerHTML = S.footer.linksCol2.map(function (l) {
        return '<a href="' + l.href + '">' + l.label + '</a>';
      }).join('');
    }

    /* Footer copyright */
    var copyEl = $('#copyright');
    if (copyEl) {
      copyEl.textContent = '© ' + new Date().getFullYear() + ' ' + S.name + ', ' + S.address;
    }
  }

  /* ── Initialize ─────────────────────────────────────── */
  populate();
  renderGrid();
  renderDrawer();
  route();

})();
