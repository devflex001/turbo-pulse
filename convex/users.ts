import { query } from "./_generated/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }
      
      // Return the current user info from the identity
      // Better Auth stores this through ctx.auth
      return identity;
    } catch (error) {
      // If not authenticated or error, return null
      return null;
    }
  },
});

