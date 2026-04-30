const fetch = require('node-fetch');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false, servername: 'ulendopay.malawihire.com' });

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

  const path = event.path.replace(/^\/\.netlify\/functions\/api-proxy/, '');

  const queryString = event.queryStringParameters
    ? '?' + new URLSearchParams(event.queryStringParameters).toString()
    : '';

  const targetUrl = `https://198.251.88.32${path}${queryString}`;

  const headers = {};
  Object.keys(event.headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (!['host', 'connection', 'content-length', 'accept-encoding'].includes(lowerKey)) {
      headers[key] = event.headers[key];
    }
  });
  headers['Host'] = 'ulendopay.malawihire.com';
  headers['accept-encoding'] = 'identity';

  const options = { method: event.httpMethod, agent: httpsAgent, headers };

  if (event.body) {
    options.body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;
  }

  try {
    const response = await fetch(targetUrl, options);
    const contentType = response.headers.get('Content-Type') || 'application/json';

    const isBinary = /^(image|application\/pdf|application\/octet-stream|application\/vnd\.openxmlformats|application\/vnd\.ms-excel)/.test(contentType);

    let body;
    let isBase64Encoded = false;

    if (isBinary) {
      const buffer = await response.arrayBuffer();
      body = Buffer.from(buffer).toString('base64');
      isBase64Encoded = true;
    } else {
      const buffer = await response.arrayBuffer();
      body = Buffer.from(buffer).toString('utf-8');
    }

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': response.headers.get('Content-Disposition') || '',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
      },
      isBase64Encoded,
      body,
    };
  } catch (error) {
    console.error('API Proxy Error:', error);
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Bridge Error',
        error: error.message,
        code: error.code,
        stack: error.stack,
        target: targetUrl
      }),
    };
  }
};
