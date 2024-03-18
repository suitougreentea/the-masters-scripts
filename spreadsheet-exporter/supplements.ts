import { SupplementsData } from "../common/spreadsheet_exporter_types.ts";
import { setColumnWidths } from "../common/spreadsheet_util.ts";
import {
  levelOrGradeToSpreadsheetValue,
  pasteTemplate,
  resizeSheet,
  timeToSpreadsheetValue,
} from "../common/spreadsheet_util.ts";
import {
  getScoreResultTemplate,
  getScoreTableTemplate,
  getSupplementComparisonTemplate,
} from "./templates.ts";

export const createSupplementsSheet = (
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  input: SupplementsData,
  templatesSheet: GoogleAppsScript.Spreadsheet.Sheet,
): GoogleAppsScript.Spreadsheet.Sheet | null => {
  const { supplementComparisons, qualifierScore, qualifierResult } = input;

  if (qualifierScore != null && qualifierResult != null) {
    const sh = ss.insertSheet("Detail");

    const numPlayers = qualifierScore.players.length;
    if (numPlayers == null) throw new Error();
    if (numPlayers < 8 || 12 < numPlayers) throw new Error();

    const scoreTableTemplate = getScoreTableTemplate(numPlayers);
    const scoreResultTemplate = getScoreResultTemplate(numPlayers);
    const tableColumn = 1;
    const resultColumn = scoreTableTemplate.numColumns + 2;
    const numColumns = scoreTableTemplate.numColumns + 1 +
      scoreResultTemplate.numColumns;
    resizeSheet(sh, numPlayers + 2, numColumns);
    setColumnWidths(sh, [
      80,
      24,
      ...[...new Array(numPlayers)].fill(16),
      30,
      16,
      80,
      24,
      24,
      24,
      24,
      24,
      40,
      70,
    ]);

    pasteTemplate(
      sh,
      2,
      tableColumn,
      templatesSheet,
      scoreTableTemplate,
      SpreadsheetApp.CopyPasteType.PASTE_NORMAL,
    );
    pasteTemplate(
      sh,
      1,
      resultColumn,
      templatesSheet,
      scoreResultTemplate,
      SpreadsheetApp.CopyPasteType.PASTE_NORMAL,
    );

    const numStages = scoreTableTemplate.numColumns - 2;
    const scoreTableRange = sh.getRange(
      3,
      tableColumn,
      numPlayers,
      numStages + 2,
    );
    const scoreTableValues = qualifierScore.players.map((e) => {
      const stageScores = [...new Array(numStages)];
      e.stageResults.forEach((r) => {
        stageScores[r.stageIndex] = r.points;
      });
      return [e.name, e.totalPoints, ...stageScores];
    });
    scoreTableRange.setValues(scoreTableValues);

    const scoreResultRange = sh.getRange(3, resultColumn, numPlayers, 9);
    const scoreResultValues = qualifierResult.players.map((e) => {
      return [
        e.rank,
        e.name,
        e.points,
        e.numPlaces[0],
        e.numPlaces[1],
        e.numPlaces[2],
        e.numPlaces[3],
        levelOrGradeToSpreadsheetValue({
          grade: e.bestGameGrade,
          level: e.bestGameLevel,
        }),
        timeToSpreadsheetValue(e.bestGameTimeDiffBest),
      ];
    });
    scoreResultRange.setValues(scoreResultValues);

    return sh;
  } else if (supplementComparisons.length > 0) {
    const sh = ss.insertSheet("Detail");

    const numRows = supplementComparisons.map((e) =>
      e.comparison.length + 3
    ).reduce((a, b) => a + b) - 1;
    resizeSheet(sh, numRows, 6);
    setColumnWidths(sh, [16, 80, 40, 70, 70, 70]);

    let row = 1;
    supplementComparisons.forEach((e) => {
      pasteTemplate(
        sh,
        row,
        1,
        templatesSheet,
        getSupplementComparisonTemplate(e.comparison.length),
        SpreadsheetApp.CopyPasteType.PASTE_NORMAL,
      );

      sh.getRange(row, 1).setValue(e.name);

      const range = sh.getRange(row + 2, 1, e.comparison.length, 6);
      const values = e.comparison.map((p) => [
        p.rank,
        p.name,
        levelOrGradeToSpreadsheetValue({ level: p.level, grade: p.grade }),
        timeToSpreadsheetValue(p.time),
        timeToSpreadsheetValue(p.timeDiffBest),
        timeToSpreadsheetValue(p.timeDiffPrev),
      ]);
      range.setValues(values);

      row += e.comparison.length + 3;
    });

    return sh;
  } else {
    return null;
  }
};
