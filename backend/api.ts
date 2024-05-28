import {
  CompetitionMetadata,
  CompetitionSetupOptions,
  Participant,
  QualifierResult,
  QualifierScore,
  RegisteredPlayerEntry,
  StageData,
  StagePlayerEntry,
  StageResultEntry,
  StageScoreData,
  StageSetupResult,
  SupplementComparisonData,
  SupplementComparisonEntry,
} from "../common/common_types.ts";
import {
  constructQualifierResultEntryStubs,
  constructStageResultEntryStub,
  finalizeRound,
  getDependencyForRound,
  getQualifierResult,
  getStageResult,
  isQualifierRound,
  NotReadyError,
  RoundDependencyData,
  setupCompetition,
  setupRound,
  StageResultEntryStub,
} from "./competition.ts";
import { resolve } from "./inject.ts";
import { injectKey as playersStoreKey } from "./players_store.ts";
import { injectKey as setupStoreKey } from "./setup_store.ts";
import { injectKey as competitionStoreKey } from "./competition_store.ts";
import { injectKey as exporterKey } from "./exporter.ts";

const lazy = <T>(ctor: () => T): { value: T } => {
  let instance: T;
  return {
    get value() {
      if (instance == null) instance = ctor();
      return instance;
    },
  };
};
const playersStore = lazy(() => resolve(playersStoreKey));
const setupStore = lazy(() => resolve(setupStoreKey));
const competitionStore = lazy(() => resolve(competitionStoreKey));
const exporter = lazy(() => resolve(exporterKey));

const stageSetupResultToStagePlayers = (setupResult: StageSetupResult) => {
  const stagePlayers: (StagePlayerEntry | undefined)[] = setupResult.entries
    .map(
      (e) => {
        const playerInfo = playersStore.value.getPlayer(e.name);
        if (playerInfo == null) throw new Error();
        const rawBestTime = playerInfo.bestTime;
        return {
          name: e.name,
          rawBestTime,
          handicap: e.handicap,
          bestTime: rawBestTime - e.handicap * 1000,
          startOrder: 0,
          startTime: 0,
          level: undefined,
          grade: undefined,
          time: undefined,
        };
      },
    );
  while (stagePlayers.length < 8) stagePlayers.push(undefined);
  const stagePlayersSorted = stagePlayers.filter((e) =>
    e != null
  ) as StagePlayerEntry[];
  stagePlayersSorted.sort((a, b) => b.bestTime - a.bestTime);
  stagePlayersSorted.forEach((e, i) => {
    e.startOrder = i + 1;
    e.startTime = stagePlayersSorted[0].bestTime - e.bestTime;
  });
  return {
    players: stagePlayers,
    result: [],
  };
};

export function mastersGetRegisteredPlayers(): RegisteredPlayerEntry[] {
  return playersStore.value.getRegisteredPlayers();
}

export function mastersRegisterPlayer(player: RegisteredPlayerEntry) {
  return playersStore.value.registerPlayer(player);
}

export function mastersUpdatePlayer(
  oldName: string,
  player: RegisteredPlayerEntry,
) {
  return playersStore.value.updatePlayer(oldName, player);
}

export function mastersGetParticipants(): Participant[] {
  return setupStore.value.getParticipants();
}

export function mastersSetParticipants(participants: Participant[]) {
  return setupStore.value.setParticipants(participants);
}

/**
 * 大会をセットアップ
 * @param manual マニュアルモード
 * @param manualNumberOfGames マニュアルモード時のゲーム数
 */
export function mastersSetupCompetition(options: CompetitionSetupOptions) {
  const participants = setupStore.value.getParticipants();

  // validate participants
  participants.forEach((participant) => {
    // TODO: duplicate check
    const { name } = participant;
    if (participants.filter((e) => e.name == participant.name).length != 1) {
      throw new Error("プレイヤーが重複しています: " + name);
    }
    if (playersStore.value.getPlayer(name) == null) {
      throw new Error("プレイヤーが登録されていません: " + name);
    }
  });

  const setupResult = setupCompetition(participants.length, options);
  competitionStore.value.reset();
  competitionStore.value.setMetadata(setupResult.metadata);

  const rounds = setupResult.metadata.rounds.map((round) => {
    const stages: StageData[] = round.stages.map((_) => ({
      players: [...new Array(8)],
      result: [],
    }));
    const supplementComparison: SupplementComparisonData[] = round
      .supplementComparisons.map((c) => ({ rankId: c.rankId, comparison: [] }));
    let qualifierScore: QualifierScore | undefined;
    let qualifierResult: QualifierResult | undefined;
    if (setupResult.metadata.type == "qualifierFinal") {
      qualifierScore = {
        players: participants.map((p) => ({
          name: p.name,
          totalPoints: 0,
          provisionalRankIndex: -1,
          stageResults: [],
        })),
      };
      qualifierResult = { result: [] };
    }
    return {
      stages,
      supplementComparison,
      qualifierScore,
      qualifierResult,
    };
  });
  competitionStore.value.setRounds(rounds);
}

export async function mastersExportCompetition(): Promise<{ url: string }> {
  return await exporter.value.exportCompetition();
}

export function mastersGetCurrentCompetitionMetadata():
  | CompetitionMetadata
  | undefined {
  return competitionStore.value.getMetadata();
}

export function mastersResetStage(
  roundIndex: number,
  stageIndex: number,
  setup: StageSetupResult,
) {
  const stageData = stageSetupResultToStagePlayers(setup);
  competitionStore.value.setStageData(roundIndex, stageIndex, stageData);
}

// TODO: fetch single stage
export function mastersGetStageData(
  roundIndex: number,
  stageIndices?: number[],
): StageData[] {
  const resolvedStageIndices: number[] = [];
  if (stageIndices != null) {
    resolvedStageIndices.push(...stageIndices);
  } else {
    const metadata = competitionStore.value.getMetadata();
    if (metadata == null) throw new Error();
    metadata.rounds[roundIndex].stages.forEach((_, i) =>
      resolvedStageIndices.push(i)
    );
  }

  const result: StageData[] = resolvedStageIndices.map((stageIndex) =>
    competitionStore.value.getStageData(roundIndex, stageIndex)
  );
  return result;
}

export function mastersGetSupplementComparisonData(
  roundIndex: number,
): SupplementComparisonData[] {
  const metadata = competitionStore.value.getMetadata();
  if (metadata == null) throw new Error();
  return metadata.rounds[roundIndex].supplementComparisons.map((definition) => {
    return competitionStore.value.getSupplementComparison(
      roundIndex,
      definition.rankId,
    );
  });
}

export function mastersGetQualifierScore(): QualifierScore {
  return competitionStore.value.getQualifierScore();
}

export function mastersGetQualifierResult(): QualifierResult {
  return competitionStore.value.getQualifierResult();
}

export function mastersReorderStagePlayers(
  roundIndex: number,
  stageIndex: number,
  names: (string | undefined)[],
) {
  const oldStageData = competitionStore.value.getStageData(
    roundIndex,
    stageIndex,
  );
  const newPlayers = names.map((name) => {
    if (name == null) return undefined;
    return oldStageData.players.find((e) => e?.name == name);
  });
  const newStageData = {
    players: newPlayers,
    result: oldStageData.result,
  };
  competitionStore.value.setStageData(roundIndex, stageIndex, newStageData);
}

export function mastersSetStageScore(
  roundIndex: number,
  stageIndex: number,
  score: StageScoreData,
) {
  const metadata = competitionStore.value.getMetadata();
  if (metadata == null) throw new Error();
  const oldStageData = competitionStore.value.getStageData(
    roundIndex,
    stageIndex,
  );

  const newPlayers = oldStageData.players.map((player) => {
    if (player == null) return undefined;

    const entry = score.players.find((e) => e.name == player.name);
    if (entry == null) return { ...player };

    return {
      ...player,
      level: entry.level,
      grade: entry.grade,
      time: entry.time,
      timeDetail: entry.timeDetail,
    };
  });

  const resultEntryStubs: StageResultEntryStub[] = [];
  newPlayers.forEach((player) => {
    if (player == null) return;
    resultEntryStubs.push(constructStageResultEntryStub(player));
  });
  const result = getStageResult(resultEntryStubs);

  const newStageData = {
    players: newPlayers,
    result: result,
  };
  competitionStore.value.setStageData(roundIndex, stageIndex, newStageData);

  if (isQualifierRound(metadata, roundIndex)) {
    const oldQualifierScore = competitionStore.value.getQualifierScore();

    const newPlayers = oldQualifierScore.players.map((player) => {
      let totalPoints = player.totalPoints;
      const stageResults = [...player.stageResults];
      const rankIndex = result.findIndex((e) => e.name == player.name);
      if (rankIndex >= 0) {
        const points = result.length - rankIndex;

        const oldIndex = stageResults.findIndex((e) =>
          e.stageIndex == stageIndex
        );
        if (oldIndex >= 0) {
          totalPoints += points - stageResults[oldIndex].points;
          stageResults[oldIndex] = {
            stageIndex,
            rankIndex,
            points,
          };
        } else {
          totalPoints += points;
          stageResults.push({
            stageIndex,
            rankIndex,
            points,
          });
        }
      }
      return {
        ...player,
        totalPoints,
        stageResults,
      };
    });

    // calculate and set provisioning standings
    const stageData = metadata.rounds[roundIndex].stages.map((_, stageIndex) =>
      competitionStore.value.getStageData(roundIndex, stageIndex)
    );
    const stageResults = stageData.map((e) => e.result);
    const numPlayersPerGroup =
      metadata.rounds[roundIndex].stages[0].fixedPlayerIndices!.length;
    const qualifierResultStubs = constructQualifierResultEntryStubs(
      stageResults,
      numPlayersPerGroup,
    );
    const qualifierResult = getQualifierResult(qualifierResultStubs);
    qualifierResult.forEach((result) => {
      const player = newPlayers.find((e) => e.name == result.name);
      player!.provisionalRankIndex = result.rank - 1;
    });

    const newQualifierScore = {
      players: newPlayers,
    };
    competitionStore.value.setQualifierScore(newQualifierScore);
  }
}

export function mastersTryInitializeRound(roundIndex: number): boolean {
  const metadata = competitionStore.value.getMetadata();
  if (metadata == null) throw new Error("metadata is null");

  if (metadata.presetName == null) return true; // マニュアル

  const firstStageData = competitionStore.value.getStageData(roundIndex, 0);
  const ready = firstStageData.players.some((e) => e != null);
  if (ready) return true;

  try {
    const dependencyDefinition = getDependencyForRound(metadata, roundIndex);
    const dependency: RoundDependencyData[] = dependencyDefinition.map(
      (definition) => {
        if (definition.type == "firstRoundEntry") {
          return {
            type: "firstRoundEntry",
            data: setupStore.value.getParticipants(),
          };
        } else if (definition.type == "qualifierRoundResult") {
          return {
            type: "qualifierRoundResult",
            result: competitionStore.value.getQualifierResult().result,
          };
        } else if (definition.type == "tournamentRoundResult") {
          const dependentRoundMetadata = metadata.rounds[definition.roundIndex];

          const stageResults: { result: StageResultEntry[] }[] =
            dependentRoundMetadata.stages.map((_, stageIndex) => {
              const stageData = competitionStore.value.getStageData(
                definition.roundIndex,
                stageIndex,
              );
              return {
                result: stageData.result,
              };
            });
          const supplementComparisons: {
            rankId: string;
            comparison: SupplementComparisonEntry[];
          }[] = dependentRoundMetadata.supplementComparisons.map(
            (comparison) => {
              const comparisonData = competitionStore.value
                .getSupplementComparison(
                  definition.roundIndex,
                  comparison.rankId,
                );
              return {
                rankId: comparison.rankId,
                comparison: comparisonData.comparison,
              };
            },
          );
          return {
            type: "tournamentRoundResult",
            roundIndex: definition.roundIndex,
            stageResults,
            supplementComparisons,
          };
        } else {
          throw new Error();
        }
      },
    );
    const result = setupRound(metadata, roundIndex, dependency);
    result.stages.forEach((stage, stageIndex) => {
      const stageData = stageSetupResultToStagePlayers(stage);
      competitionStore.value.setStageData(roundIndex, stageIndex, stageData);
    });

    return true;
  } catch (e) {
    if (e instanceof NotReadyError) {
      console.warn("not ready");
      return false;
    } else {
      throw e;
    }
  }
}

export function mastersTryFinalizeRound(roundIndex: number): boolean {
  const metadata = competitionStore.value.getMetadata();
  if (metadata == null) throw new Error("metadata is null");

  if (metadata.presetName == null) return true; // マニュアル

  try {
    const stageData = metadata.rounds[roundIndex].stages.map((_, stageIndex) =>
      competitionStore.value.getStageData(roundIndex, stageIndex)
    );
    const stageResults = stageData.map((e) => e.result);
    const result = finalizeRound(metadata, roundIndex, stageResults);

    if (result.type == "qualifierResult") {
      competitionStore.value.setQualifierResult(result.result);
    } else if (result.type == "supplementComparisons") {
      competitionStore.value.setSupplementComparisons(
        roundIndex,
        result.comparisons,
      );
    }
  } catch (e) {
    if (e instanceof NotReadyError) {
      console.warn("not ready");
      return false;
    } else {
      throw e;
    }
  }

  return true;
}
