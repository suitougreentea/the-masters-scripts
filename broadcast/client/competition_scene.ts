import "./common/register_fluentui_elements.ts";
import { getClient } from "denocg/client";
import { type TypeDefinition } from "../common/type_definition.ts";
import "./competition_scene/competition.ts";
import { MastersCompetitionElement } from "./competition_scene/competition.ts";

const client = await getClient<TypeDefinition>();

const competition = document.querySelector<MastersCompetitionElement>(
  "masters-competition",
)!;
await competition.waitForInitialization();

const currentCompetitionSceneStageDataReplicant = await client.getReplicant(
  "currentCompetitionSceneStageData",
);
currentCompetitionSceneStageDataReplicant.subscribe((value) => {
  competition.setRoundNameText(value?.metadata.name ?? "");
  competition.setTimerData(value?.stageData.players);
});

const currentRegisteredPlayersReplicant = await client.getReplicant(
  "currentRegisteredPlayers",
);
currentRegisteredPlayersReplicant.subscribe((value) => {
  competition.setRegisteredPlayers(value ?? []);
});

client.addMessageListener("startTimer", () => {
  competition.startTimer();
});
client.addMessageListener("resetTimer", () => {
  competition.resetTimer();
});

const currentCompetitionMetadataReplicant = await client.getReplicant(
  "currentCompetitionMetadata",
);
currentCompetitionMetadataReplicant.subscribe((value) => {
  competition.setTitleText(value?.name ?? "Retropia22 TGM stream");
});

const latestOcrResultReplicant = await client.getReplicant("latestOcrResult");
latestOcrResultReplicant.subscribe((value) => {
  competition.setOcrResult(value);
});

const playingPlayerDataReplicant = await client.getReplicant(
  "playingPlayerData",
);
playingPlayerDataReplicant.subscribe((value) => {
  competition.setPlayingPlayerData(value);
});
