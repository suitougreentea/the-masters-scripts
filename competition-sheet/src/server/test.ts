namespace Test {
  export function logJson(value: unknown) {
    console.log(JSON.stringify(value, null, 2));
  }

  export function automateWholeCompetition(numPlayers: number, presetName?: string) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const playersSheet = ss.getSheetByName(Definition.sheetNames.players)!;
    const playerNamesValue = playersSheet.getRange(2, 1, numPlayers, 1).getValues();
    const playerNames = playerNamesValue.map(e => String(e[0]));

    const shuffle = <T>(array: T[]) => {
      for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    };

    let resolvedPresetName: string | null = null;
    let manual = false;
    let competitionName;
    if (presetName == "manual") {
      manual = true;
      competitionName = "Masters Automated Test - Manual";
    } else {
      if (presetName != null) {
        resolvedPresetName = presetName;
      } else {
        resolvedPresetName = Preset.getAppropriatePresetName(numPlayers);
        if (resolvedPresetName == null) throw new Error();
      }
      competitionName = `Masters Automated Test - ${numPlayers} ${resolvedPresetName}`;
    }
    const preset = resolvedPresetName != null ? Preset.getPreset(resolvedPresetName) : null;

    const participants: Participant[] = [];
    if (manual || preset!.type == "qualifierFinal") {
      playerNames.forEach((name, i) => {
        participants.push({ name, firstRoundGroupIndex: i });
      });
    } else if (preset!.type == "tournament") {
      const numGroups = preset!.rounds[0].numGroups!;
      playerNames.forEach((name, i) => {
        participants.push({ name, firstRoundGroupIndex: i % numGroups });
      });
    } else {
      throw new Error();
    }
    mastersSetParticipants(participants);
    mastersSetupCompetition({
      name: competitionName,
      manualNumberOfGames: manual ? 10 : undefined,
      overridePresetName: !manual ? resolvedPresetName! : undefined,
    });
    const metadata = mastersGetCurrentCompetitionMetadata()!;

    metadata.rounds.forEach((round, roundIndex) => {
      mastersTryInitializeRound(roundIndex);

      round.stages.forEach((_, stageIndex) => {
        if (manual) {
          const shuffledParticipantNames = participants.map(e => e.name);
          shuffle(shuffledParticipantNames);
          const entries: StageSetupPlayerEntry[] = [];
          for (let i = 0; i < 4; i++) {
            entries.push({
              name: shuffledParticipantNames[i],
              handicap: Math.random() < 0.2 ? -5 : 0,
            });
          }
          mastersResetStage(roundIndex, stageIndex, { entries });
        }

        const stageData = mastersGetStageData(roundIndex, [stageIndex])[0];

        const names = stageData.players.map(e => e != null ? e.name : null);
        shuffle(names);
        mastersReorderStagePlayers(roundIndex, stageIndex, names);

        const generateRandomResult = () => {
          if (Math.random() < 0.4) {
            const level = Math.floor(Math.random() * 999);
            return { level, grade: null, time: null };
          }
          const grade = Math.random() < 0.1 ? Grade.stringToGrade("S9") : Grade.stringToGrade("GM");
          const time = 9 * 60 * 1000 + Math.floor(Math.random() * 4 * 60 * 1000);
          return { level: 999, grade, time };
        };
        const scores: StageScoreEntry[] = [];
        names.forEach(name => {
          if (name == null) return;
          scores.push({ name, ...generateRandomResult() });
        });
        mastersSetStageScore(roundIndex, stageIndex, { players: scores });
      });

      mastersTryFinalizeRound(roundIndex);
    });

    mastersExportCompetition();
  }
}
