import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,
  // Custom tables can go here if needed in the future
});

export default schema;
