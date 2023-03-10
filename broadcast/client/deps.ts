// DenoCG dependency
export * as denocg from "https://deno.land/x/denocg@v0.0.6/client/mod.ts";
export { type Replicant } from "https://deno.land/x/denocg@v0.0.6/common/replicant.ts";
export {
  type RequestName,
  type RequestParams,
  type RequestResult,
} from "https://deno.land/x/denocg@v0.0.6/common/types.ts";

// Lit dependency
export { css, html, LitElement } from "https://esm.sh/lit@2.6.1";
export {
  customElement,
  property,
  query,
  state,
} from "https://esm.sh/lit@2.6.1/decorators";
export { map } from "https://esm.sh/lit@2.6.1/directives/map";
export { styleMap } from "https://esm.sh/lit@2.6.1/directives/style-map";
export {
  consume,
  createContext,
  provide,
} from "https://esm.sh/@lit-labs/context@0.2.0?deps=lit@2.6.1";

// TinyColor
export { default as tinycolor } from "https://esm.sh/tinycolor2@1.6.0";

// Fluent UI
import {
  fluentButton,
  fluentCard,
  fluentCheckbox,
  fluentNumberField,
  fluentProgressRing,
  fluentTab,
  fluentTabPanel,
  fluentTabs,
  fluentTextField,
  provideFluentDesignSystem,
} from "https://esm.sh/@fluentui/web-components@2.5.12";
provideFluentDesignSystem().register(
  fluentButton(),
  fluentCard(),
  fluentCheckbox(),
  fluentNumberField(),
  fluentProgressRing(),
  fluentTab(),
  fluentTabPanel(),
  fluentTabs(),
  fluentTextField(),
);
export {
  Button as FluentButton,
  Card as FluentCard,
  // Checkbox as FluentCheckbox, // TODO
  NumberField as FluentNumberField,
  ProgressRing as FluentProgressRing,
  Tab as FluentTab,
  TabPanel as FluentTabPanel,
  Tabs as FluentTabs,
  TextField as FluentTextField,
} from "https://esm.sh/@fluentui/web-components@2.5.12";
