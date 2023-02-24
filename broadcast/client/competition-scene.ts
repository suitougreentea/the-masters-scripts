import { type TypeDefinition } from "../common/type_definition.ts";
import { denocg } from "./deps.ts";

const client = await denocg.getClient<TypeDefinition>();

const currentStageInfoDiv = document.querySelector<HTMLDivElement>(
  "#current-stage-info",
)!;
const currentStageInfoReplicant = await client.getReplicant("currentStageInfo");
currentStageInfoReplicant.subscribe((value) =>
  currentStageInfoDiv.innerText = JSON.stringify(value)
);
