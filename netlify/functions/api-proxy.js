// Netlify Function to proxy all API requests to the backend server
export default async (request, context) => {
  // Get the path after /api/
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  
  // Target backend URL
  const targetUrl = `https://198.251.88.32/api${path}${url.search}`;
  
  // Prepare headers
  const headers = new Headers(request.headers);
  headers.set('Host', 'ulendopay.malawihire.com');
  
  // Handle request body for non-GET requests
  let body = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }
  
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
    });
    
    // Get response body
    const responseBody = await response.text();
    
    // Return proxied response with CORS headers
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      message: 'Proxy error', 
      error: error.message 
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Handle OPTIONS preflight requests
export const config = {
  path: '/api/*',
  method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};
