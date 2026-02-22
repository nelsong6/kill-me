import { auth } from 'express-oauth2-jwt-bearer';

// Validates the Bearer JWT on protected routes.
// On success: populates req.auth.payload (sub, email, etc.)
// On failure: returns 401 Unauthorized automatically
export const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256',
});
