#!/usr/bin/env node

/**
 * Admin Seeding Script (Direct Convex Database Seeding)
 *
 * Creates the admin user in the custom users table, initializes their wallet,
 * and registers them as an admin in the Convex `admins` table.
 *
 * Usage: pnpm seed:admin
 *
 * Requires:
 *   - NEXT_PUBLIC_CONVEX_URL in environment
 *   - ADMIN_SEED_SECRET in environment
 *   - ADMIN_EMAIL (the phone number, e.g. 254712345678)
 *   - ADMIN_PASSWORD
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ConvexHttpClient } from "convex/browser";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const cliArgs = process.argv.slice(2);
const adminPhone = cliArgs[0] || process.env.ADMIN_EMAIL || "254712345678";
const adminPassword = cliArgs[1] || process.env.ADMIN_PASSWORD || "Admin@12345";
const seedSecret = process.env.ADMIN_SEED_SECRET;

console.log("🌱 BetFlow Admin Seeding");
console.log("========================");
console.log(`Convex URL:  ${convexUrl}`);
console.log(`Phone:       ${adminPhone}`);
console.log("");

function normalizePhone(phone) {
  const cleaned = phone.trim().replace(/\s+/g, "");
  const match = cleaned.match(/^(?:\+254|254|0)?([71]\d{8})$/);
  if (match) return `+254${match[1]}`;
  return cleaned;
}

async function seed() {
  if (!convexUrl) {
    console.error("❌ NEXT_PUBLIC_CONVEX_URL is not set in environment.");
    process.exit(1);
  }

  if (!seedSecret) {
    console.error("❌ ADMIN_SEED_SECRET is not set in environment.");
    process.exit(1);
  }

  const normalizedPhone = normalizePhone(adminPhone);
  console.log(`Normalized phone: ${normalizedPhone}`);
  console.log("📝 Seeding admin user directly via Convex...");

  const convex = new ConvexHttpClient(convexUrl);

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  try {
    const result = await convex.mutation("admin:seedAdminUser", {
      phone: normalizedPhone,
      passwordHash: passwordHash,
      secret: seedSecret,
    });

    console.log("✅ Seeding completed:", result);
    console.log("");
    console.log("✅ Admin credentials are ready to use:");
    console.log(`   Phone:    ${adminPhone}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("");
    console.log("🎉 Admin seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message || error);
    process.exit(1);
  }
}

seed().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
