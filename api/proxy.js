// Vercel serverless proxy for /api/* requests
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
    return res.status(200).end();
  }

  // Build target URL – req.url contains the full original path
  const path = req.url;
  const targetUrl = 'https://198.251.88.32' + path;

  console.log('Proxying:', req.method, targetUrl);

  try {
    // Read request body
    const body = req.body 
      ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) 
      : undefined;

    // Make upstream request and wait for the response
    const upstreamResponse = await new Promise((resolve, reject) => {
      const options = {
        method: req.method,
        agent,
        headers: {
          'Host': 'ulendopay.malawihire.com',
          'Content-Type': req.headers['content-type'] || 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Vercel Proxy',
        }
      };

      if (req.headers['authorization']) {
        options.headers['Authorization'] = req.headers['authorization'];
      }

      const proxyReq = https.request(targetUrl, options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => data += chunk);
        proxyRes.on('end', () => {
          resolve({
            status: proxyRes.statusCode,
            headers: proxyRes.headers,
            body: data,
          });
        });
      });

      proxyReq.on('error', (err) => {
        console.error('Proxy request error:', err);
        reject(err);
      });

      if (body) {
        proxyReq.write(body);
      }
      proxyReq.end();
    });

    // Return the upstream response to the client
    res.status(upstreamResponse.status);

    // Copy headers (exclude transfer-encoding and connection)
    Object.keys(upstreamResponse.headers).forEach(key => {
      if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, upstreamResponse.headers[key]);
      }
    });

    // Log truncated response for debugging
    try {
      const parsed = JSON.parse(upstreamResponse.body);
      console.log('Backend response:', upstreamResponse.status, JSON.stringify(parsed).substring(0, 300));
    } catch (e) {
      console.log('Backend response (non-JSON):', upstreamResponse.status, upstreamResponse.body.substring(0, 300));
    }

    return res.send(upstreamResponse.body);

  } catch (error) {
    console.error('Proxy error:', error.message, error.stack);
    return res.status(502).json({
      error: 'Proxy Error',
      message: error.message,
      code: error.code,
    });
  }
};
