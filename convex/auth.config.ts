/**
 * Convex Auth Configuration
 * Configures JWT-based authentication for Convex
 * 
 * This works with the custom JWT tokens created in lib/auth/jwt.ts
 * The domain must match the issuer (JWT_ISSUER) in lib/auth/jwt.ts
 */

// Get the domain from environment variables
// AUTH_DOMAIN should be set to your app's URL (e.g., http://localhost:3000 or https://yourdomain.com)
const domain = process.env.AUTH_DOMAIN;

if (!domain) {
  throw new Error(
    "AUTH_DOMAIN environment variable is required. " +
    "Set it in your Convex dashboard to match your app URL (e.g., http://localhost:3000 or https://yourdomain.com)"
  );
}

export default {
  providers: [
    {
      // Must match the issuer in lib/auth/jwt.ts (NEXT_PUBLIC_APP_URL)
      domain: domain,
      applicationID: "convex",
    },
  ],
};
