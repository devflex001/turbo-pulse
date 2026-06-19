import { betterAuth } from "better-auth";
import { convexAdapter } from "@convex-dev/better-auth";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const auth = betterAuth({
  database: convexAdapter(convex),
  plugins: [],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_CONVEX_URL || "",
  ],
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-here-min-32-chars-long",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  appName: "BetFlow",
});

export type Session = typeof auth.$Infer.Session;
