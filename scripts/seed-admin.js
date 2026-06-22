/**
 * Script to seed an admin user via Convex CLI
 * 
 * Usage in development:
 *   node scripts/seed-admin.js
 * 
 * Usage in production:
 *   Set ADMIN_SEED_SECRET in your Convex environment variables first
 *   node scripts/seed-admin.js --secret=<your-secret>
 * 
 * Or use Convex dashboard to call internal.auth.seedAdmin.seedAdminUser directly
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     ADMIN USER SEEDING                         ║
╟────────────────────────────────────────────────────────────────╢
║  This script helps you create an admin user                    ║
║                                                                ║
║  For production:                                               ║
║    1. Set ADMIN_SEED_SECRET in Convex environment variables   ║
║    2. Use Convex dashboard to call:                           ║
║       internal.auth.seedAdmin.seedAdminUser                   ║
║                                                                ║
║  For development:                                              ║
║    Use Convex dashboard to call:                              ║
║    internal.auth.seedAdmin.seedAdminUser                      ║
║    with args: { phone: "254712345678", password: "..." }      ║
╚════════════════════════════════════════════════════════════════╝

To seed an admin:

1. Open Convex dashboard: npx convex dashboard
2. Go to "Functions" tab
3. Find: internal.auth.seedAdmin.seedAdminUser
4. Click "Run function"
5. Enter JSON args:
   {
     "phone": "254712345678",
     "password": "YourSecurePassword123",
     "secret": "your-secret-if-production"
   }
6. Click "Run"

The admin user will be created with:
- Phone number (normalized to E.164 format)
- Hashed password (using Argon2)
- Role: admin
`);
