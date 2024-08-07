import {
  Participant,
  QualifierResult,
  QualifierScore,
  RegisteredPlayerEntry,
  StageScoreValue,
} from "../common/common_types.ts";
import {
  OcrPlayerStatus,
  OcrResult,
  PlayingPlayerData,
  RoundData,
  TypeDefinition,
} from "./common/type_definition.ts";
import { ApiClient } from "./server/api_client.ts";
import { launchServer, ServerConfig } from "denocg/server";
import PQueue from "p_queue";
import { OBSController } from "./server/obs_controller.ts";
import { OcrServer } from "./server/ocr_server.ts";
import {
  ActionHandler as UserControllerServerActionHandler,
  UserControllerServer,
} from "./server/user_controller_server.ts";
import { QueryPlayerResult } from "../common/user_controller_server_types.ts";
import { calculateStandings, StandingInput } from "./server/standings.ts";
import { createPerPlayerStreams } from "./server/ocr_processor.ts";
import { createResultCollector } from "./server/ocr_processor.ts";
import { convertOcrPlayerStatusToStageScoreValue } from "./client/common/ocr_util.ts";

export const config: ServerConfig<TypeDefinition> = {
  socketPort: 8515,
  assetsPort: 8514,
  assetsRoot: "./client",
};

const server = await launchServer(config);

const apiClient = new ApiClient();

const obsConfigText = await Deno.readTextFile("./obs-websocket-conf.json");
const obsConfig = JSON.parse(obsConfigText);
const obs = new OBSController(obsConfig.address, obsConfig.password);

const competitionSceneName = "competition";
const resultSceneName = "result";
const chatSourceName = "chat";

const currentRegisteredPlayersReplicant = server.getReplicant(
  "currentRegisteredPlayers",
);
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

const getCurrentRegisteredPlayers = async () => {
  const players = await apiClient.runCommand(
    "mastersGetRegisteredPlayers",
    [],
  );
  currentRegisteredPlayersReplicant.setValue(players);
};

const registerPlayer = async (data: RegisteredPlayerEntry) => {
  await apiClient.runCommand(
    "mastersRegisterPlayer",
    [data],
  );
};

const updatePlayer = async (oldName: string, data: RegisteredPlayerEntry) => {
  await apiClient.runCommand(
    "mastersUpdatePlayer",
    [oldName, data],
  );
};

server.registerRequestHandler("enterSetup", async () => {
  await getCurrentRegisteredPlayers();
  await getCurrentParticipants();
});

server.registerRequestHandler("getCurrentRegisteredPlayers", async () => {
  await getCurrentRegisteredPlayers();
});

server.registerRequestHandler("registerPlayer", async (params) => {
  await registerPlayer(params.data);
  await getCurrentRegisteredPlayers();
});

server.registerRequestHandler("updatePlayer", async (params) => {
  await updatePlayer(params.oldName, params.data);
  await getCurrentRegisteredPlayers();
});

server.registerRequestHandler("getCurrentParticipants", async () => {
  await getCurrentParticipants();
});

const getCurrentParticipants = async () => {
  const participants = await apiClient.runCommand(
    "mastersGetParticipants",
    [],
  );
  currentParticipantsReplicant.setValue(participants);
};

const setParticipants = async (participants: Participant[]) => {
  await apiClient.runCommand(
    "mastersSetParticipants",
    [participants],
  );
};

const addParticipantQueue = new PQueue({ concurrency: 1 });
const addParticipant = async (name: string) => {
  await addParticipantQueue.add(async () => {
    const participants = await apiClient.runCommand(
      "mastersGetParticipants",
      [],
    );
    if (participants.find((e) => e.name == name) != null) {
      return;
    }
    participants.push({ name, firstRoundGroupIndex: undefined });
    await apiClient.runCommand(
      "mastersSetParticipants",
      [participants],
    );
  });
};

server.registerRequestHandler("setParticipants", async (params) => {
  await setParticipants(params.participants);
  await getCurrentParticipants();
});

server.registerRequestHandler("setupCompetition", async (params) => {
  currentRoundDataReplicant.setValue(undefined);
  currentCompetitionMetadataReplicant.setValue(undefined);

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
  currentRoundDataReplicant.setValue(undefined);
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

server.registerRequestHandler("finishCompetitionWithExport", async () => {
  const { url } = await apiClient.runCommand("mastersExportCompetition", []);

  currentRoundDataReplicant.setValue(undefined);
  currentCompetitionMetadataReplicant.setValue(undefined);
  currentParticipantsReplicant.setValue(undefined);

  return { exportedUrl: url };
});

server.registerRequestHandler("finishCompetitionWithoutExport", () => {
  currentRoundDataReplicant.setValue(undefined);
  currentCompetitionMetadataReplicant.setValue(undefined);
  currentParticipantsReplicant.setValue(undefined);
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
  currentCompetitionSceneStageDataReplicant.setValue(undefined);
});

currentCompetitionSceneStageDataReplicant.subscribe(async (value) => {
  try {
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
    sceneItemTransform.boundsWidth = 1;
    sceneItemTransform.boundsHeight = 1;

    obs.call("SetSceneItemTransform", {
      sceneName: competitionSceneName,
      sceneItemId,
      sceneItemTransform,
    });
  } catch (e) {
    console.error(e);
  }
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
  let nextStageName: string | undefined = undefined;
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
  currentResultSceneDataReplicant.setValue(undefined);
});

server.registerRequestHandler("toggleResultScene", ({ show }) => {
  resultSceneActiveReplicant.setValue(show);
});

resultSceneActiveReplicant.subscribe(async (value) => {
  try {
    if (value) {
      await obs.call("SetCurrentProgramScene", { sceneName: resultSceneName });
    } else {
      await obs.call("SetCurrentProgramScene", {
        sceneName: competitionSceneName,
      });
    }
  } catch (e) {
    console.error(e);
  }
});

//
// OCR Server / Data
//

const ocrServer = new OcrServer(8517);

const ocrConnectedReplicant = server.getReplicant("ocrConnected");
ocrConnectedReplicant.setValue(false);
const latestOcrResultReplicant = server.getReplicant("latestOcrResult");

const { onNext, playerStreams } = createPerPlayerStreams();

ocrServer.addEventListener("connect", () => {
  console.log("OCR client connected");
  ocrConnectedReplicant.setValue(ocrServer.hasClient());
});
ocrServer.addEventListener("disconnect", () => {
  console.log("OCR client disconnected");
  ocrConnectedReplicant.setValue(ocrServer.hasClient());
});

ocrServer.addEventListener("data", (ev) => {
  const data = (ev as CustomEvent<OcrResult>).detail;
  latestOcrResultReplicant.setValue(data);
  onNext(data);
});

const resultHistory: OcrPlayerStatus[][] = [...new Array(8)].map((_) => []);
const addToResultHistory = (playerIndex: number, result: OcrPlayerStatus) => {
  const target = resultHistory[playerIndex];
  if (target.length == 4) {
    target.splice(0, 1);
  }
  target.push(result);
};

const streams = playerStreams.map((e) =>
  e.pipeThrough(createResultCollector())
);
streams.forEach((stream, playerIndex) => {
  (async () => {
    // @ts-ignore: can be removed in future
    for await (const result of stream) {
      addToResultHistory(playerIndex, result);
      console.log(`Player #${playerIndex}: added result to history`);
    }
  })();
});

server.registerRequestHandler("getScoreHistory", () => {
  const players = resultHistory.map((playerHistory, playerIndex) => {
    const currentStatus = latestOcrResultReplicant.getValue()?.status
      ?.[playerIndex];
    const history: StageScoreValue[] = [];
    playerHistory.forEach((e) => {
      const converted = convertOcrPlayerStatusToStageScoreValue(e);
      if (converted != null) history.push(converted);
    });
    return {
      history,
      current: currentStatus != null
        ? convertOcrPlayerStatusToStageScoreValue(currentStatus)
        : undefined,
    };
  });
  return {
    history: { players },
  };
});

server.registerRequestHandler("resetOcrState", () => {
  // TODO: 関数を抜けるタイミングで、OCRから送られてくるデータがリセットされているとは限らない
  // (一瞬リセット前のデータが送られてくるかも)
  latestOcrResultReplicant.setValue(undefined);
  ocrServer.requestReset();
});

//
// User Controller Server / Data
//

const registrationUrlReplicant = server.getReplicant("registrationUrl");
registrationUrlReplicant.setValue(undefined);

const userControllerServerHandler: UserControllerServerActionHandler = {
  open: (url: string) => {
    registrationUrlReplicant.setValue(url);
  },
  close: (url: string) => {
    if (registrationUrlReplicant.getValue() == url) {
      registrationUrlReplicant.setValue(undefined);
    }
  },
  queryPlayer: async (name: string): Promise<QueryPlayerResult> => {
    await getCurrentRegisteredPlayers();
    await getCurrentParticipants();
    const players = currentRegisteredPlayersReplicant.getValue();
    const registeredPlayerEntry = players?.find((e) => e.name == name);
    const participants = currentParticipantsReplicant.getValue();
    const participating = participants?.find((e) => e.name == name) != null;
    return {
      registeredPlayerEntry,
      participating,
    };
  },
  registerPlayer: async (entry: RegisteredPlayerEntry) => {
    await registerPlayer(entry);
    await getCurrentRegisteredPlayers();
  },
  updatePlayer: async (oldName: string, entry: RegisteredPlayerEntry) => {
    await updatePlayer(oldName, entry);
    await getCurrentRegisteredPlayers();
  },
  addParticipant: async (name: string) => {
    await addParticipant(name);
    await getCurrentParticipants();
  },
};
const _userControllerServer = new UserControllerServer(
  8519,
  userControllerServerHandler,
);

//
// Playing Player Data
//

const playingPlayerDataReplicant = server.getReplicant("playingPlayerData");

const updatePlayingPlayerData = () => {
  const currentCompetitionSceneStageData =
    currentCompetitionSceneStageDataReplicant.getValue();
  const ocrResult = latestOcrResultReplicant.getValue();

  if (currentCompetitionSceneStageData == null || ocrResult == null) {
    playingPlayerDataReplicant.setValue(undefined);
    return;
  }

  const players = currentCompetitionSceneStageData.stageData.players;

  const standingInput: (StandingInput & { playerIndex: number })[] = [];
  players.forEach((player, playerIndex) => {
    if (player == null) return;
    const status = ocrResult.status[playerIndex];
    standingInput.push({
      playerIndex,
      playing: status.playing,
      level: status.level,
      grade: status.grade,
      time: status.gameTime,
      startTime: player.startTime,
    });
  });
  const standingInfo = calculateStandings(standingInput);

  const result: PlayingPlayerData[] = players.map((player, playerIndex) => {
    if (player == null) return {};
    const standingIndex = standingInput.findIndex((e) =>
      e.playerIndex == playerIndex
    );
    const standing = standingInfo[standingIndex];
    return {
      standingRankIndex: standing.rankIndex,
      standingFinal: standing.final,
    };
  });
  playingPlayerDataReplicant.setValue(result);
};

currentCompetitionSceneStageDataReplicant.subscribe(() =>
  updatePlayingPlayerData()
);
latestOcrResultReplicant.subscribe(() => updatePlayingPlayerData());
