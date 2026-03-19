import {
  CompetitionMetadata,
  DestinationInfo,
  HandicapMethod,
  Participant,
  RoundMetadata,
  StageMetadata,
  StageResultEntry,
  StageSetupPlayerEntry,
  SupplementComparisonMetadata,
} from "../common/common_types.ts";
import { groupIndexToString } from "../common/group.ts";
import { Preset } from "./preset.ts";
import {
  CompetitionSetupResult,
  NotReadyError,
  RoundDependencyData,
  RoundFinalizeResult,
  RoundSetupResult,
  SupplementComparisonEntryStub,
} from "./competition_types.ts";
import { compareStageScore, getSupplementComparison } from "./score_comparator.ts";
import { getNextSnakeIndex, resolveSnakeIndex } from "./distribution.ts";

export function getDependentRoundIndicesFromPreset(
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

export function getDependentRoundIndicesFromMetadata(
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

export function setupCompetitionWithTournament(
  name: string,
  preset: Preset,
  numOverallPlayers: number,
): CompetitionSetupResult {
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

/**
 * トーナメント形式の大会の参加プレイヤーをバリデーション
 * @param entries 参加プレイヤー
 * @param numGroups 現在の大会で想定されているグループ数
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

export function setupFirstRoundWithTournament(
  metadata: CompetitionMetadata,
  roundIndex: number,
  dependency: RoundDependencyData[],
): RoundSetupResult {
  // トーナメント1回戦
  if (roundIndex != 0) throw new Error();

  const firstRound = metadata.rounds[0];
  const stages = firstRound.stages.map((_) => ({ entries: [] as StageSetupPlayerEntry[] }));

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

export function setupSubsequentRoundWithTournament(
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
  const stages = groupStubs.map((group) => {
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

export function finalizeTournamentRound(
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

  const comparisons = roundMetadata.supplementComparisons.map((definition) => {
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
