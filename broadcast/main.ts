import { QualifierResult, QualifierScore } from "./common/common_types.ts";
import { TypeDefinition } from "./common/type_definition.ts";
import { ApiClient } from "./server/api_client.ts";
import { AppsScriptApi } from "./server/apps_script_api.ts";
import { denocg } from "./server/deps.ts";

export const config: denocg.ServerConfig<TypeDefinition> = {
  socketPort: 8515,
  assetsPort: 8514,
  assetsRoot: "./client",
};

const server = await denocg.launchServer(config);

const appsScriptApi = new AppsScriptApi(8516, ApiClient.getScopes());
await appsScriptApi.initialize();
const apiClient = new ApiClient(appsScriptApi);

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
const currentStageIndexReplicant = server.getReplicant("currentStageIndex");
const currentBroadcastStageDataReplicant = server.getReplicant(
  "currentBroadcastStageData",
);

server.registerRequestHandler("setupCompetition", async (params) => {
  currentStageIndexReplicant.setValue(-1);
  currentRoundDataReplicant.setValue(null);
  currentCompetitionMetadataReplicant.setValue(null);

  await apiClient.runCommand("mastersSetupCompetition", [
    params.manual,
    params.manualNumberOfGames,
  ]);
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
  currentStageIndexReplicant.setValue(-1);
  currentRoundDataReplicant.setValue(null);
});

server.registerRequestHandler("setCurrentStage", ({ stageIndex }) => {
  currentStageIndexReplicant.setValue(stageIndex);
});

server.registerRequestHandler("refreshCurrentStage", async () => {
  const currentRoundData = currentRoundDataReplicant.getValue();
  if (currentRoundData == null) throw new Error("現在のラウンドがありません");
  const currentStageIndex = currentStageIndexReplicant.getValue();
  if (currentStageIndex == null || currentStageIndex == -1) {
    throw new Error("現在のステージがありません");
  }

  const stageData = [...currentRoundData.stageData];
  const fetchedStageData = await apiClient.runCommand("mastersGetStageData", [
    currentRoundData.roundIndex,
    [currentStageIndex],
  ]);
  stageData[currentStageIndex] = fetchedStageData[0];

  currentRoundDataReplicant.setValue({
    ...currentRoundData,
    stageData,
  });
});

server.registerRequestHandler("resetCurrentStage", async ({ setup }) => {
  const currentRoundData = currentRoundDataReplicant.getValue();
  if (currentRoundData == null) throw new Error("現在のラウンドがありません");
  const currentStageIndex = currentStageIndexReplicant.getValue();
  if (currentStageIndex == null || currentStageIndex == -1) {
    throw new Error(
      "現在のステージがありません",
    );
  }

  await apiClient.runCommand("mastersResetStage", [
    currentRoundData.roundIndex,
    currentStageIndex,
    setup,
  ]);

  const stageData = [...currentRoundData.stageData];
  const fetchedStageData = await apiClient.runCommand("mastersGetStageData", [
    currentRoundData.roundIndex,
    [currentStageIndex],
  ]);
  stageData[currentStageIndex] = fetchedStageData[0];

  currentRoundDataReplicant.setValue({
    ...currentRoundData,
    stageData,
  });
});

server.registerRequestHandler(
  "reorderCurrentStagePlayers",
  async ({ names }) => {
    const currentRoundData = currentRoundDataReplicant.getValue();
    if (currentRoundData == null) throw new Error("現在のラウンドがありません");
    const currentStageIndex = currentStageIndexReplicant.getValue();
    if (currentStageIndex == null || currentStageIndex == -1) {
      throw new Error(
        "現在のステージがありません",
      );
    }

    await apiClient.runCommand("mastersReorderStagePlayers", [
      currentRoundData.roundIndex,
      currentStageIndex,
      names,
    ]);

    const stageData = [...currentRoundData.stageData];
    const fetchedStageData = await apiClient.runCommand("mastersGetStageData", [
      currentRoundData.roundIndex,
      [currentStageIndex],
    ]);
    stageData[currentStageIndex] = fetchedStageData[0];

    currentRoundDataReplicant.setValue({
      ...currentRoundData,
      stageData,
    });
  },
);

server.registerRequestHandler("setCurrentStageScore", async ({ score }) => {
  const metadata = currentCompetitionMetadataReplicant.getValue();
  if (metadata == null) throw new Error("現在の大会がありません");
  const currentRoundData = currentRoundDataReplicant.getValue();
  if (currentRoundData == null) throw new Error("現在のラウンドがありません");
  const currentStageIndex = currentStageIndexReplicant.getValue();
  if (currentStageIndex == null || currentStageIndex == -1) {
    throw new Error("現在のステージがありません");
  }
  const currentBroadcastStageData = currentBroadcastStageDataReplicant
    .getValue();
  if (currentBroadcastStageData == null) {
    throw new Error("先にステージを準備状態にしてください");
  }

  await apiClient.runCommand("mastersSetStageScore", [
    currentRoundData.roundIndex,
    currentStageIndex,
    score,
  ]);

  const stageData = [...currentRoundData.stageData];
  const fetchedStageData = await apiClient.runCommand("mastersGetStageData", [
    currentRoundData.roundIndex,
    [currentStageIndex],
  ]);
  stageData[currentStageIndex] = fetchedStageData[0];

  let qualifierScore: QualifierScore | undefined = undefined;
  if (metadata.type == "qualifierFinal" && currentRoundData.roundIndex == 0) {
    qualifierScore = await apiClient.runCommand("mastersGetQualifierScore", []);
  }

  currentRoundDataReplicant.setValue({
    ...currentRoundData,
    stageData,
    qualifierScore,
  });
});

server.registerRequestHandler("finishCompetition", async () => {
  const { url } = await apiClient.runCommand("mastersExportCompetition", []);

  currentStageIndexReplicant.setValue(-1);
  currentRoundDataReplicant.setValue(null);
  currentCompetitionMetadataReplicant.setValue(null);
  currentParticipantsReplicant.setValue(null);

  return { exportedUrl: url };
});

server.registerRequestHandler(
  "sendCurrentStageDataToBroadcast",
  ({ shouldShowResult }) => {
    const currentRoundData = currentRoundDataReplicant.getValue();
    if (currentRoundData == null) throw new Error("現在のラウンドがありません");
    const currentStageIndex = currentStageIndexReplicant.getValue();
    if (currentStageIndex == null || currentStageIndex == -1) {
      throw new Error("現在のステージがありません");
    }

    currentBroadcastStageDataReplicant.setValue({
      roundIndex: currentRoundData.roundIndex,
      stageIndex: currentStageIndex,
      metadata: currentRoundData.metadata.stages[currentStageIndex],
      stageData: currentRoundData.stageData[currentStageIndex],
      shouldShowResult,
    });
  },
);

server.registerRequestHandler("unsetBroadcastStageData", () => {
  currentBroadcastStageDataReplicant.setValue(null);
});
