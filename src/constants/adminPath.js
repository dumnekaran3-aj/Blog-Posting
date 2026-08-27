// Single source of truth for the admin panel's URL path — read from env so
// it can be changed per-deployment without touching code, and isn't a
// hardcoded guessable string like "/admin" anywhere in the app.
//
// Note: since this is a client-side SPA, this value ends up inside the
// built JS bundle and CAN be found by someone who inspects it directly —
// this is a deterrent against casual scanning/bots, not a hard security
// boundary. Real protection is the 2FA + httpOnly cookie + rate limiting
// on the backend.
export const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || "admin";