type SpreadsheetCell = string | number | Date | null;
type SpreadsheetArg = SpreadsheetCell | SpreadsheetCell[][]

function MASTERS_GETRESULT(names: SpreadsheetArg, bestTimes: SpreadsheetArg, gradeOrLevels: SpreadsheetArg, clearTimes: SpreadsheetArg) {
  if (!Array.isArray(names) || !Array.isArray(bestTimes) || !Array.isArray(gradeOrLevels) || !Array.isArray(clearTimes)) throw new Error();

  const numRows = Math.min(names.length, bestTimes.length, gradeOrLevels.length, clearTimes.length);
  const scores: Competition.PlayerScore[] = [];
  for (let i = 0; i < numRows; i++) {
    const nameInput = names[i][0];
    const bestTimeInput = bestTimes[i][0];
    const gradeOrLevelInput = gradeOrLevels[i][0];
    const clearTimeInput = clearTimes[i][0];

    // 空欄
    if (Util.isNullOrEmptyString(nameInput)) continue;
    // リザルト未入力
    if (Util.isNullOrEmptyString(gradeOrLevelInput) && Util.isNullOrEmptyString(clearTimeInput)) continue;

    const name = String(nameInput);
    const { grade, level } = Util.spreadsheetValueToGradeOrLevel(gradeOrLevelInput);
    const time = Time.spreadsheetValueToTime(clearTimeInput);
    const bestTime = Time.spreadsheetValueToTime(bestTimeInput);
    if (bestTime == null) throw new Error();

    scores.push({
      name,
      grade,
      time,
      level,
      bestTime,
    } as Competition.PlayerResult); // TODO: 型チェック
  }

  const result = Competition.getResult(scores);
  if (result.length == 0) return null;

  return result.map(e => [
    e.rank,
    e.name,
    Util.gradeOrLevelToSpreadsheetValue({ grade: e.grade, level: e.level } as ({ grade: Grade.Grade, level: 999 } | { grade: null, level: number })), // TODO: 型チェック
    Time.timeToSpreadsheetValue(e.time),
    Time.timeToSpreadsheetValue(e.timeDiffBest),
    Time.timeToSpreadsheetValue(e.timeDiffTop),
    Time.timeToSpreadsheetValue(e.timeDiffPrev),
  ]);
}