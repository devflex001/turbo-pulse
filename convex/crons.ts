import { cronJobs } from "convex/server";

const crons = cronJobs();

// No notification cron jobs. Match-start notifications are triggered by the
// user-facing custom event countdown reaching zero.

export default crons;
