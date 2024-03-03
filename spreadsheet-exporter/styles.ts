type Range = GoogleAppsScript.Spreadsheet.Range;

export const applyHeaderStyle = (range: Range) => {
  range.setBackground("#434343").setFontColor("#FFFFFF").setFontWeight("bold")
    .setHorizontalAlignment("center");
};
