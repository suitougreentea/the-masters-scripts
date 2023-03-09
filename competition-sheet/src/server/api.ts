/**
 * アラートを表示。サイドバーから呼ばれる。
 * @param message メッセージ
 */
function mastersShowAlert(message: string) {
  SpreadsheetApp.getUi().alert(message);
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
  throw new Error("Not implemented");
}

function mastersGetCurrentCompetitionMetadata(): CompetitionMetadata | null {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return CompetitionSheet.getCurrentCompetitionMetadata(ss);
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
  resolvedStageIndices.forEach((_, stageIndex) => {
    CompetitionSheet.reapplyFormat(context, roundIndex, stageIndex);
    CompetitionSheet.getStageData(context, roundIndex, stageIndex);
  });
  return result;
}

function mastersGetSupplementComparisonData(roundIndex: number): SupplementComparisonData[] {
  throw new Error("Not implemented");
}

function mastersGetQualifierScore(): QualifierScore {
  throw new Error("Not implemented");
}

function mastersGetQualifierResult(): QualifierResult {
  throw new Error("Not implemented");
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

// 型チェック用
const assertApiFunctions: ApiFunctions = {
  mastersShowAlert,
  mastersSetupCompetition,
  mastersExportCompetition,
  mastersGetCurrentCompetitionMetadata,
  mastersGetStageData,
  mastersGetSupplementComparisonData,
  mastersGetQualifierScore,
  mastersGetQualifierResult,
  mastersReorderStagePlayers,
  mastersSetStageScore,
  mastersTryInitializeRound,
  mastersTryFinalizeRound,
};
