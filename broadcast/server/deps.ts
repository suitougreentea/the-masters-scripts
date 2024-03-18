// DenoCG dependency
export * as denocg from "https://deno.land/x/denocg@v0.0.7/server/mod.ts";

// obs-websocket dependency
export {
  default as OBSWebSocket,
  type OBSRequestTypes,
  type OBSResponseTypes,
} from "https://esm.sh/obs-websocket-js@5.0.2";

// p_queue dependency
export { default as PQueue } from "https://deno.land/x/p_queue@1.0.1/mod.ts";
