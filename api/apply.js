const LOOPS_URL = 'https://app.loops.so/api/v1/contacts/update';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, platform, handle, audienceSize, whyFit } = req.body ?? {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const payload = {
    email: String(email),
    subscribed: true,
    userGroup: 'partner-applicant',
    source: 'partners.html',
    partnerPlatform: String(platform ?? ''),
    partnerHandle: String(handle ?? ''),
    partnerAudienceSize: String(audienceSize ?? ''),
    partnerApplication: String(whyFit ?? ''),
  };

  let loopsRes;
  try {
    loopsRes = await fetch(LOOPS_URL, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.LOOPS_AFFILIATES_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Loops network error:', err.message);
    return res.status(500).json({ error: 'Failed to reach submission service' });
  }

  if (!loopsRes.ok) {
    const body = await loopsRes.text().catch(() => '');
    console.error(`Loops ${loopsRes.status}:`, body);
    return res.status(500).json({ error: 'Submission service error' });
  }

  return res.status(200).json({ ok: true });
};
