import { StagesData } from "../common/spreadsheet_exporter_types.ts";
import {
  pasteTemplate,
  resizeSheet,
  setColumnWidths,
  timeToSpreadsheetValue,
} from "../common/spreadsheet_util.ts";
import { getTimeDetailTemplate } from "./templates.ts";

export const createTimesSheet = (
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  input: StagesData,
  templatesSheet: GoogleAppsScript.Spreadsheet.Sheet,
): GoogleAppsScript.Spreadsheet.Sheet => {
  const { list } = input;

  const sh = ss.insertSheet("Times");

  resizeSheet(sh, 15 * list.length - 1, 13 * 8 - 1);
  const columnWidths: number[] = [];
  [...new Array(8)].forEach((_, i) => {
    columnWidths.push(56, 60, 60, 30, 24, 24, 24, 24, 48, 48, 48, 48);
    if (i != 7) columnWidths.push(24);
  });
  setColumnWidths(sh, columnWidths);

  let baseRow = 1;
  list.forEach((stage) => {
    sh.getRange(baseRow, 1).setValue(stage.name).setFontWeight("bold");

    let baseColumn = 1;
    stage.entries.forEach((entry) => {
      pasteTemplate(
        sh,
        baseRow + 1,
        baseColumn,
        templatesSheet,
        getTimeDetailTemplate(),
        SpreadsheetApp.CopyPasteType.PASTE_NORMAL,
      );

      if (entry == null) {
        baseColumn += 13;
        return;
      }

      sh.getRange(baseRow + 1, baseColumn).setValue(entry.name);
      // sh.getRange(baseRow + 2, baseColumn, 1, 12).setValues([["区間", "スプリット", "セクション", "ミノ", "1L", "2L", "3L", "4L", "移動時間", "移動F/ミノ", "消去ロス", "ストップ"]]);

      if (entry.timeDetail == null) {
        sh.getRange(baseRow + 13, baseColumn + 1).setValue(
          timeToSpreadsheetValue(entry.time),
        );
        baseColumn += 13;
        return;
      }

      const sectionValues = entry.timeDetail.sections.map((section) => {
        if (section.minoCount > 0) {
          return [
            timeToSpreadsheetValue(section.split),
            timeToSpreadsheetValue(section.lap),
            section.minoCount,
            section.clearCount[0],
            section.clearCount[1],
            section.clearCount[2],
            section.clearCount[3],
            section.moveTime / 1000,
            section.moveTime / section.minoCount * 60 / 1000,
            section.burnTime / 1000,
            section.levelStopTime / 1000,
          ];
        } else {
          return [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ];
        }
      });
      sh.getRange(baseRow + 3, baseColumn + 1, 10, 11).setValues(sectionValues);

      const totalValues = [[
        entry.level,
        timeToSpreadsheetValue(entry.time),
        null,
        entry.timeDetail.minoCount,
        entry.timeDetail.clearCount[0],
        entry.timeDetail.clearCount[1],
        entry.timeDetail.clearCount[2],
        entry.timeDetail.clearCount[3],
        entry.timeDetail.moveTime / 1000,
        entry.timeDetail.moveTime / entry.timeDetail.minoCount * 60 / 1000,
        entry.timeDetail.burnTime / 1000,
        entry.timeDetail.levelStopTime / 1000,
      ]];
      sh.getRange(baseRow + 13, baseColumn, 1, 12).setValues(totalValues);

      baseColumn += 13;
    });

    baseRow += 15;
  });

  return sh;
};
