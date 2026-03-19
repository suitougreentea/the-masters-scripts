import {
  CompetitionMetadata,
  CompetitionSetupOptions,
  RoundMetadata,
  StageResultEntry,
} from "../common/common_types.ts";
import { getAppropriatePresetName, getPreset } from "./preset.ts";
export type {
  CompetitionSetupResult,
  QualifierResultEntryStub,
  RoundDependencyData,
  RoundDependencyDefinition,
  RoundFinalizeResult,
  RoundSetupResult,
  StageResultEntryStub,
  SupplementComparisonEntryStub,
} from "./competition_types.ts";
export { NotReadyError } from "./competition_types.ts";
export {
  compareQualifierScore,
  compareStageScore,
  constructQualifierResultEntryStubs,
  constructStageResultEntryStub,
  getQualifierResult,
  getStageResult,
  getSupplementComparison,
} from "./score_comparator.ts";
export {
  validateEntriesWithTournament,
} from "./tournament_setup.ts";
export {
  validateEntriesWithQualifier,
} from "./qualifier_setup.ts";
import {
  setupCompetitionWithTournament,
  setupFirstRoundWithTournament,
  setupSubsequentRoundWithTournament,
  getDependentRoundIndicesFromMetadata,
  finalizeTournamentRound,
} from "./tournament_setup.ts";
import {
  setupCompetitionWithQualifier,
  setupFirstRoundWithQualifier,
  setupFinalRoundWithQualifier,
  finalizeQualifierRound,
} from "./qualifier_setup.ts";
import {
  CompetitionSetupResult,
  RoundDependencyData,
  RoundDependencyDefinition,
  RoundFinalizeResult,
  RoundSetupResult,
} from "./competition_types.ts";

/**
 * [用語]
 * * Round: "1回戦", "敗者復活", "決勝"などの単位
 * * Group: 1回戦の中の "A組", "B組", あるいは予選の中の "Heat1" という単位。
 * * Stage: 実際に行われる1試合。(Round, Group) の組で Stage が定まるので、Roundの中ではGroupと区別せずに用いることが多い。
 * * Qualifier: ポイント式の予選
 * * Tournament: ポイント式の予選→決勝ではなく、1回戦→2回戦→…と勝ち上がっていく形式のこと
 * * Wildcard: 同着順の成績比較によって進出あるいは敗退が決まる着順のこと。
 *             例えば3グループから8人が次のラウンドに進出する場合、1, 2位の計6名はそのまま進出するが、
 *             3位は3名の中から成績の良い2名が進出する。
 * * Supplement comparison: 同着順の成績比較情報。
 *
 * 実際の試合処理の流れについてはcompetition_sheet.tsを参照
 */

/**
 * 人数に応じて大会をセットアップ。ステージやsupplement comparisonの情報を割り出す。
 * @param numPlayers 参加人数
 * @param manualNumberOfGames プリセットモードの場合はnull, マニュアルモードの場合はゲーム数
 * @returns セットアップ結果
 */
export function setupCompetition(
  numPlayers: number,
  options: CompetitionSetupOptions,
): CompetitionSetupResult {
  if (options.manualNumberOfGames != null) {
    return setupCompetitionManual(options.name, options.manualNumberOfGames);
  } else {
    const presetName = options.overridePresetName != null
      ? options.overridePresetName
      : getAppropriatePresetName(numPlayers);
    if (presetName == null) {
      throw new Error(
        `${numPlayers}人に適切なプリセットが見つかりませんでした`,
      );
    }
    const preset = getPreset(presetName);

    if (
      !(preset.supportedNumberOfPlayers[0] <= numPlayers &&
        numPlayers <= preset.supportedNumberOfPlayers[1])
    ) {
      throw new Error(
        `プリセット${presetName}は${preset.supportedNumberOfPlayers[0]}～${
          preset.supportedNumberOfPlayers[1]
        }人にのみ対応しています`,
      );
    }

    if (preset.type == "qualifierFinal") {
      return setupCompetitionWithQualifier(options.name, preset, numPlayers);
    } else if (preset.type == "tournament") {
      return setupCompetitionWithTournament(options.name, preset, numPlayers);
    }
    throw new Error();
  }
}

function setupCompetitionManual(
  name: string,
  numGames: number,
): CompetitionSetupResult {
  const rounds: RoundMetadata[] = [...new Array(numGames)].map((
    _,
    i,
  ) => ({
    name: String(i + 1),
    roundIndex: i,
    stages: [{
      name: String(i + 1),
      numPlayers: 8,
      numWinners: 0,
      hasWildcard: false,
      numLosers: 0,
    }],
    supplementComparisons: [],
    numWildcardWinners: -1,
  }));

  return {
    metadata: {
      name,
      rounds,
    },
  };
}

export function getDependencyForRound(
  metadata: CompetitionMetadata,
  roundIndex: number,
): RoundDependencyDefinition[] {
  const dependency: RoundDependencyDefinition[] = [];

  if (roundIndex == 0) {
    dependency.push({ type: "firstRoundEntry" });
    return dependency;
  } else {
    if (metadata.type == "qualifierFinal") {
      if (roundIndex != 1) throw new Error();
      dependency.push({ type: "qualifierRoundResult" });
      return dependency;
    } else if (metadata.type == "tournament") {
      const dependentRoundIndices = getDependentRoundIndicesFromMetadata(
        metadata,
        roundIndex,
      );
      dependentRoundIndices.forEach((dependentRoundIndex) =>
        dependency.push({
          type: "tournamentRoundResult",
          roundIndex: dependentRoundIndex,
        })
      );
      return dependency;
    }
  }
  throw new Error();
}

/**
 * 指定したラウンドをセットアップ。以前のラウンドの結果から参加プレイヤーを割り出す。
 * @throws 以前のラウンドの結果が不十分な場合、NotReadyError
 */
export function setupRound(
  metadata: CompetitionMetadata,
  roundIndex: number,
  dependency: RoundDependencyData[],
): RoundSetupResult {
  if (roundIndex == 0) {
    if (metadata.type == "qualifierFinal") {
      return setupFirstRoundWithQualifier(metadata, roundIndex, dependency);
    } else if (metadata.type == "tournament") {
      return setupFirstRoundWithTournament(metadata, roundIndex, dependency);
    }
  } else {
    if (metadata.type == "qualifierFinal") {
      if (roundIndex != 1) throw new Error();
      return setupFinalRoundWithQualifier(metadata, roundIndex, dependency);
    } else if (metadata.type == "tournament") {
      return setupSubsequentRoundWithTournament(
        metadata,
        roundIndex,
        dependency,
      );
    }
  }
  throw new Error();
}

export function finalizeRound(
  metadata: CompetitionMetadata,
  roundIndex: number,
  stageResults: StageResultEntry[][],
): RoundFinalizeResult {
  if (metadata.type == "qualifierFinal" && roundIndex == 0) {
    return finalizeQualifierRound(metadata, roundIndex, stageResults);
  } else {
    return finalizeTournamentRound(metadata, roundIndex, stageResults);
  }
}

export function getNumOverallStages(metadata: CompetitionMetadata): number {
  return metadata.rounds.map((e) => e.stages.length).reduce((a, b) => a + b);
}

export function overallStageIndexToRoundGroupIndex(
  metadata: CompetitionMetadata,
  overallStageIndex: number,
): { roundIndex: number; groupIndex: number } | undefined {
  let startIndex = 0;
  for (let i = 0; i < metadata.rounds.length; i++) {
    const round = metadata.rounds[i];
    const numGroups = round.stages.length;
    if (
      startIndex <= overallStageIndex &&
      overallStageIndex < startIndex + numGroups
    ) {
      return { roundIndex: i, groupIndex: overallStageIndex - startIndex };
    }
    startIndex += numGroups;
  }
  return undefined;
}

export function roundGroupIndexToOverallStageIndex(
  metadata: CompetitionMetadata,
  roundGroup: { roundIndex: number; groupIndex: number },
): number | undefined {
  const { roundIndex, groupIndex } = roundGroup;
  if (roundIndex < 0 || metadata.rounds.length <= roundIndex) return undefined;
  let startIndex = 0;
  for (let i = 0; i < roundIndex - 1; i++) {
    const round = metadata.rounds[i];
    const numGroups = round.stages.length;
    startIndex += numGroups;
  }
  return startIndex + groupIndex;
}

export function isQualifierRound(
  metadata: CompetitionMetadata,
  roundIndex: number,
) {
  return metadata.type == "qualifierFinal" && roundIndex == 0;
}
