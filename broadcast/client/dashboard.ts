import "./common/register_fluentui_elements.ts";
import { getClient } from "denocg/client";
import { type TypeDefinition } from "../common/type_definition.ts";
import "./dashboard/dashboard.ts";
import { MastersDashboardElement } from "./dashboard/dashboard.ts";

const client = await getClient<TypeDefinition>();

const dashboard = document.querySelector<MastersDashboardElement>(
  "masters-dashboard",
)!;
dashboard.provideDenoCGClient(client);
await dashboard.waitForInitialization();
await dashboard.restoreState();
