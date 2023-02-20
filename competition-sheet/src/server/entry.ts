// TODO List:
// * 拡張するときに前の行の書式受け継がれる問題
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
    //.addSeparator()
    //.addItem("Debug", "debugCommand")
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

function debugCommand() {
  const ui = SpreadsheetApp.getUi();
  const input = ui.prompt("", ui.ButtonSet.OK_CANCEL);
  if (input.getSelectedButton() == ui.Button.OK) {
    const command = input.getResponseText();
    if (command.startsWith("@")) {
      switch (command.slice(1)) {
        case "listSetup":
          for (let i = 8; i <= 24; i++) {
            console.log(Competition.setupCompetition(i, null));
          }
          break;
        default:
          throw new Error("unknown command");
      }
    } else {
      console.log(eval(input.getResponseText()));
    }
  }
}