import { StagesData } from "../common/spreadsheet_exporter_types.ts";
import { setColumnWidths } from "../common/spreadsheet_util.ts";
import {
  levelOrGradeToSpreadsheetValue,
  pasteTemplate,
  resizeSheet,
  timeToSpreadsheetValue,
} from "../common/spreadsheet_util.ts";
import { getCompetitionStageTemplate } from "./templates.ts";

export const createStagesSheet = (
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  input: StagesData,
  templatesSheet: GoogleAppsScript.Spreadsheet.Sheet,
): GoogleAppsScript.Spreadsheet.Sheet => {
  const { list } = input;

  const sh = ss.insertSheet("Competition");

  resizeSheet(sh, 11 * list.length - 1, 17);
  setColumnWidths(sh, [
    16,
    80,
    70,
    40,
    70,
    24,
    70,
    40,
    70,
    30,
    16,
    80,
    40,
    70,
    70,
    70,
    70,
  ]);

  let baseRow = 1;
  list.forEach((stage) => {
    const { name, entries, result, borderlines } = stage;
    pasteTemplate(
      sh,
      baseRow,
      1,
      templatesSheet,
      getCompetitionStageTemplate(),
      SpreadsheetApp.CopyPasteType.PASTE_NORMAL,
    );

    sh.getRange(baseRow, 1).setValue(name);

    const entriesRange = sh.getRange(baseRow + 2, 2, entries.length, 8);
    const entriesValues = entries.map((e) => {
      if (e == null) return [null, null, null, null, null, null, null, null];
      return [
        e.name,
        timeToSpreadsheetValue(e.rawBestTime),
        e.handicap != 0 ? e.handicap : null,
        timeToSpreadsheetValue(e.bestTime),
        e.startOrder,
        timeToSpreadsheetValue(e.startTime),
        levelOrGradeToSpreadsheetValue({ level: e.level, grade: e.grade }),
        timeToSpreadsheetValue(e.time),
      ];
    });
    entriesRange.setValues(entriesValues);
    entries.forEach((e, i) => {
      if (e == null) return;
      const nameRange = sh.getRange(baseRow + 2 + i, 2);
      if (1 <= e.startOrder && e.startOrder <= 4) {
        nameRange.setBackground("#BAE0CE");
      }
      if (5 <= e.startOrder && e.startOrder <= 8) {
        nameRange.setBackground("#FCE8B6");
      }
    });

    const resultRange = sh.getRange(baseRow + 2, 11, result.length, 7);
    const resultValues = result.map((e) => {
      return [
        e.rank,
        e.name,
        levelOrGradeToSpreadsheetValue({ level: e.level, grade: e.grade }),
        timeToSpreadsheetValue(e.time),
        timeToSpreadsheetValue(e.timeDiffBest),
        timeToSpreadsheetValue(e.timeDiffTop),
        timeToSpreadsheetValue(e.timeDiffPrev),
      ];
    });
    resultRange.setValues(resultValues);

    borderlines.forEach((n) => {
      const range = sh.getRange(baseRow + 2 + n, 11, 1, 7);
      range.setBorder(true, null, null, null, null, null);
    });

    baseRow += 11;
  });

  return sh;
};
