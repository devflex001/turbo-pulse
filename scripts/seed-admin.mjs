#!/usr/bin/env node

/**
 * Admin Seeding Script
 *
 * Creates the admin user in the custom users table and registers them
 * as an admin in the Convex `admins` table.
 *
 * Usage: pnpm seed:admin
 *
 * Requires:
 *   - NEXT_PUBLIC_CONVEX_URL in environment
 *   - ADMIN_EMAIL (the phone number, e.g. 254712345678)
 *   - ADMIN_PASSWORD
 *   - NEXT_PUBLIC_APP_URL (for the auth endpoint)
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const adminPhone = process.env.ADMIN_EMAIL || "254712345678";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

console.log("🌱 BetFlow Admin Seeding");
console.log("========================");
console.log(`App URL:   ${appUrl}`);
console.log(`Phone:     ${adminPhone}`);
console.log("");

async function seed() {
  // Step 1: Register the admin user
  console.log("📝 Registering admin user...");
  const registerRes = await fetch(`${appUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: adminPhone, password: adminPassword }),
  });

  if (!registerRes.ok) {
    const err = await registerRes.json();
    if (registerRes.status === 409) {
      console.log("ℹ️  User already registered — skipping registration.");
    } else {
      console.error("❌ Registration failed:", err.message);
      process.exit(1);
    }
  } else {
    console.log("✅ Admin user registered successfully.");
  }

  // Step 2: Login to get the session token
  console.log("🔑 Logging in to get session...");
  const loginRes = await fetch(`${appUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: adminPhone, password: adminPassword }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.json();
    console.error("❌ Login failed:", err.message);
    process.exit(1);
  }

  const loginData = await loginRes.json();
  console.log("✅ Login successful.");
  console.log("");
  console.log("✅ Admin credentials are ready to use:");
  console.log(`   Phone:    ${adminPhone}`);
  console.log(`   Password: ${adminPassword}`);
  console.log("");
  console.log("🎉 Admin seeding complete!");
  console.log(
    "   The admin phone is used to identify the admin — it matches ADMIN_EMAIL in .env.local."
  );
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
