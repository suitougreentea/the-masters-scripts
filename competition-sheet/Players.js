var groupNames = ["A", "B", "C", "D", "E", "F"]

function startCompetition(form) {
  var presetName = form.preset
  if (presetName == null) {
    SpreadsheetApp.getUi().alert("プリセットを選択してください")
    return
  }
  var preset = presets[presetName]
  if (preset == null) {
    SpreadsheetApp.getUi().alert("存在しないプリセットです")
    return
  }
  
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Entry")
  var players = sh.getMaxRows() - 1
  var values = sh.getRange(2, 1, players, 3).getValues()
  
  if (!(preset.supportPlayers[0] <= players && players <= preset.supportPlayers[1])) {
    SpreadsheetApp.getUi().alert("このプリセットは" + players + "人に対応していません")
    return
  }
  
  var firstGroups = preset.firstGroups

  var groups = new Array(firstGroups)
  for (var i = 0; i < firstGroups; i++) {
    groups[i] = []
  }  
  
  try {
    values.forEach(function (row) {
      // TODO: duplicate check
      if (row[1] == "#N/A") {
        SpreadsheetApp.getUi().alert("空か、自己ベストデータの無いプレイヤーがいます")
        throw new Error()
      }
      var index = groupNames.indexOf(row[2])
      if (index == -1 || index >= firstGroups) {
        SpreadsheetApp.getUi().alert("不正な1回戦組があります: " + row[2])
        throw new Error()
      }
      groups[index].push(row[0])
    })
  } catch (e) { return }
  
  var lengths = groups.map(function (group) { return group.length })
  var failed = false
  var diff = 0
  for (var i = 1; i < lengths.length; i++) {
    var prev = lengths[i - 1]
    var curr = lengths[i]
    if (prev < curr) failed = true
    diff += prev - curr
    if (diff >= 2) failed = true
  }
  if (failed) {
    SpreadsheetApp.getUi().alert("1回戦組の振り分けが正しくありません。各グループの人数差は1以内で、かつ先のグループの方が人数が多くなっている必要があります: " + lengths)
    return
  }
  
  initializeCompetitionSheet(preset)
  setInitialPlayers(groups)
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Competition").activate()
  PropertiesService.getScriptProperties().setProperty("preset", presetName)
}

function setNumberPlayers(form) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Entry")
  sh.activate()
  var players = Number(form.numberPlayers)
  resizeSheet(sh, players + 1, 3)
  var range = sh.getRange(2, 1, players, 3)
  range.setBorder(true, true, true, true, false, false)
  var nameRange = sh.getRange(2, 1, players, 1)
  nameRange.setNumberFormat("@")
  
  var bestRange = sh.getRange(2, 2, players, 1)
  bestRange.setFontColor("gray")
  bestRange.setFormulaR1C1("=VLOOKUP(R[0]C[-1], Players!C1:C3, 3, FALSE)")
}

function getCurrentNumberPlayersFromSheet() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Entry")
  return sh.getMaxRows() - 1
}

function setNumberGames(form) {
  initializeCompetitionSheet(form.numberGames)
}

function getCurrentNumberGamesFromSheet() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Competition")
  return Math.floor((sh.getMaxRows() + 1) / 11)
}

// 1回戦1組と決勝のみ (5～8人, 計2戦)

// 1回戦2組 (特殊WC), 敗者復活1戦 (9人, 計6戦)
// 9: W1:[5,4]>(W2:8,L1:1); W2:[8]>(W3:4,L1:4); L1:[5]>(W3:4); W3:[8]>(W4:4)

// 1回戦2組, 敗者復活1戦 (10～12人, 計6戦)
// 10: W1:[5,5]>(W2:8,L1:2); W2:[8]>(W3:4,L1:4); L1:[6]>(W3:4); W3:[8]>(W4:4)
// 12: W1:[6,6]>(W2:8,L1:4); W2:[8]>(W3:4,L1:4); L1:[8]>(W3:4); W3:[8]>(W4:4)

// 1回戦2組, 敗者復活2戦 (13～16人, 計7戦)
// 13: W1:[7,6]>(W2:8,L1:5); L1:[5]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4); W3:[8]>(W4:4)
// 16: W1:[8,8]>(W2:8,L1:8); L1:[8]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4); W3:[8]>(W4:4)

// 1回戦3組, 敗者復活1戦2組 (17～20人, 計8戦)
// 17: W1:[6,6,5]>(W2:8,L1:9); W2:[8]>(W3:4,L1:4); L1:[7,6]>(W3:4); W3[8]>(W4:4)
// 20: W1:[7,7,6]>(W2:8,L1:12); W2:[8]>(W3:4,L1:4); L1:[8,8]>(W3:4); W3:[8]>(W4:4)
// aba, bab, ab

// 1回戦3組, 2回戦2組, 敗者復活なし (21～24人, 計7戦)
// 21: W1:[7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3[8]>(W4:4)
// 22: W1:[8,7,7]>(W2:16); W2:[8,8]>(W3:8); W3[8]>(W4:4)
// 24: W1:[8,8,8]>(W2:16); W2:[8,8]>(W3:8); W3[8]>(W4:4)
// abab, baba, abab

// 1回戦4組, 2回戦2組, 敗者復活なし (25～32人, 計8戦)
// 25: W1:[7,6,6,6]...
// 32: W1:[8,8,8,8]...
// abab, baba, abab, baba

// 1回戦5組, 2回戦2組, 敗者復活なし (33～40人, 計9戦)
// 33: W1:[7,7,7,6,6]...
// 40: W1:[8,8,8,8,8]>(W2:16); W2:[8,8]>(W3:8); W3[8]>(W4:4)

// 41: [8,]


// 6人編成, 1回戦2組, 敗者復活1戦 (8～9人, 計6戦)
// 8: W1:[4,3]>(W2:6,L1:3); W2:[6]>(W3:3,L1:3); L1:[6]>(W3:3); W3:[6]>(W4:3)
// 9: W1:[5,4]>(W2:6,L1:3); W2:[6]>(W3:3,L1:3); L1:[6]>(W3:3); W3:[6]>(W4:3)

// 6人編成, 1回戦2組, 敗者復活2戦 (10～12人, 計7戦)
// 10: W1:[5,5]>(W2:6,L1:4); L1:[4]>(L2:3); W2:[6]>(W3:3,L2:3); L2:[6]>(W3:3); W3:[8]>(W4:3)
// 11: W1:[6,5]>(W2:6,L1:5); L1:[5]>(L2:3); W2:[6]>(W3:3,L2:3); L2:[6]>(W3:3); W3:[8]>(W4:3)
// 12: W1:[6,6]>(W2:6,L1:6); L1:[6]>(L2:3); W2:[6]>(W3:3,L2:3); L2:[6]>(W3:3); W3:[8]>(W4:3)