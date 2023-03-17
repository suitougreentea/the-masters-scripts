import { StagePlayerEntry } from "./common_types.ts";

export function formatTime(ms: number, positiveSign = false): string {
  const sign = ms > 0 ? (positiveSign ? "+" : "") : ms < 0 ? "-" : "";
  const abs = Math.abs(ms);
  const min = Math.floor(abs / 60000);
  const sec = Math.floor(abs / 1000) % 60;
  const cent = Math.floor(abs / 10) % 100;

  return sign + min + ":" + String(sec).padStart(2, "0") + "." +
    String(cent).padStart(2, "0");
}

export function formatTimeNullable(ms: number | null): string | null {
  if (ms == null) return null;
  return formatTime(ms);
}

export function parseTime(time: string): number | null {
  const match = time.match(/^(\d?\d):([0-5]\d)[:.](\d\d?)$/);
  if (!match) return null;
  return Number(match[1]) * 60000 + Number(match[2]) * 1000 +
    Number(match[3].padEnd(3, "0"));
}

const gradeTable = ["S4", "S5", "S6", "S7", "S8", "S9", "GM"];

export function formatGrade(grade: number): string {
  return gradeTable[grade];
}

export function parseGrade(grade: string): number {
  return gradeTable.indexOf(grade);
}

export function formatLevelOrGrade(
  levelOrGrade: { level: number; grade: number | null },
): string {
  if (levelOrGrade.grade != null) return formatGrade(levelOrGrade.grade);
  return String(levelOrGrade.level);
}

export function formatLevelOrGradeNullable(
  levelOrGrade: { level: number | null; grade: number | null },
): string | null {
  if (levelOrGrade.level == null) return null;
  return formatLevelOrGrade({
    level: levelOrGrade.level,
    grade: levelOrGrade.grade,
  });
}

export function parseLevelOrGrade(
  levelOrGrade: string,
  emptyAsGm = false,
): { level: number | null; grade: number | null } {
  if (levelOrGrade == "") {
    if (emptyAsGm) {
      return { grade: parseGrade("GM"), level: 999 };
    } else {
      return { grade: null, level: null };
    }
  }

  const parsedLevel = Number(levelOrGrade);
  if (!isNaN(parsedLevel)) return { grade: null, level: parsedLevel };

  const parsedGrade = parseGrade(levelOrGrade);
  if (parsedGrade >= 0) return { grade: parsedGrade, level: 999 };

  return { grade: null, level: null };
}

export function getDiffTime(
  players: (StagePlayerEntry | null)[],
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
