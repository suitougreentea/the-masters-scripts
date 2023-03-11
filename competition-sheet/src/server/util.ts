namespace Util {
  export function isNullOrEmptyString(string: unknown): string is null | "" {
    return string == null || string == "";
  }

  export function resizeSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, rows: number, columns: number) {
    const oldRows = sheet.getMaxRows();
    const oldColumns = sheet.getMaxColumns();

    if (rows > oldRows) {
      sheet.insertRowsAfter(oldRows, rows - oldRows);
    } else if (rows < oldRows) {
      sheet.deleteRows(rows + 1, oldRows - rows);
    }
    if (columns > oldColumns) {
      sheet.insertColumnsAfter(oldColumns, columns - oldColumns);
    } else if (columns < oldColumns) {
      sheet.deleteColumns(columns + 1, oldColumns - columns);
    }
  }

  /**
   * シートにメタデータをJSON形式で格納
   * @param sh シート
   * @param key キー
   * @param obj データ
   */
  export function setSheetMetadata(sh: GoogleAppsScript.Spreadsheet.Sheet, key: string, obj: unknown) {
    const findArray = sh.createDeveloperMetadataFinder().withKey(key).find();
    if (findArray.length > 0) {
      findArray[0].setValue(JSON.stringify(obj));
    } else {
      sh.addDeveloperMetadata(key, JSON.stringify(obj));
    }
  }

  /**
   * シートに格納されたJSON形式のメタデータを取り出す
   * @param sh シート
   * @param key キー
   * @returns データ
   */
  export function getSheetMetadata(sh: GoogleAppsScript.Spreadsheet.Sheet, key: string): unknown {
    const findArray = sh.createDeveloperMetadataFinder().withKey(key).find();
    if (findArray.length > 0) {
      const value = findArray[0].getValue();
      if (Util.isNullOrEmptyString(value)) return undefined;
      return JSON.parse(value);
    } else {
      return undefined;
    }
  }
}
