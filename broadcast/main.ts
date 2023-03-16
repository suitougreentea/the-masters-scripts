import { QualifierResult, QualifierScore } from "./common/common_types.ts";
import { RoundData, TypeDefinition } from "./common/type_definition.ts";
import { ApiClient } from "./server/api_client.ts";
import { AppsScriptApi } from "./server/apps_script_api.ts";
import { denocg } from "./server/deps.ts";
import { OBSController } from "./server/obs_controller.ts";

export const config: denocg.ServerConfig<TypeDefinition> = {
  socketPort: 8515,
  assetsPort: 8514,
  assetsRoot: "./client",
};

const server = await denocg.launchServer(config);

const appsScriptApi = new AppsScriptApi(8516, ApiClient.getScopes());
await appsScriptApi.initialize();
const apiClient = new ApiClient(appsScriptApi);

const obsConfigText = await Deno.readTextFile("./obs-websocket-conf.json");
const obsConfig = JSON.parse(obsConfigText);
const obs = new OBSController(obsConfig.address, obsConfig.password);

const competitionSceneName = "competition";
const resultSceneName = "result";
const chatSourceName = "chat";

let currentLoginPromise: Promise<void> | null = null;
let currentLoginAbort: AbortController | null = null;

server.registerRequestHandler("login", () => {
  currentLoginAbort = new AbortController();
  currentLoginPromise = appsScriptApi.auth({
    abortController: currentLoginAbort,
  });
  (async () => {
    try {
      await currentLoginPromise;
      server.broadcastMessage("loginResult", { success: true });
    } catch {
      server.broadcastMessage("loginResult", { success: false });
    } finally {
      currentLoginAbort = null;
      currentLoginPromise = null;
    }
  })();
  return { url: appsScriptApi.getAuthUrl() };
});

server.registerRequestHandler("cancelLogin", () => {
  currentLoginAbort?.abort();
});

server.registerRequestHandler("checkLogin", async () => {
  await appsScriptApi.checkAuth();
});

const currentParticipantsReplicant = server.getReplicant("currentParticipants");
const currentCompetitionMetadataReplicant = server.getReplicant(
  "currentCompetitionMetadata",
);
const currentRoundDataReplicant = server.getReplicant("currentRoundData");
const currentCompetitionSceneStageDataReplicant = server.getReplicant(
  "currentCompetitionSceneStageData",
);
const currentResultSceneDataReplicant = server.getReplicant(
  "currentResultSceneData",
);
const resultSceneActiveReplicant = server.getReplicant("resultSceneActive");

server.registerRequestHandler("setupCompetition", async (params) => {
  currentRoundDataReplicant.setValue(null);
  currentCompetitionMetadataReplicant.setValue(null);

  await apiClient.runCommand("mastersSetupCompetition", [params.options]);
});

server.registerRequestHandler("getCurrentCompetitionMetadata", async () => {
  const metadata = await apiClient.runCommand(
    "mastersGetCurrentCompetitionMetadata",
    [],
  );
  currentCompetitionMetadataReplicant.setValue(metadata);
});

const getRoundData = async (roundIndex: number) => {
  const metadata = currentCompetitionMetadataReplicant.getValue();
  if (metadata == null) throw new Error("現在の大会がありません");

  const stageData = await apiClient.runCommand("mastersGetStageData", [
    roundIndex,
  ]);
  const supplementComparisons = await apiClient.runCommand(
    "mastersGetSupplementComparisonData",
    [roundIndex],
  );
  let qualifierScore: QualifierScore | undefined = undefined;
  let qualifierResult: QualifierResult | undefined = undefined;
  if (metadata.type == "qualifierFinal" && roundIndex == 0) {
    qualifierScore = await apiClient.runCommand("mastersGetQualifierScore", []);
    qualifierResult = await apiClient.runCommand(
      "mastersGetQualifierResult",
      [],
    );
  }

  currentRoundDataReplicant.setValue({
    roundIndex,
    metadata: metadata.rounds[roundIndex],
    stageData,
    supplementComparisons,
    qualifierScore,
    qualifierResult,
  });
};

const partialUpdateCurrentRoundData = async (
  params: {
    stageData?: number[];
    supplementComparisons?: boolean;
    qualifierScore?: boolean;
    qualifierResult?: boolean;
  },
) => {
  const currentRoundData = currentRoundDataReplicant.getValue();
  if (currentRoundData == null) throw new Error("現在のラウンドがありません");

  const updatedRoundData: Partial<RoundData> = {
    stageData: currentRoundData.stageData,
  };

  const stageIndices = params.stageData ?? [];
  if (stageIndices.length > 0) {
    const fetchedStageData = await apiClient.runCommand("mastersGetStageData", [
      currentRoundData.roundIndex,
      stageIndices,
    ]);
    fetchedStageData.forEach((data, i) => {
      updatedRoundData.stageData![stageIndices[i]] = data;
    });
  }

  if (params.supplementComparisons) {
    const supplementComparisons = await apiClient.runCommand(
      "mastersGetSupplementComparisonData",
      [currentRoundData.roundIndex],
    );
    updatedRoundData.supplementComparisons = supplementComparisons;
  }

  if (params.qualifierScore) {
    const qualifierScore = await apiClient.runCommand(
      "mastersGetQualifierScore",
      [],
    );
    updatedRoundData.qualifierScore = qualifierScore;
  }

  if (params.qualifierResult) {
    const qualifierResult = await apiClient.runCommand(
      "mastersGetQualifierResult",
      [],
    );
    updatedRoundData.qualifierResult = qualifierResult;
  }

  currentRoundDataReplicant.setValue({
    ...currentRoundData,
    ...updatedRoundData,
  });
};

server.registerRequestHandler("enterRound", async ({ roundIndex }) => {
  const _ready = await apiClient.runCommand("mastersTryInitializeRound", [
    roundIndex,
  ]);
  await getRoundData(roundIndex);
});

server.registerRequestHandler("refreshCurrentRound", async () => {
  const currentRoundData = currentRoundDataReplicant.getValue();
  if (currentRoundData == null) throw new Error("現在のラウンドがありません");
  await getRoundData(currentRoundData.roundIndex);
});

const finalizeCurrentRound = async () => {
  const metadata = currentCompetitionMetadataReplicant.getValue();
  if (metadata == null) throw new Error("現在の大会がありません");
  const currentRoundData = currentRoundDataReplicant.getValue();
  if (currentRoundData == null) throw new Error("現在のラウンドがありません");

  const roundIndex = currentRoundData.roundIndex;
  await apiClient.runCommand("mastersTryFinalizeRound", [roundIndex]);

  const supplementComparisons = await apiClient.runCommand(
    "mastersGetSupplementComparisonData",
    [roundIndex],
  );
  let qualifierResult: QualifierResult | undefined = undefined;
  if (metadata.type == "qualifierFinal" && roundIndex == 0) {
    qualifierResult = await apiClient.runCommand(
      "mastersGetQualifierResult",
      [],
    );
  }

  currentRoundDataReplicant.setValue({
    ...currentRoundData,
    supplementComparisons,
    qualifierResult,
  });
};

server.registerRequestHandler("finalizeCurrentRound", async () => {
  await finalizeCurrentRound();
});

server.registerRequestHandler("finalizeCurrentRoundIfCompleted", async () => {
  const currentRoundData = currentRoundDataReplicant.getValue();
  if (currentRoundData == null) throw new Error("現在のラウンドがありません");

  if (
    currentRoundData.stageData.every((stage, stageIndex) =>
      stage.result.length ==
        currentRoundData.metadata.stages[stageIndex].numPlayers
    )
  ) {
    await finalizeCurrentRound();
  }
});

server.registerRequestHandler("leaveCurrentRound", () => {
  currentRoundDataReplicant.setValue(null);
});

server.registerRequestHandler("refreshStage", async ({ stageIndex }) => {
  await partialUpdateCurrentRoundData({ stageData: [stageIndex] });
});

server.registerRequestHandler("resetStage", async ({ stageIndex, setup }) => {
  const currentRoundData = currentRoundDataReplicant.getValue();
  if (currentRoundData == null) throw new Error("現在のラウンドがありません");

  await apiClient.runCommand("mastersResetStage", [
    currentRoundData.roundIndex,
    stageIndex,
    setup,
  ]);

  await partialUpdateCurrentRoundData({ stageData: [stageIndex] });
});

server.registerRequestHandler(
  "reorderStagePlayers",
  async ({ stageIndex, names }) => {
    const currentRoundData = currentRoundDataReplicant.getValue();
    if (currentRoundData == null) throw new Error("現在のラウンドがありません");

    await apiClient.runCommand("mastersReorderStagePlayers", [
      currentRoundData.roundIndex,
      stageIndex,
      names,
    ]);

    await partialUpdateCurrentRoundData({ stageData: [stageIndex] });
  },
);

server.registerRequestHandler(
  "setStageScore",
  async ({ stageIndex, score }) => {
    const metadata = currentCompetitionMetadataReplicant.getValue();
    if (metadata == null) throw new Error("現在の大会がありません");
    const currentRoundData = currentRoundDataReplicant.getValue();
    if (currentRoundData == null) throw new Error("現在のラウンドがありません");

    await apiClient.runCommand("mastersSetStageScore", [
      currentRoundData.roundIndex,
      stageIndex,
      score,
    ]);

    const shouldUpdateQualifierScore = metadata.type == "qualifierFinal" &&
      currentRoundData.roundIndex == 0;
    await partialUpdateCurrentRoundData({
      stageData: [stageIndex],
      qualifierScore: shouldUpdateQualifierScore,
    });
  },
);

server.registerRequestHandler("finishCompetition", async () => {
  const { url } = await apiClient.runCommand("mastersExportCompetition", []);

  currentRoundDataReplicant.setValue(null);
  currentCompetitionMetadataReplicant.setValue(null);
  currentParticipantsReplicant.setValue(null);

  return { exportedUrl: url };
});

server.registerRequestHandler(
  "sendStageDataToCompetitionScene",
  ({ stageIndex }) => {
    const currentRoundData = currentRoundDataReplicant.getValue();
    if (currentRoundData == null) throw new Error("現在のラウンドがありません");

    currentCompetitionSceneStageDataReplicant.setValue({
      roundIndex: currentRoundData.roundIndex,
      stageIndex: stageIndex,
      metadata: currentRoundData.metadata.stages[stageIndex],
      stageData: currentRoundData.stageData[stageIndex],
    });
  },
);

server.registerRequestHandler("unsetCompetitionSceneStageData", () => {
  currentCompetitionSceneStageDataReplicant.setValue(null);
});

currentCompetitionSceneStageDataReplicant.subscribe(async (value) => {
  const { sceneItemId } = await obs.call("GetSceneItemId", {
    sceneName: competitionSceneName,
    sourceName: chatSourceName,
  });
  const { sceneItemTransform } = await obs.call("GetSceneItemTransform", {
    sceneName: competitionSceneName,
    sceneItemId,
  });

  if (value != null) {
    sceneItemTransform.positionY = 440;
    sceneItemTransform.cropTop = 340;
  } else {
    sceneItemTransform.positionY = 100;
    sceneItemTransform.cropTop = 0;
  }

  obs.call("SetSceneItemTransform", {
    sceneName: competitionSceneName,
    sceneItemId,
    sceneItemTransform,
  });
});

server.registerRequestHandler("setResultSceneData", ({ stageIndex }) => {
  const metadata = currentCompetitionMetadataReplicant.getValue();
  if (metadata == null) throw new Error("現在の大会がありません");
  const currentRoundData = currentRoundDataReplicant.getValue();
  if (currentRoundData == null) throw new Error("現在のラウンドがありません");

  let nextStageRoundIndex = currentRoundData.roundIndex;
  let nextStageStageIndex = stageIndex + 1;
  if (nextStageStageIndex >= currentRoundData.metadata.stages.length) {
    nextStageRoundIndex++;
    nextStageStageIndex = 0;
  }
  let nextStageName = null;
  if (nextStageRoundIndex < metadata.rounds.length) {
    nextStageName =
      metadata.rounds[nextStageRoundIndex].stages[nextStageStageIndex].name;
  }

  currentResultSceneDataReplicant.setValue({
    roundData: currentRoundData,
    currentStageIndex: stageIndex,
    nextStageName,
  });
});

server.registerRequestHandler("unsetResultSceneData", () => {
  currentResultSceneDataReplicant.setValue(null);
});

server.registerRequestHandler("toggleResultScene", ({ show }) => {
  resultSceneActiveReplicant.setValue(show);
});

resultSceneActiveReplicant.subscribe(async (value) => {
  if (value) {
    await obs.call("SetCurrentProgramScene", { sceneName: resultSceneName });
  } else {
    await obs.call("SetCurrentProgramScene", {
      sceneName: competitionSceneName,
    });
  }
});
