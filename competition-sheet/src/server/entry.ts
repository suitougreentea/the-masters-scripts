/**
 * タイマーへのアクセス
 * @returns タイマーページ
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createTemplateFromFile("timer").evaluate();
}

/**
 * スプレッドシートを開いた際の初期化。メニュー追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Masters")
    .addItem("結果をエクスポート", "exportResult")
    .addSeparator()
    .addItem("サイドバーを表示", "showSidebar")
    .addSeparator()
    .addItem("Debug", "debugCommand")
    .addToUi();
}

/**
 * 確認画面を表示してから結果をマイドライブにエクスポート
 */
function exportResult() {
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

/**
 * サイドバーを表示
 */
function showSidebar() {
  const html = HtmlService.createTemplateFromFile("sidebar").evaluate()
    .setTitle("Masters")
    .setWidth(400);

  SpreadsheetApp.getUi()
    .showSidebar(html);
}

/**
 * デバッグ用
 */
function debugCommand() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const manualSheet = ss.getSheetByName("Manual")!;
  const value = manualSheet.getRange(1, 1).getValue();
  if (Util.isNullOrEmptyString(value)) return;
  const command = String(value);

  if (command.startsWith("@")) {
    switch (command.slice(1)) {
      case "listSetup":
        Test.listSetup();
        break;
      default:
        throw new Error("unknown command");
    }
  } else {
    Test.logJson(eval(command));
  }
}
