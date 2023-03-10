import { denocg } from "./deps.ts";
import { type TypeDefinition } from "../common/type_definition.ts";
import "./dashboard/dashboard.ts";
import { MastersDashboardElement } from "./dashboard/dashboard.ts";

const client = await denocg.getClient<TypeDefinition>();

const dashboard = document.querySelector<MastersDashboardElement>(
  "masters-dashboard",
)!;
dashboard.provideDenoCGClient(client);
await dashboard.waitForInitialization();
