/**
 * ─────────────────────────────────────────────────────────────────
 *  COZIER — Site Configuration
 *  Edit this file to modify any copy, media, or business rules.
 *  Zero hard-coding in the application logic.
 * ─────────────────────────────────────────────────────────────────
 */
window.SITE = {

  /* Brand details */
  name:        'COZIER',
  tagline:     'Soft clothes for slow days',
  description: 'Comfort-first tees from Cagayan de Oro, every piece under ₱500.',
  location:    'CAGAYAN DE ORO / PH',
  email:       'hello@cozier.ph',
  address:     'Cagayan de Oro, Philippines',
  hours:       'Mon–Fri, 10am–5pm PHT',

  /* E-Commerce parameters */
  freeShippingOver: 1000,   // ₱ — Orders at or above this threshold ship for free
  shippingFee:      60,     // ₱ — Standard flat shipping rate
  promoCodes: {
    COZY10: 0.10,          // 10% off coupon
  },
  sizes: ['S', 'M', 'L', 'XL'],
  paymentMethods: ['Cash on delivery', 'GCash'],
  orderStatuses: ['Received', 'Processing', 'Shipped', 'Delivered'],
  apiEndpoint: '/api/orders',

  /* Hero Section (Shop) */
  hero: {
    tag: 'THE COLLECTION / 05 PIECES',
    heading1: 'Everyday,',
    heading2: 'considered.',
    desc: 'Comfort-first essentials with enough point of view to make them yours.',
    perks: [
      'Every piece under ₱500',
      'Free delivery over ₱1,000',
      'Code COZY10 takes 10% off'
    ]
  },

  /* About Page */
  about: {
    tag: 'ABOUT / THE BEGINNING',
    heading1: 'Find your',
    heading2: 'calm.',
    lead: 'Cozier started with a simple idea: the clothes you live in should feel as good as the life you’re building.',
    body: 'We are a small, independent label from Cagayan de Oro making unfussy pieces for warm days, long commutes, quick coffee, and all the in-between. Our references are familiar: the generous hospitality of home, the pace of the city, the quiet confidence of people who know what they like.',
    
    /* Video in About page ("Life in motion" section) */
    video: {
      src: 'video/brand.mp4',
      caption: 'A day in Cozier - Cagayan de Oro'
    },


    /* Dark Standard Section (Matches reference screenshot 3 exactly) */
    standard: {
      tag: 'OUR STANDARD',
      headline: 'No noise.<br>Just good clothes.',
      points: [
        {
          num: '01',
          title: 'Soft by design',
          desc: 'The first thing you notice is how easy it feels.'
        },
        {
          num: '02',
          title: 'Made for repeat',
          desc: 'Built to become part of your regular rotation.'
        },
        {
          num: '03',
          title: 'Priced with care',
          desc: 'Thoughtful design stays accessible: every piece under ₱500.'
        }
      ]
    }
  },

  /* Newsletter section */
  newsletter: {
    headline: 'Notes from Cozier',
    subline: 'New pieces and small stories. No inbox clutter.'
  },

  /* Footer Section (Matches reference screenshot 2) */
  footer: {
    tagline: 'A SMALL LABEL FROM CAGAYAN DE ORO',
    desc: 'Clothes for the parts of the day that matter.<br>Designed with care, priced to be lived in.',
    linksCol1: [
      { label: 'Shop all',    href: '#shop' },
      { label: 'Track order', href: '#track' },
      { label: 'Contact',     href: '#contact' }
    ],
    linksCol2: [
      { label: 'Our story',   href: '#about' },
      { label: 'Email us',    href: 'mailto:hello@cozier.ph' }
    ]
  }
};
