namespace CompetitionSheet {
  type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
  type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
  type Range = GoogleAppsScript.Spreadsheet.Range;

  const columnWidths = [16, 80, 70, 40, 70, 24, 70, 40, 70, 30, 16, 80, 40, 70, 70, 70, 70];

  export function initializeCompetitionSheet(ss: Spreadsheet, sh: Sheet, setupResult: Competition.CompetitionSetupResult) {
    const { preset } = setupResult;
    sh.addDeveloperMetadata(Definition.metadataKeys.presetName, preset != null ? preset.name : Preset.manualPresetName);

    let numStages: number;
    if (preset != null) {
      numStages = preset.stages.length;
    } else {
      if (setupResult.manualNumberOfGames == null) throw new Error();
      numStages = setupResult.manualNumberOfGames;
    }

    const template = ss.getSheetByName(Definition.sheetNames.templates);
    if (template == null) throw new Error("Template not found");

    let row = 1;
    for (let index = 0; index < numStages; index++) {
      const stage = preset != null ? preset.stages[index] : null;
      const name = stage != null ? stage.name : null;

      applyFormatInternal(sh, template, row, stage, true);

      ss.setNamedRange("Stage" + index, sh.getRange(row, 1));
      sh.getRange(row, 1).setValue(name);

      row += 11;
    }
    resizeSheet(sh, row - 2, 17);
    for (let i = 0; i < 17; i++) sh.setColumnWidth(i + 1, columnWidths[i]);
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
    if (name == Preset.manualPresetName) return null;
    return Preset.presets[name];
  }

  export function applyFormat(ss: Spreadsheet, sh: Sheet, stageIndex: number) {
    const template = ss.getSheetByName(Definition.sheetNames.templates);
    if (template == null) throw new Error("Template not found");

    const preset = getCurrentPreset(sh);
    const stage = preset != null ? preset.stages[stageIndex] : null;
    const stageRange = getStageRange(ss, stageIndex);
    const row = stageRange.getRow();

    applyFormatInternal(sh, template, row, stage, false);
  }

  function applyFormatInternal(sh: Sheet, template: Sheet, row: number, stage: Preset.StageDefinition | null, all: boolean) {
    const wildcard = stage != null ? stage.wildcard : false;

    const templateRow = wildcard ? 12 : 1;
    const templateRange = template.getRange(templateRow, 1, 10, 17);
    const destRange = sh.getRange(row, 1, 10, 17);
    if (all) {
      templateRange.copyTo(destRange, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);
    } else {
      templateRange.copyTo(destRange, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
      // templateRange.copyTo(destRange, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
    }

    if (stage != null) {
      sh.getRange(row + 1 + stage.winners.length, 11, 1, 7).setBorder(null, null, true, null, null, null);
      if (stage.wildcards) sh.getRange(row + 1 + stage.winners.length + stage.wildcards.length, 11, 1, 7).setBorder(null, null, true, null, null, null);
    }
  }

  function getStageRange(ss: Spreadsheet, stageIndex: number): Range {
    const result = ss.getRangeByName("Stage" + stageIndex);
    if (result == null) throw new Error(`Stage ${stageIndex + 1}が範囲外です`);
    return result;
  }

  function getStageNameFromSpreadsheet(ss: Spreadsheet, stageIndex: number): string {
    return String(getStageRange(ss, stageIndex).getValue());
  }

  export function getStageInfo(ss: Spreadsheet, sh: Sheet, stageIndex: number): Competition.StageInfo {
    const preset = getCurrentPreset(sh);
    const stage = preset != null ? preset.stages[stageIndex] : null;
    const wildcard = stage != null ? (stage.wildcard ? true : false) : false;
    return {
      stageName: getStageNameFromSpreadsheet(ss, stageIndex),
      players: getPlayerData(ss, sh, stageIndex),
      wildcard,
    };
  }

  export function getTimerInfo(ss: Spreadsheet, sh: Sheet, stageIndex: number): Competition.TimerInfo {
    const preset = getCurrentPreset(sh);
    const stage = preset != null ? preset.stages[stageIndex] : null;
    const wildcard = stage != null ? stage.wildcard : false;
    if (wildcard) {
      return {
        stageName: getStageNameFromSpreadsheet(ss, stageIndex),
        players: [],
        wildcard: true,
      };
    } else {
      return {
        stageName: getStageNameFromSpreadsheet(ss, stageIndex),
        players: getTimerPlayerData(ss, sh, stageIndex),
        wildcard: false,
      };
    }
  }

  export function setFirstRoundPlayers(ss: Spreadsheet, sh: Sheet, firstRoundGroups: string[][]) {
    firstRoundGroups.forEach((names, stageIndex) => {
      const playerData: (Competition.PlayerData | null)[] = [];
      for (let i = 0; i < 8; i++) {
        if (i < names.length) {
          playerData.push({ name: names[i], handicap: 0, gradeOrLevel: null, time: null });
        } else {
          playerData.push(null);
        }
      }
      setPlayerData(ss, sh, stageIndex, playerData, false);
    });
  }

  function getPlayerData(ss: Spreadsheet, sh: Sheet, stageIndex: number): (Competition.PlayerData | null)[] {
    const row = getStageRange(ss, stageIndex).getRow();

    const nameRange = sh.getRange(row + 2, 2, 8, 1);
    const handicapRange = sh.getRange(row + 2, 4, 8, 1);
    const scoreRange = sh.getRange(row + 2, 8, 8, 2);

    const nameValues = nameRange.getValues();
    const handicapValues = handicapRange.getValues();
    const scoreValues = scoreRange.getValues();

    const result: (Competition.PlayerData | null)[] = [];
    for (let i = 0; i < 8; i++) {
      if (Util.isNullOrEmptyString(nameValues[i][0])) {
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

  function setPlayerData(ss: Spreadsheet, sh: Sheet, stageIndex: number, data: (Competition.PlayerData | null)[], append: boolean) {
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

  function getTimerPlayerData(ss: Spreadsheet, sh: Sheet, stageIndex: number): (Competition.TimerPlayerData | null)[] {
    const row = getStageRange(ss, stageIndex).getRow();

    const range = sh.getRange(row + 2, 2, 8, 6);
    const values = range.getValues();

    const result: (Competition.TimerPlayerData | null)[] = [];
    for (let i = 0; i < 8; i++) {
      if (Util.isNullOrEmptyString(values[i][0])) {
        result.push(null);
      } else {
        const name = String(values[i][0]);
        const rawBestTime = Time.spreadsheetValueToTime(values[i][1]);
        const handicap = Util.isNullOrEmptyString(values[i][2]) ? 0 : Number(values[i][2]);
        const bestTime = Time.spreadsheetValueToTime(values[i][3]);
        const startOrder = Number(values[i][4]);
        const startTime = Time.spreadsheetValueToTime(values[i][5]);
        if (rawBestTime != null && bestTime != null && startTime != null) {
          result.push({ name, rawBestTime, handicap, bestTime, startOrder, startTime });
        } else {
          result.push(null);
        }
      }
    }
    return result;
  }

  /*
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
