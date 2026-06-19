/**
 * Convex JWT auth configuration.
 *
 * Tells Convex to trust JWTs issued by our own Next.js app.
 * Convex will fetch {domain}/.well-known/openid-configuration to discover
 * the JWKS endpoint and validate incoming tokens.
 *
 * The `applicationID` must match the `aud` claim we put in signed JWTs.
 */
export default {
  providers: [
    {
      domain: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      applicationID: "convex",
    },
  ],
};
