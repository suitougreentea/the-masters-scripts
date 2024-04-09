import { Grade, grades } from "../../../common/grade.ts";

// * クリア時のタイムはスタートタイムも含めて順位計算の考慮に入れる
//   (リアルタイムで999に達成したタイミングを使うわけではない)
//   * スタートタイムのずれにより、または段位がGMではないことにより、
//     まだ逆転が起こる可能性がある場合、final: falseのままになる
//   * もう逆転できるプレイヤーがいなくなると、final: trueに変化する
// * プレイ中のタイムはレベルが同じ時のタイブレークにのみ使用する
//   * スタートタイムのずれをプレイ中も考慮したいという気持ちもあるが、以下の理由から今は行っていない
//     * レベル数値と表示される順位が逆になる場合があり、あまり直感的じゃないかも
//       (そもそも大きくずれたときじゃないと逆転は起こりにくいが)
//     * この時間にこのレベルになった、という過去の情報が必要になり、実装が比較的面倒
// * 途中窒息した場合、それよりレベルの低い生存プレイヤーがいればfinal: falseのまま上位にいる
//   (生死に関わらずレベル順でソート)
//   * 自分よりレベルの低い生存プレイヤーがいなくなるとfinal: trueに変化する

export type StandingInput = {
  startTime: number;
  level: number;
  grade: Grade;
  time: number;
  playing: boolean;
};

export type StandingInfo = {
  rankIndex: number;
  final: boolean;
};

// クリア時のplayingは関係ない (ロール中・ロール後関係ない)
// level: 0の場合はplaying: falseであっても!cleared && !deadなことに注意
const isCleared = (input: StandingInput) => input.level == 999;
const isDead = (input: StandingInput) =>
  0 < input.level && input.level < 999 && !input.playing;

type TransformedStandingInput = {
  originalIndex: number;
  level: number;
  grade: Grade;
  adjustedTime: number;
  cleared: boolean;
  dead: boolean;
};
const sortFunction = (
  a: TransformedStandingInput,
  b: TransformedStandingInput,
) => {
  if (a.cleared && b.cleared) {
    // clear grade sort
    if (a.grade != b.grade) {
      return b.grade - a.grade;
    }

    // clear time sort
    return a.adjustedTime - b.adjustedTime;
  }

  // level sort
  if (a.level != b.level) {
    return b.level - a.level;
  }

  // time sort (level tiebreak)
  return a.adjustedTime - b.adjustedTime;
};

export const calculateStandings = (input: StandingInput[]): StandingInfo[] => {
  const transformed: TransformedStandingInput[] = input.map((e, i) => {
    const originalIndex = i;
    const level = e.level;
    const grade = e.grade;
    const adjustedTime = e.startTime + e.time;
    const cleared = isCleared(e);
    const dead = isDead(e);
    return {
      originalIndex,
      level,
      grade,
      adjustedTime,
      cleared,
      dead,
    };
  });

  const sorted = transformed.toSorted(sortFunction);

  const resultSorted: StandingInfo[] = [];
  sorted.forEach((_, i) => {
    const curr = sorted[i];
    let rankIndex: number;
    if (i == 0) {
      rankIndex = i;
    } else {
      const prev = sorted[i - 1];
      rankIndex = sortFunction(curr, prev) != 0
        ? i
        : resultSorted[i - 1].rankIndex;
    }

    let final: boolean;
    if (curr.cleared) {
      if (curr.grade != grades.GM) {
        // 自分の段位がGM未満で、プレイ中のプレイヤーがいる場合はfinal: false
        final = !sorted.some((e, j) => j > i && !e.cleared && !e.dead);
      } else {
        // 自分より下位で、自分よりタイムの短いプレイ中のプレイヤーがいる場合はfinal: false
        final = !sorted.some((e, j) =>
          j > i && e.adjustedTime <= curr.adjustedTime && !e.cleared && !e.dead
        );
      }
    } else if (curr.dead) {
      // 自分より下位にプレイ中のプレイヤーがいる場合はfinal: false
      final = !sorted.some((e, j) => j > i && !e.dead);
    } else {
      final = false;
    }

    resultSorted.push({ rankIndex, final });
  });

  // restore to input order
  const result: StandingInfo[] = [...new Array(resultSorted.length)];
  resultSorted.forEach((e, i) => {
    const originalIndex = sorted[i].originalIndex;
    result[originalIndex] = e;
  });
  return result;
};
