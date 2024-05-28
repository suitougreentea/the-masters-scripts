import {
  Participant,
  StagePlayerEntry,
  StageScoreData,
  StageScoreEntry,
  StageSetupPlayerEntry,
  StageSetupResult,
} from "../common/common_types.ts";
import { getAppropriatePresetName, getPreset } from "./preset.ts";
import * as Api from "./api.ts";
import { getSerializerValue, setSerializerValue } from "./serializer_dev.ts";
import { CompetitionSetupOptions } from "../common/common_types.ts";
import { grades } from "../common/grade.ts";

export const shuffle = <T>(array: T[]) => {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

export const loadTestDataInMemory = () => {
  setSerializerValue(
    "players",
    JSON.parse(Deno.readTextFileSync("data_test/players.json")),
  );
};

export const resolvePresetName = (
  numPlayers: number,
  inputPresetName?: string,
): string => {
  if (inputPresetName != null) return inputPresetName;
  const resolved = getAppropriatePresetName(numPlayers);
  if (resolved == null) throw new Error();
  return resolved;
};

export const populateParticipants = (
  numPlayers: number,
  presetName?: string,
): Participant[] => {
  const preset = presetName != null ? getPreset(presetName) : undefined;
  const manual = preset == null;

  const playersStoreValue = getSerializerValue("players") as {
    registeredPlayers: { name: string }[];
  };
  const playerNames = playersStoreValue.registeredPlayers.map((e) => e.name)
    .slice(0, numPlayers);

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

  return participants;
};

export const populateCompetitionSetupOptions = (
  numPlayers: number,
  presetName?: string,
): CompetitionSetupOptions => {
  const manual = presetName == null;
  let competitionName;

  if (presetName == null) {
    competitionName = "Masters Automated Test - Manual";
  } else {
    competitionName = `Masters Automated Test - ${numPlayers} ${presetName}`;
  }

  return {
    name: competitionName,
    manualNumberOfGames: manual ? 10 : undefined,
    overridePresetName: presetName,
  };
};

export const populateStageSetupResultFromParticipants = (
  participants: Participant[],
  numPickPlayers: number,
): StageSetupResult => {
  const shuffledParticipantNames = participants.map((e) => e.name);
  shuffle(shuffledParticipantNames);
  const entries: StageSetupPlayerEntry[] = [];
  for (let i = 0; i < numPickPlayers; i++) {
    entries.push({
      name: shuffledParticipantNames[i],
      handicap: Math.random() < 0.2 ? -5 : 0,
    });
  }
  return { entries };
};

export const populatePlayerReorderList = (
  players: (StagePlayerEntry | undefined)[],
): (string | undefined)[] => {
  const names = players.map((e) => e?.name);
  shuffle(names);
  return names;
};

export const populateStageScore = (
  players: (StagePlayerEntry | undefined)[],
): StageScoreData => {
  const score = () => {
    if (Math.random() < 0.4) {
      const level = Math.floor(Math.random() * 999);
      return { level, grade: undefined, time: undefined };
    }
    const grade = Math.random() < 0.1 ? grades.S9 : grades.GM;
    const time = 9 * 60 * 1000 + Math.floor(Math.random() * 4 * 60 * 1000);
    return { level: 999, grade, time };
  };
  const scores: StageScoreEntry[] = [];
  players.forEach((player) => {
    if (player == null) return;
    scores.push({ name: player.name, ...score() });
  });
  return { players: scores };
};

// using random, non-determinant
export const automateWholeCompetition = async (
  numPlayers: number,
  manual: boolean,
  presetName?: string,
  exportToSpreadsheet?: boolean,
): Promise<{ exportUrl?: string }> => {
  loadTestDataInMemory();

  const resolvedPresetName = manual
    ? undefined
    : resolvePresetName(numPlayers, presetName);
  const participants = populateParticipants(numPlayers, resolvedPresetName);
  Api.mastersSetParticipants(participants);
  const competitionSetupOptions = populateCompetitionSetupOptions(
    numPlayers,
    resolvedPresetName,
  );
  Api.mastersSetupCompetition(competitionSetupOptions);
  const metadata = Api.mastersGetCurrentCompetitionMetadata()!;

  metadata.rounds.forEach((round, roundIndex) => {
    Api.mastersTryInitializeRound(roundIndex);

    round.stages.forEach((_, stageIndex) => {
      if (manual) {
        Api.mastersResetStage(
          roundIndex,
          stageIndex,
          populateStageSetupResultFromParticipants(participants, 4),
        );
      }

      const stageData = Api.mastersGetStageData(roundIndex, [stageIndex])[0];
      Api.mastersReorderStagePlayers(
        roundIndex,
        stageIndex,
        populatePlayerReorderList(stageData.players),
      );

      const newStageData = Api.mastersGetStageData(roundIndex, [stageIndex])[0];
      Api.mastersSetStageScore(
        roundIndex,
        stageIndex,
        populateStageScore(newStageData.players),
      );
    });

    Api.mastersTryFinalizeRound(roundIndex);
  });

  if (exportToSpreadsheet) {
    const exportResult = await Api.mastersExportCompetition();
    return {
      exportUrl: exportResult.url,
    };
  } else {
    return {
      exportUrl: undefined,
    };
  }
};
