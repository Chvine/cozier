// Cloudflare Pages Function. Bind a KV namespace to this project with the variable name COZIER.
const PRICES = { 1: 349, 2: 399, 3: 449, 4: 329, 5: 379 };
const SIZES = ["S", "M", "L", "XL"];
const SHIP = 60, FREE_OVER = 1000, PROMOS = { COZY10: 0.1 };
const j = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });
const digits = (s) => String(s || "").replace(/\D/g, "");

export async function onRequest({ request, env }) {
  if (!env.COZIER) return j({ error: "KV namespace COZIER is not bound" }, 501);
  const url = new URL(request.url);

  if (request.method === "GET") {
    const raw = await env.COZIER.get("order:" + (url.searchParams.get("no") || ""));
    const o = raw && JSON.parse(raw);
    if (!o || digits(o.phone).slice(-4) !== digits(url.searchParams.get("p")).slice(-4)) return j({ error: "Order not found" }, 404);
    return j({ no: o.no, status: o.status, items: o.items, total: o.total, created: o.created });
  }
  if (request.method !== "POST") return j({ error: "Method not allowed" }, 405);

  let b;
  try { b = await request.json(); } catch { return j({ error: "Invalid request" }, 400); }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  if (b.kind === "message" || b.kind === "subscribe") {
    if (!/^\S+@\S+\.\S+$/.test(b.email || "")) return j({ error: "Invalid email" }, 400);
    await env.COZIER.put(b.kind + ":" + id, JSON.stringify({ name: String(b.name || "").slice(0, 80), email: b.email, message: String(b.message || "").slice(0, 2000), created: new Date().toISOString() }));
    return j({ ok: true });
  }

  // Orders: prices are recomputed here, never trusted from the browser.
  const items = Array.isArray(b.items) ? b.items.slice(0, 20) : [];
  if (!items.length || items.some((i) => !PRICES[i.id] || !SIZES.includes(i.s) || !(i.q >= 1 && i.q <= 10))) return j({ error: "Invalid items" }, 400);
  if (!b.name || !b.addr || digits(b.phone).length < 7 || !/^\S+@\S+\.\S+$/.test(b.email || "")) return j({ error: "Missing details" }, 400);
  const sub = items.reduce((s, i) => s + PRICES[i.id] * i.q, 0);
  const disc = Math.round(sub * (PROMOS[String(b.promo || "").toUpperCase()] || 0));
  const total = sub - disc + (sub >= FREE_OVER ? 0 : SHIP);
  const no = "CZ-" + digits(Date.now()).slice(-6);
  const order = { no, status: "Received", items, total, name: b.name, phone: b.phone, email: b.email, addr: b.addr, pay: b.pay === "GCash" ? "GCash" : "Cash on delivery", created: new Date().toISOString() };
  await env.COZIER.put("order:" + no, JSON.stringify(order));
  return j({ no, total });
}
