const fetch = require('node-fetch');
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false
});

exports.handler = async (event, context) => {
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

  const headers = {
    ...event.headers,
    'Host': 'ulendopay.malawihire.com',
  };

  delete headers['content-length'];
  delete headers['connection'];
  delete headers['host']; // Let the agent handle the host or keep it as your target

  try {
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: headers,
      body: event.body || undefined,
      agent: agent
    });

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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Proxy error',
        error: error.message
      }),
    };
  }
};
