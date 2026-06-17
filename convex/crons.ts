import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "check sports scraper schedule",
  { minutes: 1 },
  internal.scraper.checkAndSchedule,
  {}
);

export default crons;
