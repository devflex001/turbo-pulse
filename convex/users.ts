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
      
      if (!userId) {
        return null;
      }
      
      // Get the user from the database
      const user = await ctx.db.get(userId);
      return user || null;
    } catch (error) {
      // If not authenticated or error, return null
      console.error("Error fetching current user:", error);
      return null;
    }
  },
});

