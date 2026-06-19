import { query } from "./_generated/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || !identity.subject) {
        return null;
      }

      // The subject is the user ID from Better Auth
      const userId = identity.subject as string;
      
      // Get the user from the Better Auth table
      const user = await ctx.db
        .query("authUser")
        .withIndex("by_email", (q) => q.eq("email", userId))
        .first();
      
      return user || null;
    } catch (error) {
      // If not authenticated or error, return null
      return null;
    }
  },
});

