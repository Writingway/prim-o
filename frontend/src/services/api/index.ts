// Barrel : conserve l'import public `from "../services/api"`.
// Le découpage par domaine est interne ; les composants ne changent pas.

export type { ApiResult } from "./client";
export { setAccessToken, registerSessionExpired, refresh } from "./client";

export * from "./auth";
export * from "./offers";
export * from "./employees";
export * from "./company";
export * from "./admin";
export * from "./stripe";
export * from "./me";
