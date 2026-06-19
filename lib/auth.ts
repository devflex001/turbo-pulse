import { betterAuth } from "better-auth";
import { convexAdapter } from "@convex-dev/better-auth";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const auth = betterAuth({
  database: convexAdapter(convex),
  emailAndPassword: {
    enabled: true,
    // Use phone number as the email field
    autoSignIn: true,
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_CONVEX_URL || "",
  ],
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-here-min-32-chars-long",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

export type Session = typeof auth.$Infer.Session;
