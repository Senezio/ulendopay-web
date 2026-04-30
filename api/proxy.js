const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false,
  servername: 'ulendopay.malawihire.com'
});

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Build target URL
  const path = req.url.replace(/^\/api/, '/api'); // ensure /api prefix
  const targetUrl = `https://198.251.88.32${path}`;

  const options = {
    method: req.method,
    agent,
    headers: {
      'Host': 'ulendopay.malawihire.com',
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Accept': 'application/json',
    }
  };

  if (req.headers['authorization']) {
    options.headers['Authorization'] = req.headers['authorization'];
  }

  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    
    // Copy headers
    Object.keys(proxyRes.headers).forEach(key => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });

    let body = '';
    proxyRes.on('data', chunk => body += chunk);
    proxyRes.on('end', () => {
      res.send(body);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Proxy Error', message: err.message });
  });

  if (req.body) {
    proxyReq.write(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  }
  
  proxyReq.end();
};
