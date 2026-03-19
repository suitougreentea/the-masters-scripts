import {
  CompetitionMetadata,
  Participant,
  StageResultEntry,
  StageSetupPlayerEntry,
} from "../common/common_types.ts";
import { groupIndexToString } from "../common/group.ts";
import { Preset } from "./preset.ts";
import {
  CompetitionSetupResult,
  NotReadyError,
  RoundDependencyData,
  RoundFinalizeResult,
  RoundSetupResult,
} from "./competition_types.ts";
import {
  constructQualifierResultEntryStubs,
  getQualifierResult,
} from "./score_comparator.ts";

export function setupCompetitionWithQualifier(
  name: string,
  preset: Preset,
  numPlayers: number,
): CompetitionSetupResult {
  // ポイント制予選
  if (preset.rounds.length != 2) throw new Error();

  const firstRound = preset.rounds[0];
  if (firstRound.qualifierPlayerIndices == null) throw new Error();

  const qualifierStages = firstRound.qualifierPlayerIndices.map(
    (indices, i) => ({
      name: `${firstRound.name} Heat${i + 1}`,
      numPlayers: indices.length,
      fixedPlayerIndices: indices,
      numWinners: 0,
      hasWildcard: false,
      numLosers: 0,
    }),
  );

  const finalStages = [{
    name: preset.rounds[1].name,
    numPlayers: 4,
    numWinners: 1,
    hasWildcard: false,
    numLosers: 3,
  }];

  const rounds = [{
    // 予選
    name: firstRound.name,
    stages: qualifierStages,
    numWildcardWinners: 0,
    winnersDestination: {
      roundIndex: 1,
      method: "standard" as const,
      handicap: "winnersPure" as const,
    },
    supplementComparisons: [],
  }, {
    // 決勝
    name: preset.rounds[1].name,
    stages: finalStages,
    supplementComparisons: [],
  }];

  return {
    metadata: {
      name,
      numPlayers,
      presetName: preset.name,
      type: "qualifierFinal",
      rounds,
    },
  };
}

/**
 * 予選形式の大会の参加プレイヤーをバリデーション
 * @param entries 参加プレイヤー
 * @param numPlayers 現在の大会で想定されている参加人数
 */
export function validateEntriesWithQualifier(
  entries: Participant[],
  numPlayers: number,
) {
  entries.forEach((e) => {
    if (e.firstRoundGroupIndex == null) {
      throw new Error("1回戦組が設定されていないプレイヤーがいます: " + e.name);
    }
    if (e.firstRoundGroupIndex == -1 || e.firstRoundGroupIndex >= numPlayers) {
      throw new Error(
        "範囲外の1回戦組があります: " +
          groupIndexToString(e.firstRoundGroupIndex),
      );
    }
    if (
      entries.filter((f) => e.firstRoundGroupIndex == f.firstRoundGroupIndex)
        .length != 1
    ) {
      throw new Error(
        "1回戦組に重複があります: " +
          groupIndexToString(e.firstRoundGroupIndex),
      );
    }
  });
}

export function setupFirstRoundWithQualifier(
  metadata: CompetitionMetadata,
  roundIndex: number,
  dependency: RoundDependencyData[],
): RoundSetupResult {
  // ポイント制予選
  if (roundIndex != 0) throw new Error();

  const firstRound = metadata.rounds[0];

  const entryDependency = dependency.find((e) => e.type == "firstRoundEntry");
  if (entryDependency == null) throw new Error();
  if (entryDependency.type != "firstRoundEntry") throw new Error();
  validateEntriesWithQualifier(entryDependency.data, metadata.numPlayers!);

  const stages = firstRound.stages.map((stageMetadata) => {
    const playerIndices = stageMetadata.fixedPlayerIndices;
    if (playerIndices == null) throw new Error();

    const stageEntries: StageSetupPlayerEntry[] = playerIndices.map((i) => {
      const foundEntry = entryDependency.data.find((e) =>
        e.firstRoundGroupIndex == i
      );
      if (foundEntry == null) throw new Error();
      return {
        name: foundEntry.name,
        handicap: 0,
      };
    });

    return {
      entries: stageEntries,
    };
  });

  return {
    stages,
  };
}

export function setupFinalRoundWithQualifier(
  metadata: CompetitionMetadata,
  roundIndex: number,
  dependency: RoundDependencyData[],
): RoundSetupResult {
  // ポイント戦決勝
  if (roundIndex != 1) throw new Error();

  const round = metadata.rounds[1];
  if (round.stages.length != 1) throw new Error();

  const qualifierDependency = dependency.find((e) =>
    e.type == "qualifierRoundResult"
  );
  if (qualifierDependency == null) throw new Error();
  if (qualifierDependency.type != "qualifierRoundResult") throw new Error();

  // 全部のリザルトが揃っていることを確認
  if (qualifierDependency.result.length != metadata.numPlayers) {
    throw new NotReadyError();
  }

  const stages = round.stages.map((_) => ({ entries: [] as StageSetupPlayerEntry[] }));

  const assignHandicap = (rankIndex: number): number => {
    if (rankIndex == 0) return -10;
    if (rankIndex == 1) return -5;
    return 0;
  };
  for (let i = 0; i < 4; i++) {
    const qualifierResultEntry = qualifierDependency.result[i];
    stages[0].entries.push({
      name: qualifierResultEntry.name,
      handicap: assignHandicap(i),
    });
  }

  return {
    stages,
  };
}

export function finalizeQualifierRound(
  metadata: CompetitionMetadata,
  roundIndex: number,
  stageResults: StageResultEntry[][],
): RoundFinalizeResult {
  if (roundIndex != 0) throw new Error();

  const qualifierRound = metadata.rounds[0];
  if (qualifierRound.stages[0].fixedPlayerIndices == null) throw new Error();
  const numPlayersPerGroup = qualifierRound.stages[0].fixedPlayerIndices.length;
  if (
    qualifierRound.stages.some((e) =>
      e.fixedPlayerIndices == null ||
      e.fixedPlayerIndices.length != numPlayersPerGroup
    )
  ) throw new Error();

  // 全部のリザルトが揃っていることを確認
  if (
    stageResults.some((stageResult) => stageResult.length != numPlayersPerGroup)
  ) throw new NotReadyError();

  const qualifierResultStubs = constructQualifierResultEntryStubs(
    stageResults,
    numPlayersPerGroup,
  );
  const qualifierResult = getQualifierResult(qualifierResultStubs);
  return {
    type: "qualifierResult",
    result: {
      result: qualifierResult,
    },
  };
}
