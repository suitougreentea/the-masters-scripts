namespace Exporter {
  type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
  type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
  type Range = GoogleAppsScript.Spreadsheet.Range;

  function copySheetAsValues(shSrc: Sheet, ssDest: Spreadsheet): Sheet {
    const rows = shSrc.getMaxRows();
    const columns = shSrc.getMaxColumns();

    const shDest = shSrc.copyTo(ssDest);
    shDest.setName(shSrc.getName());

    const rangeSrc = shSrc.getRange(1, 1, rows, columns);
    const rangeDest = shDest.getRange(1, 1, rows, columns);

    const values = rangeSrc.getValues();
    rangeDest.setValues(values);
    const numberFormats = rangeSrc.getNumberFormats();
    rangeDest.setNumberFormats(numberFormats);

    return shDest;
  }

  export function exportResult() {
    const ssSrc = SpreadsheetApp.getActiveSpreadsheet();
    const ssDest = SpreadsheetApp.create("The Masters Result");
    const defaultSheet = ssDest.getSheets()[0];

    const moveSheet = (ss: Spreadsheet, sh: Sheet, pos: number) => {
      ss.setActiveSheet(sh);
      ss.moveActiveSheet(pos);
    };

    let sheetIndex = 1;

    const entrySheetSrc = ssSrc.getSheetByName(Definition.sheetNames.entry);
    if (entrySheetSrc == null) throw new Error("Entryシートがありません");
    const entrySheetDest = copySheetAsValues(entrySheetSrc, ssDest);
    moveSheet(ssDest, entrySheetDest, sheetIndex);
    sheetIndex++;

    const competitionSheetSrc = ssSrc.getSheetByName(Definition.sheetNames.competition);
    if (competitionSheetSrc == null) throw new Error("Competitionシートがありません");
    const competitionSheetDest = copySheetAsValues(competitionSheetSrc, ssDest);
    moveSheet(ssDest, competitionSheetDest, sheetIndex);
    sheetIndex++;

    const detailSheetSrc = ssSrc.getSheetByName(Definition.sheetNames.competitionDetail);
    if (detailSheetSrc != null) {
      const detailSheetDest = copySheetAsValues(detailSheetSrc, ssDest);
      moveSheet(ssDest, detailSheetDest, sheetIndex);
      sheetIndex++;
    }

    const rankingSheetSrc = ssSrc.getSheetByName(Definition.sheetNames.ranking);
    if (rankingSheetSrc == null) throw new Error("Rankingシートがありません");
    const rankingSheetDest = copySheetAsValues(rankingSheetSrc, ssDest);
    moveSheet(ssDest, rankingSheetDest, sheetIndex);
    sheetIndex++;

    ssDest.deleteSheet(defaultSheet);
  }
}
