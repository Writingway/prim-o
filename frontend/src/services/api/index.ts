// Barrel: keeps the public `from "../services/api"` import path.
// The split by domain is internal; components are unaffected.

export type { ApiResult } from "./client";
export { setAccessToken, registerSessionExpired, refresh, assetUrl } from "./client";

export * from "./auth";
export * from "./offers";
export * from "./employees";
export * from "./company";
export * from "./stats";
export * from "./admin";
export * from "./stripe";

export * from "./promoCodes";
export * from "./redemption";

export * from "./me";
export * from "./categories";
