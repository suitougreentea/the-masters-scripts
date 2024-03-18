export const grades = {
  "9": 0,
  "8": 1,
  "7": 2,
  "6": 3,
  "5": 4,
  "4": 5,
  "3": 6,
  "2": 7,
  "1": 8,
  "S1": 9,
  "S2": 10,
  "S3": 11,
  "S4": 12,
  "S5": 13,
  "S6": 14,
  "S7": 15,
  "S8": 16,
  "S9": 17,
  "GM": 18,
} as const;

const gradeTable = [
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
  "1",
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
  "S9",
  "GM",
] as const;

export type GradeString = (typeof gradeTable)[number];
export type Grade = (typeof grades)[GradeString];

export const gradeToString = (grade: Grade): GradeString => {
  return gradeTable[grade];
};

export const stringToGrade = (string: GradeString): Grade => {
  return gradeTable.indexOf(string) as Grade;
};

export const tryStringToGrade = (string: string): Grade | null => {
  const index = gradeTable.indexOf(string as unknown as GradeString);
  if (index == -1) return null;
  return index as Grade;
};
