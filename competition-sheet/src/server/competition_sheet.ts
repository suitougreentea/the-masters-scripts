namespace CompetitionSheet {
  type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
  type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
  type Range = GoogleAppsScript.Spreadsheet.Range;

  type StageInfo = { stageName: string, players: (PlayerData | null)[] };
  type PlayerData = { name: string, handicap: number, gradeOrLevel: string | null, time: string | null };

  export function initializeCompetitionSheet(ss: Spreadsheet, sh: Sheet, setupResult: Competition.CompetitionSetupResult) {
    const { preset, presetName } = setupResult;
    sh.addDeveloperMetadata(Definition.metadataKeys.presetName, presetName);

    let numStages: number;
    if (preset != null) {
      numStages = preset.stages.length;
    } else {
      if (setupResult.manualNumberOfGames == null) throw new Error();
      numStages = setupResult.manualNumberOfGames;
    }

    let row = 1;
    for (let index = 0; index < numStages; index++) {
      const stage = preset != null ? preset.stages[index] : null;
      const name = stage != null ? stage.name : String(index + 1);
      sh.getRange(row, 1).setValue(name);
      sh.getRange(row, 1, 1, 9).setBackground("#C9DAF8").setFontWeight("bold").setBorder(true, true, true, true, null, null);
      ss.setNamedRange("Stage" + index, sh.getRange(row, 1));

      const headers = ["#", "プレイヤー名", "(ベスト)", "Hdcp", "(調整)", "(順)", "(スタート)", "段/Lv", "タイム"];
      sh.getRange(row + 1, 1, 1, 9).setValues([headers]).setFontWeight("bold").setHorizontalAlignment("center").setBorder(true, true, true, true, null, null);

      const contentStartRow = row + 2;
      const contentEndRow = row + 9;
      sh.getRange(contentStartRow, 1, 8, 1).setValues([[1], [2], [3], [4], [5], [6], [7], [8]]);

      const positionAndNameRange = sh.getRange(contentStartRow, 1, 8, 2);
      const rule1 = SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=AND(1 <= $F${contentStartRow}, $F${contentStartRow} <= 4)`)
        .setBackground("#B7E1CD")
        .setRanges([positionAndNameRange])
        .build();
      addConditionalFormatRule(sh, rule1);
      const rule2 = SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=AND(5 <= $F${contentStartRow}, $F${contentStartRow} <= 8)`)
        .setBackground("#FCE8B2")
        .setRanges([positionAndNameRange])
        .build();
      addConditionalFormatRule(sh, rule2);

      const nameRange = sh.getRange(contentStartRow, 2, 8, 1);
      nameRange.setNumberFormat("@");

      const handicapRange = sh.getRange(contentStartRow, 4, 8, 1);
      handicapRange.setNumberFormat("+0;-0");
      const handPositiveRule = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThan(0)
        .setFontColor("#0B8043")
        .setRanges([handicapRange])
        .build();
      const handNegativeRule = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThan(0)
        .setFontColor("#C53929")
        .setRanges([handicapRange])
        .build();
      addConditionalFormatRule(sh, handPositiveRule);
      addConditionalFormatRule(sh, handNegativeRule);

      sh.getRange(contentStartRow, 3).setFormulaR1C1(`=MAP(R${contentStartRow}C2:R${contentEndRow}C2, MASTERS_GETBESTFROMENTRY)`);
      sh.getRange(contentStartRow, 5).setFormulaR1C1(`=MAP(R${contentStartRow}C3:R${contentEndRow}C3, R${contentStartRow}C4:R${contentEndRow}C4, MASTERS_GETHANDICAPPEDBEST)`);
      sh.getRange(contentStartRow, 6).setFormulaR1C1(`=MAP(R${contentStartRow}C5:R${contentEndRow}C5, LAMBDA(e, MASTERS_GETSTARTORDER(e, R${contentStartRow}C5:R${contentEndRow}C5)))`);
      sh.getRange(contentStartRow, 7).setFormulaR1C1(`=MAP(R${contentStartRow}C5:R${contentEndRow}C5, LAMBDA(e, MASTERS_GETSTARTTIME(e, R${contentStartRow}C5:R${contentEndRow}C5)))`);

      const startOrderRange = sh.getRange(contentStartRow, 6, 8, 1);
      startOrderRange.setFontWeight("bold");

      const resultInputGradeOrLevelRange = sh.getRange(contentStartRow, 8, 8, 1);
      resultInputGradeOrLevelRange.setHorizontalAlignment("right");

      const resultInputTimeRange = sh.getRange(contentStartRow, 9, 8, 1);
      resultInputTimeRange.setNumberFormat("@");
      resultInputTimeRange.setHorizontalAlignment("right");

      sh.getRange(contentStartRow, 1, 8, 9).setBorder(true, true, true, true, null, null);

      sh.getRange(row, 11).setValue("結果");
      sh.getRange(row, 11, 1, 7).setBackground("#F9CB9C").setFontWeight("bold").setBorder(true, true, true, true, null, null);
      ss.setNamedRange("Result" + index, sh.getRange(row, 11));

      const resultHeaders = ["#", "プレイヤー名", "段/Lv", "タイム", "(調整)", "トップとの差", "上位との差"];
      sh.getRange(row + 1, 11, 1, 7).setValues([resultHeaders]).setFontWeight("bold").setHorizontalAlignment("center").setBorder(true, true, true, true, null, null);

      sh.getRange(contentStartRow, 11).setFormulaR1C1(`=MASTERS_GETRESULT(R${contentStartRow}C2:R${contentEndRow}C2, R${contentStartRow}C5:R${contentEndRow}C5, R${contentStartRow}C8:R${contentEndRow}C8, R${contentStartRow}C9:R${contentEndRow}C9)`);
      // sh.getRange(contentStartRow, 11, 8, 1).setValues([[1], [2], [3], [4], [5], [6], [7], [8]]);

      sh.getRange(contentStartRow, 12, 8, 1).setNumberFormat("@");

      sh.getRange(contentStartRow, 13, 8, 1).setHorizontalAlignment("right");

      sh.getRange(contentStartRow, 14, 8, 4).setNumberFormat("[mm]:ss.00");

      if (stage != null) {
        sh.getRange(row + 1 + stage.winners.length, 11, 1, 7).setBorder(null, null, true, null, null, null);
        if (stage.wildcards) sh.getRange(row + 1 + stage.winners.length + stage.wildcards.length, 11, 1, 7).setBorder(null, null, true, null, null, null);
      }

      sh.getRange(contentStartRow, 11, 8, 7).setBorder(true, true, true, true, null, null);

      row += 11;
    }
    resizeSheet(sh, row - 2, 17);
    for (let i = 0; i < 17; i++) sh.setColumnWidth(i + 1, widths[i]);
  }

  function readPresetName(sh: Sheet): string | null {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const competitionSheet = ss.getSheetByName(Definition.sheetNames.competition);
    if (competitionSheet == null) return null;
    const data = competitionSheet.createDeveloperMetadataFinder().withKey(Definition.metadataKeys.presetName).find()[0];
    if (data == null) return null;
    const name = data.getValue();
    return name;
  }

  export function getCurrentPreset(sh: Sheet): Preset.Preset | null {
    const name = readPresetName(sh);
    if (name == null) return null;
    return Preset.presets[name];
  }

  function getStageRange(ss: Spreadsheet, stageIndex: number): Range {
    const result = ss.getRangeByName("Stage" + stageIndex);
    if (result == null) throw new Error(`Stage ${stageIndex} not found`);
    return result;
  }

  function getStageNameFromSpreadsheet(ss: Spreadsheet, stageIndex: number): string {
    return String(getStageRange(ss, stageIndex).getValue());
  }

  export function getStageInfo(ss: Spreadsheet, sh: Sheet, stageIndex: number): StageInfo {
    return {
      stageName: getStageNameFromSpreadsheet(ss, stageIndex),
      players: getPlayerData(ss, sh, stageIndex)
    };
  }

  export function setFirstRoundPlayers(ss: Spreadsheet, sh: Sheet, firstRoundGroups: string[][]) {
    firstRoundGroups.forEach((names, stageIndex) => {
      const namesAndHandicaps: (PlayerData | null)[] = [];
      for (let i = 0; i < 8; i++) {
        if (i < names.length) {
          namesAndHandicaps.push({ name: names[i], handicap: 0, gradeOrLevel: null, time: null });
        } else {
          namesAndHandicaps.push(null);
        }
      }
      setPlayerData(ss, sh, stageIndex, namesAndHandicaps, false);
    });
  }

  function getPlayerData(ss: Spreadsheet, sh: Sheet, stageIndex: number): (PlayerData | null)[] {
    const row = getStageRange(ss, stageIndex).getRow();

    const nameRange = sh.getRange(row + 2, 2, 8, 1);
    const handicapRange = sh.getRange(row + 2, 4, 8, 1);
    const scoreRange = sh.getRange(row + 2, 8, 8, 2);

    const nameValues = nameRange.getValues();
    const handicapValues = handicapRange.getValues();
    const scoreValues = scoreRange.getValues();

    const result: (PlayerData | null)[] = [];
    for (let i = 0; i < 8; i++) {
      if (Util.isNullOrEmptyString(nameValues[i])) {
        result.push(null);
      } else {
        const name = String(nameValues[i][0]);
        const handicap = Util.isNullOrEmptyString(handicapValues[i][0]) ? 0 : Number(handicapValues[i][0]);
        const gradeOrLevel = Util.isNullOrEmptyString(scoreValues[i][0]) ? null : String(scoreValues[i][0]);
        const time = Util.isNullOrEmptyString(scoreValues[i][1]) ? null : String(scoreValues[i][1]);
        result.push({ name, handicap, gradeOrLevel, time });
      }
    }
    return result;
  }

  function setPlayerData(ss: Spreadsheet, sh: Sheet, stageIndex: number, data: (PlayerData | null)[], append: boolean) {
    if (!append && data.length != 8) throw new Error();

    const row = getStageRange(ss, stageIndex).getRow();

    const nameRange = sh.getRange(row + 2, 2, 8, 1);
    const handicapRange = sh.getRange(row + 2, 4, 8, 1);
    const scoreRange = sh.getRange(row + 2, 8, 8, 2);

    let nameValues: unknown[][];
    let handicapValues: unknown[][];
    let scoreValues: unknown[][];
    let startIndex = 0;

    if (append) {
      nameValues = nameRange.getValues();
      handicapValues = handicapRange.getValues();
      scoreValues = scoreRange.getValues();
      for (let i = 0; i < nameValues.length; i++) {
        if (!Util.isNullOrEmptyString(nameValues[i][0])) startIndex = i + 1;
      }
    } else {
      nameValues = new Array(8).fill(null).map(_ => [null]);
      handicapValues = new Array(8).fill(null).map(_ => [null]);
      scoreValues = new Array(8).fill(null).map(_ => [null, null]);
      // トランスパイル結果がだめ
      // nameValues = [...new Array(8)].map(_ => [null]);
      // handicapValues = [...new Array(8)].map(_ => [null]);
      // scoreValues = [...new Array(8)].map(_ => [null, null]);
    }

    if (startIndex + data.length > nameValues.length) throw new Error("Players overflow");

    data.forEach((e, i) => {
      if (e == null) return;
      const destIndex = startIndex + i;
      nameValues[destIndex][0] = e.name;
      handicapValues[destIndex][0] = e.handicap != 0 ? e.handicap : null;
      scoreValues[destIndex][0] = e.gradeOrLevel;
      scoreValues[destIndex][1] = e.time;
    });

    nameRange.setValues(nameValues);
    handicapRange.setValues(handicapValues);
    scoreRange.setValues(scoreValues);
  }

  export function reorderPlayers(ss: Spreadsheet, sh: Sheet, stageIndex: number, newPlayerNames: (string | null)[]) {
    if (newPlayerNames.length != 8) throw new Error();

    const row = getStageRange(ss, stageIndex).getRow();

    const nameRange = sh.getRange(row + 2, 2, 8, 1);
    const handicapRange = sh.getRange(row + 2, 4, 8, 1);
    const scoreRange = sh.getRange(row + 2, 8, 8, 2);

    const oldNameValues = nameRange.getValues();
    const oldHandicapValues = handicapRange.getValues();
    const oldScoreValues = scoreRange.getValues();

    const newNameValues: unknown[][] = [];
    const newHandicapValues: unknown[][] = [];
    const newScoreValues: unknown[][] = [];

    newPlayerNames.forEach(name => {
      if (Util.isNullOrEmptyString(name)) {
        newNameValues.push([null]);
        newHandicapValues.push([null]);
        newScoreValues.push([null, null]);
      } else {
        const oldIndex = oldNameValues.findIndex(e => e[0] == name);
        if (oldIndex < 0) throw new Error("対応するプレイヤーが見つかりませんでした。更新後再度並び替えを行ってください: " + name);
        newNameValues.push(oldNameValues[oldIndex]);
        newHandicapValues.push(oldHandicapValues[oldIndex]);
        newScoreValues.push(oldScoreValues[oldIndex]);
      }
    });

    nameRange.setValues(newNameValues);
    handicapRange.setValues(newHandicapValues);
    scoreRange.setValues(newScoreValues);
  }

  /*
  function setTimer(index) {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sh = ss.getSheetByName("Competition")
    const nr = ss.getRangeByName("Stage" + index)
    const row = nr.getRow()
    const names = sh.getRange(row + 2, 2, 8, 1).getValues().map(function (e) { return e[0] })
    const times = sh.getRange(row + 2, 7, 8, 1).getValues().map(function (e) {
      if (!e[0]) return 0
      return parseTimeFromDate(e[0])
    })
    const result = new Array(8)
    for (const i = 0; i < 8; i++) {
      result[i] = { name: names[i], time: times[i] }
    }
    setTimerData(result)
  }

  function setNext(index) {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sh = ss.getSheetByName("Competition")
    const nr = ss.getRangeByName("Stage" + index)
    const row = nr.getRow()
    const players = getPlayerNamesAndHandicaps(index)
    const result = sh.getRange(row + 2, 12, 8, 3).getValues().map(function (row) { return { name: row[0], score: row[1], time: parseTimeFromDate(row[2]) } })
    const resultNames = result.map(function (p) { return p.name })
    const preset = getCurrentPreset()
    const stage = preset.stages[index]
    const winnersLength = stage.winners.length
    const wildcardLength = stage.wildcards ? stage.wildcards.length : 0
    const losersLength = stage.losers.length
    const winners = resultNames.slice(0, winnersLength)
    const wildcard = resultNames.slice(winnersLength, winnersLength + wildcardLength)
    const losers = resultNames.slice(winnersLength + wildcardLength)

    winners.forEach(function (e, i) {
      const to = stage.winners[i]
      if (to == null) return
      const newHandicap = 0
      const player = players.filter(function (p) { return p.name == e })[0]
      const oldHandicap = player.handicap
      const adv = i == 0 ? -10 : i == 1 ? -5 : 0
      if (stage.consolation) adv = i == 0 ? 5 : 10
      if (stage.wildcard) adv = 0
      if (player.handicap < 0) newHandicap = adv
      else newHandicap = oldHandicap + adv
      const data = [{ name: e, handicap: newHandicap }]
      setPlayerNamesAndHandicaps(to, data, true, false)
    })

    wildcard.forEach(function (e, i) {
      const to = stage.wildcards[i]
      if (to == null) return
      const player = players.filter(function (p) { return p.name == e })[0]
      const playerResult = result.filter(function (p) { return p.name == e })[0]
      const data = [{ name: e, handicap: player.handicap, score: playerResult.score, time: playerResult.time }]
      setPlayerNamesAndHandicaps(to, data, true, true)
    })

    losers.forEach(function (e, i) {
      const to = stage.losers[i]
      if (to == null) return
      const data = [{ name: e, handicap: 0 }]
      setPlayerNamesAndHandicaps(to, data, true, false)
    })
  }
  */

  function resizeSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, rows: number, columns: number) {
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

  function addConditionalFormatRule(sh: GoogleAppsScript.Spreadsheet.Sheet, rule: GoogleAppsScript.Spreadsheet.ConditionalFormatRule) {
    const rules = sh.getConditionalFormatRules();
    rules.push(rule);
    sh.setConditionalFormatRules(rules);
  }
}
