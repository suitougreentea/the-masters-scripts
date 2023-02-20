namespace Grade {
  export const grades = {
    S4: 0,
    S5: 1,
    S6: 2,
    S7: 3,
    S8: 4,
    S9: 5,
    GM: 6,
  } as const;

  const gradeTable = ["S4", "S5", "S6", "S7", "S8", "S9", "GM"];

  /* eslint no-shadow: off */
  export type Grade = typeof grades[keyof typeof grades];

  export function gradeToString(grade: Grade): string {
    return gradeTable[grade];
  }

  export function stringToGrade(string: string): Grade | null {
    const index = gradeTable.indexOf(string);
    if (index == -1) return null;
    return index as Grade;
  }

  export function spreadsheetValueToGradeOrLevel(gradeOrLevel: unknown): { grade: Grade.Grade | null, level: number } {
    // GMの場合は何も入力されない
    if (Util.isNullOrEmptyString(gradeOrLevel)) return { grade: Grade.grades.GM, level: 999 };

    // 一度stringに
    const stringified = String(gradeOrLevel);

    const parsedLevel = Number(stringified);
    if (!isNaN(parsedLevel)) return { grade: null, level: parsedLevel };

    const parsedGrade = Grade.stringToGrade(stringified);
    if (parsedGrade != null) return { grade: parsedGrade, level: 999 };

    throw new Error("Unknown Grade/Level: " + gradeOrLevel);
  }

  export function gradeOrLevelToSpreadsheetValue(gradeOrLevel: { grade: Grade.Grade | null, level: number }): string | number {
    if (gradeOrLevel.grade != null) return Grade.gradeToString(gradeOrLevel.grade);
    return gradeOrLevel.level;
  }
}
