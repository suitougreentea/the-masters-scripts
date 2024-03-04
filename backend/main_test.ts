import { assertEquals } from "https://deno.land/std@0.215.0/assert/mod.ts";

import { Participant, StageScoreEntry, StageSetupPlayerEntry } from "../common/common_types.ts";
import { stringToGrade } from "../common/grade.ts";
import { getAppropriatePresetName, getPreset } from "./preset.ts";
import * as Api from "./api.ts";
import { configureInject, modifyInjectInMemory } from "./inject_config.ts";
import { setSerializerValue, getSerializerValue } from "./serializer_test.ts";

configureInject();
modifyInjectInMemory();

export const automateWholeCompetition = async (numPlayers: number, presetName?: string, exportToSpreadsheet?: boolean): Promise<{ exportUrl?: string }> => {
  const playerNames = Api.mastersGetRegisteredPlayers().map(e => e.name).slice(0, numPlayers);

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
      resolvedPresetName = getAppropriatePresetName(numPlayers);
      if (resolvedPresetName == null) throw new Error();
    }
    competitionName = `Masters Automated Test - ${numPlayers} ${resolvedPresetName}`;
  }
  const preset = resolvedPresetName != null ? getPreset(resolvedPresetName) : null;

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
  Api.mastersSetParticipants(participants);
  Api.mastersSetupCompetition({
    name: competitionName,
    manualNumberOfGames: manual ? 10 : undefined,
    overridePresetName: !manual ? resolvedPresetName! : undefined,
  });
  const metadata = Api.mastersGetCurrentCompetitionMetadata()!;

  metadata.rounds.forEach((round, roundIndex) => {
    Api.mastersTryInitializeRound(roundIndex);

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
        Api.mastersResetStage(roundIndex, stageIndex, { entries });
      }

      const stageData = Api.mastersGetStageData(roundIndex, [stageIndex])[0];

      const names = stageData.players.map(e => e != null ? e.name : null);
      shuffle(names);
      Api.mastersReorderStagePlayers(roundIndex, stageIndex, names);

      const generateRandomResult = () => {
        if (Math.random() < 0.4) {
          const level = Math.floor(Math.random() * 999);
          return { level, grade: null, time: null };
        }
        const grade = Math.random() < 0.1 ? stringToGrade("S9") : stringToGrade("GM");
        const time = 9 * 60 * 1000 + Math.floor(Math.random() * 4 * 60 * 1000);
        return { level: 999, grade, time };
      };
      const scores: StageScoreEntry[] = [];
      names.forEach(name => {
        if (name == null) return;
        scores.push({ name, ...generateRandomResult() });
      });
      Api.mastersSetStageScore(roundIndex, stageIndex, { players: scores });
    });

    Api.mastersTryFinalizeRound(roundIndex);
  });

  if (exportToSpreadsheet)
  {
    const exportResult = await Api.mastersExportCompetition();
    return {
      exportUrl: exportResult.url,
    }
  } else {
    return {}
  }
}


Deno.test(async function wholeCompetitionCompletes(t) {
  setSerializerValue("players", JSON.parse(Deno.readTextFileSync("data_test/players.json")));

  for (let numPlayers = 8; numPlayers <= 48; numPlayers++) {
    await t.step({
      name: `${numPlayers} players`,
      async fn() {
        await automateWholeCompetition(numPlayers, undefined, true);
      }
    });
  };
});
