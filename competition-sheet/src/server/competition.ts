namespace Competition {
  export type PlayerEntry = {
    name: string;
    firstRoundGroupIndex: number | null;
  };

  export type CompetitionSetupResult = {
    preset: Preset.Preset | null;
    stages: StageSetupResult[];
    hasQualifierRound: boolean;
    supplementComparisons: SupplementComparisonSetupResult[];
  };
  export type StageSetupResult = { roundIndex: number, groupIndex: number, name: string, numPlayers: number, numWinners: number, hasWildcard: boolean, numLosers: number };
  export type SupplementComparisonSetupResult = { roundIndex: number, rankIndex: number, name: string, numPlayers: number };

  export type CompetitionIO = {
    readEntries(): PlayerEntry[];
    readStageEntry(roundIndex: number, groupIndex: number): StagePlayerEntry[];
    readStageResult(roundIndex: number, groupIndex: number): StagePlayerResult[];
    writeQualifierResult(result: QualifierPlayerResult[]): void;
    readSupplementComparison(roundIndex: number, rankIndex: number): StagePlayerResult[];
    writeSupplementComparison(roundIndex: number, rankIndex: number, result: StagePlayerResult[]): void;
  }

  export type RoundSetupResult = {
    groups: {
      entries: StagePlayerEntry[];
    }[];
  }

  export type StageInfo = { stageName: string, players: (PlayerData | null)[], manual: boolean, wildcard: boolean };
  export type PlayerData = { name: string, handicap: number, gradeOrLevel: string | null, time: string | null };
  export type TimerInfo = { stageName: string, players: (TimerPlayerData | null)[], wildcard: boolean };
  export type TimerPlayerData = { name: string, rawBestTime: number, handicap: number, bestTime: number, startOrder: number, startTime: number };

  export type StagePlayerEntry = {
    name: string;
    handicap: number;
  }

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

  export type QualifierPlayerScore = {
    name: string;
    points: number;
    numPlaces: [number, number, number, number];
    bestGameGrade: Grade.Grade;
    bestGameTimeDiffBest: Time.Time | null;
    bestGameLevel: number;
  }

  export type QualifierPlayerResult = QualifierPlayerScore & {
    rank: number;
  }

  const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  export function groupIndexToString(index: number): string {
    return groupNames[index];
  }

  export function stringToGroupIndex(string: string): number | null {
    const index = groupNames.indexOf(string);
    if (index == -1) return null;
    return index;
  }

  export function setupCompetition(numEntryPlayers: number, manualNumberOfGames: number | null): CompetitionSetupResult {
    if (manualNumberOfGames != null) {
      const stages = new Array(manualNumberOfGames).fill(null).map((_, i) => ({
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
        stages,
        hasQualifierRound: false,
        supplementComparisons: [],
      };
    } else {
      const presetName = Preset.getAppropriatePresetName(numEntryPlayers);
      if (presetName == null) throw new Error(`${numEntryPlayers}人に適切なプリセットが見つかりませんでした`);
      const preset = Preset.getPreset(presetName);

      if (!(preset.supportedNumberOfPlayers[0] <= numEntryPlayers && numEntryPlayers <= preset.supportedNumberOfPlayers[1])) {
        throw new Error();
      }

      const firstRound = preset.rounds[0];
      if (firstRound.qualifierPlayerIndices != null) {
        // ポイント制予選
        if (preset.rounds.length != 2) throw new Error();

        const stages: StageSetupResult[] = [];
        // 予選
        firstRound.qualifierPlayerIndices.forEach((_, i) => stages.push({
          roundIndex: 0,
          groupIndex: i,
          name: `${firstRound.name}Heat${i + 1}`,
          numPlayers: 4,
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
          stages,
          hasQualifierRound: true,
          supplementComparisons: [],
        };
      } else if (firstRound.numGroups != null) {
        // トーナメント
        const stages: StageSetupResult[] = [];
        const supplementComparisons: SupplementComparisonSetupResult[] = [];

        preset.rounds.forEach((round, roundIndex) => {
          // 人数割り出し
          const stageNumPlayers = new Array(round.numGroups!).fill(0);
          if (roundIndex == 0) {
            const quotient = Math.floor(numEntryPlayers / round.numGroups!);
            const remainder = numEntryPlayers % round.numGroups!;
            for (let i = 0; i < round.numGroups!; i++) {
              stageNumPlayers[i] = quotient + (i < remainder ? 1 : 0);
            }
          } else {
            const sendPlayersNone = (num: number) => {
              if (stageNumPlayers.length != 1) throw new Error();
              stageNumPlayers[0] += num;
            };
            const sendPlayersSnake = (num: number) => {
              const startSnakeIndex = getNextSnakeIndex(stageNumPlayers);
              for (let i = 0; i < num; i++) {
                const snakeIndex = (startSnakeIndex + i) % (stageNumPlayers.length * 2);
                stageNumPlayers[resolveSnakeIndex(snakeIndex, stageNumPlayers.length)]++;
              }
            };
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

              if (destinationMethod == "none") {
                sendPlayersNone(numSend);
              } else if (destinationMethod == "rankSnake" || destinationMethod == "rankSortedSnake") {
                sendPlayersSnake(numSend);
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
            const name = round.numGroups == 1 ? round.name : `${round.name}${groupNames[i]}`;
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

          // 補足情報を埋める
          const supplementComparisonsToAdd: SupplementComparisonSetupResult[] = [];
          if (round.winners != null) {
            const numWinners = stagesToAdd[0].numWinners;
            if (round.winners.destinationMethod == "rankSortedSnake") {
              for (let i = 0; i < numWinners; i++) {
                const numRankPlayers = stagesToAdd.filter(e => e.numWinners > i).length;
                if (numRankPlayers == 1) continue;
                supplementComparisonsToAdd.push({
                  roundIndex,
                  rankIndex: i,
                  name: `${round.name}${i + 1}位`,
                  numPlayers: numRankPlayers,
                });
              }
            }
            const hasWildcard = stagesToAdd[0].hasWildcard;
            if (stagesToAdd.some(e => e.hasWildcard != hasWildcard)) throw new Error(); // ワイルドカード有無が揃ってない場合は未対応
            const numWildcard = hasWildcard ? 1 : 0;
            if (numWildcard > 0) {
              if (stagesToAdd.some(e => e.numWinners != numWinners)) throw new Error(); // 勝ち数が揃ってない場合は未対応
              supplementComparisonsToAdd.push({
                roundIndex,
                rankIndex: numWinners,
                name: `${round.name}${numWinners + 1}位 (ワイルドカード)`,
                numPlayers: round.numGroups!,
              });
            }
          }
          if (round.losers != null) {
            if (round.losers.destinationMethod == "rankSortedSnake") {
              const numWinners = stagesToAdd[0].numWinners;
              if (stagesToAdd.some(e => e.numWinners != numWinners)) throw new Error(); // 勝ち数が揃ってない場合は未対応
              const hasWildcard = stagesToAdd[0].hasWildcard;
              if (stagesToAdd.some(e => e.hasWildcard != hasWildcard)) throw new Error(); // ワイルドカード有無が揃ってない場合は未対応
              const numWildcard = hasWildcard ? 1 : 0;
              const startRankIndex = numWinners + numWildcard;
              const numLosers = Math.max(...stagesToAdd.map(e => e.numLosers));
              for (let i = 0; i < numLosers; i++) {
                const rankIndex = startRankIndex + i;
                const numRankPlayers = stagesToAdd.filter(e => e.numPlayers > rankIndex).length;
                if (numRankPlayers == 1) continue;
                supplementComparisonsToAdd.push({
                  roundIndex,
                  rankIndex,
                  name: `${round.name}${rankIndex + 1}位`,
                  numPlayers: numRankPlayers,
                });
              }
            }
          }

          stages.push(...stagesToAdd);
          supplementComparisons.push(...supplementComparisonsToAdd);
        });

        return {
          preset,
          stages,
          hasQualifierRound: false,
          supplementComparisons,
        };
      } else {
        throw new Error();
      }
    }
  }

  export function setupRound(preset: Preset.Preset, roundIndex: number, io: CompetitionIO): RoundSetupResult {
    if (roundIndex == 0) {
      const firstRound = preset.rounds[0];
      if (firstRound.qualifierPlayerIndices != null) {
        // ポイント制予選
        const result: RoundSetupResult = {
          groups: new Array(firstRound.qualifierPlayerIndices.length).fill(null).map(_ => ({ entries: [] })),
        };

        // TODO
        return result;
      } else if (firstRound.numGroups != null) {
        // トーナメント
        const result: RoundSetupResult = {
          groups: new Array(firstRound.numGroups).fill(null).map(_ => ({ entries: [] })),
        };

        const firstRoundGroups: PlayerEntry[][] = new Array(firstRound.numGroups);
        for (let i = 0; i < firstRound.numGroups; i++) {
          firstRoundGroups[i] = [];
        }

        entries.forEach((e) => {
          if (e.firstRoundGroupIndex == null) {
            throw new Error("1回戦組が設定されていないプレイヤーがいます: " + e.name);
          }
          if (e.firstRoundGroupIndex == -1 || e.firstRoundGroupIndex >= firstRoundGroups.length) {
            throw new Error("範囲外の1回戦組があります: " + groupNames[e.firstRoundGroupIndex]);
          }
          firstRoundGroups[e.firstRoundGroupIndex].push(e);
        });

        const firstRoundGroupNumPlayers = firstRoundGroups.map((e) => e.length);
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
        // TODO
        return result;
      }
      throw new Error();
    } else {
      const round = preset.rounds[roundIndex];
      const numGroups = round.numGroups;
      if (numGroups == null) throw new Error();

      const result: RoundSetupResult = {
        groups: new Array(numGroups).fill(null).map(_ => ({ entries: [] })),
      };

      const dependents = getRoundDependents(preset, roundIndex);

      // TODO
      return result;
    }
  }

  export function stageToRoundGroup(preset: Preset.Preset, stageIndex: number): { roundIndex: number, groupIndex: number } | null {
    let startIndex = 0;
    for (let i = 0; i < preset.rounds.length; i++) {
      const round = preset.rounds[i];
      const numGroups = round.numGroups != null ? round.numGroups : round.qualifierPlayerIndices != null ? round.qualifierPlayerIndices.length : 0;
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
      const numGroups = round.numGroups != null ? round.numGroups : round.qualifierPlayerIndices != null ? round.qualifierPlayerIndices.length : 0;
      startIndex += numGroups;
    }
    return startIndex + groupIndex;
  }

  function getStageSetupResult(stages: StageSetupResult[], roundIndex: number, groupIndex: number): StageSetupResult | null {
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
      return - a.bestGameTimeDiffBest - b.bestGameTimeDiffBest;
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
}
