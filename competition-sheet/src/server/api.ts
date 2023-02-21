/**
 * 大会をセットアップ。サイドバーから呼ばれる。
 * @param form サイドバーのフォーム情報
 */
function setupCompetition(form: { manual?: "on", manualNumberOfGames: string }) {
  try {
    const { manual, manualNumberOfGames } = form;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const entries = CompetitionSheet.getPlayerEntries(ss);

    const setupResult = Competition.setupCompetition(entries.length, manual ? Number(manualNumberOfGames) : null);

    const { competitionSheet } = CompetitionSheet.setupCompetitionSheet(ss, setupResult);
    competitionSheet.activate();
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

/**
 * ステージ情報を取得。サイドバーから呼ばれる。
 * @param stageIndex
 * @returns stageInfo: ステージ情報, isLast: 最後のステージならtrue
 */
function getStageInfo(stageIndex: number): { stageInfo: Competition.StageInfo, isLast: boolean } {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const setupResult = CompetitionSheet.getCurrentSetupResultOrError(ss);
    const { stages } = setupResult;

    if (stageIndex < 0 || stages.length <= stageIndex) throw new Error("範囲外のステージです: " + stageIndex + 1);
    const { roundIndex, groupIndex } = stages[stageIndex];
    const result = CompetitionSheet.getStageInfo(ss, roundIndex, groupIndex);

    CompetitionSheet.reapplyFormat(ss, roundIndex, groupIndex);
    return { stageInfo: result, isLast: stageIndex == stages.length - 1 };
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

/**
 * ステージのプレイヤーを並び替え。サイドバーから呼ばれる。
 * @param stageIndex
 * @param names 並べ替え後のプレイヤー順
 */
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

/**
 * ステージを抜ける。サイドバーから呼ばれる。
 * 予選ラウンド中の場合に得点を書き込む。
 * @param stageIndex
 */
function leaveStage(stageIndex: number) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const setupResult = CompetitionSheet.getCurrentSetupResultOrError(ss);
    const { stages } = setupResult;

    if (stageIndex < 0 || stages.length <= stageIndex) throw new Error("範囲外のステージです: " + stageIndex + 1);
    const { roundIndex, groupIndex } = setupResult.stages[stageIndex];

    CompetitionSheet.reapplyFormat(ss, roundIndex, groupIndex);
    CompetitionSheet.leaveStage(ss, roundIndex, groupIndex);
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

/**
 * タイマー情報を取得。タイマーから呼ばれる。
 * @param stageIndex
 * @returns stageTimerInfo: タイマー情報, isLast: 最後のステージならtrue
 */
function getTimerInfo(stageIndex: number): { stageTimerInfo: Competition.StageTimerInfo, isLast: boolean } {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const setupResult = CompetitionSheet.getCurrentSetupResultOrError(ss);
  const { stages } = setupResult;

  if (stageIndex < 0 || stages.length <= stageIndex) throw new Error("範囲外のステージです: " + stageIndex + 1);
  const { roundIndex, groupIndex } = setupResult.stages[stageIndex];

  const result = CompetitionSheet.getTimerInfo(ss, roundIndex, groupIndex);
  return { stageTimerInfo: result, isLast: stageIndex == stages.length - 1 };
}
