import { Grade, gradeToString, grades, tryStringToGrade } from "./grade.ts";
import { dateToTime, stringToTime } from "./time.ts";

function isNullOrEmptyString(string: unknown): string is null | "" {
  return string == null || string == "";
}

export const resizeSheet = (sheet: GoogleAppsScript.Spreadsheet.Sheet, rows: number, columns: number) => {
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

export const setColumnWidths = (sheet: GoogleAppsScript.Spreadsheet.Sheet, widths: number[]) => {
  widths.forEach((width, i) => sheet.setColumnWidth(i + 1, width));
}

export type TemplateInfo = {
  row: number,
  column: number,
  numRows: number,
  numColumns: number,
}

export const pasteTemplate = (destSheet: GoogleAppsScript.Spreadsheet.Sheet, row: number, column: number, templatesSheet: GoogleAppsScript.Spreadsheet.Sheet, templateInfo: TemplateInfo, type: GoogleAppsScript.Spreadsheet.CopyPasteType) => {
  const templateRange = templatesSheet.getRange(templateInfo.row, templateInfo.column, templateInfo.numRows, templateInfo.numColumns);

  const destRange = destSheet.getRange(row, column, templateInfo.numRows, templateInfo.numColumns);
  templateRange.copyTo(destRange, type, false);
}

export const timeToSpreadsheetValue = (time: number | null): number | null => {
  if (time == null) return null;
  return time / (24 * 60 * 60 * 1000);
}

export const spreadsheetValueToTime = (value: unknown): number | null => {
  if (value == null) return null;
  if (value instanceof Date) return dateToTime(value);
  if (typeof value == "number") {
    return value * 24 * 60 * 60 * 1000;
  }
  if (typeof value == "string") {
    return stringToTime(value);
  }
  return null;
}

export const spreadsheetValueToLevelOrGrade = (levelOrGrade: unknown): { level: number, grade: Grade | null } => {
  // GMの場合は何も入力されない
  if (isNullOrEmptyString(levelOrGrade)) return { grade: grades.GM, level: 999 };

  // 一度stringに
  const stringified = String(levelOrGrade);

  const parsedLevel = Number(stringified);
  if (!isNaN(parsedLevel)) return { grade: null, level: parsedLevel };

  const parsedGrade = tryStringToGrade(stringified);
  if (parsedGrade != null) return { grade: parsedGrade, level: 999 };

  throw new Error("Unknown Level/Grade: " + levelOrGrade);
}

export const levelOrGradeToSpreadsheetValue = (levelOrGrade: { level: number | null, grade: Grade | null }): string | number | null => {
  if (levelOrGrade.grade != null) return gradeToString(levelOrGrade.grade);
  return levelOrGrade.level;
}
