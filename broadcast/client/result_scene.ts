import "./register_fluentui_elements.ts";
import { getClient } from "denocg/client";
import { type TypeDefinition } from "../common/type_definition.ts";
import "./result/result.ts";
import { MastersResultElement } from "./result/result.ts";

const client = await getClient<TypeDefinition>();

const result = document.querySelector<MastersResultElement>(
  "masters-result",
)!;
await result.waitForInitialization();

const currentCompetitionMetadataReplicant = await client.getReplicant(
  "currentCompetitionMetadata",
);
currentCompetitionMetadataReplicant.subscribe((value) => {
  result.title = value?.name ?? "Retropia22 TGM stream";
});

const currentResultSceneDataReplicant = await client.getReplicant(
  "currentResultSceneData",
);
currentResultSceneDataReplicant.subscribe((value) => {
  result.data = value ?? null;
});
