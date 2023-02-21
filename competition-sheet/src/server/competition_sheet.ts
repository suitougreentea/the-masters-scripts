/**
 * ## 大会の処理の流れ
 * ### セットアップ
 * * サイドバーからsetupCompetition()が呼ばれる
 * * 人数からプリセットを確定させ、Competitionシート (ステージ情報の読み書き) とCompetitionDetailシート (予選テーブル, supplement comparisonの出力先) を準備
 * ### 1ステージの流れ
 * * サイドバーからgetStageInfo()が呼ばれる
 *   * まだ該当ステージの出場プレイヤーが入力されていない場合、ラウンドをセットアップ
 *     * 第1ラウンドの場合、Entryシートの情報を読んで出場プレイヤーが入力される
 *     * 後続ラウンドの場合、前のラウンドの結果を読み出して出場プレイヤーが入力される
 *       * CompetitionDetailシートに予選リザルトやsupplement comparisonが書き込まれる
 * * サイドバーでプレイヤーを並べ替え、reorderPlayers()が呼ばれるので並べ替えを反映
 * * タイマーで該当ステージを選択すると、getStageTimerInfo()が呼ばれるのでタイマー情報を返す
 * * ゲーム終了後リザルトを入力すると、数式によりリザルトが表示される
 * * サイドバーで他のステージに移動するとき、leaveStage()が呼ばれる
 *   * 予選ラウンド中の場合、テーブルにポイントを反映
 */
namespace CompetitionSheet {
  type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
  type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
  type Range = GoogleAppsScript.Spreadsheet.Range;

  type StagePlayerEntryWithSpreadsheetScore = Competition.StagePlayerEntry & { gradeOrLevel: string | null, time: string | null };

  function constructStageRangeName(roundIndex: number, groupIndex: number) { return `Stage_${roundIndex}_${groupIndex}`; }
  function constructQualifierTableRangeName() { return "QualifierTable"; }
  function constructQualifierResultRangeName() { return "QualifierResult"; }
  function constructSupplementComparisonRangeName(roundIndex: number, rankId: string) { return `SupplementCompariton_${roundIndex}_${rankId}`; }

  function getStageRange(ss: Spreadsheet, roundIndex: number, groupIndex: number): Range {
    const result = ss.getRangeByName(constructStageRangeName(roundIndex, groupIndex));
    if (result == null) throw new Error(`${constructStageRangeName(roundIndex, groupIndex)}が見つかりません`);
    return result;
  }
  function getQualifierTableRange(ss: Spreadsheet): Range {
    const result = ss.getRangeByName(constructQualifierTableRangeName());
    if (result == null) throw new Error(`${constructQualifierTableRangeName()}が見つかりません`);
    return result;
  }
  function getQualifierResultRange(ss: Spreadsheet): Range {
    const result = ss.getRangeByName(constructQualifierResultRangeName());
    if (result == null) throw new Error(`${constructQualifierResultRangeName()}が見つかりません`);
    return result;
  }
  function getSupplementComparisonRange(ss: Spreadsheet, roundIndex: number, rankId: string): Range {
    const result = ss.getRangeByName(constructSupplementComparisonRangeName(roundIndex, rankId));
    if (result == null) throw new Error(`${constructSupplementComparisonRangeName(roundIndex, rankId)}が見つかりません`);
    return result;
  }

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
  export function getCompetitionDetailSheetOrError(ss: Spreadsheet): Sheet {
    const sheet = getCompetitionDetailSheet(ss);
    if (sheet == null) throw new Error("CompetitionDetailシートがありません");
    return sheet;
  }
  export function getTemplatesSheetOrError(ss: Spreadsheet): Sheet {
    const sheet = ss.getSheetByName(Definition.sheetNames.templates);
    if (sheet == null) throw new Error();
    return sheet;
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
      writeSupplementComparison: (roundIndex: number, rankId: string, result: Competition.SupplementComparisonResult[]) => {
        setSupplementComparison(ss, roundIndex, rankId, result);
      },
    };
  }

  /**
   * Entryシートから参加者を読み取る
   * @param ss
   * @returns
   */
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

  /**
   * Competition.setupCompetition()の結果に応じて、CompetitionシートとCompetitionDetailシートを準備する
   * @param ss
   * @param setupResult
   * @returns Competitionシート, CompetitionDetailシート
   */
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
        if (numPlayers == null) throw new Error();
        if (numPlayers < 8 || 12 < numPlayers) throw new Error();

        const tableTemplateName = `scoreTable${numPlayers}` as keyof typeof Definition.templates;
        const resultTemplateName = `scoreResult${numPlayers}` as keyof typeof Definition.templates;

        let detailSheetColumn = 1;

        pasteTemplate(detailSheet, 2, detailSheetColumn, templatesSheet, tableTemplateName, SpreadsheetApp.CopyPasteType.PASTE_NORMAL);
        ss.setNamedRange(constructQualifierTableRangeName(), detailSheet!.getRange(2, detailSheetColumn));

        const playerEntries = getPlayerEntries(ss);
        Competition.validateEntriesWithQualifier(playerEntries, numPlayers);
        const nameValues: string[][] = [];
        for (let i = 0; i < numPlayers; i++) {
          const playerEntry = playerEntries.find(e => i == e.firstRoundGroupIndex);
          if (playerEntry == null) throw new Error();
          nameValues.push([playerEntry.name]);
        }
        detailSheet.getRange(3, 1, numPlayers, 1).setValues(nameValues);

        detailSheetColumn += Definition.templates[tableTemplateName].numColumns + 1;

        pasteTemplate(detailSheet, 1, detailSheetColumn, templatesSheet, resultTemplateName, SpreadsheetApp.CopyPasteType.PASTE_NORMAL);
        ss.setNamedRange(constructQualifierResultRangeName(), detailSheet!.getRange(1, detailSheetColumn));
        detailSheetColumn += Definition.templates[resultTemplateName].numColumns;

        Util.resizeSheet(detailSheet, Definition.templates[resultTemplateName].numRows, detailSheetColumn - 1);

        const detailSheetColumnWidths: number[] = [];
        detailSheetColumnWidths.push(80, 24);
        for (let i = 0; i < preset.rounds[0].qualifierPlayerIndices!.length; i++) detailSheetColumnWidths.push(16);
        detailSheetColumnWidths.push(30);
        detailSheetColumnWidths.push(16, 80, 24, 24, 24, 24, 24, 40, 70);
        for (let i = 0; i < detailSheetColumn - 1; i++) detailSheet.setColumnWidth(i + 1, detailSheetColumnWidths[i]);
      } else {
        let detailSheetRow = 1;
        supplementComparisons.forEach(supplementComparison => {
          const comparisonNumPlayers = supplementComparison.numPlayers;
          if (comparisonNumPlayers < 2 || 6 < comparisonNumPlayers) throw new Error();
          const templateName = `supplementComparison${comparisonNumPlayers}` as keyof typeof Definition.templates;

          pasteTemplate(detailSheet!, detailSheetRow, 1, templatesSheet, templateName, SpreadsheetApp.CopyPasteType.PASTE_NORMAL);
          detailSheet!.getRange(detailSheetRow, 1).setValue(supplementComparison.name);
          ss.setNamedRange(constructSupplementComparisonRangeName(supplementComparison.roundIndex, supplementComparison.rankId), detailSheet!.getRange(detailSheetRow, 1));
          detailSheetRow += Definition.templates[templateName].numRows + 1;
        });
        Util.resizeSheet(detailSheet, detailSheetRow - 2, 6);

        const detailSheetColumnWidths = [16, 80, 40, 70, 70, 70];
        for (let i = 0; i < 6; i++) detailSheet.setColumnWidth(i + 1, detailSheetColumnWidths[i]);
      }
    }

    return { competitionSheet, detailSheet };
  }

  /**
   * Competitionシートに埋め込まれたCompetitionSetupResultを読み出す
   * @param ss
   * @returns
   */
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

  /**
   * ユーザー入力によって崩れた書式を修正する
   * @param ss
   * @param roundIndex
   * @param groupIndex
   */
  export function reapplyFormat(ss: Spreadsheet, roundIndex: number, groupIndex: number) {
    const competitionSheet = getCompetitionSheetOrError(ss);
    const templatesSheet = getTemplatesSheetOrError(ss);

    const setupResult = getCurrentSetupResultOrError(ss);
    const stage = Competition.getStageSetupResult(setupResult.stages, roundIndex, groupIndex);
    const stageRange = getStageRange(ss, roundIndex, groupIndex);
    const row = stageRange.getRow();

    applyStageFormatInternal(competitionSheet, templatesSheet, row, stage, false);
  }

  function applyStageFormatInternal(sh: Sheet, template: Sheet, row: number, stage: Competition.StageSetupResult | null, all: boolean) {
    const type = all ? SpreadsheetApp.CopyPasteType.PASTE_NORMAL : SpreadsheetApp.CopyPasteType.PASTE_FORMAT;
    pasteTemplate(sh, row, 1, template, "competitionStage", type);

    if (stage != null) {
      if (stage.numWinners > 0) sh.getRange(row + 1 + stage.numWinners, 11, 1, 7).setBorder(null, null, true, null, null, null);
      if (stage.hasWildcard) sh.getRange(row + 1 + stage.numWinners + 1, 11, 1, 7).setBorder(null, null, true, null, null, null);
    }
  }

  function pasteTemplate(destSheet: Sheet, row: number, column: number, templatesSheet: Sheet, templateName: keyof typeof Definition.templates, type: GoogleAppsScript.Spreadsheet.CopyPasteType) {
    const templateData = Definition.templates[templateName];
    const templateRange = templatesSheet.getRange(templateData.row, templateData.column, templateData.numRows, templateData.numColumns);

    const destRange = destSheet.getRange(row, column, templateData.numRows, templateData.numColumns);
    templateRange.copyTo(destRange, type, false);
  }

  /**
   * ステージ情報 (プレイヤー含む) を取得
   * @param ss
   * @param roundIndex
   * @param groupIndex
   * @returns
   */
  export function getStageInfo(ss: Spreadsheet, roundIndex: number, groupIndex: number): Competition.StageInfo {
    const setupResult = getCurrentSetupResultOrError(ss);
    const { stages } = setupResult;

    let ready = false;
    let players = getStageEntries(ss, roundIndex, groupIndex);
    if (players.some(e => e != null)) ready = true;
    if (!ready) {
      const modified = setupRound(ss, setupResult, roundIndex);
      if (modified) {
        ready = true;
        players = getStageEntries(ss, roundIndex, groupIndex);
      }
    }

    const stage = Competition.getStageSetupResult(stages, roundIndex, groupIndex)!;
    return {
      setupResult: stage,
      ready,
      players,
    };
  }

  /**
   * タイマー情報を取得
   * @param ss
   * @param roundIndex
   * @param groupIndex
   * @returns
   */
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

  /**
   * ラウンドをセットアップ。プレイヤーを埋める
   * @param ss
   * @param setupResult
   * @param roundIndex
   * @returns 変更があったかを返す
   */
  function setupRound(ss: Spreadsheet, setupResult: Competition.CompetitionSetupResult, roundIndex: number): boolean {
    if (setupResult.preset == null) return false; // マニュアル

    let result: Competition.RoundSetupResult;
    try {
      result = Competition.setupRound(setupResult.preset, setupResult.numPlayers!, setupResult.stages, roundIndex, getIO(ss));
    } catch (e) {
      if (e instanceof Competition.NotReadyError) {
        console.warn("not ready");
        return false;
      } else {
        throw e;
      }
    }

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

    return true;
  }

  /**
   * ステージのプレイヤーを並び替え
   * @param ss
   * @param roundIndex
   * @param groupIndex
   * @param newPlayerNames 並び替え後のプレイヤー順
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

  /**
   * スプレッドシートからリザルトを読み取る。
   * @param ss
   * @param roundIndex
   * @param groupIndex
   * @returns タイムが入力されていない場合、bestTimeは0になる
   */
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

  /**
   * ステージを抜ける際の処理。予選ポイントを書き込む
   * @param ss
   * @param roundIndex
   * @param groupIndex
   */
  export function leaveStage(ss: Spreadsheet, roundIndex: number, groupIndex: number) {
    const setupResult = getCurrentSetupResultOrError(ss);

    // ポイント制予選の各ステージを抜けるときのみ処理が必要
    if (setupResult.preset == null) return;
    if (!setupResult.preset.hasQualifierRound) return;
    if (roundIndex != 0) return;

    const numPlayers = setupResult.numPlayers;
    if (numPlayers == null) throw new Error();
    const stage = Competition.getStageSetupResult(setupResult.stages, roundIndex, groupIndex);
    if (stage == null) throw new Error();

    const result = getStageResult(ss, roundIndex, groupIndex);

    if (result.length != stage.numPlayers) return;

    // リザルトが揃っている
    const detailSheet = getCompetitionDetailSheetOrError(ss);
    const tableRange = getQualifierTableRange(ss);
    const tableRow = tableRange.getRow();
    const tableColumn = tableRange.getColumn();

    const nameValues = detailSheet.getRange(tableRow + 1, tableColumn, numPlayers, 1).getValues();
    const names = nameValues.map(row => Util.isNullOrEmptyString(row[0]) ? null : String(row[0]));

    const pointValues: unknown[][] = new Array(numPlayers).fill(null).map(_ => [null]);
    result.forEach((e, rankIndex) => {
      const points = stage.numPlayers - rankIndex;
      const index = names.indexOf(e.name);
      if (index < 0) throw new Error();
      pointValues[index][0] = points;
    });
    detailSheet.getRange(tableRow + 1, tableColumn + 2 + groupIndex, numPlayers, 1).setValues(pointValues);
  }

  function getQualifierTable(ss: Spreadsheet): Competition.QualifierTableEntry[] {
    const detailSheet = getCompetitionDetailSheetOrError(ss);
    const setupResult = getCurrentSetupResultOrError(ss);

    const numPlayers = setupResult.numPlayers;
    if (numPlayers == null) throw new Error();
    const numGroups = setupResult.preset!.rounds[0].qualifierPlayerIndices!.length;

    const tableRange = getQualifierTableRange(ss);
    const tableRow = tableRange.getRow();
    const tableColumn = tableRange.getColumn();

    const values = detailSheet.getRange(tableRow + 1, tableColumn, numPlayers, 2 + numGroups).getValues();

    const result: Competition.QualifierTableEntry[] = [];
    values.forEach(row => {
      const name = String(row[0]);
      const totalPoints = Number(row[1]);
      const stageResults: { stageIndex: number, rankIndex: number, points: number }[] = [];

      row.slice(2).forEach((pointsValue, stageIndex) => {
        if (Util.isNullOrEmptyString(pointsValue)) return;
        const points = Number(pointsValue);
        const rankIndex = setupResult.stages[stageIndex].numPlayers - points;

        stageResults.push({
          stageIndex,
          rankIndex,
          points,
        });
      });

      result.push({
        name,
        totalPoints,
        stageResults,
      });
    });
    return result;
  }

  function setQualifierResult(ss: Spreadsheet, result: Competition.QualifierPlayerResult[]) {
    const detailSheet = getCompetitionDetailSheetOrError(ss);
    const setupResult = getCurrentSetupResultOrError(ss);

    const numPlayers = setupResult.numPlayers;
    if (numPlayers == null) throw new Error();

    const resultRange = getQualifierResultRange(ss);
    const resultRow = resultRange.getRow();
    const resultColumn = resultRange.getColumn();

    const resultValues: unknown[][] = [];
    result.forEach(e => {
      resultValues.push([
        e.rank,
        e.name,
        e.points,
        e.numPlaces[0],
        e.numPlaces[1],
        e.numPlaces[2],
        e.numPlaces[3],
        Grade.gradeOrLevelToSpreadsheetValue({ grade: e.bestGameGrade, level: e.bestGameLevel }),
        Time.timeToSpreadsheetValue(e.bestGameTimeDiffBest),
      ]);
    });
    detailSheet.getRange(resultRow + 2, resultColumn, resultValues.length, 9).setValues(resultValues);

    // 進出プレイヤー色付け
    const tableRange = getQualifierTableRange(ss);
    const tableRow = tableRange.getRow();
    const tableColumn = tableRange.getColumn();
    const nameValues = detailSheet.getRange(tableRow + 1, tableColumn, numPlayers, 1).getValues();
    const names = nameValues.map(row => Util.isNullOrEmptyString(row[0]) ? null : String(row[0]));
    for (let i = 0; i < 4; i++) {
      const name = result[i].name;
      const playerIndex = names.indexOf(name);
      if (playerIndex < 0) throw new Error();
      detailSheet.getRange(tableRow + 1 + playerIndex, 1, 1, 2).setBackground("#C45700");
    }
  }

  function setSupplementComparison(ss: Spreadsheet, roundIndex: number, rankId: string, result: Competition.SupplementComparisonResult[]) {
    const detailSheet = getCompetitionDetailSheetOrError(ss);
    // const setupResult = getCurrentSetupResultOrError(ss);

    const range = getSupplementComparisonRange(ss, roundIndex, rankId);
    const row = range.getRow();
    const column = range.getColumn();

    const resultValues: unknown[][] = [];
    result.forEach(e => {
      resultValues.push([
        e.rank,
        e.name,
        Grade.gradeOrLevelToSpreadsheetValue({ grade: e.grade, level: e.level }),
        Time.timeToSpreadsheetValue(e.time),
        Time.timeToSpreadsheetValue(e.timeDiffBest),
        Time.timeToSpreadsheetValue(e.timeDiffPrev),
      ]);
    });
    detailSheet.getRange(row + 2, column, resultValues.length, 6).setValues(resultValues);
  }
}
