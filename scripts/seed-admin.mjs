import { ConvexClient } from "convex/browser";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim())),
);

const phone = process.argv[2];
if (!phone) {
  console.error("Usage: node scripts/seed-admin.mjs <phone>");
  console.error("Example: node scripts/seed-admin.mjs +254712345678");
  process.exit(1);
}

const client = new ConvexClient(env.NEXT_PUBLIC_CONVEX_URL);

try {
  const data = await client.mutation("admin:seedAdminByPhone", {
    phone,
    secret: env.ADMIN_SEED_SECRET,
  });
  console.log("Admin seeded successfully:", data);
  process.exit(0);
} catch (error) {
  console.error("Failed to seed admin:", error.message || error);
  process.exit(1);
}
