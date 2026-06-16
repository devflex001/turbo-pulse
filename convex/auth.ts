import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      // Override the default 8 character requirement to exactly 6 characters as requested by the user
      validatePasswordRequirements(password) {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
      },
      profile(params) {
        return {
          email: params.email as string,
          phone: params.email as string,
          name: params.username as string,
        };
      },
    }),
  ],
});
