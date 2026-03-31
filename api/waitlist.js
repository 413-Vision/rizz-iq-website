// api/waitlist.js
// Vercel serverless function — handles waitlist signups from getrizziq.com
//
// What it does:
//   1. Validates the email
//   2. Adds contact to Loops.so with tag "waitlist"
//   3. Triggers Loops transactional confirmation email
//   4. Returns success/error JSON to the landing page
//
// Environment variables required (set in Vercel dashboard):
//   LOOPS_API_KEY            — from Loops.so Settings > API Keys
//   LOOPS_TRANSACTIONAL_ID   — from Loops.so Transactional > your confirmation email
//
// Deploy: Place this file at /api/waitlist.js in your Vercel project root.
// Vercel auto-exposes it at https://getrizziq.com/api/waitlist

export default async function handler(req, res) {
  // ── CORS headers — allow requests from getrizziq.com and local dev ──
  res.setHeader('Access-Control-Allow-Origin', 'https://getrizziq.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Parse + validate email ──
  const { email, source = 'unknown' } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // ── Step 1: Create/update contact in Loops.so ──
  try {
    const loopsContact = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email: cleanEmail,
        source: 'waitlist',
        userGroup: 'waitlist',
        // Custom fields — visible in Loops contact record
        signupSource: source,         // 'hero' | 'final-cta' | 'nav'
        signupDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      }),
    });

    // Loops returns 200 for new contacts, 409 if already exists — both are fine
    if (!loopsContact.ok && loopsContact.status !== 409) {
      const loopsError = await loopsContact.text();
      console.error('Loops contact creation failed:', loopsError);
      // Don't block the user — log and continue
    }
  } catch (err) {
    console.error('Loops contact fetch error:', err);
    // Non-blocking — continue to send confirmation
  }

  // ── Step 2: Send transactional confirmation email via Loops ──
  try {
    const loopsEmail = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        transactionalId: process.env.LOOPS_TRANSACTIONAL_ID,
        email: cleanEmail,
      }),
    });

    if (!loopsEmail.ok) {
      const emailError = await loopsEmail.text();
      console.error('Loops transactional email failed:', emailError);
      // Non-blocking — contact was still created
    }
  } catch (err) {
    console.error('Loops transactional fetch error:', err);
  }

  // ── Success ──
  return res.status(200).json({
    success: true,
    message: "You're on the list.",
  });
}
