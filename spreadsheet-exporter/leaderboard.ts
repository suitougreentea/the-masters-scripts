import { LeaderboardData } from "../common/spreadsheet_exporter_types.ts";
import { setColumnWidths } from "../common/spreadsheet_util.ts";
import { timeToSpreadsheetValue } from "../common/spreadsheet_util.ts";
import { resizeSheet } from "../common/spreadsheet_util.ts";
import { Time, createTime } from "../common/time.ts";

const getColorByBestTime = (bestTime: Time) => {
  // TODO: fill this
  if (bestTime < createTime(8, 50, 0)) return "#000000";
  if (bestTime < createTime(8, 50, 0)) return "#000000";
  if (bestTime < createTime(8, 50, 0)) return "#000000";
  if (bestTime < createTime(8, 50, 0)) return "#000000";
  return null;
}

export const createLeaderboardSheet = (ss: GoogleAppsScript.Spreadsheet.Spreadsheet, input: LeaderboardData): GoogleAppsScript.Spreadsheet.Sheet => {
  const { list } = input;

  const sh = ss.insertSheet("Ranking");

  resizeSheet(sh, list.length + 1, 2);
  setColumnWidths(sh, [34, 100, 59]);

  const headerRange = sh.getRange(1, 1, 1, 3)
  headerRange.setValues([["#", "プレイヤー", "タイム"]]);
  headerRange.setBackground("#000000").setFontColor("#FFFFFF").setFontWeight("bold");

  const valueRange = sh.getRange(2, 1, list.length, 3);
  valueRange.setValues(list.map(e => [e.rank, e.name, timeToSpreadsheetValue(e.bestTime)]));
  valueRange.setNumberFormats(list.map(_ => ["0", "@", "mm:ss.00"]));
  valueRange.setBorder(true, true, true, true, null, null);

  // TODO: can be optimized as list is sorted
  list.forEach((e, i) => {
    const color = getColorByBestTime(e.bestTime);
    if (color != null) {
      sh.getRange(i + 2, 1, 1, 3).setBackground(color);
    }
  })

  return sh;
}
