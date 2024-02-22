import { isNullOrEmptyString } from "./util.ts";

export const grades = {
  "S4": 0,
  "S5": 1,
  "S6": 2,
  "S7": 3,
  "S8": 4,
  "S9": 5,
  "GM": 6,
} as const;

const gradeTable = ["S4", "S5", "S6", "S7", "S8", "S9", "GM"];

export function gradeToString(grade: number): string {
  return gradeTable[grade];
}

export function stringToGrade(string: string): number | null {
  const index = gradeTable.indexOf(string);
  if (index == -1) return null;
  return index as number;
}

export function spreadsheetValueToLevelOrGrade(
  levelOrGrade: unknown,
): { level: number; grade: number | null } {
  // GMの場合は何も入力されない
  if (isNullOrEmptyString(levelOrGrade)) {
    return { grade: grades.GM, level: 999 };
  }

  // 一度stringに
  const stringified = String(levelOrGrade);

  const parsedLevel = Number(stringified);
  if (!isNaN(parsedLevel)) return { grade: null, level: parsedLevel };

  const parsedGrade = stringToGrade(stringified);
  if (parsedGrade != null) return { grade: parsedGrade, level: 999 };

  throw new Error("Unknown Level/Grade: " + levelOrGrade);
}

export function levelOrGradeToSpreadsheetValue(
  levelOrGrade: { level: number; grade: number | null },
): string | number {
  if (levelOrGrade.grade != null) return gradeToString(levelOrGrade.grade);
  return levelOrGrade.level;
}
