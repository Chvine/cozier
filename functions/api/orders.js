/**
 * Cloudflare Pages Function — /functions/api/orders.js
 * Bind a KV namespace named COZIER in the Cloudflare Pages dashboard.
 *
 * ⚠️  KEEP IN SYNC WITH:
 *   • js/products.js  → product id + price must match PRICES below
 *   • js/config.js    → SIZES, freeShippingOver, shippingFee, promoCodes must match
 *
 * Prices are always recalculated server-side — never trusted from the browser.
 */

// Mirror of js/products.js prices  { productId: priceInPeso }
const PRICES = { 1: 349, 2: 399, 3: 449, 4: 329, 5: 379 };

// Mirror of js/config.js
const SIZES  = ['S', 'M', 'L', 'XL'];
const SHIP   = 60;
const FREE   = 1000;
const PROMOS = { COZY10: 0.1 };

const j   = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
});
const dig = (s) => String(s || '').replace(/\D/g, '');

export async function onRequest({ request, env }) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type'
      }
    });
  }

  if (!env.COZIER) return j({ error: 'KV namespace COZIER is not bound' }, 501);

  const url = new URL(request.url);

  /* ── GET: look up an order ─────────────────────────── */
  if (request.method === 'GET') {
    const no  = url.searchParams.get('no') || '';
    const raw = await env.COZIER.get('order:' + no);
    const o   = raw && JSON.parse(raw);
    if (!o || dig(o.phone).slice(-4) !== dig(url.searchParams.get('p')).slice(-4))
      return j({ error: 'Order not found' }, 404);
    return j({
      no:      o.no,
      status:  o.status,
      items:   o.items,
      total:   o.total,
      pay:     o.pay,
      name:    o.name,
      addr:    o.addr,
      phone:   o.phone,
      created: o.created
    });
  }

  if (request.method !== 'POST') return j({ error: 'Method not allowed' }, 405);

  /* ── POST: create order / message / subscribe ──────── */
  let b;
  try { b = await request.json(); } catch { return j({ error: 'Invalid JSON' }, 400); }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* message or newsletter */
  if (b.kind === 'message' || b.kind === 'subscribe') {
    if (!/^\S+@\S+\.\S+$/.test(b.email || '')) return j({ error: 'Invalid email' }, 400);
    await env.COZIER.put(b.kind + ':' + id, JSON.stringify({
      name:    String(b.name    || '').slice(0, 80),
      email:   b.email,
      message: String(b.message || '').slice(0, 2000),
      created: new Date().toISOString()
    }));
    return j({ ok: true });
  }

  /* order — prices always recalculated server-side */
  const items = Array.isArray(b.items) ? b.items.slice(0, 20) : [];
  if (!items.length || items.some(i =>
    !PRICES[i.id] || !SIZES.includes(i.s) || !(i.q >= 1 && i.q <= 10)
  )) return j({ error: 'Invalid items' }, 400);

  if (!b.name || !b.addr || dig(b.phone).length < 7 || !/^\S+@\S+\.\S+$/.test(b.email || ''))
    return j({ error: 'Missing required fields' }, 400);

  const sub   = items.reduce((s, i) => s + PRICES[i.id] * i.q, 0);
  const disc  = Math.round(sub * (PROMOS[String(b.promo || '').toUpperCase()] || 0));
  const total = sub - disc + (sub >= FREE ? 0 : SHIP);
  const no    = 'CZ-' + dig(Date.now()).slice(-6);

  const order = {
    no,
    status:  'Received',
    items,
    total,
    name:    String(b.name).slice(0, 80),
    phone:   String(b.phone).slice(0, 20),
    email:   String(b.email).slice(0, 120),
    addr:    String(b.addr).slice(0, 200),
    pay:     b.pay === 'GCash' ? 'GCash' : 'Cash on delivery',
    promo:   PROMOS[String(b.promo||'').toUpperCase()] ? String(b.promo).toUpperCase() : '',
    created: new Date().toISOString()
  };

  await env.COZIER.put('order:' + no, JSON.stringify(order));
  return j({ no, total });
}
