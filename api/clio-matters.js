export default async function handler(req, res) {
  const { CLIO_CLIENT_ID, CLIO_CLIENT_SECRET } = process.env;
  if (!CLIO_CLIENT_ID || !CLIO_CLIENT_SECRET) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Clio credentials not configured' }));
    return;
  }

  try {
    const tokenRes = await fetch('https://app.clio.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CLIO_CLIENT_ID,
        client_secret: CLIO_CLIENT_SECRET,
        scope: 'read:matters',
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to obtain access token', details: text }));
      return;
    }

    const token = await tokenRes.json();
    const mattersRes = await fetch('https://app.clio.com/api/v4/matters?states=active', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!mattersRes.ok) {
      const text = await mattersRes.text();
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to fetch matters', details: text }));
      return;
    }

    const matters = await mattersRes.json();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(matters));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unexpected error', details: err.message }));
  }
}
