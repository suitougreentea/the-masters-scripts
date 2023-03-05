import { TypeDefinition } from "../../common/type_definition.ts";
import { createContext, denocg } from "../deps.ts";

export type DashboardContext = {
  getClient(): Promise<denocg.Client<TypeDefinition>>;
};

export const dashboardContext = createContext<DashboardContext>(
  Symbol("dashboard"),
);
