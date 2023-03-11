/**
 * ## 大会の処理の流れ
 * ### セットアップ
 * * サイドバーからsetupCompetition()が呼ばれる
 * * 人数からプリセットを確定させ、Competitionシート (ステージ情報の読み書き) とCompetitionDetailシート (予選テーブル, supplement comparisonの出力先) を準備
 * ### 1ステージの流れ
 * * TODO
 */
namespace CompetitionSheet {
  type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
  type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
  type Range = GoogleAppsScript.Spreadsheet.Range;

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

  export function getSetupSheet(ss: Spreadsheet): Sheet | null {
    return ss.getSheetByName(Definition.sheetNames.setup);
  }
  export function getSetupSheetOrError(ss: Spreadsheet): Sheet {
    const sheet = getSetupSheet(ss);
    if (sheet == null) throw new Error("Setupシートがありません");
    return sheet;
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

  /**
   * Setupシートから大会名を読み取る
   * @param ss
   * @returns
   */
  export function getCompetitionName(context: { setupSheet: Sheet }): string {
    const { setupSheet } = context;
    const value = setupSheet.getRange("R1C2").getValue();
    if (Util.isNullOrEmptyString(value)) return "";
    return String(value);
  }

  /**
   * Setupシートから参加者を読み取る
   * @param ss
   * @returns
   */
  export function getParticipants(context: { setupSheet: Sheet }): Participant[] {
    const { setupSheet } = context;

    const values = setupSheet.getRange("R4C1:C3").getValues();

    const entries: Participant[] = [];

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

  export function setParticipants(context: { setupSheet: Sheet }, participants: Participant[]) {
    const { setupSheet } = context;

    const valuesRange = setupSheet.getRange("R4C1:C2");
    const numRows = valuesRange.getNumRows();

    const values: unknown[][] = new Array(numRows).fill(null).map(_ => [null, null]);
    participants.forEach((participant, i) => {
      values[i] = [participant.name, participant.firstRoundGroupIndex != null ? Competition.groupIndexToString(participant.firstRoundGroupIndex) : null];
    });
    valuesRange.setValues(values);
  }

  /**
   * Competition.setupCompetition()の結果に応じて、CompetitionシートとCompetitionDetailシートを準備する
   * @param ss
   * @param setupResult
   * @returns Competitionシート, CompetitionDetailシート
   */
  export function setupCompetitionSheet(context: { ss: Spreadsheet, setupSheet: Sheet }, setupResult: Competition.CompetitionSetupResult): { competitionSheet: Sheet, detailSheet: Sheet | null } {
    const { ss, setupSheet } = context;

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

    const { metadata } = setupResult;

    competitionSheet = ss.insertSheet(Definition.sheetNames.competition, ss.getSheets().length);

    const templatesSheet = getTemplatesSheetOrError(ss);

    let competitionSheetRow = 1;
    metadata.rounds.forEach((round, roundIndex) => {
      round.stages.forEach((stage, stageIndex) => {
        applyStageFormatInternal(competitionSheet!, templatesSheet, competitionSheetRow, stage, true);

        ss.setNamedRange(constructStageRangeName(roundIndex, stageIndex), competitionSheet!.getRange(competitionSheetRow, 1));
        competitionSheet!.getRange(competitionSheetRow, 1).setValue(stage.name);

        competitionSheetRow += Definition.templates.competitionStage.numRows + 1;
      });
    });
    Util.resizeSheet(competitionSheet, competitionSheetRow - 2, 17);

    const competitionSheetColumnWidths = [16, 80, 70, 40, 70, 24, 70, 40, 70, 30, 16, 80, 40, 70, 70, 70, 70];
    for (let i = 0; i < 17; i++) competitionSheet.setColumnWidth(i + 1, competitionSheetColumnWidths[i]);

    Util.setSheetMetadata(competitionSheet, Definition.metadataKeys.competitionMetadata, metadata);

    const needsDetailSheet = metadata.type == "qualifierFinal" || metadata.rounds.some(round => round.supplementComparisons.length > 0);
    if (needsDetailSheet) {
      detailSheet = ss.insertSheet(Definition.sheetNames.competitionDetail, ss.getSheets().length);

      if (metadata.type == "qualifierFinal") {
        const numPlayers = metadata.numPlayers;
        if (numPlayers == null) throw new Error();
        if (numPlayers < 8 || 12 < numPlayers) throw new Error();

        const tableTemplateName = `scoreTable${numPlayers}` as keyof typeof Definition.templates;
        const resultTemplateName = `scoreResult${numPlayers}` as keyof typeof Definition.templates;

        let detailSheetColumn = 1;

        pasteTemplate(detailSheet, 2, detailSheetColumn, templatesSheet, tableTemplateName, SpreadsheetApp.CopyPasteType.PASTE_NORMAL);
        ss.setNamedRange(constructQualifierTableRangeName(), detailSheet!.getRange(2, detailSheetColumn));

        const playerEntries = getParticipants({ setupSheet });
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
        for (let i = 0; i < metadata.rounds[0].stages.length; i++) detailSheetColumnWidths.push(16);
        detailSheetColumnWidths.push(30);
        detailSheetColumnWidths.push(16, 80, 24, 24, 24, 24, 24, 40, 70);
        for (let i = 0; i < detailSheetColumn - 1; i++) detailSheet.setColumnWidth(i + 1, detailSheetColumnWidths[i]);
      } else {
        let detailSheetRow = 1;
        metadata.rounds.forEach((round, roundIndex) => {
          round.supplementComparisons.forEach(supplementComparison => {
            const comparisonNumPlayers = supplementComparison.numPlayers;
            if (comparisonNumPlayers < 2 || 6 < comparisonNumPlayers) throw new Error();
            const templateName = `supplementComparison${comparisonNumPlayers}` as keyof typeof Definition.templates;

            pasteTemplate(detailSheet!, detailSheetRow, 1, templatesSheet, templateName, SpreadsheetApp.CopyPasteType.PASTE_NORMAL);
            detailSheet!.getRange(detailSheetRow, 1).setValue(supplementComparison.name);
            ss.setNamedRange(constructSupplementComparisonRangeName(roundIndex, supplementComparison.rankId), detailSheet!.getRange(detailSheetRow, 1));
            detailSheetRow += Definition.templates[templateName].numRows + 1;
          });
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
  export function getCurrentCompetitionMetadata(ss: Spreadsheet): CompetitionMetadata | null {
    const competitionSheet = getCompetitionSheet(ss);
    if (competitionSheet == null) return null;

    const metadata = Util.getSheetMetadata(competitionSheet, Definition.metadataKeys.competitionMetadata);
    if (metadata == null) return null;
    return metadata as CompetitionMetadata;
  }
  export function getCurrentCompetitionMetadataOrError(ss: Spreadsheet): CompetitionMetadata {
    const metadata = getCurrentCompetitionMetadata(ss);
    if (metadata == null) throw new Error("セットアップが行われていません");
    return metadata;
  }

  /**
   * ユーザー入力によって崩れた書式を修正する
   * @param ss
   * @param roundIndex
   * @param groupIndex
   */
  export function reapplyFormat(context: { ss: Spreadsheet, metadata: CompetitionMetadata, competitionSheet: Sheet, templatesSheet: Sheet }, roundIndex: number, groupIndex: number) {
    const { ss, metadata, competitionSheet, templatesSheet } = context;
    const stageMetadata = metadata.rounds[roundIndex].stages[groupIndex];
    const stageRange = getStageRange(ss, roundIndex, groupIndex);
    const row = stageRange.getRow();

    applyStageFormatInternal(competitionSheet, templatesSheet, row, stageMetadata, false);
  }

  function applyStageFormatInternal(sh: Sheet, template: Sheet, row: number, stage: StageMetadata | null, all: boolean) {
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
   * ラウンドをセットアップ。プレイヤーを埋める
   * @param ss
   * @param setupResult
   * @param roundIndex
   * @returns 準備できているかどうか
   */
  export function tryInitializeRound(context: { ss: Spreadsheet, metadata: CompetitionMetadata, setupSheet: Sheet, competitionSheet: Sheet, detailSheet: Sheet | null }, roundIndex: number): boolean {
    const { ss, metadata, competitionSheet, detailSheet } = context;

    if (metadata.presetName == null) return true; // マニュアル

    const firstStageData = getStageData(context, roundIndex, 0);
    const ready = firstStageData.players.some(e => e != null);
    if (ready) return true;

    try {
      const dependencyDefinition = Competition.getDependencyForRound(metadata, roundIndex);
      const dependency: Competition.RoundDependencyData[] = dependencyDefinition.map(definition => {
        if (definition.type == "firstRoundEntry") {
          return {
            type: "firstRoundEntry",
            data: getParticipants(context),
          };
        } else if (definition.type == "qualifierRoundResult") {
          if (detailSheet == null) throw new Error();
          return {
            type: "qualifierRoundResult",
            result: getQualifierResult({ ss, metadata, detailSheet }).result,
          };
        } else if (definition.type == "tournamentRoundResult") {
          const dependentRoundMetadata = metadata.rounds[definition.roundIndex];
          if (dependentRoundMetadata.supplementComparisons.length > 0 && detailSheet == null) throw new Error();

          const stageResults: { result: StageResultEntry[] }[] = dependentRoundMetadata.stages.map((_, stageIndex) => {
            const stageData = getStageData(context, definition.roundIndex, stageIndex);
            return {
              result: stageData.result,
            };
          });
          const supplementComparisons: { rankId: string, comparison: SupplementComparisonEntry[] }[] = dependentRoundMetadata.supplementComparisons.map(comparison => {
            const comparisonData = getSupplementComparison({ ss, metadata, detailSheet: detailSheet! }, definition.roundIndex, comparison.rankId);
            return {
              rankId: comparison.rankId,
              comparison: comparisonData.comparison,
            };
          });
          return {
            type: "tournamentRoundResult",
            roundIndex: definition.roundIndex,
            stageResults,
            supplementComparisons,
          };
        } else {
          throw new Error();
        }
      });
      const result = Competition.setupRound(metadata, roundIndex, dependency);

      result.stages.forEach((stage, stageIndex) => {
        const row = getStageRange(ss, roundIndex, stageIndex).getRow();

        const numEntries = stage.entries.length;
        const nameRange = competitionSheet.getRange(row + 2, 2, numEntries, 1);
        const handicapRange = competitionSheet.getRange(row + 2, 4, numEntries, 1);

        const nameValues = stage.entries.map(e => [e.name]);
        const handicapValues = stage.entries.map(e => [e.handicap != 0 ? e.handicap : null]);

        nameRange.setValues(nameValues);
        handicapRange.setValues(handicapValues);
      });
    } catch (e) {
      if (e instanceof Competition.NotReadyError) {
        console.warn("not ready");
        return false;
      } else {
        throw e;
      }
    }

    return true;
  }

  export function tryFinalizeRound(context: { ss: Spreadsheet, metadata: CompetitionMetadata, competitionSheet: Sheet, detailSheet: Sheet | null }, roundIndex: number): boolean {
    const { ss, metadata, detailSheet } = context;

    if (metadata.presetName == null) return true; // マニュアル

    try {
      const stageData = metadata.rounds[roundIndex].stages.map((_, stageIndex) => getStageData(context, roundIndex, stageIndex));
      const stageResults = stageData.map(e => e.result);
      const result = Competition.finalizeRound(metadata, roundIndex, stageResults);

      if (result.type == "qualifierResult") {
        if (detailSheet == null) throw new Error();
        setQualifierResult({ ss, metadata, detailSheet }, result.result);
      } else if (result.type == "supplementComparisons") {
        if (detailSheet == null) throw new Error();
        result.comparisons.forEach(comparison => {
          setSupplementComparison({ ss, detailSheet }, roundIndex, comparison.rankId, comparison);
        });
      }
    } catch (e) {
      if (e instanceof Competition.NotReadyError) {
        console.warn("not ready");
        return false;
      } else {
        throw e;
      }
    }

    return true;
  }

  export function resetStage(context: { ss: Spreadsheet, competitionSheet: Sheet }, roundIndex: number, groupIndex: number, setup: StageSetupResult) {
    const { ss, competitionSheet } = context;

    const row = getStageRange(ss, roundIndex, groupIndex).getRow();

    const nameRange = competitionSheet.getRange(row + 2, 2, 8, 1);
    const handicapRange = competitionSheet.getRange(row + 2, 4, 8, 1);
    const scoreRange = competitionSheet.getRange(row + 2, 8, 8, 2);

    const nameValues: unknown[][] = [];
    const handicapValues: unknown[][] = [];
    const scoreValues: unknown[][] = [];

    for (let i = 0; i < 8; i++) {
      if (i < setup.entries.length) {
        const e = setup.entries[i];
        nameValues.push([e.name]);
        handicapValues.push([e.handicap != 0 ? e.handicap : null]);
        scoreValues.push([null, null]);
      } else {
        nameValues.push([null]);
        handicapValues.push([null]);
        scoreValues.push([null, null]);
      }
    }

    nameRange.setValues(nameValues);
    handicapRange.setValues(handicapValues);
    scoreRange.setValues(scoreValues);
  }

  export function getStageData(context: { ss: Spreadsheet, competitionSheet: Sheet }, roundIndex: number, groupIndex: number): StageData {
    const { ss, competitionSheet } = context;

    const row = getStageRange(ss, roundIndex, groupIndex).getRow();

    const dataRange = competitionSheet.getRange(row + 2, 2, 8, 16);
    const data = dataRange.getValues();

    const players: (StagePlayerEntry | null)[] = [];
    data.forEach(e => {
      if (Util.isNullOrEmptyString(e[0])) {
        players.push(null);
      } else {
        const name = String(e[0]);
        const rawBestTime = Time.spreadsheetValueToTime(e[1]);
        const handicap = Util.isNullOrEmptyString(e[2]) ? 0 : Number(e[2]);
        const bestTime = Time.spreadsheetValueToTime(e[3]);
        const startOrder = Number(e[4]);
        const startTime = Time.spreadsheetValueToTime(e[5]);
        let level: number | null = null;
        let grade: number | null = null;
        let time: number | null = null;
        if (!Util.isNullOrEmptyString(e[6]) || !Util.isNullOrEmptyString(e[7])) {
          ({ level, grade } = Grade.spreadsheetValueToLevelOrGrade(e[6]));
          time = Time.spreadsheetValueToTime(e[7]);
        }
        players.push({
          name,
          rawBestTime: rawBestTime != null ? rawBestTime : 0,
          handicap,
          bestTime: bestTime != null ? bestTime : 0,
          startOrder,
          startTime: startTime != null ? startTime : 0,
          level,
          grade,
          time,
        });
      }
    });

    const result: StageResultEntry[] = [];
    data.forEach(e => {
      if (!Util.isNullOrEmptyString(e[10])) {
        const rank = Number(e[9]);
        const name = e[10];
        const { level, grade } = Grade.spreadsheetValueToLevelOrGrade(e[11]);
        const time = Time.spreadsheetValueToTime(e[12]);
        const timeDiffBest = Time.spreadsheetValueToTime(e[13]);
        const timeDiffPrev = Time.spreadsheetValueToTime(e[14]);
        const timeDiffTop = Time.spreadsheetValueToTime(e[15]);
        result.push({
          rank,
          name,
          level,
          grade,
          time,
          timeDiffBest,
          timeDiffPrev,
          timeDiffTop,
        });
      }
    });

    return {
      players,
      result,
    };
  }

  /**
   * ステージのプレイヤーを並び替え
   * @param ss
   * @param roundIndex
   * @param groupIndex
   * @param newPlayerNames 並び替え後のプレイヤー順
   */
  export function reorderPlayers(context: { ss: Spreadsheet, competitionSheet: Sheet }, roundIndex: number, groupIndex: number, newPlayerNames: (string | null)[]) {
    const { ss, competitionSheet } = context;

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

  export function setStageScore(context: { ss: Spreadsheet, competitionSheet: Sheet }, roundIndex: number, groupIndex: number, score: StageScoreData) {
    const { ss, competitionSheet } = context;
    const row = getStageRange(ss, roundIndex, groupIndex).getRow();

    const nameRange = competitionSheet.getRange(row + 2, 2, 8, 1);
    const nameValues = nameRange.getValues();

    const scoreRange = competitionSheet.getRange(row + 2, 8, 8, 2);
    const scoreValues: unknown[][] = new Array(8).fill(null).map(_ => [null, null]);
    score.players.forEach(player => {
      const index = nameValues.findIndex(e => e[0] == player.name);
      if (index < 0) throw new Error("対応するプレイヤーが見つかりませんでした。更新後再度並び替えを行ってください: " + player.name);
      scoreValues[index][0] = player.level != null ? Grade.levelOrGradeToSpreadsheetValue({ level: player.level, grade: player.grade }) : null;
      scoreValues[index][1] = player.time != null ? Time.timeToString(player.time) : null; // ここは文字列で入れる
    });
    scoreRange.setValues(scoreValues);
  }

  export function setStageResult(context: { ss: Spreadsheet, competitionSheet: Sheet }, roundIndex: number, groupIndex: number, result: StageResultEntry[]) {
    const { ss, competitionSheet } = context;
    const row = getStageRange(ss, roundIndex, groupIndex).getRow();

    const dataRange = competitionSheet.getRange(row + 2, 11, result.length, 7);

    const values = result.map(e => {
      return [
        e.rank,
        e.name,
        Grade.levelOrGradeToSpreadsheetValue({ level: e.level, grade: e.grade }),
        Time.timeToSpreadsheetValue(e.time),
        Time.timeToSpreadsheetValue(e.timeDiffBest),
        Time.timeToSpreadsheetValue(e.timeDiffTop),
        Time.timeToSpreadsheetValue(e.timeDiffPrev),
      ];
    });
    dataRange.setValues(values);
  }

  export function getQualifierScore(context: { ss: Spreadsheet, metadata: CompetitionMetadata, detailSheet: Sheet }): QualifierScore {
    const { ss, metadata, detailSheet } = context;

    const numPlayers = metadata.numPlayers;
    if (numPlayers == null) throw new Error();
    const numStages = metadata.rounds[0].stages.length;

    const tableRange = getQualifierTableRange(ss);
    const tableRow = tableRange.getRow();
    const tableColumn = tableRange.getColumn();

    const values = detailSheet.getRange(tableRow + 1, tableColumn, numPlayers, 2 + numStages).getValues();

    const players: QualifierScoreEntry[] = [];
    values.forEach(row => {
      const name = String(row[0]);
      const totalPoints = Number(row[1]);
      const stageResults: { stageIndex: number, rankIndex: number, points: number }[] = [];

      row.slice(2).forEach((pointsValue, stageIndex) => {
        if (Util.isNullOrEmptyString(pointsValue)) return;
        const points = Number(pointsValue);
        const rankIndex = metadata.rounds[0].stages[stageIndex].numPlayers - points;

        stageResults.push({
          stageIndex,
          rankIndex,
          points,
        });
      });

      players.push({
        name,
        totalPoints,
        stageResults,
      });
    });

    return {
      players,
    };
  }

  export function setQualifierTableColumn(context: { ss: Spreadsheet, metadata: CompetitionMetadata, detailSheet: Sheet }, stageIndex: number, result: StageResultEntry[]) {
    const { ss, metadata, detailSheet } = context;

    if (metadata.type == null) throw new Error();
    if (metadata.type != "qualifierFinal") throw new Error();
    const numPlayers = metadata.numPlayers;
    if (numPlayers == null) throw new Error();

    const tableRange = getQualifierTableRange(ss);
    const tableRow = tableRange.getRow();
    const tableColumn = tableRange.getColumn();

    const nameValues = detailSheet.getRange(tableRow + 1, tableColumn, numPlayers, 1).getValues();
    const names = nameValues.map(row => Util.isNullOrEmptyString(row[0]) ? null : String(row[0]));

    const pointValues: unknown[][] = new Array(numPlayers).fill(null).map(_ => [null]);
    result.forEach((e, rankIndex) => {
      const points = result.length - rankIndex;
      const index = names.indexOf(e.name);
      if (index < 0) throw new Error();
      pointValues[index][0] = points;
    });
    detailSheet.getRange(tableRow + 1, tableColumn + 2 + stageIndex, numPlayers, 1).setValues(pointValues);
  }

  export function getQualifierResult(context: { ss: Spreadsheet, metadata: CompetitionMetadata, detailSheet: Sheet }): QualifierResult {
    const { ss, metadata, detailSheet } = context;

    const numPlayers = metadata.numPlayers;
    if (numPlayers == null) throw new Error();

    const resultRange = getQualifierResultRange(ss);
    const resultRow = resultRange.getRow();
    const resultColumn = resultRange.getColumn();

    const resultValues = detailSheet.getRange(resultRow + 2, resultColumn, numPlayers, 9).getValues();

    const result: QualifierResultEntry[] = [];
    resultValues.forEach(row => {
      if (Util.isNullOrEmptyString(row[1])) return;

      const { level, grade } = Grade.spreadsheetValueToLevelOrGrade(row[7]);
      result.push({
        rank: Number(row[0]),
        name: String(row[1]),
        points: Number(row[2]),
        numPlaces: [Number(row[3]), Number(row[4]), Number(row[5]), Number(row[6])],
        bestGameLevel: level,
        bestGameGrade: grade,
        bestGameTimeDiffBest: Time.spreadsheetValueToTime(row[8]),
      });
    });

    return {
      result,
    };
  }

  export function setQualifierResult(context: { ss: Spreadsheet, metadata: CompetitionMetadata, detailSheet: Sheet }, result: QualifierResult) {
    const { ss, metadata, detailSheet } = context;

    const numPlayers = metadata.numPlayers;
    if (numPlayers == null) throw new Error();

    const resultRange = getQualifierResultRange(ss);
    const resultRow = resultRange.getRow();
    const resultColumn = resultRange.getColumn();

    const resultValues: unknown[][] = [];
    result.result.forEach(e => {
      resultValues.push([
        e.rank,
        e.name,
        e.points,
        e.numPlaces[0],
        e.numPlaces[1],
        e.numPlaces[2],
        e.numPlaces[3],
        Grade.levelOrGradeToSpreadsheetValue({ grade: e.bestGameGrade, level: e.bestGameLevel }),
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
      const name = result.result[i].name;
      const playerIndex = names.indexOf(name);
      if (playerIndex < 0) throw new Error();
      detailSheet.getRange(tableRow + 1 + playerIndex, 1, 1, 2).setBackground("#C45700");
    }
  }

  export function getSupplementComparison(context: { ss: Spreadsheet, metadata: CompetitionMetadata, detailSheet: Sheet }, roundIndex: number, rankId: string): SupplementComparisonData {
    const { ss, metadata, detailSheet } = context;

    const definition = metadata.rounds[roundIndex].supplementComparisons.find(e => e.rankId == rankId);
    if (definition == null) throw new Error();

    const range = getSupplementComparisonRange(ss, roundIndex, rankId);
    const row = range.getRow();
    const column = range.getColumn();

    const values = detailSheet.getRange(row + 2, column, definition.numPlayers, 6).getValues();

    const entries: SupplementComparisonEntry[] = [];
    values.forEach(e => {
      if (Util.isNullOrEmptyString(e[1])) return;

      const { level, grade } = Grade.spreadsheetValueToLevelOrGrade(e[2]);
      entries.push({
        rank: Number(e[0]),
        name: String(e[1]),
        level,
        grade,
        time: Time.spreadsheetValueToTime(e[3]),
        timeDiffBest: Time.spreadsheetValueToTime(e[4]),
        timeDiffPrev: Time.spreadsheetValueToTime(e[5]),
      });
    });

    return {
      rankId,
      comparison: entries,
    };
  }

  export function setSupplementComparison(context: { ss: Spreadsheet, detailSheet: Sheet }, roundIndex: number, rankId: string, data: SupplementComparisonData) {
    if (rankId != data.rankId) throw new Error();
    const { ss, detailSheet } = context;

    const range = getSupplementComparisonRange(ss, roundIndex, rankId);
    const row = range.getRow();
    const column = range.getColumn();

    const resultValues: unknown[][] = [];
    data.comparison.forEach(e => {
      resultValues.push([
        e.rank,
        e.name,
        Grade.levelOrGradeToSpreadsheetValue({ level: e.level, grade: e.grade }),
        Time.timeToSpreadsheetValue(e.time),
        Time.timeToSpreadsheetValue(e.timeDiffBest),
        Time.timeToSpreadsheetValue(e.timeDiffPrev),
      ]);
    });
    detailSheet.getRange(row + 2, column, resultValues.length, 6).setValues(resultValues);
  }
}
