import { denocg } from "./deps.ts";
import { type TypeDefinition } from "../common/type_definition.ts";
import "./competition_scene/competition.ts";
import { MastersCompetitionElement } from "./competition_scene/competition.ts";

const client = await denocg.getClient<TypeDefinition>();

const competition = document.querySelector<MastersCompetitionElement>(
  "masters-competition",
)!;
await competition.waitForInitialization();

const currentStageTimerInfoReplicant = await client.getReplicant(
  "currentStageTimerInfo",
);
currentStageTimerInfoReplicant.subscribe((value) => {
  competition.setRoundNameText(value?.stageResult.name ?? "");
  competition.setTimerData(value?.players);
});

client.addMessageListener("startTimer", () => {
  competition.startTimer();
});
client.addMessageListener("stopTimer", () => {
  competition.stopTimer();
});

const titleReplicant = await client.getReplicant("title");
titleReplicant.subscribe((value) => {
  competition.setTitleText(value ?? "");
});
