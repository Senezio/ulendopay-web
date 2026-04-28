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

    const headers = { ...req.headers };
    delete headers['host'];
    delete headers['connection'];
    headers['host'] = 'ulendopay.malawihire.com';

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
        ...headers,
        'content-length': bodyData ? Buffer.byteLength(bodyData) : 0,
      },
      rejectUnauthorized: false,
    };

    await new Promise((resolve, reject) => {
      const proxyReq = https.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode);
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });
        proxyRes.pipe(res).on('finish', resolve);
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
