namespace CompetitionSheet {
  type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
  type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
  type Range = GoogleAppsScript.Spreadsheet.Range;

  type StagePlayerEntryWithSpreadsheetScore = Competition.StagePlayerEntry & { gradeOrLevel: string | null, time: string | null };

  function constructStageRangeName(roundIndex: number, groupIndex: number) { return `Stage_${roundIndex}_${groupIndex}`; }

  export function getCompetitionSheet(ss: Spreadsheet): Sheet | null {
    return ss.getSheetByName(Definition.sheetNames.competition);
  }
  export function getCompetitionSheetOrError(ss: Spreadsheet): Sheet {
    const sheet = getCompetitionSheet(ss);
    if (sheet == null) throw new Error("Competitionシートがありません");
    return sheet;
  }
  export function getCompetitionDetailSheet(ss: Spreadsheet): Sheet | null {
    return ss.getSheetByName(Definition.sheetNames.competitionDetail);
  }
  export function getTemplatesSheetOrError(ss: Spreadsheet): Sheet {
    const sheet = ss.getSheetByName(Definition.sheetNames.templates);
    if (sheet == null) throw new Error();
    return sheet;
  }

  export function getPlayerEntries(ss: Spreadsheet): Competition.PlayerEntry[] {
    const entrySheet = ss.getSheetByName(Definition.sheetNames.entry)!;
    const values = entrySheet.getRange("R3C1:C3").getValues();

    const entries: Competition.PlayerEntry[] = [];

    values.forEach(e => {
      // TODO: duplicate check
      const [nameInput, firstRoundGroupInput, bestTimeInput] = e;

      if (Util.isNullOrEmptyString(nameInput)) return;
      const name = String(nameInput);

      let firstRoundGroupIndex: number | null;
      if (Util.isNullOrEmptyString(firstRoundGroupInput)) {
        firstRoundGroupIndex = null;
      } else {
        const parsed = Competition.stringToGroupIndex(String(firstRoundGroupInput));
        if (parsed == null) throw new Error("不正な1回戦組があります: " + firstRoundGroupInput);
        firstRoundGroupIndex = parsed;
      }

      const bestTime = Time.spreadsheetValueToTime(bestTimeInput);
      if (bestTime == null) throw new Error("自己ベストの無いプレイヤーがいます");

      entries.push({
        name,
        firstRoundGroupIndex,
      });
    });

    return entries;
  }

  export function setupCompetitionSheet(ss: Spreadsheet, setupResult: Competition.CompetitionSetupResult): { competitionSheet: Sheet, detailSheet: Sheet | null } {
    let competitionSheet = getCompetitionSheet(ss);
    if (competitionSheet != null) {
      ss.deleteSheet(competitionSheet);
      competitionSheet = null;
    }
    let detailSheet = getCompetitionDetailSheet(ss);
    if (detailSheet != null) {
      ss.deleteSheet(detailSheet);
      detailSheet = null;
    }

    const { preset, numPlayers, stages, supplementComparisons } = setupResult;

    competitionSheet = ss.insertSheet(Definition.sheetNames.competition, ss.getSheets().length);

    const templatesSheet = getTemplatesSheetOrError(ss);

    let competitionSheetRow = 1;
    stages.forEach((stage, stageIndex) => {
      applyStageFormatInternal(competitionSheet!, templatesSheet, competitionSheetRow, stage, true);

      ss.setNamedRange(constructStageRangeName(stage.roundIndex, stage.groupIndex), competitionSheet!.getRange(competitionSheetRow, 1));
      competitionSheet!.getRange(competitionSheetRow, 1).setValue(stage.name);

      competitionSheetRow += Definition.templates.competitionStage.numRows + 1;
    });
    Util.resizeSheet(competitionSheet, competitionSheetRow - 2, 17);

    const competitionSheetColumnWidths = [16, 80, 70, 40, 70, 24, 70, 40, 70, 30, 16, 80, 40, 70, 70, 70, 70];
    for (let i = 0; i < 17; i++) competitionSheet.setColumnWidth(i + 1, competitionSheetColumnWidths[i]);

    Util.setSheetMetadata(competitionSheet, Definition.metadataKeys.setupResult, setupResult);

    if (preset != null && (preset.hasQualifierRound || supplementComparisons.length > 0)) {
      detailSheet = ss.insertSheet(Definition.sheetNames.competitionDetail, ss.getSheets().length);

      if (preset.hasQualifierRound) {
        if (supplementComparisons.length > 0) throw new Error();
        if (numPlayers! < 8 || 12 < numPlayers!) throw new Error();

        const tableTemplateName = `scoreTable${numPlayers!}` as keyof typeof Definition.templates;
        const resultTemplateName = `scoreResult${numPlayers!}` as keyof typeof Definition.templates;

        let detailSheetColumn = 1;

        pasteTemplate(detailSheet, 2, detailSheetColumn, templatesSheet, tableTemplateName, SpreadsheetApp.CopyPasteType.PASTE_NORMAL);
        detailSheetColumn += Definition.templates[tableTemplateName].numColumns + 1;

        pasteTemplate(detailSheet, 1, detailSheetColumn, templatesSheet, resultTemplateName, SpreadsheetApp.CopyPasteType.PASTE_NORMAL);
        detailSheetColumn += Definition.templates[resultTemplateName].numColumns;

        Util.resizeSheet(detailSheet, Definition.templates[resultTemplateName].numRows, detailSheetColumn - 1);

        const detailSheetColumnWidths: number[] = [];
        detailSheetColumnWidths.push(80, 24);
        for (let i = 0; i < preset.rounds[0].qualifierPlayerIndices!.length; i++) detailSheetColumnWidths.push(16);
        detailSheetColumnWidths.push(30);
        detailSheetColumnWidths.push(16, 80, 24, 24, 24, 24, 24, 70, 70);
        for (let i = 0; i < detailSheetColumn - 1; i++) detailSheet.setColumnWidth(i + 1, detailSheetColumnWidths[i]);
      } else {
        let detailSheetRow = 1;
        supplementComparisons.forEach(supplementComparison => {
          const comparisonNumPlayers = supplementComparison.numPlayers;
          if (comparisonNumPlayers < 2 || 6 < comparisonNumPlayers) throw new Error();
          const templateName = `supplementComparison${comparisonNumPlayers}` as keyof typeof Definition.templates;

          pasteTemplate(detailSheet!, detailSheetRow, 1, templatesSheet, templateName, SpreadsheetApp.CopyPasteType.PASTE_NORMAL);
          detailSheet!.getRange(detailSheetRow, 1).setValue(supplementComparison.name);
          detailSheetRow += Definition.templates[templateName].numRows + 1;
        });
        Util.resizeSheet(detailSheet, detailSheetRow - 2, 6);

        const detailSheetColumnWidths = [16, 80, 40, 70, 70, 70];
        for (let i = 0; i < 6; i++) detailSheet.setColumnWidth(i + 1, detailSheetColumnWidths[i]);
      }
    }

    return { competitionSheet, detailSheet };
  }

  export function getCurrentSetupResult(ss: Spreadsheet): Competition.CompetitionSetupResult | null {
    const competitionSheet = getCompetitionSheet(ss);
    if (competitionSheet == null) return null;

    const metadata = Util.getSheetMetadata(competitionSheet, Definition.metadataKeys.setupResult);
    if (metadata == null) return null;
    return metadata as Competition.CompetitionSetupResult;
  }
  export function getCurrentSetupResultOrError(ss: Spreadsheet): Competition.CompetitionSetupResult {
    const result = getCurrentSetupResult(ss);
    if (result == null) throw new Error("セットアップが行われていません");
    return result;
  }

  export function reapplyFormat(ss: Spreadsheet, roundIndex: number, groupIndex: number) {
    const competitionSheet = getCompetitionSheetOrError(ss);
    const templatesSheet = getTemplatesSheetOrError(ss);

    const setupResult = getCurrentSetupResultOrError(ss);
    const stage = Competition.getStageSetupResult(setupResult.stages, roundIndex, groupIndex);
    const stageRange = getStageRange(ss, roundIndex, groupIndex);
    const row = stageRange.getRow();

    applyStageFormatInternal(competitionSheet, templatesSheet, row, stage, false);
  }

  function pasteTemplate(destSheet: Sheet, row: number, column: number, templatesSheet: Sheet, templateName: keyof typeof Definition.templates, type: GoogleAppsScript.Spreadsheet.CopyPasteType) {
    const templateData = Definition.templates[templateName];
    const templateRange = templatesSheet.getRange(templateData.row, templateData.column, templateData.numRows, templateData.numColumns);

    const destRange = destSheet.getRange(row, column, templateData.numRows, templateData.numColumns);
    templateRange.copyTo(destRange, type, false);
  }

  function applyStageFormatInternal(sh: Sheet, template: Sheet, row: number, stage: Competition.StageSetupResult | null, all: boolean) {
    const type = all ? SpreadsheetApp.CopyPasteType.PASTE_NORMAL : SpreadsheetApp.CopyPasteType.PASTE_FORMAT;
    pasteTemplate(sh, row, 1, template, "competitionStage", type);

    if (stage != null) {
      if (stage.numWinners > 0) sh.getRange(row + 1 + stage.numWinners, 11, 1, 7).setBorder(null, null, true, null, null, null);
      if (stage.hasWildcard) sh.getRange(row + 1 + stage.numWinners + 1, 11, 1, 7).setBorder(null, null, true, null, null, null);
    }
  }

  function getStageRange(ss: Spreadsheet, roundIndex: number, groupIndex: number): Range {
    const result = ss.getRangeByName(constructStageRangeName(roundIndex, groupIndex));
    if (result == null) throw new Error(`${constructStageRangeName(roundIndex, groupIndex)}が見つかりません`);
    return result;
  }

  export function getStageInfo(ss: Spreadsheet, roundIndex: number, groupIndex: number): Competition.StageInfo {
    const setupResult = getCurrentSetupResultOrError(ss);
    const { stages } = setupResult;

    let ready = false;
    let players = getStageEntries(ss, roundIndex, groupIndex);
    if (players.some(e => e != null)) ready = true;
    if (!ready) {
      setupRound(ss, setupResult, roundIndex);
      players = getStageEntries(ss, roundIndex, groupIndex);
    }

    const stage = Competition.getStageSetupResult(stages, roundIndex, groupIndex)!;
    return {
      setupResult: stage,
      ready,
      players,
    };
  }

  export function getTimerInfo(ss: Spreadsheet, roundIndex: number, groupIndex: number): Competition.StageTimerInfo {
    const setupResult = getCurrentSetupResultOrError(ss);
    const { stages } = setupResult;

    let ready = false;
    const players = getTimerPlayerData(ss, roundIndex, groupIndex);
    if (players.some(e => e != null)) ready = true;

    const stage = Competition.getStageSetupResult(stages, roundIndex, groupIndex)!;
    return {
      stageResult: stage,
      ready,
      players,
    };
  }

  function getIO(ss: Spreadsheet): Competition.CompetitionIO {
    return {
      readEntries: () => {
        return getPlayerEntries(ss);
      },
      readQualifierTable: () => {
        return getQualifierTable(ss);
      },
      readStageResult: (roundIndex: number, groupIndex: number) => {
        return getStageResult(ss, roundIndex, groupIndex);
      },
      writeQualifierResult: (result: Competition.QualifierPlayerResult[]) => {
        setQualifierResult(ss, result);
      },
      writeSupplementComparison: (roundIndex: number, rankId: string, result: Competition.StagePlayerResult[]) => {
        setSupplementComparison(ss, roundIndex, rankId, result);
      },
    };
  }

  function setupRound(ss: Spreadsheet, setupResult: Competition.CompetitionSetupResult, roundIndex: number) {
    if (setupResult.preset == null) return; // マニュアル
    const result = Competition.setupRound(setupResult.preset, setupResult.numPlayers!, setupResult.stages, roundIndex, getIO(ss));

    const competitionSheet = getCompetitionSheetOrError(ss);

    result.groups.forEach((group, groupIndex) => {
      const row = getStageRange(ss, roundIndex, groupIndex).getRow();

      const numEntries = group.entries.length;
      const nameRange = competitionSheet.getRange(row + 2, 2, numEntries, 1);
      const handicapRange = competitionSheet.getRange(row + 2, 4, numEntries, 1);

      const nameValues = group.entries.map(e => [e.name]);
      const handicapValues = group.entries.map(e => [e.handicap != 0 ? e.handicap : null]);

      nameRange.setValues(nameValues);
      handicapRange.setValues(handicapValues);
    });
  }

  /*
  function setPlayerData(ss: Spreadsheet, sh: Sheet, roundIndex: number, groupIndex: number, data: (StagePlayerEntryWithSpreadsheetScore | null)[], append: boolean) {
    if (!append && data.length != 8) throw new Error();

    const row = getStageRange(ss, roundIndex, groupIndex).getRow();

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
  */

  export function reorderPlayers(ss: Spreadsheet, roundIndex: number, groupIndex: number, newPlayerNames: (string | null)[]) {
    const competitionSheet = getCompetitionSheetOrError(ss);

    if (newPlayerNames.length != 8) throw new Error();

    const row = getStageRange(ss, roundIndex, groupIndex).getRow();

    const nameRange = competitionSheet.getRange(row + 2, 2, 8, 1);
    const handicapRange = competitionSheet.getRange(row + 2, 4, 8, 1);
    const scoreRange = competitionSheet.getRange(row + 2, 8, 8, 2);

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

  function getTimerPlayerData(ss: Spreadsheet, roundIndex: number, groupIndex: number): (Competition.StageTimerPlayerData | null)[] {
    const competitionSheet = getCompetitionSheetOrError(ss);

    const row = getStageRange(ss, roundIndex, groupIndex).getRow();

    const range = competitionSheet.getRange(row + 2, 2, 8, 6);
    const values = range.getValues();

    const result: (Competition.StageTimerPlayerData | null)[] = [];
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

  function getStageEntries(ss: Spreadsheet, roundIndex: number, groupIndex: number): (Competition.StagePlayerEntry | null)[] {
    const competitionSheet = getCompetitionSheetOrError(ss);

    const row = getStageRange(ss, roundIndex, groupIndex).getRow();

    const nameRange = competitionSheet.getRange(row + 2, 2, 8, 1);
    const handicapRange = competitionSheet.getRange(row + 2, 4, 8, 1);

    const nameValues = nameRange.getValues();
    const handicapValues = handicapRange.getValues();

    const result: (Competition.StagePlayerEntry | null)[] = [];
    for (let i = 0; i < 8; i++) {
      if (Util.isNullOrEmptyString(nameValues[i][0])) {
        result.push(null);
      } else {
        const name = String(nameValues[i][0]);
        const handicap = Util.isNullOrEmptyString(handicapValues[i][0]) ? 0 : Number(handicapValues[i][0]);
        result.push({ name, handicap });
      }
    }
    return result;
  }

  // bestTimeは0の場合あり
  function getStageResult(ss: Spreadsheet, roundIndex: number, groupIndex: number): Competition.StagePlayerResult[] {
    const competitionSheet = getCompetitionSheetOrError(ss);

    const row = getStageRange(ss, roundIndex, groupIndex).getRow();

    const range = competitionSheet.getRange(row + 2, 11, 8, 7);
    const values = range.getValues();

    const result: Competition.StagePlayerResult[] = [];
    values.forEach(rowValues => {
      if (Util.isNullOrEmptyString(rowValues[0])) return;
      const rank = Number(rowValues[0]);
      const name = String(rowValues[1]);
      const { grade, level } = Grade.spreadsheetValueToGradeOrLevel(rowValues[2]);
      const time = Time.spreadsheetValueToTime(rowValues[3]);
      const timeDiffBest = Time.spreadsheetValueToTime(rowValues[4]);
      const timeDiffTop = Time.spreadsheetValueToTime(rowValues[5]);
      const timeDiffPrev = Time.spreadsheetValueToTime(rowValues[6]);
      const bestTime = (time != null && timeDiffBest != null) ? time - timeDiffBest : 0;
      result.push({ name, grade, time, level, bestTime, rank, timeDiffBest, timeDiffTop, timeDiffPrev } as Competition.StagePlayerResult);
    });
    return result;
  }

  // TODO: 計算部分をCompetitionに移動
  /*
  export function applyResult(ss: Spreadsheet, sh: Sheet, roundIndex: number, groupIndex: number) {
    const preset = getCurrentPreset(sh);
    if (preset == null) throw new Error("マニュアルモードでは使用できません");
    const stage = preset.stages[stageIndex];

    const playerData = getPlayerData(ss, sh, roundIndex, groupIndex);
    const result = getResultFromSpreadsheetValues(ss, sh, stageIndex);

    const winnersLength = stage.winners.length;
    const wildcardLength = stage.wildcards ? stage.wildcards.length : 0;
    const losersLength = stage.losers.length;

    if (result.length < winnersLength + wildcardLength) throw new Error(`人数が足りません。勝ち${winnersLength}人, ワイルドカード${wildcardLength}人, 負け${losersLength}人; リザルト${result.length}人`);

    for (let i = 0; i < winnersLength; i++) {
      const resultIndex = i;
      const resultEntry = result[resultIndex];
      const playerEntry = playerData.find(e => e != null && e.name == resultEntry.name);
      if (playerEntry == null) throw new Error();

      const destStageIndex = stage.winners[i];
      if (destStageIndex == null) continue;
      const name = playerEntry.name;
      const gradeOrLevel = null;
      const time = null;

      let handicap = 0;
      const oldHandicap = playerEntry.handicap;
      let diff = i == 0 ? -10 : i == 1 ? -5 : 0;
      if (stage.consolation) diff = 5; // 昔は1着+5, 2着以降+10だったが、現在は+5に統一
      if (stage.wildcard) diff = 0;
      if (oldHandicap < 0) {
        handicap = diff;
      } else {
        handicap = oldHandicap + diff;
      }

      setPlayerData(ss, sh, destStageIndex, [{ name, handicap, gradeOrLevel, time }], true);
    }

    for (let i = 0; i < wildcardLength; i++) {
      const resultIndex = winnersLength + i;
      const resultEntry = result[resultIndex];
      const playerEntry = playerData.find(e => e != null && e.name == resultEntry.name);
      if (playerEntry == null) throw new Error();

      const destStageIndex = stage.wildcards![i];
      if (destStageIndex == null) throw new Error();
      setPlayerData(ss, sh, destStageIndex, [playerEntry], true);
    }

    for (let i = 0; i < losersLength; i++) {
      const resultIndex = winnersLength + wildcardLength + i;
      const resultEntry = result[resultIndex];
      if (resultEntry == null) continue;
      const playerEntry = playerData.find(e => e != null && e.name == resultEntry.name);
      if (playerEntry == null) throw new Error();

      const destStageIndex = stage.losers[i];
      if (destStageIndex == null) continue;
      const name = playerEntry.name;
      const handicap = 0;
      const gradeOrLevel = null;
      const time = null;
      setPlayerData(ss, sh, destStageIndex, [{ name, handicap, gradeOrLevel, time }], true);
    }
  }
  */

  export function leaveStage(ss: Spreadsheet, roundIndex: number, groupIndex: number) {
    const setupResult = getCurrentSetupResultOrError(ss);

    // ポイント制予選の各ステージを抜けるときのみ処理が必要
    if (setupResult.preset == null) return;
    if (!setupResult.preset.hasQualifierRound) return;
    if (roundIndex != 0) return;

    const result = getStageResult(ss, roundIndex, groupIndex);
    throw new Error("not implemented");
  }

  export function getQualifierTable(ss: Spreadsheet): Competition.QualifierTableEntry[] {
    throw new Error("not implemented");
  }

  export function setQualifierResult(ss: Spreadsheet, result: Competition.QualifierPlayerResult[]) {
    throw new Error("not implemented");
  }

  export function setSupplementComparison(ss: Spreadsheet, roundIndex: number, rankId: string, result: Competition.StagePlayerResult[]) {
    throw new Error("not implemented");
  }
}
