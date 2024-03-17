import { TemplateInfo } from "../common/spreadsheet_util.ts";

export const getCompetitionStageTemplate = (): TemplateInfo => ({
  row: 1,
  column: 1,
  numRows: 10,
  numColumns: 17,
});

export const getCompetitionStageWildcardTemplate = (): TemplateInfo => ({
  row: 12,
  column: 1,
  numRows: 10,
  numColumns: 17,
});

export const getSupplementComparisonTemplate = (
  numPlayers: number,
): TemplateInfo => {
  if (numPlayers == 2) return { row: 23, column: 1, numRows: 4, numColumns: 6 };
  if (numPlayers == 3) return { row: 28, column: 1, numRows: 5, numColumns: 6 };
  if (numPlayers == 4) return { row: 34, column: 1, numRows: 6, numColumns: 6 };
  if (numPlayers == 5) return { row: 41, column: 1, numRows: 7, numColumns: 6 };
  if (numPlayers == 6) return { row: 49, column: 1, numRows: 8, numColumns: 6 };
  throw new Error("Unsupported numPlayers");
};

export const getScoreTableTemplate = (numPlayers: number): TemplateInfo => {
  if (numPlayers == 8) {
    return { row: 59, column: 1, numRows: 9, numColumns: 10 };
  }
  if (numPlayers == 9) {
    return { row: 70, column: 1, numRows: 10, numColumns: 11 };
  }
  if (numPlayers == 10) {
    return { row: 82, column: 1, numRows: 11, numColumns: 12 };
  }
  if (numPlayers == 11) {
    return { row: 95, column: 1, numRows: 12, numColumns: 13 };
  }
  if (numPlayers == 12) {
    return { row: 109, column: 1, numRows: 13, numColumns: 11 };
  }
  throw new Error("Unsupported numPlayers");
};

export const getScoreResultTemplate = (numPlayers: number): TemplateInfo => {
  if (numPlayers == 8) {
    return { row: 58, column: 16, numRows: 10, numColumns: 9 };
  }
  if (numPlayers == 9) {
    return { row: 69, column: 16, numRows: 11, numColumns: 9 };
  }
  if (numPlayers == 10) {
    return { row: 81, column: 16, numRows: 12, numColumns: 9 };
  }
  if (numPlayers == 11) {
    return { row: 94, column: 16, numRows: 13, numColumns: 9 };
  }
  if (numPlayers == 12) {
    return { row: 108, column: 16, numRows: 14, numColumns: 9 };
  }
  throw new Error("Unsupported numPlayers");
};
