// TODO List:
// * ハンデ計算が変なので直す（presetsのwinnersに直接書く？）
// * デザインもう少し良く
// * 拡張するときに前の行の書式受け継がれる問題
// * エクスポート
// * フロントのデザインを良い感じに
// * タイマーにハンデをうまく表示する

function doGet() {
  return HtmlService.createTemplateFromFile("timer").evaluate();
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Masters")
    .addItem("Export", "confirmExport")
    .addSeparator()
    .addItem("Show Sidebar", "showSidebar")
    .addToUi();
}

function confirmExport() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert("Confirm", "Export the result to " + undefined + "?", ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    Exporter.exportResult();
    ui.alert("Export", "Done!", ui.ButtonSet.OK);
  }
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile("sidebar").evaluate()
    .setTitle("Masters")
    .setWidth(400);

  SpreadsheetApp.getUi()
    .showSidebar(html);
}

// test

function resetValidation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  {
    const playersSheet = ss.getSheetByName(Definition.sheetNames.players);
    if (playersSheet == null) throw new Error();
    const nameValidationBuilder = SpreadsheetApp.newDataValidation();
    nameValidationBuilder.requireFormulaSatisfied("=COUNTIF(A$2:A2, A2)=1");
    playersSheet.getRange("A2:A").setDataValidation(nameValidationBuilder.build());
  }
  {
    const entrySheet = ss.getSheetByName(Definition.sheetNames.entry);
    if (entrySheet == null) throw new Error();
    const nameValidationBuilder = SpreadsheetApp.newDataValidation();
    nameValidationBuilder.requireFormulaSatisfied("=COUNTIF(A$3:A3, A3)=1");
    entrySheet.getRange("A3:A").setDataValidation(nameValidationBuilder.build());
  }
}