var gradesTable = ["S4", "S5", "S6", "S7", "S8", "S9", "GM"]
var gmGrade = gradesTable.indexOf("GM")
var widths = [16, 80, 70, 40, 70, 24, 70, 70, 70, 30, 16, 80, 40, 70, 70, 70, 70]

/*
function initializeCompetitionSheet(preset) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  sh.clearConditionalFormatRules()
  var row = 1
  var windex = 0
  preset.stages.forEach(function (stage, index) {
    var name = stage.name
    sh.getRange(row, 1).setValue(name)
    sh.getRange(row, 1, 1, 9).setBackground("#C9DAF8").setFontWeight("bold").setBorder(true, true, true, true, null, null)
    ss.setNamedRange("Stage" + index, sh.getRange(row, 1))
    
    var headers = ["#", "プレイヤー名", "(ベスト)", "Hdcp", "(調整)", "(順)", "(スタート)", "スコア", "タイム"]
    sh.getRange(row + 1, 1, 1, 9).setValues([headers]).setFontWeight("bold").setHorizontalAlignment("center").setBorder(true, true, true, true, null, null)
    
    var contentStartRow = row + 2
    var contentEndRow = row + 9
    sh.getRange(row + 2, 1, 8, 1).setValues([[1], [2], [3], [4], [5], [6], [7], [8]])

    var nameRange = sh.getRange(row + 2, 2, 8, 1)
    var rule1 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(1 <= INDIRECT(ADDRESS(ROW(), COLUMN() + 4, 4)), INDIRECT(ADDRESS(ROW(), COLUMN() + 4, 4)) <= 4)')
    .setBackground("#B7E1CD")
    .setRanges([nameRange])
    .build()
    addConditionalFormatRule(sh, rule1)
    var rule2 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(5 <= INDIRECT(ADDRESS(ROW(), COLUMN() + 4, 4)), INDIRECT(ADDRESS(ROW(), COLUMN() + 4, 4)) <= 8)')
    .setBackground("#FCE8B2")
    .setRanges([nameRange])
    .build()
    addConditionalFormatRule(sh, rule2)
    nameRange.setNumberFormat("@")
    
    sh.getRange(row + 2, 3, 8, 1).setFormula('=IF(ISBLANK(R[0]C2), "", VLOOKUP(R[0]C[-1], Entry!A$2:B, 2, FALSE))')

    var handicapRange = sh.getRange(row + 2, 4, 8, 1)
    handicapRange.setNumberFormat("+0;-0")
    var handPositiveRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setFontColor("#0B8043")
    .setRanges([handicapRange])
    .build()
    var handNegativeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setFontColor("#C53929")
    .setRanges([handicapRange])
    .build()
    addConditionalFormatRule(sh, handPositiveRule)
    addConditionalFormatRule(sh, handNegativeRule)
    
    sh.getRange(row + 2, 5, 8, 1).setFormula('=IF(ISBLANK(R[0]C2), "", R[0]C[-2] - TIME(0, 0, 1) * R[0]C[-1])')
    
    sh.getRange(row + 2, 6, 8, 1).setFormula('=IF(ISBLANK(R[0]C2), "", RANK(R[0]C[-1], R' + contentStartRow + 'C[-1]:R' + contentEndRow + 'C[-1]))').setFontWeight("bold")
    
    sh.getRange(row + 2, 7, 8, 1).setFormula('=IF(ISBLANK(R[0]C2), "", VLOOKUP(1, {R' + contentStartRow + 'C[-1]:R' + contentEndRow + 'C[-1], R' + contentStartRow + 'C[-2]:R' + contentEndRow + 'C[-2]}, 2, false) - R[0]C[-2])')

    sh.getRange(row + 2, 1, 8, 9).setBorder(true, true, true, true, null, null)
    
    sh.getRange(row, 11).setValue("結果")
    sh.getRange(row, 11, 1, 7).setBackground("#F9CB9C").setFontWeight("bold").setBorder(true, true, true, true, null, null)
    ss.setNamedRange("Result" + index, sh.getRange(row, 11))
    
    var resultHeaders = ["#", "プレイヤー名", "スコア", "タイム", "(調整)", "トップとの差", "上位との差"]
    sh.getRange(row + 1, 11, 1, 7).setValues([resultHeaders]).setFontWeight("bold").setHorizontalAlignment("center").setBorder(true, true, true, true, null, null)
    
    sh.getRange(row + 2, 11, 8, 1).setValues([[1], [2], [3], [4], [5], [6], [7], [8]])
    
    sh.getRange(row + 2, 12, 8, 1).setNumberFormat("@")
    
    sh.getRange(row + 2, 13, 8, 1).setHorizontalAlignment("right")
    
    sh.getRange(row + 2, 14, 8, 4).setNumberFormat("[mm]:ss.00")
    
    sh.getRange(row + 1 + stage.winners.length, 11, 1, 7).setBorder(null, null, true, null, null, null)
    if (stage.wildcards) sh.getRange(row + 1 + stage.winners.length + stage.wildcards.length, 11, 1, 7).setBorder(null, null, true, null, null, null)

    sh.getRange(row + 2, 11, 8, 7).setBorder(true, true, true, true, null, null)
    
    row += 11
  })
  resizeSheet(sh, row - 2, 17)
  for (var i = 0; i < 17; i++) sh.setColumnWidth(i + 1, widths[i])
}
*/

// コロナ仕様
function initializeCompetitionSheet(numberGames) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  sh.clearConditionalFormatRules()
  var row = 1
  var windex = 0
  for (let index = 0; index < numberGames; index++) {
    var name = String(index + 1)
    sh.getRange(row, 1).setValue(name)
    sh.getRange(row, 1, 1, 9).setBackground("#C9DAF8").setFontWeight("bold").setBorder(true, true, true, true, null, null)
    ss.setNamedRange("Stage" + index, sh.getRange(row, 1))
    
    var headers = ["#", "プレイヤー名", "(ベスト)", "Hdcp", "(調整)", "(順)", "(スタート)", "スコア", "タイム"]
    sh.getRange(row + 1, 1, 1, 9).setValues([headers]).setFontWeight("bold").setHorizontalAlignment("center").setBorder(true, true, true, true, null, null)
    
    var contentStartRow = row + 2
    var contentEndRow = row + 9
    sh.getRange(row + 2, 1, 8, 1).setValues([[1], [2], [3], [4], [5], [6], [7], [8]])

    var nameRange = sh.getRange(row + 2, 2, 8, 1)
    var rule1 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(1 <= INDIRECT(ADDRESS(ROW(), COLUMN() + 4, 4)), INDIRECT(ADDRESS(ROW(), COLUMN() + 4, 4)) <= 4)')
    .setBackground("#B7E1CD")
    .setRanges([nameRange])
    .build()
    addConditionalFormatRule(sh, rule1)
    var rule2 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(5 <= INDIRECT(ADDRESS(ROW(), COLUMN() + 4, 4)), INDIRECT(ADDRESS(ROW(), COLUMN() + 4, 4)) <= 8)')
    .setBackground("#FCE8B2")
    .setRanges([nameRange])
    .build()
    addConditionalFormatRule(sh, rule2)
    nameRange.setNumberFormat("@")
    
    sh.getRange(row + 2, 3, 8, 1).setFormula('=IF(ISBLANK(R[0]C2), "", VLOOKUP(R[0]C[-1], Entry!A$2:B, 2, FALSE))')

    var handicapRange = sh.getRange(row + 2, 4, 8, 1)
    handicapRange.setNumberFormat("+0;-0")
    var handPositiveRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setFontColor("#0B8043")
    .setRanges([handicapRange])
    .build()
    var handNegativeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setFontColor("#C53929")
    .setRanges([handicapRange])
    .build()
    addConditionalFormatRule(sh, handPositiveRule)
    addConditionalFormatRule(sh, handNegativeRule)
    
    sh.getRange(row + 2, 5, 8, 1).setFormula('=IF(ISBLANK(R[0]C2), "", R[0]C[-2] - TIME(0, 0, 1) * R[0]C[-1])')
    
    sh.getRange(row + 2, 6, 8, 1).setFormula('=IF(ISBLANK(R[0]C2), "", RANK(R[0]C[-1], R' + contentStartRow + 'C[-1]:R' + contentEndRow + 'C[-1]))').setFontWeight("bold")
    
    sh.getRange(row + 2, 7, 8, 1).setFormula('=IF(ISBLANK(R[0]C2), "", VLOOKUP(1, {R' + contentStartRow + 'C[-1]:R' + contentEndRow + 'C[-1], R' + contentStartRow + 'C[-2]:R' + contentEndRow + 'C[-2]}, 2, false) - R[0]C[-2])')

    sh.getRange(row + 2, 1, 8, 9).setBorder(true, true, true, true, null, null)
    
    sh.getRange(row, 11).setValue("結果")
    sh.getRange(row, 11, 1, 7).setBackground("#F9CB9C").setFontWeight("bold").setBorder(true, true, true, true, null, null)
    ss.setNamedRange("Result" + index, sh.getRange(row, 11))
    
    var resultHeaders = ["#", "プレイヤー名", "スコア", "タイム", "(調整)", "トップとの差", "上位との差"]
    sh.getRange(row + 1, 11, 1, 7).setValues([resultHeaders]).setFontWeight("bold").setHorizontalAlignment("center").setBorder(true, true, true, true, null, null)
    
    sh.getRange(row + 2, 11, 8, 1).setValues([[1], [2], [3], [4], [5], [6], [7], [8]])
    
    sh.getRange(row + 2, 12, 8, 1).setNumberFormat("@")
    
    sh.getRange(row + 2, 13, 8, 1).setHorizontalAlignment("right")
    
    sh.getRange(row + 2, 14, 8, 4).setNumberFormat("[mm]:ss.00")
    
    // sh.getRange(row + 1 + stage.winners.length, 11, 1, 7).setBorder(null, null, true, null, null, null)
    // if (stage.wildcards) sh.getRange(row + 1 + stage.winners.length + stage.wildcards.length, 11, 1, 7).setBorder(null, null, true, null, null, null)

    sh.getRange(row + 2, 11, 8, 7).setBorder(true, true, true, true, null, null)
    
    row += 11
  }
  resizeSheet(sh, row - 2, 17)
  for (var i = 0; i < 17; i++) sh.setColumnWidth(i + 1, widths[i])
}

function setInitialPlayers(groups) {
  groups.forEach(function (names_, index) {
    names = new Array(8)
    for (var i = 0; i < 8; i++) names[i] = i < names_.length ? names_[i] : ""
    setPlayerNames(index, names)
  })
}

function getPlayerNames(index) {
  console.error("getPlayerNames() is deprecated")
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  var nr = ss.getRangeByName("Stage" + index)
  var row = nr.getRow()
  var range = sh.getRange(row + 2, 2, 8, 1)
  var value = range.getValues()
  return value.map(function (e) { return e[0] })
}

function getPlayerNamesAndHandicaps(index) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  var nr = ss.getRangeByName("Stage" + index)
  var row = nr.getRow()
  var nameRange = sh.getRange(row + 2, 2, 8, 1)
  var nameValue = nameRange.getValues()
  var handRange = sh.getRange(row + 2, 4, 8, 1)
  var handValue = handRange.getValues()
  var result = []
  for (var i = 0; i < 8; i++) {
    result.push({ name: nameValue[i], handicap: handValue[i] == "" ? 0 : Number(handValue[i]) })
  }
  return result
}

function setPlayerNames(index, names) {
  console.error("setPlayerNames() is deprecated")
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  var nr = ss.getRangeByName("Stage" + index)
  var row = nr.getRow()
  var range = sh.getRange(row + 2, 2, 8, 1)
  var value = []
  names.forEach(function (e) { value.push([e]) })
  range.setValues(value)
}

function doneSortPlayers(index, names) {
  var old = getPlayerNamesAndHandicaps(index)
  var data = names.map(function (name) {
    var match = old.filter(function (e) { return e.name == name })[0]
    if (name == "") handicap = 0
    else if (match == null) handicap = 0
    else handicap = match.handicap
    return { name: name, handicap: handicap }
  })
  setPlayerNamesAndHandicaps(index, data, false)
}

function setPlayerNamesAndHandicaps(index, data, append) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  var nr = ss.getRangeByName("Stage" + index)
  var row = nr.getRow()
  var nameRange = sh.getRange(row + 2, 2, 8, 1)
  var startIndex = 0
  if (append) nameRange.getValues().forEach(function (row, i) { if (row[0] != "") startIndex = i + 1 })
  var length = Math.max(8 - startIndex, 0)
  var nameValue = data.map(function (e) { return [e.name] }).slice(0, length)
  var newNameRange = sh.getRange(row + 2 + startIndex, 2, nameValue.length, 1)
  newNameRange.setValues(nameValue)
  var handValue = data.map(function (e) { return [e.handicap != 0 ? e.handicap : null] }).slice(0, length)
  var handRange = sh.getRange(row + 2 + startIndex, 4, handValue.length, 1)
  handRange.setValues(handValue)
  var scoresValue = data.map(function (e) {
    var score = e.score == null ? null : e.score
    var time = e.time
    return [score, timeToString(time)]
  })
  var scoresRange = sh.getRange(row + 2 + startIndex, 8, handValue.length, 2)
  scoresRange.setValues(scoresValue)
}


function getStageName(index) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  var nr = ss.getRangeByName("Stage" + index)
  return nr.getValue()
}

function setTimer(index) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  var nr = ss.getRangeByName("Stage" + index)
  var row = nr.getRow()
  var names = sh.getRange(row + 2, 2, 8, 1).getValues().map(function (e) { return e[0] })
  var times = sh.getRange(row + 2, 7, 8, 1).getValues().map(function (e) {
    if (!e[0]) return 0
    return parseTimeFromDate(e[0])
  })
  var result = new Array(8)
  for (var i = 0; i < 8; i++) {
    result[i] = { name: names[i], time: times[i] }
  }
  setTimerData(result)
}

function compareResult(a, b) {
  if (a.grade != null && b.grade == null) return 1
  if (a.grade == null && b.grade != null) return -1
  if (a.grade != null && b.grade != null) {
    // grade-time sort
    if (a.grade == b.grade) return - (a.calcTime - b.calcTime)
    return a.grade - b.grade
  }
  // level-time sort
  if (a.level == b.level) return - (a.calcTime - b.calcTime)
  return a.level - b.level
}

function setResult(index) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  var nr = ss.getRangeByName("Stage" + index)
  var row = nr.getRow()
  var names = sh.getRange(row + 2, 2, 8, 1).getValues().map(function (e) { return e[0] })
  var bestTimes = sh.getRange(row + 2, 5, 8, 1).getValues().map(function (e) {
    if (!e[0]) return 0
    return parseTimeFromDate(e[0])
  })
  var result = sh.getRange(row + 2, 8, 8, 2).getValues()
  var combinedResult = []
  for (var i = 0; i < 8; i++) {
    var name = names[i]
    if (name != "") {
      var score = result[i][0]
      var level = null
      var grade = null
      if (score == "") grade = gmGrade
      var _level = Number(score)
      if (!isNaN(_level)) {
        level = _level
      } else {
        var _grade = gradesTable.indexOf(score)
        if (_grade >= 0) {
          grade = _grade
        } else {
          throw new Error("Unknown score: " + score)
        }
      }
      var time = parseTimeFromString(result[i][1])
      var bestTime = bestTimes[i]
      var calcTime = time != null ? time - bestTime : null
      combinedResult.push({
        name: name,
        level: level,
        grade: grade,
        time: time,
        calcTime: calcTime,
      })
    }
  }
  
  var values = []
  combinedResult.sort(compareResult).reverse()
  var top = combinedResult[0]
  for (var i = 0; i < combinedResult.length; i++) {
    var e = combinedResult[i]
    var prev = combinedResult[i-1]
    var score = null
    if (e.level != null) score = e.level
    if (e.grade != null) score = gradesTable[e.grade]
    var topDiff = null
    if (e.grade == gmGrade) topDiff = e.calcTime - top.calcTime
    var prevDiff = null
    if (prev != null && ((e.level != null && prev.level == e.level) || (e.grade != null && prev.grade == e.grade))) prevDiff = e.calcTime - prev.calcTime
    var rank = i + 1
    if (prev != null && compareResult(e, prev) == 0) rank = values[i-1][0]
    
    values.push([
      rank,
      e.name,
      score,
      timeToSpreadsheet(e.time),
      timeToSpreadsheet(e.calcTime),
      timeToSpreadsheet(topDiff),
      timeToSpreadsheet(prevDiff)
    ])
  }
  
  sh.getRange(row + 2, 11, values.length, 7).setValues(values)
}

function setNext(index) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName("Competition")
  var nr = ss.getRangeByName("Stage" + index)
  var row = nr.getRow()
  var players = getPlayerNamesAndHandicaps(index)
  var result = sh.getRange(row + 2, 12, 8, 3).getValues().map(function (row) { return { name: row[0], score: row[1], time: parseTimeFromDate(row[2]) } })
  var resultNames = result.map(function (p) { return p.name })
  var preset = getCurrentPreset()
  var stage = preset.stages[index]
  var winnersLength = stage.winners.length
  var wildcardLength = stage.wildcards ? stage.wildcards.length : 0
  var losersLength = stage.losers.length
  var winners = resultNames.slice(0, winnersLength)
  var wildcard = resultNames.slice(winnersLength, winnersLength + wildcardLength)
  var losers = resultNames.slice(winnersLength + wildcardLength)

  winners.forEach(function (e, i) {
    var to = stage.winners[i]
    if (to == null) return
    var newHandicap = 0
    var player = players.filter(function (p) { return p.name == e })[0]
    var oldHandicap = player.handicap
    var adv = i == 0 ? -10 : i == 1 ? -5 : 0
    if (stage.consolation) adv = i == 0 ? 5 : 10
    if (stage.wildcard) adv = 0
    if (player.handicap < 0) newHandicap = adv
    else newHandicap = oldHandicap + adv
    var data = [{ name: e, handicap: newHandicap }]
    setPlayerNamesAndHandicaps(to, data, true, false)
  })

  wildcard.forEach(function (e, i) {
    var to = stage.wildcards[i]
    if (to == null) return
    var player = players.filter(function (p) { return p.name == e })[0]
    var playerResult = result.filter(function (p) { return p.name == e })[0]
    var data = [{ name: e, handicap: player.handicap, score: playerResult.score, time: playerResult.time }]
    setPlayerNamesAndHandicaps(to, data, true, true)
  })

  losers.forEach(function (e, i) {
    var to = stage.losers[i]
    if (to == null) return
    var data = [{ name: e, handicap: 0 }]
    setPlayerNamesAndHandicaps(to, data, true, false)
  })
}

/*
function getStageInfo(index) {
  var preset = getCurrentPreset()
  if (index < 0 || preset.stages.length <= index) return null
  return {
    stageName: getStageName(index),
    players: getPlayerNamesAndHandicaps(index).map(function (e) { return e.name })
  }
}
*/
// コロナ仕様
function getStageInfo(index) {
  // var preset = getCurrentPreset()
  if (index < 0 || getCurrentNumberGamesFromSheet() <= index) return null
  return {
    stageName: getStageName(index),
    players: getPlayerNamesAndHandicaps(index).map(function (e) { return e.name })
  }
}

function getCurrentPreset() {
  var name = PropertiesService.getScriptProperties().getProperty("preset")
  return presets[name]
}
  
function parseTimeFromString(str) {
  var match = str.match(/^(\d?\d):([0-5]\d)[:\.](\d\d?)$/)
  if (!match) return null
  return Number(match[1]) * 60000 + Number(match[2]) * 1000 + Number(match[3].padEnd(3, "0"))
}
function parseTimeFromDate(date) {
  if (date == null || date == "") return null
  return date.getMinutes() * 60000 + date.getSeconds() * 1000 + date.getMilliseconds()
}
function timeToSpreadsheet(time) {
  if (time == null) return null
  return time / (24 * 60 * 60 * 1000)
}
function timeFromSpreadsheet(sstime) {
  if (sstime == null || sstime == "") return null
  return sstime * 24 * 60 * 60 * 1000
}
function timeFromSpreadsheetNative(sstime) {
  if (!(sstime instanceof Date)) return null
  return sstime.getTime() + 2209194000000
}
function timeToString(time) {
  if (time == null) return null
  var min = Math.floor(time / 60000)
  var sec = Math.floor(time / 1000) % 60
  var cent = Math.floor(time / 10) % 100
  return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0") + "." + String(cent).padStart(2, "0")
}
  
function getTimerData() {
  // console.log(SpreadsheetApp.getActiveSpreadsheet())
  // return JSON.parse(SpreadsheetApp.openById("1sKRSB-6rct6p3A0YyRy6YBMjZYerEJeWbJoLFA158PA").getSheetByName("Competition").getRange(1, 1).getValue())
  return JSON.parse(PropertiesService.getDocumentProperties().getProperty("timerData"))
}

function setTimerData(data) {
  // console.log("timerdata 2")
  // SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Competition").getRange(1, 1).setValue(JSON.stringify(data))
  // PropertiesService.getDocumentProperties().deleteAllProperties()
  return PropertiesService.getDocumentProperties().setProperty("timerData", JSON.stringify(data))
}