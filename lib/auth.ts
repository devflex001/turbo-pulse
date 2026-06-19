import { betterAuth } from "better-auth";
import { env } from "@/lib/env";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  trustedOrigins: [
    env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
  secret: env.BETTER_AUTH_SECRET || "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",
  appName: "BetFlow",
});

export type Session = typeof auth.$Infer.Session;
