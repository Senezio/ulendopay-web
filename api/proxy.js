const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const path = req.url.replace(/^\/api\/v1/, '');
  const targetPath = `/api/v1${path}`;

  const headers = { ...req.headers };
  delete headers['host'];
  delete headers['connection'];
  delete headers['content-length'];
  headers['Host'] = 'ulendopay.malawihire.com';

  let body = '';
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
    });
    if (body) headers['content-length'] = Buffer.byteLength(body).toString();
  }

  const options = {
    hostname: '198.251.88.32',
    path: targetPath,
    method: req.method,
    headers,
    rejectUnauthorized: false,
  };

  return new Promise((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || 'application/json';
      res.setHeader('Content-Type', contentType);
      res.status(proxyRes.statusCode);

      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        res.send(data);
        resolve();
      });
    });

    proxyReq.on('error', (error) => {
      res.status(502).json({ message: 'Bridge Error', error: error.message });
      resolve();
    });

    if (body) proxyReq.write(body);
    proxyReq.end();
  });
};
