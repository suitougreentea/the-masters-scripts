function setupCompetition(form: { manual: boolean, manualNumberOfGames: number }) {
  try {
    const entrySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Definition.sheetNames.entry)!;
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

    const { manual, manualNumberOfGames } = form;

    const setupResult = Competition.setupCompetition(manual, manualNumberOfGames, entries);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let competitionSheet = ss.getSheetByName(Definition.sheetNames.competition);
    if (competitionSheet != null) {
      ss.deleteSheet(competitionSheet);
    }
    competitionSheet = ss.insertSheet(Definition.sheetNames.competition, ss.getSheets().length);

    CompetitionSheet.initializeCompetitionSheet(ss, competitionSheet, setupResult);
    CompetitionSheet.setFirstRoundPlayers(ss, competitionSheet, setupResult.firstRoundGroups);
    competitionSheet.activate();
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

function getStageInfo(stageIndex: number): Competition.StageInfo {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const competitionSheet = ss.getSheetByName(Definition.sheetNames.competition);
    if (competitionSheet == null) throw new Error("Competitionシートがありません");
    const result = CompetitionSheet.getStageInfo(ss, competitionSheet, stageIndex);
    CompetitionSheet.applyFormat(ss, competitionSheet, stageIndex);
    return result;
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

function reorderPlayers(stageIndex: number, names: (string | null)[]) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const competitionSheet = ss.getSheetByName(Definition.sheetNames.competition);
    if (competitionSheet == null) throw new Error("Competitionシートがありません");
    CompetitionSheet.reorderPlayers(ss, competitionSheet, stageIndex, names);
    CompetitionSheet.applyFormat(ss, competitionSheet, stageIndex);
  } catch (e) {
    SpreadsheetApp.getUi().alert(String(e));
    throw e;
  }
}

function getTimerInfo(stageIndex: number): Competition.TimerInfo {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const competitionSheet = ss.getSheetByName(Definition.sheetNames.competition);
  if (competitionSheet == null) throw new Error("Competitionシートがありません");
  return CompetitionSheet.getTimerInfo(ss, competitionSheet, stageIndex);
}
