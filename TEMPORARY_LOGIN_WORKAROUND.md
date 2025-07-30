# Temporary Login Workaround

Due to an issue with the `/api/auth/me` endpoint and JWT verification in Cloudflare Workers, the dashboard may not redirect after login even though authentication is successful.

## Workaround Steps:

1. Go to https://pact-dashboard.pages.dev
2. Login with:
   - Email: `admin@pentatonic.com`
   - Password: `admin123`
3. If you remain on the login page after successful login:
   - Open browser developer console (F12)
   - Check that a token was stored: `localStorage.getItem('token')`
   - Manually navigate to: https://pact-dashboard.pages.dev/#/dashboard
   - Or refresh the page

## Known Issue:

The JWT token is being created successfully during login, but the `/api/auth/me` endpoint is having issues verifying the token. This appears to be related to Cloudflare Workers' implementation of the JWT library.

## What's Working:
- Login endpoint (creates valid JWT tokens)
- All other API endpoints when accessed with the token
- Frontend dashboard once you get past the login

## Root Cause:
The issue appears to be with how Cloudflare Workers handles the JWT secret during verification. The same secret that creates the token is failing to verify it in subsequent requests.