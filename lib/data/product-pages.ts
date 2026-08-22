/**
 * The /product pages, listed once.
 *
 * Deliberately in its own module rather than exported from MarketingNav.tsx.
 * That file is `'use client'`, and every export of a client module becomes a
 * client *reference* when a server component imports it - so `PRODUCT_PAGES`
 * arrived at the server-rendered /product index as an opaque proxy and
 * `.map` blew up at request time. Plain data shared across the boundary has
 * to live outside the client module.
 *
 * The failure hid for a while because /product is a dynamic route, so the
 * build never executes it, and the pages were owner-gated until now.
 */
export const PRODUCT_PAGES = [
  {
    href: '/product/improve-your-cv',
    label: 'Improve your CV',
    blurb: 'Find the detail you left off the page'
  },
  {
    href: '/product/learn-to-interview',
    label: 'Learn to interview',
    blurb: 'Know which part of your answer is missing'
  },
  {
    href: '/product/practice-interview-calls',
    label: 'Practice interview calls',
    blurb: 'Hear yourself before an employer does'
  },
  {
    href: '/product/track-your-growth',
    label: 'Track your growth',
    blurb: 'Proof you are getting better at this'
  }
];
