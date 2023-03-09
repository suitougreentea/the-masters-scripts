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

  /**
   * 大会リザルトをマイドライブ直下にエクスポート
   */
  export function exportResult(): { url: string } {
    const ssSrc = SpreadsheetApp.getActiveSpreadsheet();
    const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ssSrc);
    const ssDest = SpreadsheetApp.create(`${metadata.name} Result`);
    const defaultSheet = ssDest.getSheets()[0];

    const moveSheet = (ss: Spreadsheet, sh: Sheet, pos: number) => {
      ss.setActiveSheet(sh);
      ss.moveActiveSheet(pos);
    };

    let sheetIndex = 1;

    const setupSheetSrc = ssSrc.getSheetByName(Definition.sheetNames.setup);
    if (setupSheetSrc == null) throw new Error("Setupシートがありません");
    const setupSheetDest = copySheetAsValues(setupSheetSrc, ssDest);
    setupSheetDest.setName("Info");
    moveSheet(ssDest, setupSheetDest, sheetIndex);
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

    const fileId = ssDest.getId()
    const file = DriveApp.getFileById(fileId);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    try {
      // 動かすアカウントによっては権限が無いはず
      const folder = DriveApp.getFolderById("1Np9NBJq0rgWFhgxaUG6M2gYyrlT2juXj");
      file.moveTo(folder);
    } catch (e) {
      console.error(e as object);
    }
    return { url: `https://docs.google.com/spreadsheets/d/${fileId}/edit?usp=sharing` };
  }
}
