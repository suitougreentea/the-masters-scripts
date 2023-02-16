// TODO List:
// * ハンデ計算が変なので直す（presetsのwinnersに直接書く？）
// * デザインもう少し良く
// * 拡張するときに前の行の書式受け継がれる問題
// * フロントのデザインを良い感じに
// * タイマーにハンデをうまく表示する

function doGet() {
  return HtmlService.createTemplateFromFile("timer").evaluate();
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Masters")
    .addItem("結果をエクスポート", "confirmExport")
    .addSeparator()
    .addItem("サイドバーを表示", "showSidebar")
    .addToUi();
}

function confirmExport() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert("Confirm", "結果をエクスポートしますか？", ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    try {
      Exporter.exportResult();
      ui.alert("Export", "エクスポート完了。マイドライブ直下に生成されています。", ui.ButtonSet.OK);
    } catch (e) {
      SpreadsheetApp.getUi().alert(String(e));
    }
  }
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile("sidebar").evaluate()
    .setTitle("Masters")
    .setWidth(400);

  SpreadsheetApp.getUi()
    .showSidebar(html);
}
