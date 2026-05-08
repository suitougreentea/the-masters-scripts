import { assertEquals } from "@std/assert";
import { grades } from "../common/grade.ts";
import * as Api from "./api.ts";
import { configureInject, modifyInjectInMemory } from "./inject_config.ts";

const ensureInMemorySetup = () => {
  configureInject();
  modifyInjectInMemory();
};

const createTestPlayers = () => {
  const seed = crypto.randomUUID().slice(0, 8);
  const p1 = `gm-test-a-${seed}`;
  const p2 = `gm-test-b-${seed}`;

  Api.mastersRegisterPlayer({
    name: p1,
    bestTime: 540000,
    comment: "",
  });
  Api.mastersRegisterPlayer({
    name: p2,
    bestTime: 545000,
    comment: "",
  });

  return { p1, p2 };
};

const setupSingleStageCompetition = (p1: string, p2: string) => {
  Api.mastersSetParticipants([
    { name: p1, firstRoundGroupIndex: 0 },
    { name: p2, firstRoundGroupIndex: 1 },
  ]);
  Api.mastersSetupCompetition({
    name: "api-test",
    manualNumberOfGames: 1,
    overridePresetName: undefined,
  });
  Api.mastersResetStage(0, 0, {
    entries: [
      { name: p1, handicap: 0 },
      { name: p2, handicap: 0 },
    ],
  });
};

const getTournamentBestTime = (name: string) => {
  return Api.mastersGetRegisteredPlayers().find((e) => e.name == name)
    ?.tournamentBestTime;
};

Deno.test("mastersSetStageScore updates tournamentBestTime only for GM", () => {
  ensureInMemorySetup();
  const { p1, p2 } = createTestPlayers();
  setupSingleStageCompetition(p1, p2);

  Api.mastersSetStageScore(0, 0, {
    players: [
      { name: p1, level: 999, grade: grades.S9, time: 500000 },
      { name: p2, level: 999, grade: grades.GM, time: 510000 },
    ],
  });

  assertEquals(getTournamentBestTime(p1), undefined);
  assertEquals(getTournamentBestTime(p2), 510000);
});

Deno.test("mastersSetStageScore keeps GM best unless faster GM appears", () => {
  ensureInMemorySetup();
  const { p1, p2 } = createTestPlayers();
  setupSingleStageCompetition(p1, p2);

  Api.mastersSetStageScore(0, 0, {
    players: [
      { name: p1, level: 999, grade: grades.GM, time: 520000 },
      { name: p2, level: 999, grade: grades.GM, time: 530000 },
    ],
  });
  assertEquals(getTournamentBestTime(p1), 520000);

  Api.mastersSetStageScore(0, 0, {
    players: [
      { name: p1, level: 999, grade: grades.S9, time: 500000 },
      { name: p2, level: 999, grade: grades.GM, time: 535000 },
    ],
  });
  assertEquals(getTournamentBestTime(p1), 520000);

  Api.mastersSetStageScore(0, 0, {
    players: [
      { name: p1, level: 999, grade: grades.GM, time: 510000 },
      { name: p2, level: 999, grade: grades.GM, time: 540000 },
    ],
  });
  assertEquals(getTournamentBestTime(p1), 510000);
});

Deno.test("mastersUpdatePlayer can override and clear tournamentBestTime", () => {
  ensureInMemorySetup();
  const seed = crypto.randomUUID().slice(0, 8);
  const name = `gm-test-edit-${seed}`;

  Api.mastersRegisterPlayer({
    name,
    bestTime: 540000,
    comment: "",
  });

  Api.mastersUpdatePlayer(name, {
    name,
    bestTime: 540000,
    tournamentBestTime: 500000,
    comment: "manual",
  });
  assertEquals(getTournamentBestTime(name), 500000);

  Api.mastersUpdatePlayer(name, {
    name,
    bestTime: 540000,
    tournamentBestTime: undefined,
    comment: "clear",
  });
  assertEquals(getTournamentBestTime(name), undefined);
});
