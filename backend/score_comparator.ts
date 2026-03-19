import {
  QualifierResultEntry,
  StagePlayerEntry,
  StageResultEntry,
  SupplementComparisonEntry,
} from "../common/common_types.ts";
import { grades } from "../common/grade.ts";
import {
  QualifierResultEntryStub,
  StageResultEntryStub,
  SupplementComparisonEntryStub,
} from "./competition_types.ts";

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
    timeDiffBest: player.time != null
      ? player.time - player.bestTime
      : undefined,
  };
}

/**
 * ステージのスコアをソートしてリザルトとして出力
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
    const prevScore = i > 0 ? sorted[i - 1] : undefined;

    let timeDiffTop: number | undefined;
    if (
      i > 0 && currentScore.grade == grades.GM && topScore.grade == grades.GM
    ) {
      if (
        currentScore.timeDiffBest == null || topScore.timeDiffBest == null
      ) throw new Error("結果が正常に入力されていません");
      timeDiffTop = currentScore.timeDiffBest - topScore.timeDiffBest;
    }

    // 段位が同じときのみ比較する
    let timeDiffPrev: number | undefined;
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

export function getSupplementComparison(
  scores: SupplementComparisonEntryStub[],
): SupplementComparisonEntry[] {
  const sorted = [...scores];
  sorted.sort(compareStageScore).reverse();

  const result: SupplementComparisonEntry[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const currentScore = sorted[i];
    const prevScore = i > 0 ? sorted[i - 1] : undefined;

    // 段位が同じときのみ比較する
    let timeDiffPrev: number | undefined;
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

export function constructQualifierResultEntryStubs(
  stageResults: StageResultEntry[][],
  numPlayersPerGroup: number,
): QualifierResultEntryStub[] {
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
      const numPlaces: number[] = new Array(4).fill(0);
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

  return qualifierResultStubs;
}

export function getQualifierResult(
  scores: QualifierResultEntryStub[],
): QualifierResultEntry[] {
  const sorted = [...scores];
  sorted.sort(compareQualifierScore).reverse();

  const result: QualifierResultEntry[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const currentScore = sorted[i];
    const prevScore = i > 0 ? sorted[i - 1] : undefined;

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
