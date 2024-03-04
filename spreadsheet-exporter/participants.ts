import { groupIndexToString } from "../common/group.ts";
import { ParticipantsData } from "../common/spreadsheet_exporter_types.ts";
import { setColumnWidths } from "../common/spreadsheet_util.ts";
import { timeToSpreadsheetValue } from "../common/spreadsheet_util.ts";
import { resizeSheet } from "../common/spreadsheet_util.ts";
import { applyHeaderStyle } from "./styles.ts";

export const createParticipantsSheet = (
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  input: ParticipantsData,
): GoogleAppsScript.Spreadsheet.Sheet => {
  const { list } = input;

  const sh = ss.insertSheet("Participants");

  resizeSheet(sh, list.length + 2, 3);
  setColumnWidths(sh, [103, 68, 62]);

  const numPlayersHeaderRange = sh.getRange(1, 1, 1, 2);
  numPlayersHeaderRange.merge();
  numPlayersHeaderRange.setValue("エントリー人数");
  applyHeaderStyle(numPlayersHeaderRange);

  const numPlayersRange = sh.getRange(1, 3);
  numPlayersRange.setValue(list.length);
  numPlayersRange.setHorizontalAlignment("center");

  const headerRange = sh.getRange(2, 1, 1, 3);
  headerRange.setValues([["プレイヤー", "組", "ベスト"]]);
  applyHeaderStyle(headerRange);

  const valueRange = sh.getRange(3, 1, list.length, 3);
  valueRange.setValues(
    list.map((
      e,
    ) => [
      e.name,
      groupIndexToString(e.firstRoundGroupIndex),
      timeToSpreadsheetValue(e.bestTime),
    ]),
  );
  valueRange.setNumberFormats(list.map((_) => ["@", "@", "mm:ss.00"]));
  valueRange.setBorder(true, true, true, true, null, null);

  return sh;
};
