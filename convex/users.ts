import { query } from "./_generated/server";
import { components } from "./_generated/api";

async function getAuthUserId(ctx: any) {
  const user = await components.betterAuth.getCurrentUser(ctx);
  return user?._id ?? null;
}

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});
