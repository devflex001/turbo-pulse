/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminBets from "../adminBets.js";
import type * as adminTransactions from "../adminTransactions.js";
import type * as adminUsers from "../adminUsers.js";
import type * as auth_authorization from "../auth/authorization.js";
import type * as auth_examples from "../auth/examples.js";
import type * as auth_login from "../auth/login.js";
import type * as auth_register from "../auth/register.js";
import type * as auth_seedAdmin from "../auth/seedAdmin.js";
import type * as auth_sessions from "../auth/sessions.js";
import type * as auth_user from "../auth/user.js";
import type * as auth_utils from "../auth/utils.js";
import type * as bets from "../bets.js";
import type * as crons from "../crons.js";
import type * as customEvents from "../customEvents.js";
import type * as daraja from "../daraja.js";
import type * as ipTracking from "../ipTracking.js";
import type * as migrations_walletIsolationMigration from "../migrations/walletIsolationMigration.js";
import type * as mpesa from "../mpesa.js";
import type * as notifications from "../notifications.js";
import type * as paymentMode from "../paymentMode.js";
import type * as paystack from "../paystack.js";
import type * as platformConfig from "../platformConfig.js";
import type * as referrals from "../referrals.js";
import type * as scraper from "../scraper.js";
import type * as scraperValidators from "../scraperValidators.js";
import type * as scrapers_kwikbet from "../scrapers/kwikbet.js";
import type * as scrapers_types from "../scrapers/types.js";
import type * as sportsData from "../sportsData.js";
import type * as supportChat from "../supportChat.js";
import type * as tests_walletIsolationTest from "../tests/walletIsolationTest.js";
import type * as withdrawals from "../withdrawals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminBets: typeof adminBets;
  adminTransactions: typeof adminTransactions;
  adminUsers: typeof adminUsers;
  "auth/authorization": typeof auth_authorization;
  "auth/examples": typeof auth_examples;
  "auth/login": typeof auth_login;
  "auth/register": typeof auth_register;
  "auth/seedAdmin": typeof auth_seedAdmin;
  "auth/sessions": typeof auth_sessions;
  "auth/user": typeof auth_user;
  "auth/utils": typeof auth_utils;
  bets: typeof bets;
  crons: typeof crons;
  customEvents: typeof customEvents;
  daraja: typeof daraja;
  ipTracking: typeof ipTracking;
  "migrations/walletIsolationMigration": typeof migrations_walletIsolationMigration;
  mpesa: typeof mpesa;
  notifications: typeof notifications;
  paymentMode: typeof paymentMode;
  paystack: typeof paystack;
  platformConfig: typeof platformConfig;
  referrals: typeof referrals;
  scraper: typeof scraper;
  scraperValidators: typeof scraperValidators;
  "scrapers/kwikbet": typeof scrapers_kwikbet;
  "scrapers/types": typeof scrapers_types;
  sportsData: typeof sportsData;
  supportChat: typeof supportChat;
  "tests/walletIsolationTest": typeof tests_walletIsolationTest;
  withdrawals: typeof withdrawals;
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
