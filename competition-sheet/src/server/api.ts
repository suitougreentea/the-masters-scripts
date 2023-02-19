function setupCompetition(form: { manual: boolean, manualNumberOfGames: number }) {
  try {
    const { manual, manualNumberOfGames } = form;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const entries = CompetitionSheet.getPlayerEntries(ss);

    const setupResult = Competition.setupCompetition(entries.length, manual ? manualNumberOfGames : null);

    const { competitionSheet } = CompetitionSheet.setupCompetitionSheet(ss, setupResult);
    competitionSheet.activate();
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

function getStageInfo(stageIndex: number): Competition.StageInfo {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const setupResult = CompetitionSheet.getCurrentSetupResultOrError(ss);
    const { stages } = setupResult;

    if (stageIndex < 0 || stages.length <= stageIndex) throw new Error("範囲外のステージです: " + stageIndex + 1);
    const { roundIndex, groupIndex } = stages[stageIndex];
    const result = CompetitionSheet.getStageInfo(ss, roundIndex, groupIndex);

    CompetitionSheet.reapplyFormat(ss, roundIndex, groupIndex);
    return result;
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

function reorderPlayers(stageIndex: number, names: (string | null)[]) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const setupResult = CompetitionSheet.getCurrentSetupResultOrError(ss);
    const { stages } = setupResult;

    if (stageIndex < 0 || stages.length <= stageIndex) throw new Error("範囲外のステージです: " + stageIndex + 1);
    const { roundIndex, groupIndex } = setupResult.stages[stageIndex];

    CompetitionSheet.reorderPlayers(ss, roundIndex, groupIndex, names);
    CompetitionSheet.reapplyFormat(ss, roundIndex, groupIndex);
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

function leaveStage(stageIndex: number) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const setupResult = CompetitionSheet.getCurrentSetupResultOrError(ss);
    const { stages } = setupResult;

    if (stageIndex < 0 || stages.length <= stageIndex) throw new Error("範囲外のステージです: " + stageIndex + 1);
    const { roundIndex, groupIndex } = setupResult.stages[stageIndex];

    CompetitionSheet.reapplyFormat(ss, roundIndex, groupIndex);
    return CompetitionSheet.leaveStage(ss, roundIndex, groupIndex);
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

// タイマーから
function getTimerInfo(stageIndex: number): Competition.StageTimerInfo {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const setupResult = CompetitionSheet.getCurrentSetupResultOrError(ss);
  const { stages } = setupResult;

  if (stageIndex < 0 || stages.length <= stageIndex) throw new Error("範囲外のステージです: " + stageIndex + 1);
  const { roundIndex, groupIndex } = setupResult.stages[stageIndex];

  return CompetitionSheet.getTimerInfo(ss, roundIndex, groupIndex);
}
