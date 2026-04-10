const fetch = require('node-fetch');
const https = require('https');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

exports.handler = async (event) => {
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

  const options = {
    method: event.httpMethod,
    agent: httpsAgent,
    headers: {}
  };

  Object.keys(event.headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (!['host', 'connection', 'content-length'].includes(lowerKey)) {
      options.headers[key] = event.headers[key];
    }
  });

  options.headers['Host'] = 'ulendopay.malawihire.com';

  if (event.body) {
    options.body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;
  }

  try {
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
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Bridge Error' }),
    };
  }
};
