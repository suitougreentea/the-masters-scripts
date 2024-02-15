import { denocg } from "./deps.ts";
import { type TypeDefinition } from "../common/type_definition.ts";
import "./competition_scene/competition.ts";
import { MastersCompetitionElement } from "./competition_scene/competition.ts";

const client = await denocg.getClient<TypeDefinition>();

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
client.addMessageListener("stopTimer", () => {
  competition.stopTimer();
});

const currentCompetitionMetadataReplicant = await client.getReplicant(
  "currentCompetitionMetadata",
);
currentCompetitionMetadataReplicant.subscribe((value) => {
  competition.setTitleText(value?.name ?? "Retropia22 TGM stream");
});

// TODO: Experimental
const latestOcrResultReplicant = await client.getReplicant("latestOcrResult");
latestOcrResultReplicant.subscribe((value) => {
  competition.setOcrResult(value);
})
