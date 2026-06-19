import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }

      // The subject is the user ID from Better Auth
      const userId = identity.subject as Id<"user">;
      
      // Get the user from the database
      const user = await ctx.db.get(userId);
      return user || null;
    } catch (error) {
      // If not authenticated, return null
      return null;
    }
  },
});

