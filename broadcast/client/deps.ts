// DenoCG dependency
export * as denocg from "https://deno.land/x/denocg@v0.0.6/client/mod.ts";
export { type Replicant } from "https://deno.land/x/denocg@v0.0.6/common/replicant.ts";

// Lit dependency
export { css, html, LitElement } from "https://esm.sh/lit@2.6.1";
export {
  customElement,
  property,
  query,
  state,
} from "https://esm.sh/lit@2.6.1/decorators";
export { map } from "https://esm.sh/lit@2.6.1/directives/map";
export {
  consume,
  createContext,
  provide,
} from "https://esm.sh/@lit-labs/context@0.2.0?deps=lit@2.6.1";

// TinyColor
export { default as tinycolor } from "https://esm.sh/tinycolor2@1.6.0";
