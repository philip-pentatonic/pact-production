/**
 * Simple test worker to debug the issue
 */

export default {
  async fetch(request, env, ctx) {
    return new Response(JSON.stringify({
      message: "Hello from simple worker",
      url: request.url,
      method: request.method
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};