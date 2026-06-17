/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminUsers from "../adminUsers.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as scraper from "../scraper.js";
import type * as scraperValidators from "../scraperValidators.js";
import type * as scrapers_kwikbet from "../scrapers/kwikbet.js";
import type * as scrapers_types from "../scrapers/types.js";
import type * as sportsData from "../sportsData.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminUsers: typeof adminUsers;
  auth: typeof auth;
  crons: typeof crons;
  http: typeof http;
  scraper: typeof scraper;
  scraperValidators: typeof scraperValidators;
  "scrapers/kwikbet": typeof scrapers_kwikbet;
  "scrapers/types": typeof scrapers_types;
  sportsData: typeof sportsData;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
