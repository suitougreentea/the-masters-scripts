// TODO List:
// * ハンデ計算が変なので直す（presetsのwinnersに直接書く？）
// * もう少し良い感じにファイルを分ける
// * エラーハンドリング（フロントPromise化・バックは例外を投げる）
// * デザインもう少し良く
// * 拡張するときに前の行の書式受け継がれる問題
// * エクスポート
// * 自己べランキングを分ける？
// * 適用したら次のステージに進む
// * フロントのデザインを良い感じに
// * スコア欄もっと狭くて良い/Align
// * タイマーにハンデをうまく表示する

function onOpen() {
  var ui = SpreadsheetApp.getUi()
  ui.createMenu("Masters")
      // .addItem("Export", "confirmExport")
      // .addItem("Initialize", "confirmInitialize")
      .addSeparator()
      .addItem("Show Sidebar", "showSidebar")
      .addToUi()
}

function confirmExport() {
  var ui = SpreadsheetApp.getUi()
  var response = ui.alert("Confirm", "Export the result to " + undefined + "?", ui.ButtonSet.YES_NO)
  
  if (response == ui.Button.YES) {
    exportResult()
  }
}

function exportResult() {
  var ui = SpreadsheetApp.getUi()
  var response = ui.alert("Export", "Done!", ui.ButtonSet.OK)
}

function confirmInitialize() {
  var ui = SpreadsheetApp.getUi()
  var response = ui.alert("Confirm", "Do you really want to initialize the sheet? All information will be lost.", ui.ButtonSet.YES_NO)
  
  if (response == ui.Button.YES) {
    initialize()
  }
}

function initialize() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var competitionSheet = ss.getSheetByName("Competition")
  ss.deleteSheet(competitionSheet)
  ss.insertSheet("Competition")
  var entrySheet = ss.getSheetByName("Entry")
  entrySheet.getRange(2, 1, entrySheet.getLastRow() - 1, 1).clear()
  entrySheet.getRange(2, 3, entrySheet.getLastRow() - 1, 1).clear()
  var ui = SpreadsheetApp.getUi()
  var response = ui.alert("Initialize", "Done!", ui.ButtonSet.OK)
}

function showSidebar() {
  var html = HtmlService.createTemplateFromFile("Sidebar").evaluate()
      .setTitle("Masters")
      .setWidth(400)
  
  SpreadsheetApp.getUi()
      .showSidebar(html)
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}

function resizeSheet(sheet, rows, columns) {
  var oldRows = sheet.getMaxRows()
  var oldColumns = sheet.getMaxColumns()
  
  if (rows > oldRows) {
    sheet.insertRowsAfter(oldRows, rows - oldRows)
  } else if (rows < oldRows) {
    sheet.deleteRows(rows + 1, oldRows - rows)
  }
  if (columns > oldColumns) {
    sheet.insertColumnsAfter(oldColumns, columns - oldColumns)
  } else if (columns < oldColumns) {
    sheet.deleteColumns(columns + 1, oldColumns - columns)
  }
}

function addConditionalFormatRule(sh, rule) {
  var rules = sh.getConditionalFormatRules()
  rules.push(rule)
  sh.setConditionalFormatRules(rules)
}

function doGet() {
  return HtmlService.createTemplateFromFile("Timer").evaluate()
}