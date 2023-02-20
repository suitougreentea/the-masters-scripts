namespace Competition {
  export type PlayerEntry = {
    name: string;
    firstRoundGroupIndex: number | null;
  };

  export type CompetitionSetupResult = {
    preset: Preset.Preset | null; // マニュアルモードのときnull
    numPlayers: number | null; // マニュアルモードのときnull
    stages: StageSetupResult[];
    supplementComparisons: SupplementComparisonSetupResult[];
  };
  export type StageSetupResult = { roundIndex: number, groupIndex: number, name: string, numPlayers: number, numWinners: number, hasWildcard: boolean, numLosers: number };
  // rankId: T{number}: 上位から (>=0), B{number}: 下位から (>0), W: ワイルドカード
  export type SupplementComparisonSetupResult = { roundIndex: number, rankId: string, name: string, numPlayers: number };

  export type CompetitionIO = {
    readEntries(): PlayerEntry[];
    readQualifierTable(): QualifierTableEntry[];
    // readStageEntries(roundIndex: number, groupIndex: number): (StagePlayerEntry | null)[];
    readStageResult(roundIndex: number, groupIndex: number): StagePlayerResult[];
    writeQualifierResult(result: QualifierPlayerResult[]): void;
    // readSupplementComparison(roundIndex: number, rankId: string): StagePlayerResult[];
    writeSupplementComparison(roundIndex: number, rankId: string, result: SupplementComparisonResult[]): void;
  }

  export type RoundSetupResult = {
    groups: {
      entries: StagePlayerEntry[];
    }[];
  }

  export type StagePlayerEntry = { name: string, handicap: number };
  export type StageInfo = { setupResult: StageSetupResult, ready: boolean, players: (StagePlayerEntry | null)[] };
  export type StageTimerInfo = { stageResult: StageSetupResult, ready: boolean, players: (StageTimerPlayerData | null)[] };
  export type StageTimerPlayerData = { name: string, rawBestTime: number, handicap: number, bestTime: number, startOrder: number, startTime: number };

  export type StagePlayerScore = {
    name: string;
    grade: Grade.Grade | null;
    time: Time.Time | null;
    level: number;
    bestTime: Time.Time;
  };

  export type StagePlayerResult = StagePlayerScore & {
    rank: number;
    timeDiffBest: Time.Time | null;
    timeDiffTop: Time.Time | null;
    timeDiffPrev: Time.Time | null;
  };

  export type SupplementComparisonEntry = StagePlayerScore & {
    originalRankIndex: number;
  }

  export type SupplementComparisonResult = SupplementComparisonEntry & {
    rank: number;
    timeDiffBest: Time.Time | null;
    timeDiffPrev: Time.Time | null;
  }

  export type QualifierTableEntry = {
    name: string;
    totalPoints: number;
    stageResults: { stageIndex: number, rankIndex: number, points: number }[];
  };

  export type QualifierPlayerScore = {
    name: string;
    points: number;
    numPlaces: number[];
    bestGameGrade: Grade.Grade | null;
    bestGameTimeDiffBest: Time.Time | null;
    bestGameLevel: number;
  };

  export type QualifierPlayerResult = QualifierPlayerScore & {
    rank: number;
  };

  const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  export function groupIndexToString(index: number): string {
    return groupNames[index];
  }

  export function stringToGroupIndex(string: string): number | null {
    const index = groupNames.indexOf(string);
    if (index == -1) return null;
    return index;
  }

  export function setupCompetition(numPlayers: number, manualNumberOfGames: number | null): CompetitionSetupResult {
    if (manualNumberOfGames != null) {
      return setupCompetitionManual(manualNumberOfGames);
    } else {
      const presetName = Preset.getAppropriatePresetName(numPlayers);
      if (presetName == null) throw new Error(`${numPlayers}人に適切なプリセットが見つかりませんでした`);
      const preset = Preset.getPreset(presetName);

      if (!(preset.supportedNumberOfPlayers[0] <= numPlayers && numPlayers <= preset.supportedNumberOfPlayers[1])) {
        throw new Error();
      }

      if (preset.hasQualifierRound) {
        return setupCompetitionWithQualifier(preset, numPlayers);
      } else {
        return setupCompetitionWithTournament(preset, numPlayers);
      }
    }
  }

  function setupCompetitionManual(numGames: number): CompetitionSetupResult {
    const stages = new Array(numGames).fill(null).map((_, i) => ({
      roundIndex: 0,
      groupIndex: i,
      name: String(i + 1),
      numPlayers: 8,
      numWinners: 0,
      hasWildcard: false,
      numLosers: 0,
    }));

    return {
      preset: null,
      numPlayers: null,
      stages,
      supplementComparisons: [],
    };
  }

  function setupCompetitionWithQualifier(preset: Preset.Preset, numPlayers: number): CompetitionSetupResult {
    // ポイント制予選
    if (preset.rounds.length != 2) throw new Error();

    const firstRound = preset.rounds[0];
    if (firstRound.qualifierPlayerIndices == null) throw new Error();
    const stages: StageSetupResult[] = [];
    // 予選
    firstRound.qualifierPlayerIndices.forEach((indices, i) => stages.push({
      roundIndex: 0,
      groupIndex: i,
      name: `${firstRound.name}Heat${i + 1}`,
      numPlayers: indices.length,
      numWinners: 0,
      hasWildcard: false,
      numLosers: 0,
    }));
    // 決勝
    stages.push({
      roundIndex: 1,
      groupIndex: 0,
      name: preset.rounds[1].name,
      numPlayers: 4,
      numWinners: 1,
      hasWildcard: false,
      numLosers: 3,
    });

    return {
      preset,
      numPlayers,
      stages,
      supplementComparisons: [],
    };
  }

  function setupCompetitionWithTournament(preset: Preset.Preset, numOverallPlayers: number): CompetitionSetupResult {
    // トーナメント
    const stages: StageSetupResult[] = [];
    const supplementComparisons: SupplementComparisonSetupResult[] = [];

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
          const destinationMethod = winner ? dependentRound.winners!.destinationMethod : dependentRound.losers!.destinationMethod;

          let numSend = 0;
          for (let i = 0; i < dependentRound.numGroups!; i++) {
            const dependentStage = getStageSetupResult(stages, dependentRoundIndex, i);
            if (dependentStage == null) throw new Error();
            const dependentStageNumWinners = dependentStage.numWinners;
            const dependentStageNumLosers = dependentStage.numLosers;
            numSend += winner ? dependentStageNumWinners : dependentStageNumLosers;
          }
          if (winner) {
            numSend += dependentRound.winners!.numWildcard;
          }

          if (destinationMethod == "standard") {
            const startSnakeIndex = getNextSnakeIndex(stageNumPlayers);
            for (let i = 0; i < numSend; i++) {
              const snakeIndex = (startSnakeIndex + i) % (stageNumPlayers.length * 2);
              stageNumPlayers[resolveSnakeIndex(snakeIndex, stageNumPlayers.length)]++;
            }
          }
        };

        const dependents = getRoundDependents(preset, roundIndex);
        dependents.forEach(dependentRoundIndex => {
          const dependentRound = preset.rounds[dependentRoundIndex];
          if (dependentRound.winners != null && dependentRound.winners.destinationRoundIndex == roundIndex) {
            sendPlayers(dependentRoundIndex, true);
          }
          if (dependentRound.losers != null && dependentRound.losers.destinationRoundIndex == roundIndex) {
            sendPlayers(dependentRoundIndex, false);
          }
        });
      }

      // ステージ情報を埋める
      const stagesToAdd: StageSetupResult[] = [];
      for (let i = 0; i < round.numGroups!; i++) {
        const name = round.numGroups == 1 ? round.name : `${round.name}${groupIndexToString(i)}`;
        const numPlayers = stageNumPlayers[i];
        const numWinners = round.winners != null ? round.winners.numPerGroup : -1;
        const numLosers = round.losers != null ? round.losers.numPerGroup : -1;
        const hasWildcard = round.winners != null ? round.winners.numWildcard > 0 : false;
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
          if (numWinners + numWildcard + numLosers != numPlayers) throw new Error();
          resolvedNumWinners = numWinners;
          resolvedNumLosers = numLosers;
        } else {
          throw new Error();
        }

        stagesToAdd.push({
          roundIndex,
          groupIndex: i,
          name,
          numPlayers,
          numWinners: resolvedNumWinners,
          hasWildcard,
          numLosers: resolvedNumLosers,
        });
      }

      // 補足情報の定義を埋める
      const supplementComparisonsToAdd: SupplementComparisonSetupResult[] = [];
      if (round.winners != null) {
        const numMaxWinners = Math.max(...stagesToAdd.map(e => e.numWinners));
        if (round.winners.destinationMethod == "standard") {
          // グループ数が1の場合は順位内比較を行う必要がないので補足情報も不要
          if (round.numGroups! > 1) {
            for (let i = 0; i < numMaxWinners; i++) {
              const numRankPlayers = stagesToAdd.filter(e => e.numWinners > i).length;
              if (numRankPlayers == 1) continue;
              supplementComparisonsToAdd.push({
                roundIndex,
                rankId: `T${i}`,
                name: `${round.name}${i + 1}位`,
                numPlayers: numRankPlayers,
              });
            }
          }
        }
        const hasWildcard = round.winners.numWildcard > 0;
        if (stagesToAdd.some(e => e.hasWildcard != hasWildcard)) throw new Error(); // ワイルドカード有無が揃ってない場合は未対応
        const numWildcard = hasWildcard ? 1 : 0;
        if (numWildcard > 0) {
          const unevenNumWinners = stagesToAdd.some(e => e.numWinners != numMaxWinners);
          const name = unevenNumWinners ? `${round.name}ワイルドカード` : `${round.name}${numMaxWinners + 1}位 (ワイルドカード)`;
          supplementComparisonsToAdd.push({
            roundIndex,
            rankId: "W",
            name,
            numPlayers: round.numGroups!,
          });
        }
      }
      if (round.losers != null) {
        if (round.losers.destinationMethod == "standard") {
          // グループ数が1の場合は順位内比較を行う必要がないので補足情報も不要
          if (round.numGroups! > 1) {
            const numWinners = stagesToAdd[0].numWinners;
            const unevenNumWinners = stagesToAdd.some(e => e.numWinners != numWinners);
            const hasWildcard = stagesToAdd[0].hasWildcard;
            if (stagesToAdd.some(e => e.hasWildcard != hasWildcard)) throw new Error(); // 負けを並べるとき、ワイルドカード有無が揃ってない場合は未対応
            const numWildcard = hasWildcard ? 1 : 0;
            const numMaxLosers = Math.max(...stagesToAdd.map(e => e.numLosers));
            const unevenNumLosers = stagesToAdd.some(e => e.numLosers != numMaxLosers);
            if (!unevenNumWinners) {
              for (let i = 0; i < numMaxLosers; i++) {
                const rankIndex = numWinners + numWildcard + i;
                const numRankPlayers = stagesToAdd.filter(e => e.numPlayers > rankIndex).length;
                if (numRankPlayers == 1) continue;
                supplementComparisonsToAdd.push({
                  roundIndex,
                  rankId: `T${rankIndex}`,
                  name: `${round.name}${rankIndex + 1}位`,
                  numPlayers: numRankPlayers,
                });
              }
            } else if (!unevenNumLosers) {
              for (let i = 0; i < numMaxLosers; i++) {
                const numRankPlayers = stagesToAdd.length;
                if (numRankPlayers == 1) continue;
                const name = i == numMaxLosers - 1 ? `${round.name}最下位` : `${round.name} 下から${numMaxLosers - i}位`;
                supplementComparisonsToAdd.push({
                  roundIndex,
                  rankId: `B${numMaxLosers - i}`,
                  name,
                  numPlayers: numRankPlayers,
                });
              }
            } else {
              throw new Error(); // 勝ち数も負け数も揃ってないことはないはず
            }
          }
        }
      }

      stages.push(...stagesToAdd);
      supplementComparisons.push(...supplementComparisonsToAdd);
    });

    return {
      preset,
      numPlayers: numOverallPlayers,
      stages,
      supplementComparisons,
    };
  }

  export function setupRound(preset: Preset.Preset, numPlayers: number, stages: StageSetupResult[], roundIndex: number, io: CompetitionIO): RoundSetupResult {
    if (roundIndex == 0) {
      if (preset.hasQualifierRound) {
        return setupFirstRoundWithQualifier(preset, numPlayers, stages, io);
      } else {
        return setupFirstRoundWithTournament(preset, stages, io);
      }
    } else {
      if (preset.hasQualifierRound) {
        if (roundIndex != 1) throw new Error();
        return setupFinalRoundWithQualifier(preset, numPlayers, stages, io);
      } else {
        return setupSubsequentRoundWithTournament(preset, stages, roundIndex, io);
      }
    }
  }

  export function validateEntriesWithQualifier(entries: PlayerEntry[], numPlayers: number) {
    entries.forEach((e) => {
      if (e.firstRoundGroupIndex == null) {
        throw new Error("1回戦組が設定されていないプレイヤーがいます: " + e.name);
      }
      if (e.firstRoundGroupIndex == -1 || e.firstRoundGroupIndex >= numPlayers) {
        throw new Error("範囲外の1回戦組があります: " + groupIndexToString(e.firstRoundGroupIndex));
      }
      if (entries.filter(f => e.firstRoundGroupIndex == f.firstRoundGroupIndex).length != 1) {
        throw new Error("1回戦組に重複があります: " + groupIndexToString(e.firstRoundGroupIndex));
      }
    });
  }

  function setupFirstRoundWithQualifier(preset: Preset.Preset, numPlayers: number, stages: StageSetupResult[], io: CompetitionIO): RoundSetupResult {
    // ポイント制予選
    const firstRound = preset.rounds[0];
    if (firstRound.qualifierPlayerIndices == null) throw new Error();

    const groups: RoundSetupResult["groups"] = new Array(firstRound.qualifierPlayerIndices.length).fill(null).map(_ => ({ entries: [] }));

    const entries = io.readEntries();
    validateEntriesWithQualifier(entries, numPlayers);

    groups.forEach((_, groupIndex) => {
      groups[groupIndex].entries = firstRound.qualifierPlayerIndices![groupIndex].map(i => {
        const foundEntry = entries.find(e => e.firstRoundGroupIndex == i);
        if (foundEntry == null) throw new Error();
        return {
          name: foundEntry.name,
          handicap: 0,
        };
      });
    });

    return {
      groups,
    };
  }

  function setupFinalRoundWithQualifier(preset: Preset.Preset, numPlayers: number, stages: StageSetupResult[], io: CompetitionIO): RoundSetupResult {
    // ポイント戦決勝
    const round = preset.rounds[1];
    const numGroups = round.numGroups;
    if (numGroups == null) throw new Error();
    if (numGroups != 1) throw new Error();
    const groups: RoundSetupResult["groups"] = new Array(numGroups).fill(null).map(_ => ({ entries: [] }));

    const qualifierRound = preset.rounds[0];
    if (qualifierRound.qualifierPlayerIndices == null) throw new Error();
    const numPlayersPerGroup = qualifierRound.qualifierPlayerIndices[0].length;
    if (qualifierRound.qualifierPlayerIndices.some(e => e.length != numPlayersPerGroup)) throw new Error();

    const qualifierTable = io.readQualifierTable();
    if (qualifierTable.length != numPlayers) throw new Error();

    // 全員のポイントが揃っていることを確認
    const numStagesPerPlayer = qualifierRound.qualifierPlayerIndices.length * numPlayersPerGroup / numPlayers;
    if (qualifierTable.some(e => e.stageResults.length != numStagesPerPlayer)) throw new NotReadyError();

    const qualifierRoundResults = qualifierRound.qualifierPlayerIndices.map((_, i) => io.readStageResult(0, i));

    const qualifierScores: QualifierPlayerScore[] = [];
    qualifierTable.forEach(entry => {
      const stageResults = entry.stageResults.map(stageResult => {
        const found = qualifierRoundResults[stageResult.stageIndex].find(e => e.name == entry.name);
        if (found == null) throw new Error();
        return found;
      });
      stageResults.sort(compareStageScore);
      const bestResult = stageResults[stageResults.length - 1];

      const numPlaces: number[] = new Array(numPlayersPerGroup).fill(0);
      entry.stageResults.forEach(stageResult => {
        numPlaces[stageResult.rankIndex]++;
      });

      qualifierScores.push({
        name: entry.name,
        bestGameGrade: bestResult.grade,
        bestGameLevel: bestResult.level,
        bestGameTimeDiffBest: bestResult.timeDiffBest,
        numPlaces,
        points: entry.totalPoints,
      });
    });

    const qualifierResults = getQualifierResult(qualifierScores);

    io.writeQualifierResult(qualifierResults);

    const assignHandicap = (rankIndex: number): number => {
      if (rankIndex == 0) return -10;
      if (rankIndex == 1) return -5;
      return 0;
    };
    for (let i = 0; i < 4; i++) {
      const qualifierResult = qualifierResults[i];
      groups[0].entries.push({ name: qualifierResult.name, handicap: assignHandicap(i) });
    }

    return {
      groups,
    };
  }

  export function validateEntriesWithTournament(entries: PlayerEntry[], numGroups: number) {
    entries.forEach((e) => {
      if (e.firstRoundGroupIndex == null) {
        throw new Error("1回戦組が設定されていないプレイヤーがいます: " + e.name);
      }
      if (e.firstRoundGroupIndex == -1 || e.firstRoundGroupIndex >= numGroups) {
        throw new Error("範囲外の1回戦組があります: " + groupIndexToString(e.firstRoundGroupIndex));
      }
    });
  }

  function setupFirstRoundWithTournament(preset: Preset.Preset, stages: StageSetupResult[], io: CompetitionIO): RoundSetupResult {
    // トーナメント
    const firstRound = preset.rounds[0];
    const groups: RoundSetupResult["groups"] = new Array(firstRound.numGroups).fill(null).map(_ => ({ entries: [] }));

    const entries = io.readEntries();
    validateEntriesWithTournament(entries, groups.length);
    entries.forEach((e) => {
      const stagePlayerEntry = {
        name: e.name,
        handicap: 0,
      };
      groups[e.firstRoundGroupIndex!].entries.push(stagePlayerEntry);
    });

    const firstRoundGroupNumPlayers = groups.map((e) => e.entries.length);
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
      throw new Error("1回戦組の振り分けが正しくありません。各グループの人数差は1以内で、かつ先のグループの方が人数が多くなっている必要があります: " + firstRoundGroupNumPlayers);
    }

    return {
      groups,
    };
  }

  function setupSubsequentRoundWithTournament(preset: Preset.Preset, stages: StageSetupResult[], roundIndex: number, io: CompetitionIO): RoundSetupResult {
    if (roundIndex == 0) throw new Error;
    const round = preset.rounds[roundIndex];
    const numGroups = round.numGroups;
    if (numGroups == null) throw new Error();

    type StagePlayerEntryStub = { name: string, previousRoundRankIndex: number, previousRoundHandicapMethod: Preset.HandicapMethod };
    const groupStubs: StagePlayerEntryStub[][] = new Array(numGroups).fill(null).map(_ => []);

    const sendPlayers = (dependentRoundIndex: number, winner: boolean) => {
      const dependentRound = preset.rounds[dependentRoundIndex];
      const destinationMethod = winner ? dependentRound.winners!.destinationMethod : dependentRound.losers!.destinationMethod;

      const dependentStages: StageSetupResult[] = [];
      const dependentStageResults: StagePlayerResult[][] = [];
      for (let i = 0; i < dependentRound.numGroups!; i++) {
        const stage = getStageSetupResult(stages, dependentRoundIndex, i);
        if (stage == null) throw new Error;
        dependentStages.push(stage);

        const stageResult = io.readStageResult(dependentRoundIndex, i);
        dependentStageResults.push(stageResult);
      }

      // 全部のリザルトが揃っていることを確認
      dependentStages.forEach((dependentStage, dependentStageIndex) => {
        const dependentStageResult = dependentStageResults[dependentStageIndex];
        if (dependentStageResult.length != dependentStage.numPlayers) throw new NotReadyError();
      });

      if (destinationMethod == "standard") {
        const sortedStubsToPut: StagePlayerEntryStub[] = [];

        if (winner) {
          const numMaxWinners = Math.max(...dependentStages.map(e => e.numWinners));

          for (let i = 0; i < numMaxWinners; i++) {
            const rankIndex = i;

            const resultsPerRank: SupplementComparisonEntry[] = [];
            dependentStages.forEach((dependentStage, dependentStageIndex) => {
              if (rankIndex >= dependentStage.numWinners) return;
              const dependentStageResult = dependentStageResults[dependentStageIndex][rankIndex];
              resultsPerRank.push({ ...dependentStageResult, originalRankIndex: rankIndex });
            });

            const comparisonResult = getSupplementComparison(resultsPerRank);

            // グループ数が1の場合は順位内比較を行う必要がないので補足情報も不要
            if (dependentRound.numGroups! > 1) {
              io.writeSupplementComparison(dependentRoundIndex, `T${rankIndex}`, comparisonResult);
            }

            comparisonResult.forEach(result => {
              sortedStubsToPut.push({
                name: result.name,
                previousRoundHandicapMethod: dependentRound.winners!.handicapMethod,
                previousRoundRankIndex: result.originalRankIndex,
              });
            });
          }

          const hasWildcard = dependentRound.winners!.numWildcard > 0;
          if (dependentStages.some(e => e.hasWildcard != hasWildcard)) throw new Error(); // ワイルドカード有無が揃ってない場合は未対応
          if (hasWildcard) {
            const wildcardResults: SupplementComparisonEntry[] = [];
            dependentStages.forEach((dependentStage, dependentStageIndex) => {
              const originalRankIndex = dependentStage.numWinners;
              const dependentStageResult = dependentStageResults[dependentStageIndex][originalRankIndex];
              wildcardResults.push({ ...dependentStageResult, originalRankIndex });
            });

            const comparisonResult = getSupplementComparison(wildcardResults);

            io.writeSupplementComparison(dependentRoundIndex, "W", comparisonResult);

            comparisonResult.forEach((result, i) => {
              if (i >= dependentRound.winners!.numWildcard) return;
              sortedStubsToPut.push({
                name: result.name,
                previousRoundHandicapMethod: dependentRound.winners!.handicapMethod,
                previousRoundRankIndex: result.originalRankIndex,
              });
            });
          }
        } else {
          const numWinners = dependentStages[0].numWinners;
          const unevenNumWinners = dependentStages.some(e => e.numWinners != numWinners);
          const hasWildcard = dependentStages[0].hasWildcard;
          if (dependentStages.some(e => e.hasWildcard != hasWildcard)) throw new Error(); // 負けを並べるとき、ワイルドカード有無が揃ってない場合は未対応
          const numWildcard = hasWildcard ? 1 : 0;
          const numMaxLosers = Math.max(...dependentStages.map(e => e.numLosers));
          const unevenNumLosers = dependentStages.some(e => e.numLosers != numMaxLosers);
          for (let i = 0; i < numMaxLosers; i++) {
            const resultsPerRank: SupplementComparisonEntry[] = [];
            dependentStages.forEach((dependentStage, dependentStageIndex) => {
              const originalRankIndex = dependentStage.numWinners + numWildcard + i;
              if (originalRankIndex >= dependentStage.numPlayers) return;
              const dependentStageResult = dependentStageResults[dependentStageIndex][originalRankIndex];
              resultsPerRank.push({ ...dependentStageResult, originalRankIndex });
            });

            const comparisonResult = getSupplementComparison(resultsPerRank);

            // グループ数が1の場合は順位内比較を行う必要がないので補足情報も不要
            if (dependentRound.numGroups! > 1) {
              let rankId: string;
              if (!unevenNumWinners) {
                rankId = `T${numWinners + numWildcard + i}`;
              } else if (!unevenNumLosers) {
                rankId = `B${numMaxLosers - i}`;
              } else {
                throw new Error(); // 勝ち数も負け数も揃ってないことはないはず
              }
              io.writeSupplementComparison(dependentRoundIndex, rankId, comparisonResult);
            }

            comparisonResult.forEach(result => {
              sortedStubsToPut.push({
                name: result.name,
                previousRoundHandicapMethod: "none",
                previousRoundRankIndex: result.originalRankIndex,
              });
            });
          }
        }

        const startSnakeIndex = getNextSnakeIndex(groupStubs.map(e => e.entries.length));
        sortedStubsToPut.forEach((stub, i) => {
          const snakeIndex = (startSnakeIndex + i) % (groupStubs.length * 2);
          groupStubs[resolveSnakeIndex(snakeIndex, groupStubs.length)].push(stub);
        });
      }
    };

    const dependents = getRoundDependents(preset, roundIndex);
    dependents.forEach(dependentRoundIndex => {
      const dependentRound = preset.rounds[dependentRoundIndex];
      if (dependentRound.winners != null && dependentRound.winners.destinationRoundIndex == roundIndex) {
        sendPlayers(dependentRoundIndex, true);
      }
      if (dependentRound.losers != null && dependentRound.losers.destinationRoundIndex == roundIndex) {
        sendPlayers(dependentRoundIndex, false);
      }
    });

    // ハンディキャップを計算
    const assignHandicap = (playerIndex: number, entry: StagePlayerEntryStub): number => {
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
    const groups: RoundSetupResult["groups"] = groupStubs.map(group => {
      const entries: StagePlayerEntry[] = group.map((entry, playerIndex) => {
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
      groups,
    };
  }

  export function stageToRoundGroup(preset: Preset.Preset, stageIndex: number): { roundIndex: number, groupIndex: number } | null {
    let startIndex = 0;
    for (let i = 0; i < preset.rounds.length; i++) {
      const round = preset.rounds[i];
      const numGroups = round.numGroups != null ? round.numGroups : preset.hasQualifierRound ? round.qualifierPlayerIndices!.length : 0;
      if (startIndex <= stageIndex && stageIndex < startIndex + numGroups) {
        return { roundIndex: i, groupIndex: stageIndex - startIndex };
      }
      startIndex += numGroups;
      i++;
    }
    return null;
  }

  export function roundGroupToStage(preset: Preset.Preset, roundGroup: { roundIndex: number, groupIndex: number }): number | null {
    const { roundIndex, groupIndex } = roundGroup;
    if (roundIndex < 0 || preset.rounds.length <= roundIndex) return null;
    let startIndex = 0;
    for (let i = 0; i < roundIndex - 1; i++) {
      const round = preset.rounds[i];
      const numGroups = round.numGroups != null ? round.numGroups : preset.hasQualifierRound ? round.qualifierPlayerIndices!.length : 0;
      startIndex += numGroups;
    }
    return startIndex + groupIndex;
  }

  export function getStageSetupResult(stages: StageSetupResult[], roundIndex: number, groupIndex: number): StageSetupResult | null {
    const found = stages.find(e => e.roundIndex == roundIndex && e.groupIndex == groupIndex);
    if (found == null) return null;
    return found;
  }

  function getRoundDependents(preset: Preset.Preset, roundIndex: number): number[] {
    const result: number[] = [];
    preset.rounds.forEach((e, i) => {
      if (e.winners != null && e.winners.destinationRoundIndex == roundIndex) result.push(i);
      if (e.losers != null && e.losers.destinationRoundIndex == roundIndex) result.push(i);
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
      if (numFilledPlayers[0] % 2 != 0) throw new Error();
      return changedIndex + 1;
    }

    throw new Error();
  }

  function resolveSnakeIndex(snakeIndex: number, numGroups: number): number { return snakeIndex < numGroups ? snakeIndex : numGroups * 2 - 1 - snakeIndex; }

  function compareStageScore(a: StagePlayerScore, b: StagePlayerScore): number {
    if (a.grade != null && b.grade == null) return 1;
    if (a.grade == null && b.grade != null) return -1;
    if (a.grade != null && b.grade != null && a.time != null && b.time != null) {
      // grade-time sort
      if (a.grade != b.grade) return a.grade - b.grade;
      return - ((a.time - a.bestTime) - (b.time - b.bestTime));
    }
    // level sort
    return a.level - b.level;
  }

  function compareQualifierScore(a: QualifierPlayerScore, b: QualifierPlayerScore): number {
    if (a.points != b.points) return a.points - b.points;
    for (let i = 0; i < 4; i++) {
      if (a.numPlaces[i] != b.numPlaces[i]) return a.numPlaces[i] - b.numPlaces[i];
    }
    if (a.bestGameGrade != null && b.bestGameGrade == null) return 1;
    if (a.bestGameGrade == null && b.bestGameGrade != null) return -1;
    if (a.bestGameGrade != null && b.bestGameGrade != null && a.bestGameTimeDiffBest != null && b.bestGameTimeDiffBest != null) {
      // grade-time sort
      if (a.bestGameGrade != b.bestGameGrade) return a.bestGameGrade - b.bestGameGrade;
      return - (a.bestGameTimeDiffBest - b.bestGameTimeDiffBest);
    }
    // level sort
    return a.bestGameLevel - b.bestGameLevel;
  }

  export function getStageResult(scores: StagePlayerScore[]): StagePlayerResult[] {
    const sorted = [...scores];
    sorted.sort(compareStageScore).reverse();

    const result: StagePlayerResult[] = [];
    const topScore = sorted[0];
    for (let i = 0; i < sorted.length; i++) {
      const currentScore = sorted[i];
      const prevScore = i > 0 ? sorted[i - 1] : null;

      const timeDiffBest = currentScore.time != null ? currentScore.time - currentScore.bestTime : null;

      let timeDiffTop: Time.Time | null = null;
      if (currentScore.grade == Grade.grades.GM && topScore.grade == Grade.grades.GM) {
        if (currentScore.time == null || topScore.time == null) throw new Error();
        timeDiffTop = (currentScore.time - currentScore.bestTime) - (topScore.time - topScore.bestTime);
      }

      // 段位が同じときのみ比較する
      let timeDiffPrev: Time.Time | null = null;
      if (prevScore != null && (currentScore.grade != null && currentScore.grade == prevScore.grade)) {
        if (currentScore.time == null || prevScore.time == null) throw new Error();
        timeDiffPrev = (currentScore.time - currentScore.bestTime) - (prevScore.time - prevScore.bestTime);
      }

      let rank: number;
      if (prevScore != null && compareStageScore(currentScore, prevScore) == 0) {
        rank = result[i - 1].rank;
      } else {
        rank = i + 1;
      }

      result.push({ ...currentScore, rank, timeDiffBest, timeDiffTop, timeDiffPrev });
    }

    return result;
  }

  export function getSupplementComparison(scores: SupplementComparisonEntry[]): SupplementComparisonResult[] {
    const sorted = [...scores];
    sorted.sort(compareStageScore).reverse();

    const result: SupplementComparisonResult[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const currentScore = sorted[i];
      const prevScore = i > 0 ? sorted[i - 1] : null;

      const timeDiffBest = currentScore.time != null ? currentScore.time - currentScore.bestTime : null;

      // 段位が同じときのみ比較する
      let timeDiffPrev: Time.Time | null = null;
      if (prevScore != null && (currentScore.grade != null && currentScore.grade == prevScore.grade)) {
        if (currentScore.time == null || prevScore.time == null) throw new Error();
        timeDiffPrev = (currentScore.time - currentScore.bestTime) - (prevScore.time - prevScore.bestTime);
      }

      let rank: number;
      if (prevScore != null && compareStageScore(currentScore, prevScore) == 0) {
        rank = result[i - 1].rank;
      } else {
        rank = i + 1;
      }

      result.push({ ...currentScore, rank, timeDiffBest, timeDiffPrev });
    }

    return result;
  }

  function getQualifierResult(scores: QualifierPlayerScore[]): QualifierPlayerResult[] {
    const sorted = [...scores];
    sorted.sort(compareQualifierScore).reverse();

    const result: QualifierPlayerResult[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const currentScore = sorted[i];
      const prevScore = i > 0 ? sorted[i - 1] : null;

      let rank: number;
      if (prevScore != null && compareQualifierScore(currentScore, prevScore) == 0) {
        rank = result[i - 1].rank;
      } else {
        rank = i + 1;
      }

      result.push({ ...currentScore, rank });
    }

    return result;
  }

  export class NotReadyError extends Error {
    constructor() {
      super();
      this.name = "NotReadyError";
      Object.setPrototypeOf(this, NotReadyError.prototype);
    }
  }
}
