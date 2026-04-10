const fetch = require('node-fetch');

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

  // Get the path after /api/
  const path = event.path.replace(/^\/\.netlify\/functions\/api-proxy\/?/, '').replace(/^\/api\/?/, '');
  
  // Target backend URL
  const targetUrl = `https://198.251.88.32/api/${path}`;
  
  // Prepare headers
  const headers = {
    ...event.headers,
    'Host': 'ulendopay.malawihire.com',
  };
  
  // Remove problematic headers
  delete headers['content-length'];
  delete headers['connection'];
  
  try {
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: headers,
      body: event.body || undefined,
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
