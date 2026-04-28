const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

module.exports = async (req, res) => {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const path = req.url.replace(/^\/api\/v1/, '');
  const targetUrl = `https://198.251.88.32/api/v1${path}`;

  const options = {
    method: req.method,
    agent: httpsAgent,
    headers: { ...req.headers, 'Host': 'ulendopay.malawihire.com' },
  };

  delete options.headers['host'];
  delete options.headers['connection'];
  delete options.headers['content-length'];

  const fetch = (await import('node-fetch')).default;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
    });
    if (body) options.body = body;
  }

  try {
    const response = await fetch(targetUrl, options);
    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.status(response.status);
    const text = await response.text();
    res.send(text);
  } catch (error) {
    res.status(502).json({ message: 'Bridge Error', error: error.message });
  }
};
