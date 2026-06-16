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

const res = await fetch(
  `${env.NEXT_PUBLIC_CONVEX_SITE_URL}/api/mutation`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "admin:seedAdminByPhone",
      args: { phone, secret: env.ADMIN_SEED_SECRET },
    }),
  },
);

const data = await res.json();
if (res.ok) {
  console.log("Admin seeded successfully:", data);
} else {
  console.error("Failed to seed admin:", data);
  process.exit(1);
}
