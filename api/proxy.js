const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const path = req.url.replace(/^\/api\/v1/, '');
    const targetPath = `/api/v1${path}`;

    let bodyData = req.body;
    if (bodyData && typeof bodyData !== 'string') {
      bodyData = JSON.stringify(bodyData);
    }

    const options = {
      hostname: '198.251.88.32',
      port: 443,
      path: targetPath,
      method: req.method,
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        'host': 'ulendopay.malawihire.com',
        'authorization': req.headers['authorization'] || '',
        'x-idempotency-key': req.headers['x-idempotency-key'] || '',
        'content-length': bodyData ? Buffer.byteLength(bodyData) : 0,
        'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        'origin': 'https://ulendopay.vercel.app',
        'referer': 'https://ulendopay.vercel.app/',
      },
      rejectUnauthorized: false,
    };

    await new Promise((resolve, reject) => {
      const proxyReq = https.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode);
        res.setHeader('Content-Type', 'application/json');
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => { res.send(data); resolve(); });
      });

      proxyReq.on('error', reject);
      if (bodyData) proxyReq.write(bodyData);
      proxyReq.end();
    });

  } catch (err) {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Proxy Error', error: err.message });
    }
  }
};
