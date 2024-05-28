import { StageScoreValue } from "../../../common/common_types.ts";
import {
  GradeString,
  gradeToString,
  stringToGrade,
} from "../../../common/grade.ts";
import { timeToString } from "../../../common/time.ts";

export const parseScoreEditorScore = (
  value: string,
): StageScoreValue | undefined => {
  const levelMatch = value.match(/^\d{1,3}$/);
  if (levelMatch) {
    return { level: Number(levelMatch[0]), grade: undefined, time: undefined };
  }
  const gradeAndTimeMatch = value.match(
    /^(([1-9]|S[1-9]|GM) +)?(((\d{1,2}):(\d{1,2})[:\.](\d{1,2}))|((\d{1,2})(\d\d)(\d\d)))$/,
  );
  if (gradeAndTimeMatch) {
    const grade = stringToGrade((gradeAndTimeMatch[2] ?? "GM") as GradeString);
    const longTime = gradeAndTimeMatch.slice(5, 8);
    const shortTime = gradeAndTimeMatch.slice(9, 12);
    let time: number;
    if (longTime[0] != null) {
      time = Number(longTime[0]) * 60000 + Number(longTime[1]) * 1000 +
        Number(longTime[2].padEnd(2, "0")) * 10;
    } else if (shortTime[0] != null) {
      time = Number(shortTime[0]) * 60000 + Number(shortTime[1]) * 1000 +
        Number(shortTime[2]) * 10;
    } else {
      throw new Error();
    }
    return { level: 999, grade, time };
  }
  return undefined;
};

export const formatScoreEditorScore = (
  score: StageScoreValue,
): string => {
  if (score.level != null && score.grade == null && score.time == null) {
    return String(score.level);
  }
  if (score.grade != null && score.time != null) {
    return `${gradeToString(score.grade)} ${timeToString(score.time)}`;
  }
  if (score.grade == null && score.time != null) {
    return `GM ${timeToString(score.time)}`;
  }
  return "";
};
