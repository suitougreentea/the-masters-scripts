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

  export type Grade = typeof grades[keyof typeof grades];

  export function gradeToString(grade: Grade): string {
    return gradeTable[grade];
  }

  export function stringToGrade(string: string): Grade | null {
    const index = gradeTable.indexOf(string);
    if (index == -1) return null;
    return index as Grade;
  }
}
