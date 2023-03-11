/**
 * アラートを表示。サイドバーから呼ばれる。
 * @param message メッセージ
 */
function mastersShowAlert(message: string) {
  SpreadsheetApp.getUi().alert(message);
}

function mastersSetParticipants(participants: Participant[]) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setupSheet = CompetitionSheet.getSetupSheetOrError(ss);
  const context = { ss, setupSheet };

  CompetitionSheet.setParticipants(context, participants);
}

/**
 * 大会をセットアップ
 * @param manual マニュアルモード
 * @param manualNumberOfGames マニュアルモード時のゲーム数
 */
function mastersSetupCompetition(manual: boolean, manualNumberOfGames: number) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setupSheet = CompetitionSheet.getSetupSheetOrError(ss);
  const context = { ss, setupSheet };
  const name = CompetitionSheet.getCompetitionName(context);
  const entries = CompetitionSheet.getParticipants(context);

  const setupResult = Competition.setupCompetition(name, entries.length, manual ? manualNumberOfGames : null);

  const { competitionSheet } = CompetitionSheet.setupCompetitionSheet(context, setupResult);
  competitionSheet.activate();
}

function mastersExportCompetition(): { url: string } {
  return Exporter.exportResult();
}

function mastersGetCurrentCompetitionMetadata(): CompetitionMetadata | null {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return CompetitionSheet.getCurrentCompetitionMetadata(ss);
}

function mastersResetStage(roundIndex: number, stageIndex: number, setup: StageSetupResult) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ss);
  const competitionSheet = CompetitionSheet.getCompetitionSheetOrError(ss);
  const templatesSheet = CompetitionSheet.getTemplatesSheetOrError(ss);
  const context = { ss, metadata, competitionSheet, templatesSheet };

  CompetitionSheet.resetStage(context, roundIndex, stageIndex, setup);
  CompetitionSheet.reapplyFormat(context, roundIndex, stageIndex);
}

function mastersGetStageData(roundIndex: number, stageIndices?: number[]): StageData[] {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ss);
  const competitionSheet = CompetitionSheet.getCompetitionSheetOrError(ss);
  const templatesSheet = CompetitionSheet.getTemplatesSheetOrError(ss);
  const context = { ss, metadata, competitionSheet, templatesSheet };

  const resolvedStageIndices: number[] = [];
  if (stageIndices != null) {
    resolvedStageIndices.push(...stageIndices);
  } else {
    metadata.rounds[roundIndex].stages.forEach((_, i) => resolvedStageIndices.push(i));
  }

  const result: StageData[] = [];
  resolvedStageIndices.forEach(stageIndex => {
    CompetitionSheet.reapplyFormat(context, roundIndex, stageIndex);
    const data = CompetitionSheet.getStageData(context, roundIndex, stageIndex);
    result.push(data);
  });
  return result;
}

function mastersGetSupplementComparisonData(roundIndex: number): SupplementComparisonData[] {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ss);
  if (metadata.rounds[roundIndex].supplementComparisons.length == 0) return [];
  const competitionSheet = CompetitionSheet.getCompetitionSheetOrError(ss);
  const detailSheet = CompetitionSheet.getCompetitionDetailSheetOrError(ss);
  const context = { ss, metadata, competitionSheet, detailSheet };

  return metadata.rounds[roundIndex].supplementComparisons.map(definition => {
    return CompetitionSheet.getSupplementComparison(context, roundIndex, definition.rankId);
  });
}

function mastersGetQualifierScore(): QualifierScore {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ss);
  const detailSheet = CompetitionSheet.getCompetitionDetailSheetOrError(ss);
  const context = { ss, metadata, detailSheet };

  return CompetitionSheet.getQualifierScore(context);
}

function mastersGetQualifierResult(): QualifierResult {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ss);
  const detailSheet = CompetitionSheet.getCompetitionDetailSheetOrError(ss);
  const context = { ss, metadata, detailSheet };

  return CompetitionSheet.getQualifierResult(context);
}

function mastersReorderStagePlayers(roundIndex: number, stageIndex: number, names: (string | null)[]) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ss);
  const competitionSheet = CompetitionSheet.getCompetitionSheetOrError(ss);
  const templatesSheet = CompetitionSheet.getTemplatesSheetOrError(ss);
  const context = { ss, metadata, competitionSheet, templatesSheet };

  CompetitionSheet.reorderPlayers(context, roundIndex, stageIndex, names);
  CompetitionSheet.reapplyFormat(context, roundIndex, stageIndex);
}

function mastersSetStageScore(roundIndex: number, stageIndex: number, score: StageScoreData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ss);
  const competitionSheet = CompetitionSheet.getCompetitionSheetOrError(ss);
  const detailSheet = CompetitionSheet.getCompetitionDetailSheet(ss);
  const templatesSheet = CompetitionSheet.getTemplatesSheetOrError(ss);
  const context = { ss, metadata, competitionSheet, detailSheet, templatesSheet };

  CompetitionSheet.setStageScore(context, roundIndex, stageIndex, score);

  const stageData = CompetitionSheet.getStageData(context, roundIndex, stageIndex);
  const resultEntryStubs: Competition.StageResultEntryStub[] = [];
  stageData.players.forEach(player => {
    if (player == null) return;
    resultEntryStubs.push(Competition.constructStageResultEntryStub(player));
  });
  const result = Competition.getStageResult(resultEntryStubs);
  CompetitionSheet.setStageResult(context, roundIndex, stageIndex, result);

  CompetitionSheet.reapplyFormat(context, roundIndex, stageIndex);

  if (Competition.isQualifierRound(metadata, roundIndex)) {
    if (detailSheet == null) throw new Error();
    CompetitionSheet.setQualifierTableColumn({ ss, metadata, detailSheet }, stageIndex, result);
  }
}

function mastersTryInitializeRound(roundIndex: number): boolean {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ss);
  const setupSheet = CompetitionSheet.getSetupSheetOrError(ss);
  const competitionSheet = CompetitionSheet.getCompetitionSheetOrError(ss);
  const detailSheet = CompetitionSheet.getCompetitionDetailSheet(ss);
  const context = { ss, metadata, setupSheet, competitionSheet, detailSheet };

  return CompetitionSheet.tryInitializeRound(context, roundIndex);
}

function mastersTryFinalizeRound(roundIndex: number): boolean {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const metadata = CompetitionSheet.getCurrentCompetitionMetadataOrError(ss);
  const competitionSheet = CompetitionSheet.getCompetitionSheetOrError(ss);
  const detailSheet = CompetitionSheet.getCompetitionDetailSheet(ss);
  const context = { ss, metadata, competitionSheet, detailSheet };

  return CompetitionSheet.tryFinalizeRound(context, roundIndex);
}

// 実行可能APIで入出力をオブジェクトでするとnullが捨てられてしまう
function mastersCallApiAsJson<TName extends keyof ApiFunctions>(functionName: TName, parameters: string): string {
  const parsedParameters = JSON.parse(parameters) as Parameters<ApiFunctions[TName]>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const result = globalThis[functionName](...parsedParameters);
  return JSON.stringify(result);
}

// 型チェック用
const assertApiFunctions: ApiFunctions = {
  mastersShowAlert,
  mastersSetParticipants,
  mastersSetupCompetition,
  mastersExportCompetition,
  mastersGetCurrentCompetitionMetadata,
  mastersResetStage,
  mastersGetStageData,
  mastersGetSupplementComparisonData,
  mastersGetQualifierScore,
  mastersGetQualifierResult,
  mastersReorderStagePlayers,
  mastersSetStageScore,
  mastersTryInitializeRound,
  mastersTryFinalizeRound,
};
