import { LeaderboardData } from "../common/spreadsheet_exporter_types.ts";
import { setColumnWidths } from "../common/spreadsheet_util.ts";
import { timeToSpreadsheetValue } from "../common/spreadsheet_util.ts";
import { resizeSheet } from "../common/spreadsheet_util.ts";
import { createTime, Time } from "../common/time.ts";
import { applyHeaderStyle } from "./styles.ts";

const getColorByBestTime = (bestTime: Time): string | undefined => {
  if (bestTime < createTime(9, 0, 0)) return "#F2CDCC";
  if (bestTime < createTime(9, 10, 0)) return "#FBE5CF";
  if (bestTime < createTime(9, 20, 0)) return "#FFF2CF";
  if (bestTime < createTime(9, 30, 0)) return "#DAEAD5";
  if (bestTime < createTime(9, 40, 0)) return "#D1E0E3";
  if (bestTime < createTime(10, 0, 0)) return "#C9DAF6";
  if (bestTime < createTime(10, 30, 0)) return "#D0E2F2";
  if (bestTime < createTime(11, 0, 0)) return "#D8D2E8";
  if (bestTime < createTime(12, 0, 0)) return "#E9D2DB";
  return undefined;
};

export const createLeaderboardSheet = (
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  input: LeaderboardData,
): GoogleAppsScript.Spreadsheet.Sheet => {
  const { list } = input;

  const sh = ss.insertSheet("Ranking");

  resizeSheet(sh, list.length + 1, 3);
  setColumnWidths(sh, [34, 100, 59]);

  const headerRange = sh.getRange(1, 1, 1, 3);
  headerRange.setValues([["順位", "プレイヤー", "タイム"]]);
  applyHeaderStyle(headerRange);

  const valueRange = sh.getRange(2, 1, list.length, 3);
  valueRange.setValues(
    list.map((e) => [e.rank, e.name, timeToSpreadsheetValue(e.bestTime)]),
  );
  valueRange.setNumberFormats(list.map((_) => ["0", "@", "mm:ss.00"]));
  valueRange.setBorder(true, true, true, true, null, null);

  // TODO: can be optimized as list is sorted
  list.forEach((e, i) => {
    const color = getColorByBestTime(e.bestTime);
    if (color != null) {
      sh.getRange(i + 2, 1, 1, 3).setBackground(color);
    }
  });

  return sh;
};
