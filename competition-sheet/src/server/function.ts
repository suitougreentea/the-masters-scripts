type SpreadsheetCell = string | number | Date | null;
type SpreadsheetArg = SpreadsheetCell | SpreadsheetCell[][]

/**
 * ステージリザルトを計算するスプレッドシート関数。配列で渡すこと。
 * @param names
 * @param bestTimes ハンデ調整後の自己ベスト
 * @param gradeOrLevels
 * @param clearTimes
 * @returns リザルトを表に展開したもの
 */
function MASTERS_GETRESULT(names: SpreadsheetArg, bestTimes: SpreadsheetArg, gradeOrLevels: SpreadsheetArg, clearTimes: SpreadsheetArg) {
  // TODO: S9でタイムがないときにバグる
  if (!Array.isArray(names) || !Array.isArray(bestTimes) || !Array.isArray(gradeOrLevels) || !Array.isArray(clearTimes)) throw new Error();

  const numRows = Math.min(names.length, bestTimes.length, gradeOrLevels.length, clearTimes.length);
  const scores: Competition.StageResultEntryStub[] = [];
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
    const { grade, level } = Grade.spreadsheetValueToLevelOrGrade(gradeOrLevelInput);
    const time = Time.spreadsheetValueToTime(clearTimeInput);
    const bestTime = Time.spreadsheetValueToTime(bestTimeInput);
    if (bestTime == null) throw new Error();

    scores.push({
      name,
      grade,
      time,
      level,
      timeDiffBest: time != null ? time - bestTime : null,
    });
  }

  const result = Competition.getStageResult(scores);
  if (result.length == 0) return null;

  return result.map(e => [
    e.rank,
    e.name,
    Grade.levelOrGradeToSpreadsheetValue({ grade: e.grade, level: e.level }), // TODO: 型チェック
    Time.timeToSpreadsheetValue(e.time),
    Time.timeToSpreadsheetValue(e.timeDiffBest),
    Time.timeToSpreadsheetValue(e.timeDiffTop),
    Time.timeToSpreadsheetValue(e.timeDiffPrev),
  ]);
}