const fetch = require('node-fetch');
const https = require('https');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

exports.handler = async (event, context) => {
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
      },
      body: '',
    };
  }

  const path = event.path.replace(/^\/\.netlify\/functions\/api-proxy\/?/, '').replace(/^\/api\/?/, '');
  const targetUrl = `https://198.251.88.32/api/${path}`;
  
  // Prepare request options
  const options = {
    method: event.httpMethod,
    agent: httpsAgent,
  };

  // Forward headers (except host and connection)
  options.headers = {};
  Object.keys(event.headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (!['host', 'connection', 'content-length'].includes(lowerKey)) {
      options.headers[key] = event.headers[key];
    }
  });
  
  // Override Host header
  options.headers['Host'] = 'ulendopay.malawihire.com';
  
  // Handle body
  if (event.body) {
    options.body = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64')
      : event.body;
  }
  
  try {
    console.log('Proxying to:', targetUrl);
    console.log('Method:', event.httpMethod);
    console.log('Headers:', JSON.stringify(options.headers));
    
    const response = await fetch(targetUrl, options);
    const responseBody = await response.text();
    
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
      },
      body: responseBody,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Proxy error', 
        error: error.message,
        target: targetUrl
      }),
    };
  }
};
