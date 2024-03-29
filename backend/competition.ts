import {
  CompetitionMetadata,
  CompetitionSetupOptions,
  DestinationInfo,
  HandicapMethod,
  Participant,
  QualifierResult,
  QualifierResultEntry,
  RoundMetadata,
  StageMetadata,
  StagePlayerEntry,
  StageResultEntry,
  StageSetupPlayerEntry,
  StageSetupResult,
  SupplementComparisonData,
  SupplementComparisonEntry,
  SupplementComparisonMetadata,
} from "../common/common_types.ts";
import { getAppropriatePresetName, getPreset, Preset } from "./preset.ts";
import { groupIndexToString } from "../common/group.ts";
import { grades } from "../common/grade.ts";

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
export type CompetitionSetupResult = {
  metadata: CompetitionMetadata;
};

export type RoundSetupResult = {
  stages: StageSetupResult[];
};

export type RoundDependencyDefinition = {
  type: "firstRoundEntry";
} | {
  type: "qualifierRoundResult";
} | {
  type: "tournamentRoundResult";
  roundIndex: number;
};

export type RoundDependencyData = {
  type: "firstRoundEntry";
  data: Participant[];
} | {
  type: "qualifierRoundResult";
  result: QualifierResultEntry[];
} | {
  type: "tournamentRoundResult";
  roundIndex: number;
  stageResults: {
    result: StageResultEntry[];
  }[];
  supplementComparisons: {
    rankId: string;
    comparison: SupplementComparisonEntry[];
  }[];
};

export type RoundFinalizeResult = {
  type: "qualifierResult";
  result: QualifierResult;
} | {
  type: "supplementComparisons";
  comparisons: SupplementComparisonData[];
};

export type StageResultEntryStub = Omit<
  StageResultEntry,
  "rank" | "timeDiffTop" | "timeDiffPrev"
>;
type QualifierResultEntryStub = Omit<QualifierResultEntry, "rank">;
type SupplementComparisonEntryStub = Omit<
  SupplementComparisonEntry,
  "rank" | "timeDiffPrev"
>;

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
  const rounds: RoundMetadata[] = new Array(numGames).fill(null).map((
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

function setupCompetitionWithQualifier(
  name: string,
  preset: Preset,
  numPlayers: number,
): CompetitionSetupResult {
  // ポイント制予選
  if (preset.rounds.length != 2) throw new Error();

  const firstRound = preset.rounds[0];
  if (firstRound.qualifierPlayerIndices == null) throw new Error();

  const qualifierStages: StageMetadata[] = [];
  firstRound.qualifierPlayerIndices.forEach((indices, i) =>
    qualifierStages.push({
      name: `${firstRound.name} Heat${i + 1}`,
      numPlayers: indices.length,
      fixedPlayerIndices: indices,
      numWinners: 0,
      hasWildcard: false,
      numLosers: 0,
    })
  );

  const finalStages: StageMetadata[] = [{
    name: preset.rounds[1].name,
    numPlayers: 4,
    numWinners: 1,
    hasWildcard: false,
    numLosers: 3,
  }];

  const rounds: RoundMetadata[] = [{
    // 予選
    name: firstRound.name,
    stages: qualifierStages,
    numWildcardWinners: 0,
    winnersDestination: {
      roundIndex: 1,
      method: "standard",
      handicap: "winnersPure",
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

function setupCompetitionWithTournament(
  name: string,
  preset: Preset,
  numOverallPlayers: number,
): CompetitionSetupResult {
  // トーナメント

  const rounds: RoundMetadata[] = [];

  preset.rounds.forEach((round, roundIndex) => {
    // 各ステージの人数割り出し
    const stageNumPlayers = new Array(round.numGroups!).fill(0);
    if (roundIndex == 0) {
      // 開始ラウンドはエントリー数とグループ数から計算
      const quotient = Math.floor(numOverallPlayers / round.numGroups!);
      const remainder = numOverallPlayers % round.numGroups!;
      for (let i = 0; i < round.numGroups!; i++) {
        stageNumPlayers[i] = quotient + (i < remainder ? 1 : 0);
      }
    } else {
      // 以降のラウンドは前のラウンドの結果から計算
      const sendPlayers = (dependentRoundIndex: number, winner: boolean) => {
        const dependentRound = preset.rounds[dependentRoundIndex];
        const destinationMethod = winner
          ? dependentRound.winners!.destinationMethod
          : dependentRound.losers!.destinationMethod;

        let numSend = 0;
        for (let i = 0; i < dependentRound.numGroups!; i++) {
          const dependentStage = rounds[dependentRoundIndex].stages[i];
          if (dependentStage == null) throw new Error();
          const dependentStageNumWinners = dependentStage.numWinners;
          const dependentStageNumLosers = dependentStage.numLosers;
          numSend += winner
            ? dependentStageNumWinners
            : dependentStageNumLosers;
        }
        if (winner) {
          numSend += dependentRound.winners!.numWildcard;
        } else {
          if (
            dependentRound.winners != null &&
            dependentRound.winners.numWildcard > 0
          ) {
            numSend += dependentRound.numGroups! -
              dependentRound.winners!.numWildcard;
          }
        }

        if (destinationMethod == "standard") {
          const startSnakeIndex = getNextSnakeIndex(stageNumPlayers);
          for (let i = 0; i < numSend; i++) {
            const snakeIndex = (startSnakeIndex + i) %
              (stageNumPlayers.length * 2);
            stageNumPlayers[
              resolveSnakeIndex(snakeIndex, stageNumPlayers.length)
            ]++;
          }
        }
      };

      const dependents = getDependentRoundIndicesFromPreset(preset, roundIndex);
      dependents.forEach((dependentRoundIndex) => {
        const dependentRound = preset.rounds[dependentRoundIndex];
        if (
          dependentRound.winners != null &&
          dependentRound.winners.destinationRoundIndex == roundIndex
        ) {
          sendPlayers(dependentRoundIndex, true);
        }
        if (
          dependentRound.losers != null &&
          dependentRound.losers.destinationRoundIndex == roundIndex
        ) {
          sendPlayers(dependentRoundIndex, false);
        }
      });
    }

    // ステージ情報を埋める
    const stages: StageMetadata[] = [];
    for (let i = 0; i < round.numGroups!; i++) {
      const stageName = round.numGroups == 1
        ? round.name
        : `${round.name} ${groupIndexToString(i)}組`;
      const numPlayers = stageNumPlayers[i];
      const numWinners = round.winners != null ? round.winners.numPerGroup : -1;
      const numLosers = round.losers != null ? round.losers.numPerGroup : -1;
      const hasWildcard = round.winners != null
        ? round.winners.numWildcard > 0
        : false;
      const numWildcard = hasWildcard ? 1 : 0;
      let resolvedNumWinners: number;
      let resolvedNumLosers: number;
      if (numWinners == -1 && numLosers == -1) {
        // 決勝のみ許す
        if (roundIndex != preset.rounds.length - 1) throw new Error();
        resolvedNumWinners = 1;
        resolvedNumLosers = numPlayers - 1;
      } else if (numWinners > 0 && numLosers == -1) {
        resolvedNumWinners = numWinners;
        resolvedNumLosers = numPlayers - numWildcard - numWinners;
      } else if (numWinners == -1 && numLosers > 0) {
        resolvedNumWinners = numPlayers - numWildcard - numLosers;
        resolvedNumLosers = numLosers;
      } else if (numWinners > 0 && numLosers > 0) {
        if (numWinners + numWildcard + numLosers != numPlayers) {
          throw new Error();
        }
        resolvedNumWinners = numWinners;
        resolvedNumLosers = numLosers;
      } else {
        throw new Error();
      }

      stages.push({
        name: stageName,
        numPlayers,
        numWinners: resolvedNumWinners,
        hasWildcard,
        numLosers: resolvedNumLosers,
      });
    }

    // 補足情報の定義を埋める
    const supplementComparisons: SupplementComparisonMetadata[] = [];
    if (round.winners != null) {
      const numMaxWinners = Math.max(...stages.map((e) => e.numWinners));
      if (round.winners.destinationMethod == "standard") {
        // グループ数が1の場合は順位内比較を行う必要がないので補足情報も不要
        if (round.numGroups! > 1) {
          for (let i = 0; i < numMaxWinners; i++) {
            const numRankPlayers = stages.filter((e) =>
              e.numWinners > i
            ).length;
            if (numRankPlayers == 1) continue;
            supplementComparisons.push({
              rankId: `Tw${i}`,
              name: `${round.name} ${i + 1}位`,
              numPlayers: numRankPlayers,
            });
          }
        }
      }
      const hasWildcard = round.winners.numWildcard > 0;
      if (stages.some((e) => e.hasWildcard != hasWildcard)) throw new Error(); // ワイルドカード有無が揃ってない場合は未対応
      const numWildcard = hasWildcard ? 1 : 0;
      if (numWildcard > 0) {
        const unevenNumWinners = stages.some((e) =>
          e.numWinners != numMaxWinners
        );
        const comparisonName = unevenNumWinners
          ? `${round.name} ワイルドカード`
          : `${round.name} ${numMaxWinners + 1}位 (ワイルドカード)`;
        supplementComparisons.push({
          rankId: "W",
          name: comparisonName,
          numPlayers: round.numGroups!,
        });
      }
    }
    if (round.losers != null) {
      if (round.losers.destinationMethod == "standard") {
        // グループ数が1の場合は順位内比較を行う必要がないので補足情報も不要
        if (round.numGroups! > 1) {
          const numWinners = stages[0].numWinners;
          const unevenNumWinners = stages.some((e) =>
            e.numWinners != numWinners
          );
          const hasWildcard = stages[0].hasWildcard;
          if (stages.some((e) => e.hasWildcard != hasWildcard)) {
            throw new Error(); // 負けを並べるとき、ワイルドカード有無が揃ってない場合は未対応
          }
          const numWildcard = hasWildcard ? 1 : 0;
          const numMaxLosers = Math.max(...stages.map((e) => e.numLosers));
          const unevenNumLosers = stages.some((e) =>
            e.numLosers != numMaxLosers
          );
          if (!unevenNumWinners) {
            for (let i = 0; i < numMaxLosers; i++) {
              const rankIndex = numWinners + numWildcard + i;
              const numRankPlayers = stages.filter((e) =>
                e.numPlayers > rankIndex
              ).length;
              if (numRankPlayers == 1) continue;
              supplementComparisons.push({
                rankId: `Tl${rankIndex}`,
                name: `${round.name} ${rankIndex + 1}位`,
                numPlayers: numRankPlayers,
              });
            }
          } else if (!unevenNumLosers) {
            for (let i = 0; i < numMaxLosers; i++) {
              const numRankPlayers = stages.length;
              if (numRankPlayers == 1) continue;
              const comparisonName = i == numMaxLosers - 1
                ? `${round.name} 最下位`
                : `${round.name} 下から${numMaxLosers - i}位`;
              supplementComparisons.push({
                rankId: `B${numMaxLosers - i}`,
                name: comparisonName,
                numPlayers: numRankPlayers,
              });
            }
          } else {
            throw new Error(); // 勝ち数も負け数も揃ってないことはないはず
          }
        }
      }
    }

    const winnersDestination: DestinationInfo | undefined =
      round.winners != null
        ? {
          roundIndex: round.winners.destinationRoundIndex,
          method: round.winners.destinationMethod,
          handicap: round.winners.handicapMethod,
        }
        : undefined;

    const numWildcardWinners = round.winners != null
      ? round.winners.numWildcard
      : undefined;

    const losersDestination: DestinationInfo | undefined =
      round.losers != null && round.losers.destinationRoundIndex != null
        ? {
          roundIndex: round.losers.destinationRoundIndex,
          method: round.losers.destinationMethod!,
          handicap: "none",
        }
        : undefined;

    rounds.push({
      name: round.name,
      winnersDestination,
      numWildcardWinners,
      losersDestination,
      stages,
      supplementComparisons,
    });
  });

  return {
    metadata: {
      name,
      numPlayers: numOverallPlayers,
      presetName: preset.name,
      type: "tournament",
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

function setupFirstRoundWithQualifier(
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

  const stages: StageSetupResult[] = firstRound.stages.map((stageMetadata) => {
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

function setupFinalRoundWithQualifier(
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

  const stages: StageSetupResult[] = round.stages.map((_) => ({ entries: [] }));

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

/**
 * トーナメント形式の大会の参加プレイヤーをバリデーション
 * @param entries 参加プレイヤー
 * @param numPlayers 現在の大会で想定されている参加人数
 */
export function validateEntriesWithTournament(
  entries: Participant[],
  numGroups: number,
) {
  entries.forEach((e) => {
    if (e.firstRoundGroupIndex == null) {
      throw new Error("1回戦組が設定されていないプレイヤーがいます: " + e.name);
    }
    if (e.firstRoundGroupIndex == -1 || e.firstRoundGroupIndex >= numGroups) {
      throw new Error(
        "範囲外の1回戦組があります: " +
          groupIndexToString(e.firstRoundGroupIndex),
      );
    }
  });
}

function setupFirstRoundWithTournament(
  metadata: CompetitionMetadata,
  roundIndex: number,
  dependency: RoundDependencyData[],
): RoundSetupResult {
  // トーナメント1回戦
  if (roundIndex != 0) throw new Error();

  const firstRound = metadata.rounds[0];
  const stages: StageSetupResult[] = firstRound.stages.map((_) => ({
    entries: [],
  }));

  const entryDependency = dependency.find((e) => e.type == "firstRoundEntry");
  if (entryDependency == null) throw new Error();
  if (entryDependency.type != "firstRoundEntry") throw new Error();
  validateEntriesWithTournament(entryDependency.data, stages.length);
  entryDependency.data.forEach((e) => {
    const stagePlayerEntry = {
      name: e.name,
      handicap: 0,
    };
    stages[e.firstRoundGroupIndex!].entries.push(stagePlayerEntry);
  });

  const firstRoundGroupNumPlayers = stages.map((e) => e.entries.length);
  let failed = false;
  let diff = 0;
  for (let i = 1; i < firstRoundGroupNumPlayers.length; i++) {
    const prev = firstRoundGroupNumPlayers[i - 1];
    const curr = firstRoundGroupNumPlayers[i];
    if (prev < curr) failed = true;
    diff += prev - curr;
    if (diff >= 2) failed = true;
  }
  if (failed) {
    throw new Error(
      "1回戦組の振り分けが正しくありません。各グループの人数差は1以内で、かつ先のグループの方が人数が多くなっている必要があります: " +
        firstRoundGroupNumPlayers,
    );
  }

  return {
    stages,
  };
}

function setupSubsequentRoundWithTournament(
  metadata: CompetitionMetadata,
  roundIndex: number,
  dependency: RoundDependencyData[],
): RoundSetupResult {
  // トーナメント
  if (roundIndex == 0) throw new Error();

  const round = metadata.rounds[roundIndex];

  type StagePlayerEntryStub = {
    name: string;
    previousRoundRankIndex: number;
    previousRoundHandicapMethod: HandicapMethod;
  };
  const groupStubs: StagePlayerEntryStub[][] = round.stages.map((_) => []);

  const sendPlayers = (dependentRoundIndex: number, winner: boolean) => {
    const dependentRoundMetadata = metadata.rounds[dependentRoundIndex];
    const dependentStageMetadata = dependentRoundMetadata.stages;
    const destinationMethod = winner
      ? dependentRoundMetadata.winnersDestination!.method
      : dependentRoundMetadata.losersDestination!.method;

    const foundDependency = dependency.find((e) =>
      e.type == "tournamentRoundResult" && e.roundIndex == dependentRoundIndex
    );
    if (foundDependency == null) throw new Error();
    if (foundDependency.type != "tournamentRoundResult") throw new Error();
    const dependentStageResults = foundDependency.stageResults;

    // 全部のリザルトが揃っていることを確認
    dependentStageResults.forEach((stageResult, stageIndex) => {
      if (
        stageResult.result.length !=
          dependentStageMetadata[stageIndex].numPlayers
      ) throw new NotReadyError();
    });

    if (destinationMethod == "standard") {
      const sortedStubsToPut: StagePlayerEntryStub[] = [];

      if (winner) {
        const numMaxWinners = Math.max(
          ...dependentStageMetadata.map((e) => e.numWinners),
        );

        for (let i = 0; i < numMaxWinners; i++) {
          const rankIndex = i;

          const resultsPerRank: SupplementComparisonEntryStub[] = [];
          dependentStageMetadata.forEach(
            (dependentStage, dependentStageIndex) => {
              if (rankIndex >= dependentStage.numWinners) return;
              const dependentStageResult =
                dependentStageResults[dependentStageIndex].result[rankIndex];
              resultsPerRank.push(dependentStageResult);
            },
          );

          const sortedResultsPerRank = [...resultsPerRank];
          sortedResultsPerRank.sort(compareStageScore).reverse();

          sortedResultsPerRank.forEach((result) => {
            sortedStubsToPut.push({
              name: result.name,
              previousRoundHandicapMethod:
                dependentRoundMetadata.winnersDestination!.handicap,
              previousRoundRankIndex: rankIndex,
            });
          });
        }

        const hasWildcard = dependentRoundMetadata.numWildcardWinners! > 0;
        if (dependentStageMetadata.some((e) => e.hasWildcard != hasWildcard)) {
          throw new Error(); // ワイルドカード有無が揃ってない場合は未対応
        }
        if (hasWildcard) {
          const wildcardResults: SupplementComparisonEntryStub[] = [];
          const originalRankIndices: Record<string, number> = {};
          dependentStageMetadata.forEach(
            (dependentStage, dependentStageIndex) => {
              const rankIndex = dependentStage.numWinners;
              const dependentStageResult =
                dependentStageResults[dependentStageIndex].result[rankIndex];
              wildcardResults.push(dependentStageResult);
              originalRankIndices[dependentStageResult.name] = rankIndex;
            },
          );

          const sortedWildcardResults = [...wildcardResults];
          sortedWildcardResults.sort(compareStageScore).reverse();

          sortedWildcardResults.forEach((result, i) => {
            if (i >= dependentRoundMetadata.numWildcardWinners!) return;
            sortedStubsToPut.push({
              name: result.name,
              previousRoundHandicapMethod:
                dependentRoundMetadata.winnersDestination!.handicap,
              previousRoundRankIndex: originalRankIndices[result.name],
            });
          });
        }
      } else {
        // const numWinners = dependentStageMetadata[0].numWinners;
        // const unevenNumWinners = dependentStageMetadata.some((e) =>
        //   e.numWinners != numWinners
        // );
        const hasWildcard = dependentStageMetadata[0].hasWildcard;
        if (dependentStageMetadata.some((e) => e.hasWildcard != hasWildcard)) {
          throw new Error(); // 負けを並べるとき、ワイルドカード有無が揃ってない場合は未対応
        }
        const numWildcard = hasWildcard ? 1 : 0;
        const numMaxLosers = Math.max(
          ...dependentStageMetadata.map((e) => e.numLosers),
        );
        // const unevenNumLosers = dependentStageMetadata.some((e) =>
        //   e.numLosers != numMaxLosers
        // );

        if (hasWildcard) {
          const wildcardResults: SupplementComparisonEntryStub[] = [];
          const originalRankIndices: Record<string, number> = {};
          dependentStageMetadata.forEach(
            (dependentStage, dependentStageIndex) => {
              const rankIndex = dependentStage.numWinners;
              const dependentStageResult =
                dependentStageResults[dependentStageIndex].result[rankIndex];
              wildcardResults.push(dependentStageResult);
              originalRankIndices[dependentStageResult.name] = rankIndex;
            },
          );

          const sortedWildcardResults = [...wildcardResults];
          sortedWildcardResults.sort(compareStageScore).reverse();

          sortedWildcardResults.forEach((result, i) => {
            if (i < dependentRoundMetadata.numWildcardWinners!) return;
            sortedStubsToPut.push({
              name: result.name,
              previousRoundHandicapMethod:
                dependentRoundMetadata.losersDestination!.handicap,
              previousRoundRankIndex: originalRankIndices[result.name],
            });
          });
        }

        for (let i = 0; i < numMaxLosers; i++) {
          const resultsPerRank: SupplementComparisonEntryStub[] = [];
          const originalRankIndices: Record<string, number> = {};
          dependentStageMetadata.forEach(
            (dependentStage, dependentStageIndex) => {
              const rankIndex = dependentStage.numWinners + numWildcard + i;
              if (rankIndex >= dependentStage.numPlayers) return;
              const dependentStageResult =
                dependentStageResults[dependentStageIndex].result[rankIndex];
              resultsPerRank.push(dependentStageResult);
              originalRankIndices[dependentStageResult.name] = rankIndex;
            },
          );

          const sortedResultsPerRank = [...resultsPerRank];
          sortedResultsPerRank.sort(compareStageScore).reverse();

          sortedResultsPerRank.forEach((result) => {
            sortedStubsToPut.push({
              name: result.name,
              previousRoundHandicapMethod:
                dependentRoundMetadata.losersDestination!.handicap,
              previousRoundRankIndex: originalRankIndices[result.name],
            });
          });
        }
      }

      const startSnakeIndex = getNextSnakeIndex(
        groupStubs.map((e) => e.length),
      );
      sortedStubsToPut.forEach((stub, i) => {
        const snakeIndex = (startSnakeIndex + i) % (groupStubs.length * 2);
        groupStubs[resolveSnakeIndex(snakeIndex, groupStubs.length)].push(stub);
      });
    }
  };

  const dependents = getDependentRoundIndicesFromMetadata(metadata, roundIndex);
  dependents.forEach((dependentRoundIndex) => {
    const dependentRound = metadata.rounds[dependentRoundIndex];
    if (
      dependentRound.winnersDestination != null &&
      dependentRound.winnersDestination.roundIndex == roundIndex
    ) {
      sendPlayers(dependentRoundIndex, true);
    }
    if (
      dependentRound.losersDestination != null &&
      dependentRound.losersDestination.roundIndex == roundIndex
    ) {
      sendPlayers(dependentRoundIndex, false);
    }
  });

  // ハンディキャップを計算
  const assignHandicap = (
    playerIndex: number,
    entry: StagePlayerEntryStub,
  ): number => {
    switch (entry.previousRoundHandicapMethod) {
      case "none":
        return 0;
      case "winnersPure":
        if (entry.previousRoundRankIndex == 0) return -10;
        if (entry.previousRoundRankIndex == 1) return -5;
        return 0;
      case "winnersDest":
        if (playerIndex == 0) return -10;
        if (playerIndex == 1) return -5;
        return 0;
      case "winnersDest2":
        if (entry.previousRoundRankIndex == 0) {
          if (playerIndex == 0) return -10;
          if (playerIndex == 1) return -5;
        }
        return 0;
      case "losers":
        return 5;
      default:
        throw new Error();
    }
  };
  const stages: StageSetupResult[] = groupStubs.map((group) => {
    const entries: StageSetupPlayerEntry[] = group.map((entry, playerIndex) => {
      return {
        name: entry.name,
        handicap: assignHandicap(playerIndex, entry),
      };
    });

    return {
      entries,
    };
  });

  return {
    stages,
  };
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

function finalizeQualifierRound(
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

  // プレイヤーごとの情報
  const qualifierPlayerData: {
    name: string;
    participatingStageResults: StageResultEntry[];
  }[] = [];
  stageResults.forEach((stageResult) => {
    stageResult.forEach((e) => {
      let entry = qualifierPlayerData.find((q) => q.name == e.name);
      if (entry == null) {
        entry = {
          name: e.name,
          participatingStageResults: [],
        };
        qualifierPlayerData.push(entry);
      }

      entry.participatingStageResults.push(e);
    });
  });

  const qualifierResultStubs: QualifierResultEntryStub[] = qualifierPlayerData
    .map((e) => {
      let points = 0;
      const numPlaces = new Array(4).fill(0);
      e.participatingStageResults.forEach((resultEntry) => {
        // タイのときは同点入ってる
        points += numPlayersPerGroup - resultEntry.rank + 1;
        numPlaces[resultEntry.rank - 1]++;
      });

      e.participatingStageResults.sort(compareStageScore);
      const bestResult =
        e.participatingStageResults[e.participatingStageResults.length - 1];

      return {
        name: e.name,
        points,
        numPlaces,
        bestGameGrade: bestResult.grade,
        bestGameLevel: bestResult.level,
        bestGameTimeDiffBest: bestResult.timeDiffBest,
      };
    });

  const qualifierResult = getQualifierResult(qualifierResultStubs);
  return {
    type: "qualifierResult",
    result: {
      result: qualifierResult,
    },
  };
}

function finalizeTournamentRound(
  metadata: CompetitionMetadata,
  roundIndex: number,
  stageResults: StageResultEntry[][],
): RoundFinalizeResult {
  const roundMetadata = metadata.rounds[roundIndex];

  // 全部のリザルトが揃っていることを確認
  if (stageResults.length != roundMetadata.stages.length) throw new Error();
  stageResults.forEach((stageResult, stageIndex) => {
    if (stageResult.length != roundMetadata.stages[stageIndex].numPlayers) {
      throw new NotReadyError();
    }
  });

  const comparisons: SupplementComparisonData[] = roundMetadata
    .supplementComparisons.map((definition) => {
      const stubs: SupplementComparisonEntryStub[] = [];

      if (definition.rankId.startsWith("Tw")) {
        // 上から (勝ちプレイヤーのみ)
        const rankNumber = Number(definition.rankId.slice(2));
        stageResults.forEach((stageResult, stageIndex) => {
          const stageMetadata = roundMetadata.stages[stageIndex];
          const rankIndex = rankNumber;
          if (rankNumber < stageMetadata.numWinners) {
            stubs.push(stageResult[rankIndex]);
          }
        });
      } else if (definition.rankId.startsWith("Tl")) {
        // 上から (負けプレイヤーのみ)
        const rankNumber = Number(definition.rankId.slice(2));
        stageResults.forEach((stageResult, stageIndex) => {
          const stageMetadata = roundMetadata.stages[stageIndex];
          const rankIndex = rankNumber;
          if (
            stageMetadata.numWinners + (stageMetadata.hasWildcard ? 1 : 0) <=
              rankNumber && rankNumber < stageMetadata.numPlayers
          ) {
            stubs.push(stageResult[rankIndex]);
          }
        });
      } else if (definition.rankId == "W") {
        // ワイルドカード
        stageResults.forEach((stageResult, stageIndex) => {
          const stageMetadata = roundMetadata.stages[stageIndex];
          const rankIndex = stageMetadata.numWinners;
          if (!stageMetadata.hasWildcard) throw new Error();
          stubs.push(stageResult[rankIndex]);
        });
      } else if (definition.rankId.startsWith("B")) {
        // 下から
        const rankNumber = Number(definition.rankId.slice(1));
        stageResults.forEach((stageResult, stageIndex) => {
          const stageMetadata = roundMetadata.stages[stageIndex];
          const rankIndex = stageMetadata.numPlayers - rankNumber;
          if (rankNumber <= stageMetadata.numLosers) {
            stubs.push(stageResult[rankIndex]);
          }
        });
      } else {
        throw new Error();
      }

      if (stubs.length != definition.numPlayers) throw new Error();

      const comparison = getSupplementComparison(stubs);
      return {
        rankId: definition.rankId,
        comparison,
      };
    });

  return {
    type: "supplementComparisons",
    comparisons,
  };
}

export function getNumOverallStages(metadata: CompetitionMetadata): number {
  return metadata.rounds.map((e) => e.stages.length).reduce((a, b) => a + b);
}

export function overallStageIndexToRoundGroupIndex(
  metadata: CompetitionMetadata,
  overallStageIndex: number,
): { roundIndex: number; groupIndex: number } | null {
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
  return null;
}

export function roundGroupIndexToOverallStageIndex(
  metadata: CompetitionMetadata,
  roundGroup: { roundIndex: number; groupIndex: number },
): number | null {
  const { roundIndex, groupIndex } = roundGroup;
  if (roundIndex < 0 || metadata.rounds.length <= roundIndex) return null;
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

function getDependentRoundIndicesFromPreset(
  preset: Preset,
  roundIndex: number,
): number[] {
  const result: number[] = [];
  preset.rounds.forEach((e, i) => {
    if (e.winners != null && e.winners.destinationRoundIndex == roundIndex) {
      result.push(i);
    }
    if (e.losers != null && e.losers.destinationRoundIndex == roundIndex) {
      result.push(i);
    }
  });
  return result;
}

function getDependentRoundIndicesFromMetadata(
  metadata: CompetitionMetadata,
  roundIndex: number,
): number[] {
  const result: number[] = [];
  metadata.rounds.forEach((e, i) => {
    if (
      e.winnersDestination != null &&
      e.winnersDestination.roundIndex == roundIndex
    ) result.push(i);
    if (
      e.losersDestination != null &&
      e.losersDestination.roundIndex == roundIndex
    ) result.push(i);
  });
  return result;
}

function getNextSnakeIndex(numFilledPlayers: number[]): number {
  let state = 0;
  let changedIndex = -1;
  for (let i = 0; i < numFilledPlayers.length - 1; i++) {
    const a = numFilledPlayers[i];
    const b = numFilledPlayers[i + 1];
    if (a == b) {
      continue;
    } else if (a + 1 == b) {
      if (state != 0) throw new Error();
      state = -1;
      changedIndex = i;
    } else if (a == b + 1) {
      if (state != 0) throw new Error();
      state = 1;
      changedIndex = i;
    } else {
      throw new Error();
    }
  }

  if (state == 0) {
    if (numFilledPlayers[0] % 2 == 0) {
      // 各グループ同数で、偶数人埋まっている -> 下向き
      return 0;
    } else {
      // 各グループ同数で、奇数人埋まっている -> 上向き
      return numFilledPlayers.length;
    }
  } else if (state == -1) {
    // 後ろのグループの方が人数が多い -> 上向き
    if (numFilledPlayers[0] % 2 != 1) throw new Error();
    return numFilledPlayers.length * 2 - 1 - changedIndex;
  } else if (state == 1) {
    // 前のグループの方が人数が多い -> 下向き
    if (numFilledPlayers[0] % 2 != 1) throw new Error();
    return changedIndex + 1;
  }

  throw new Error();
}

function resolveSnakeIndex(snakeIndex: number, numGroups: number): number {
  return snakeIndex < numGroups ? snakeIndex : numGroups * 2 - 1 - snakeIndex;
}

export function compareStageScore(
  a: StageResultEntryStub,
  b: StageResultEntryStub,
): number {
  if (a.grade != null && b.grade == null) return 1;
  if (a.grade == null && b.grade != null) return -1;
  if (a.grade != null && b.grade != null) {
    // grade-time sort
    if (a.grade != b.grade) return a.grade - b.grade;
    if (a.timeDiffBest != null && b.timeDiffBest != null) {
      return -(a.timeDiffBest - b.timeDiffBest);
    }
    // この3パターンは結果が正常に入力されていないとき
    if (a.timeDiffBest != null && b.timeDiffBest == null) return 1;
    if (a.timeDiffBest == null && b.timeDiffBest != null) return -1;
    if (a.timeDiffBest == null && b.timeDiffBest == null) return 0;
  }
  // level sort
  return a.level - b.level;
}

export function compareQualifierScore(
  a: QualifierResultEntryStub,
  b: QualifierResultEntryStub,
): number {
  if (a.points != b.points) return a.points - b.points;
  for (let i = 0; i < 4; i++) {
    if (a.numPlaces[i] != b.numPlaces[i]) {
      return a.numPlaces[i] - b.numPlaces[i];
    }
  }
  if (a.bestGameGrade != null && b.bestGameGrade == null) return 1;
  if (a.bestGameGrade == null && b.bestGameGrade != null) return -1;
  if (
    a.bestGameGrade != null && b.bestGameGrade != null &&
    a.bestGameTimeDiffBest != null && b.bestGameTimeDiffBest != null
  ) {
    // grade-time sort
    if (a.bestGameGrade != b.bestGameGrade) {
      return a.bestGameGrade - b.bestGameGrade;
    }
    return -(a.bestGameTimeDiffBest - b.bestGameTimeDiffBest);
  }
  // level sort
  return a.bestGameLevel - b.bestGameLevel;
}

export function constructStageResultEntryStub(
  player: StagePlayerEntry,
): StageResultEntryStub {
  return {
    name: player.name,
    level: player.level != null ? player.level : 0,
    grade: player.grade,
    time: player.time,
    timeDiffBest: player.time != null ? player.time - player.bestTime : null,
  };
}

/**
 * ステージのスコアをソートしてリザルトとして出力
 * @param scores
 * @returns
 */
export function getStageResult(
  scores: StageResultEntryStub[],
): StageResultEntry[] {
  const sorted = [...scores];
  sorted.sort(compareStageScore).reverse();

  const result: StageResultEntry[] = [];
  const topScore = sorted[0];
  for (let i = 0; i < sorted.length; i++) {
    const currentScore = sorted[i];
    const prevScore = i > 0 ? sorted[i - 1] : null;

    let timeDiffTop: number | null = null;
    if (
      i > 0 && currentScore.grade == grades.GM && topScore.grade == grades.GM
    ) {
      if (
        currentScore.timeDiffBest == null || topScore.timeDiffBest == null
      ) throw new Error("結果が正常に入力されていません");
      timeDiffTop = currentScore.timeDiffBest - topScore.timeDiffBest;
    }

    // 段位が同じときのみ比較する
    let timeDiffPrev: number | null = null;
    if (
      prevScore != null &&
      (currentScore.grade != null && currentScore.grade == prevScore.grade)
    ) {
      if (currentScore.timeDiffBest == null || prevScore.timeDiffBest == null) {
        throw new Error("結果が正常に入力されていません");
      }
      timeDiffPrev = currentScore.timeDiffBest - prevScore.timeDiffBest;
    }

    let rank: number;
    if (prevScore != null && compareStageScore(currentScore, prevScore) == 0) {
      rank = result[i - 1].rank;
    } else {
      rank = i + 1;
    }

    result.push({ ...currentScore, rank, timeDiffTop, timeDiffPrev });
  }

  return result;
}

function getSupplementComparison(
  scores: SupplementComparisonEntryStub[],
): SupplementComparisonEntry[] {
  const sorted = [...scores];
  sorted.sort(compareStageScore).reverse();

  const result: SupplementComparisonEntry[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const currentScore = sorted[i];
    const prevScore = i > 0 ? sorted[i - 1] : null;

    // 段位が同じときのみ比較する
    let timeDiffPrev: number | null = null;
    if (
      prevScore != null &&
      (currentScore.grade != null && currentScore.grade == prevScore.grade)
    ) {
      if (currentScore.timeDiffBest == null || prevScore.timeDiffBest == null) {
        throw new Error("結果が正常に入力されていません");
      }
      timeDiffPrev = currentScore.timeDiffBest - prevScore.timeDiffBest;
    }

    let rank: number;
    if (prevScore != null && compareStageScore(currentScore, prevScore) == 0) {
      rank = result[i - 1].rank;
    } else {
      rank = i + 1;
    }

    result.push({ ...currentScore, rank, timeDiffPrev });
  }

  return result;
}

function getQualifierResult(
  scores: QualifierResultEntryStub[],
): QualifierResultEntry[] {
  const sorted = [...scores];
  sorted.sort(compareQualifierScore).reverse();

  const result: QualifierResultEntry[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const currentScore = sorted[i];
    const prevScore = i > 0 ? sorted[i - 1] : null;

    let rank: number;
    if (
      prevScore != null && compareQualifierScore(currentScore, prevScore) == 0
    ) {
      rank = result[i - 1].rank;
    } else {
      rank = i + 1;
    }

    result.push({ ...currentScore, rank });
  }

  return result;
}

/**
 * 以前のラウンドの結果が揃っていないのでセットアップが続けられない
 */
export class NotReadyError extends Error {
  constructor() {
    super();
    this.name = "NotReadyError";
    Object.setPrototypeOf(this, NotReadyError.prototype);
  }
}
