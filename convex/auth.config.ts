/**
 * Convex Auth Configuration
 * 
 * This file configures JWT-based authentication for Convex.
 * We use a custom JWT provider that signs tokens on the client side
 * after successful phone + password authentication.
 * 
 * The JWT must contain:
 * - sub (subject): The user ID
 * - aud (audience): "convex"
 * - iss (issuer): Your app's domain
 */

export default {
  providers: [
    {
      // This should match the issuer (iss) claim in your JWTs
      // For development, you can use localhost
      // For production, use your actual domain
      domain: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

      // This must match the audience (aud) claim in your JWTs
      applicationID: "convex",
    },
  ],
};
