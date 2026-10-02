# COZIER — Minimalist Independent Clothing Label

A clean, minimalist e-commerce web application designed for **Cozier** (Cagayan de Oro, Philippines) with complete shopping bag, checkout flow, media gallery (images & video), order tracking dashboard, and full Cloudflare Pages / KV deployment support.

---

## 📁 Project Architecture

```
cozier_files/
├── index.html                  ← Main Single-Page Application
├── wrangler.toml               ← Cloudflare Pages configuration
├── js/
│   ├── config.js               ← All site settings, copy, media, footer links (NO hardcoding)
│   ├── products.js             ← Product catalog (IDs, names, prices, colors, filters)
│   └── app.js                  ← App logic (cart, checkout, tracking dashboard, drawer)
├── functions/
│   └── api/
│       └── orders.js           ← Cloudflare Pages serverless Function (KV storage & validation)
├── images/                     ← Put product images (1.jpg, 2.jpg...) and about photos here
└── video/
    └── brand.mp4               ← Brand story video for the About page
```

---

## 🎨 Consistent Typography & Visual System

- **Serif Display & Headings:** `Newsreader` (Weights 400 & 500)
- **Sans-Serif Body & UI:** `Manrope` (Weights 400, 500, 600, 700)
- **Palette:**
  - Background: `#e8ebee` (Cool paper grey)
  - Ink: `#172026` (Deep charcoal)
  - Mute: `#5f6b78` (Subtle grey)
  - Moss: `#56633f` (Olive green accent)
  - Navy: `#243040` (Dark standard band)
  - Sand: `#d9b88f` (Garment background)

---

## ⚙️ How to Customize (Zero Hardcoding)

1. **Change Products:** Edit [`js/products.js`](file:///C:/Users/Sharmaine/Downloads/cozier_files/js/products.js)
   - Add, edit, or remove items.
   - Put photos in `images/<id>.jpg`. If an image is missing, a minimal SVG shirt illustration renders automatically.
2. **Change Copy, Media & Rules:** Edit [`js/config.js`](file:///C:/Users/Sharmaine/Downloads/cozier_files/js/config.js)
   - Brand name, contact email, location, hours
   - Free delivery threshold (`1000` ₱) and standard shipping fee (`60` ₱)
   - Promo codes (e.g. `COZY10` for 10% discount)
   - About page videos & photos
   - "Our Standard" points
   - Footer links

---

## ☁️ Deploy to Cloudflare Pages

### Option A: Via GitHub (Recommended)
1. Push this folder to a GitHub repository.
2. In the **Cloudflare Dashboard**, navigate to **Workers & Pages → Create Application → Pages → Connect to Git**.
3. Select your repository.
4. Settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (root)
5. Click **Save and Deploy**.
6. Create a KV namespace in **Workers & Pages → KV**, name it `COZIER`.
7. Go to your Pages project **Settings → Functions → KV namespace bindings**:
   - Variable name: `COZIER`
   - KV namespace: select `COZIER`
8. Redeploy to activate live cloud order storage.

### Option B: Via Wrangler CLI
```bash
npx wrangler pages deploy . --project-name cozier
```
