const widths = [16, 80, 70, 40, 70, 24, 70, 70, 70, 30, 16, 80, 40, 70, 70, 70, 70];

namespace Competition {
  export type PlayerEntry = {
    name: string;
    firstRoundGroupIndex: number | null;
  };

  export type CompetitionSetupResult = {
    preset: Preset.Preset | null;
    presetName: string;
    manualNumberOfGames: number | null;
    firstRoundGroups: string[][];
  };

  export type FinishedPlayerScore = {
    name: string;
    grade: Grade.Grade;
    time: Time.Time;
    level: 999;
    bestTime: Time.Time;
  };
  export type FailedPlayerScore = {
    name: string;
    grade: null;
    time: null;
    level: number;
    bestTime: Time.Time;
  };
  export type PlayerScore = FinishedPlayerScore | FailedPlayerScore;

  export type PlayerResult = PlayerScore & {
    rank: number;
    timeDiffBest: Time.Time | null;
    timeDiffTop: Time.Time | null;
    timeDiffPrev: Time.Time | null;
  };

  const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H"];

  export function groupIndexToString(index: number): string {
    return groupNames[index];
  }

  export function stringToGroupIndex(string: string): number | null {
    const index = groupNames.indexOf(string);
    if (index == -1) return null;
    return index;
  }

  export function setupCompetition(presetName: string, manualNumberOfGames: number, entries: PlayerEntry[]): CompetitionSetupResult {
    if (presetName == Preset.manualPresetName) {
      return {
        preset: null,
        presetName,
        manualNumberOfGames,
        firstRoundGroups: [],
      };
    } else {
      if (!(presetName in Preset.presets)) {
        throw new Error("存在しないプリセットです");
      }

      const preset = Preset.presets[presetName];

      if (!(preset.supportedNumberOfPlayers[0] <= entries.length && entries.length <= preset.supportedNumberOfPlayers[1])) {
        throw new Error("このプリセットは" + entries.length + "人に対応していません");
      }

      const firstRoundGroups: PlayerEntry[][] = new Array(preset.numFirstRoundGroups);
      for (let i = 0; i < preset.numFirstRoundGroups; i++) {
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

      return {
        preset,
        presetName,
        manualNumberOfGames: null,
        firstRoundGroups: firstRoundGroups.map(e => e.map(f => f.name)),
      };
    }
  }

  function compareScore(a: PlayerScore, b: PlayerScore) {
    if (a.grade != null && b.grade == null) return 1;
    if (a.grade == null && b.grade != null) return -1;
    if (a.grade != null && b.grade != null && a.time != null && b.time != null) {
      // grade-time sort
      if (a.grade == b.grade) return - ((a.time - a.bestTime) - (b.time - b.bestTime));
      return a.grade - b.grade;
    }
    // level sort
    return a.level - b.level;
  }

  export function getResult(scores: PlayerScore[]): PlayerResult[] {
    const sorted = [...scores];
    sorted.sort(compareScore).reverse();

    const result: PlayerResult[] = [];
    const topScore = sorted[0];
    for (let i = 0; i < sorted.length; i++) {
      const currentScore = sorted[i];
      const prevScore = i > 0 ? sorted[i - 1] : null;

      const timeDiffBest = currentScore.time != null ? currentScore.time - currentScore.bestTime : null;

      let timeDiffTop: Time.Time | null = null;
      if (currentScore.grade == Grade.grades.GM && topScore.grade == Grade.grades.GM) {
        timeDiffTop = (currentScore.time - currentScore.bestTime) - (topScore.time - topScore.bestTime);
      }

      // 段位が同じときのみ比較する
      let timeDiffPrev: Time.Time | null = null;
      if (prevScore != null &&
        (currentScore.grade != null && currentScore.grade == prevScore.grade)) {
        timeDiffPrev = (currentScore.time - currentScore.bestTime) - (prevScore.time - prevScore.bestTime);
      }

      let rank: number;
      if (prevScore != null && compareScore(currentScore, prevScore) == 0) {
        rank = result[i - 1].rank;
      } else {
        rank = i + 1;
      }

      result.push({ ...currentScore, rank, timeDiffBest, timeDiffTop, timeDiffPrev });
    }

    return result;
  }
}
