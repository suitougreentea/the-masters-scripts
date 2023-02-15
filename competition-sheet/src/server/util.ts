namespace Util {
  export function isNullOrEmptyString(string: unknown): string is null | "" {
    return string == null || string == "";
  }

  export function spreadsheetValueToGradeOrLevel(gradeOrLevel: unknown): { grade: Grade.Grade, level: 999 } | { grade: null, level: number } {
    // GMの場合は何も入力されない
    if (isNullOrEmptyString(gradeOrLevel)) return { grade: Grade.grades.GM, level: 999 };

    // 一度stringに
    const stringified = String(gradeOrLevel);

    const parsedLevel = Number(stringified);
    if (!isNaN(parsedLevel)) return { grade: null, level: parsedLevel };

    const parsedGrade = Grade.stringToGrade(stringified);
    if (parsedGrade != null) return { grade: parsedGrade, level: 999 };

    throw new Error("Unknown Grade/Level: " + gradeOrLevel);
  }

  export function gradeOrLevelToSpreadsheetValue(gradeOrLevel: { grade: Grade.Grade, level: 999 } | { grade: null, level: number }): string | number {
    if (gradeOrLevel.grade != null) return Grade.gradeToString(gradeOrLevel.grade);
    return gradeOrLevel.level;
  }
}
