#!/usr/bin/env node

const jwt = require('@tsndr/cloudflare-worker-jwt');

async function testJWT() {
  const secret = 'KcG/bLN2sH/oqpUn4XL+abTsHJkfhVxNOlohHZb4Wfw=';
  
  // Create a test token
  const token = await jwt.sign({
    sub: 4,
    username: 'admin-pentatonic',
    email: 'admin@pentatonic.com',
    role: 'super_admin',
    member_id: null,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  }, secret);
  
  console.log('Generated token:', token);
  
  // Verify the token
  const isValid = await jwt.verify(token, secret);
  console.log('Token is valid:', isValid);
  
  // Decode the token
  const payload = jwt.decode(token);
  console.log('Decoded payload:', payload);
}

testJWT().catch(console.error);