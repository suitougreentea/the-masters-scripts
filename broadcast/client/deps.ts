// DenoCG dependency
export * as denocg from "https://deno.land/x/denocg@v0.0.7/client/mod.ts";

// Lit dependency
// TODO: esm.shの新しいバージョンだと壊れる
export { css, html, LitElement } from "https://esm.sh/v111/lit@2.6.1";
export {
  customElement,
  property,
  query,
  state,
} from "https://esm.sh/v111/lit@2.6.1/decorators";
export { map } from "https://esm.sh/v111/lit@2.6.1/directives/map";
export { classMap } from "https://esm.sh/v111/lit@2.6.1/directives/class-map";
export { styleMap } from "https://esm.sh/v111/lit@2.6.1/directives/style-map";
export { live } from "https://esm.sh/v111/lit@2.6.1/directives/live";
export {
  consume,
  createContext,
  provide,
} from "https://esm.sh/v111/@lit-labs/context@0.2.0?deps=lit@2.6.1";

// TinyColor
export { default as tinycolor } from "https://esm.sh/tinycolor2@1.6.0";

// Fluent UI
import {
  fluentButton,
  fluentCard,
  fluentCheckbox,
  fluentDialog,
  fluentNumberField,
  fluentProgressRing,
  fluentRadio,
  fluentRadioGroup,
  fluentSwitch,
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
  fluentDialog(),
  fluentNumberField(),
  fluentProgressRing(),
  fluentRadio(),
  fluentRadioGroup(),
  fluentSwitch(),
  fluentTab(),
  fluentTabPanel(),
  fluentTabs(),
  fluentTextField(),
);
export {
  Button as FluentButton,
  Card as FluentCard,
  // Checkbox as FluentCheckbox, // TODO
  Dialog as FluentDialog,
  NumberField as FluentNumberField,
  ProgressRing as FluentProgressRing,
  Radio as FluentRadio,
  RadioGroup as FluentRadioGroup,
  Switch as FluentSwitch,
  Tab as FluentTab,
  TabPanel as FluentTabPanel,
  Tabs as FluentTabs,
  TextField as FluentTextField,
} from "https://esm.sh/@fluentui/web-components@2.5.12";
