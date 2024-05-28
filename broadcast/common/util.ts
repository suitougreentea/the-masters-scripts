import { StagePlayerEntry } from "../../common/common_types.ts";
import {
  Grade,
  gradeToString,
  stringToGrade,
  tryStringToGrade,
} from "../../common/grade.ts";

const groupTable = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export function formatGroup(groupIndex: number): string {
  return groupTable[groupIndex];
}

export function parseGroup(group: string): number | undefined {
  const index = groupTable.indexOf(group.toUpperCase());
  if (index < 0) return undefined;
  return index;
}

export function formatLevelOrGrade(
  levelOrGrade: { level: number; grade?: Grade },
): string {
  if (levelOrGrade.grade != null) return gradeToString(levelOrGrade.grade);
  return String(levelOrGrade.level);
}

export function formatLevelOrGradeNullable(
  levelOrGrade: { level?: number; grade?: Grade },
): string | undefined {
  if (levelOrGrade.level == null) return undefined;
  return formatLevelOrGrade({
    level: levelOrGrade.level,
    grade: levelOrGrade.grade,
  });
}

export function parseLevelOrGrade(
  levelOrGrade: string,
  emptyAsGm = false,
): { level?: number; grade?: Grade } {
  if (levelOrGrade == "") {
    if (emptyAsGm) {
      return { grade: stringToGrade("GM"), level: 999 };
    } else {
      return { grade: undefined, level: undefined };
    }
  }

  const parsedLevel = Number(levelOrGrade);
  if (!isNaN(parsedLevel)) return { grade: undefined, level: parsedLevel };

  const parsedGrade = tryStringToGrade(levelOrGrade);
  if (parsedGrade != null) return { grade: parsedGrade, level: 999 };

  return { grade: undefined, level: undefined };
}

export function getDiffTime(
  players: (StagePlayerEntry | undefined)[],
  playerIndex: number,
): number {
  const player = players[playerIndex];
  if (player == null) return 0;

  if (player.startOrder == 1) return 0;

  // startOrderが1つ先の人を探す
  let targetIndex = -1;
  players.forEach((e, i) => {
    if (e == null) return;
    if (e.startOrder < player.startOrder) {
      if (
        targetIndex == -1 || players[targetIndex]!.startOrder < e.startOrder
      ) {
        targetIndex = i;
      }
    }
  });
  if (targetIndex == -1) return 0; // unreachable?

  return player.startTime - players[targetIndex]!.startTime;
}

export type PromiseSet<T> = {
  promise: Promise<T>;
  resolve: (result: T) => void;
  reject: (reason: unknown) => void;
};
export function createPromiseSet<T = void>(): PromiseSet<T> {
  let resolve: ((result: T) => void) | undefined = undefined;
  let reject: ((reason: unknown) => void) | undefined = undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}
