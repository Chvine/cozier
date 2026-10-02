/**
 * ─────────────────────────────────────────────
 *  COZIER — Product Catalog
 *  Add, edit, or remove products here.
 *  Images: place /images/{id}.jpg for each product.
 *  If an image is missing the site renders a drawn SVG fallback automatically.
 * ─────────────────────────────────────────────
 *
 *  Fields:
 *    id      {number}  Unique product identifier (must match PRICES in functions/api/orders.js)
 *    name    {string}  Product display name
 *    color   {string}  Colourway label shown to the customer
 *    hex     {string}  CSS hex used in the fallback SVG illustration
 *    tagline {string}  Short one-line descriptor shown in the product dialog
 *    price   {number}  Price in Philippine Peso (₱)
 *    mark    {string}  Text printed on the SVG tee illustration
 *    markHex {string}  CSS hex for the SVG mark text
 *    filter  {string}  Filter chip key — 'dark' or 'light'
 */
window.PRODUCTS = [
  {
    id:      1,
    name:    'Essential Tee',
    color:   'Olive',
    hex:     '#6f7a5a',
    tagline: 'A familiar shape, made softer.',
    price:   349,
    mark:    'C',
    markHex: '#e9e4d6',
    filter:  'dark',
  },
  {
    id:      2,
    name:    'Signature Tee',
    color:   'Midnight Navy',
    hex:     '#262b45',
    tagline: 'Quiet confidence, no extra noise.',
    price:   399,
    mark:    'cozier',
    markHex: '#e9e4d6',
    filter:  'dark',
  },
  {
    id:      3,
    name:    'Comfort Backprint Tee',
    color:   'Washed Black',
    hex:     '#141414',
    tagline: 'Find comfort in the simple things.',
    price:   449,
    mark:    'COZIER',
    markHex: '#e9e4d6',
    filter:  'dark',
  },
  {
    id:      4,
    name:    'Everyday Logo Tee',
    color:   'Natural Cream',
    hex:     '#f1ece0',
    tagline: 'The one you reach for again.',
    price:   329,
    mark:    'COZIER',
    markHex: '#262b45',
    filter:  'light',
  },
  {
    id:      5,
    name:    'Studio Leaf Tee',
    color:   'Off White',
    hex:     '#f5f2ea',
    tagline: 'Grow slow. Live soft.',
    price:   379,
    mark:    'COZIER',
    markHex: '#55603f',
    filter:  'light',
  },
];
