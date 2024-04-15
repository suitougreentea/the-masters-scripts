import { assertEquals } from "https://deno.land/std@0.215.0/assert/mod.ts";
import { calculateStandings, StandingInfo } from "./standings.ts";
import { GradeString, stringToGrade } from "../../common/grade.ts";

const input = (data: string[]): StandingInfo[] => {
  return calculateStandings(data.map((e) => {
    const match = e.match(/^(\d+)\+(\d+)G(.+)L(\d+)(P)?$/);
    const [
      _,
      startTimeString,
      timeString,
      gradeString,
      levelString,
      playingString,
    ] = match!;
    const startTime = Number(startTimeString) * 1000;
    const time = Number(timeString) * 1000;
    const grade = stringToGrade(gradeString as GradeString);
    const level = Number(levelString);
    const playing = playingString != null;
    return {
      startTime,
      level,
      grade,
      time,
      playing,
    };
  }));
};

const output = (data: string[]): StandingInfo[] => {
  return data.map((e) => {
    const match = e.match(/^(\d+)(F)?$/);
    const [_, rankIndexString, finalString] = match!;
    const rankIndex = Number(rankIndexString);
    const final = finalString != null;
    return {
      rankIndex,
      final,
    };
  });
};

Deno.test("without handicap, all not started (tie)", () => {
  assertEquals(
    input(["0+0G9L0", "0+0G9L0", "0+0G9L0"]),
    output(["0", "0", "0"]),
  );
});

Deno.test("without handicap, all started (tie)", () => {
  assertEquals(
    input(["0+0G9L1P", "0+0G9L1P", "0+0G9L1P"]),
    output(["0", "0", "0"]),
  );
});

Deno.test("with handicap, all not started (tie)", () => {
  assertEquals(
    input(["10+0G9L0", "10+0G9L0", "10+0G9L0"]),
    output(["0", "0", "0"]),
  );
});

Deno.test("with handicap, all not started", () => {
  assertEquals(
    input(["0+0G9L0", "5+0G9L0", "10+0G9L0"]),
    output(["0", "1", "2"]),
  );
});

Deno.test("with handicap, all started (tie)", () => {
  assertEquals(
    input(["10+0G9L1P", "5+5G9L1P", "0+10G9L1P"]),
    output(["0", "0", "0"]),
  );
});

Deno.test("order test", () => {
  assertEquals(
    input(["0+0G9L2", "0+0G9L1", "0+0G9L0"]),
    output(["0", "1", "2"]),
  );
  assertEquals(
    input(["0+0G9L0", "0+0G9L2", "0+0G9L1"]),
    output(["2", "0", "1"]),
  );
  assertEquals(
    input(["0+0G9L0", "0+0G9L1", "0+0G9L2"]),
    output(["2", "1", "0"]),
  );
});

Deno.test("clear grade sort", () => {
  assertEquals(
    input(["0+600GGML999P", "0+600GS9L999P", "0+300GS4L500P"]),
    output(["0", "1", "2"]),
  );
});

Deno.test("clear time sort", () => {
  assertEquals(
    input([
      "0+600GGML999",
      "1+599GGML999",
      "2+600GGML999",
      "10+550GS9L999",
      "10+600GS9L999",
      "0+500GS9L998P",
    ]),
    output(["0", "0", "2", "3", "4", "5"]),
  );
});

Deno.test("level sort", () => {
  assertEquals(
    input(["0+300GS4L500P", "0+290GS5L499", "0+300GS4L498P"]),
    output(["0", "1", "2"]),
  );
});

Deno.test("level tiebreaking", () => {
  assertEquals(
    input(["12+0G9L1P", "5+6G9L1P", "0+10G9L1P"]),
    output(["2", "1", "0"]),
  );
});

Deno.test("final flag check (cleared, time)", () => {
  assertEquals(
    input(["0+600GGML999", "0+500GS9L998P"]),
    output(["0", "1"]),
  );
  assertEquals(
    input(["0+600GGML999", "0+601GS9L997P", "0+500GS9L998"]),
    output(["0F", "2", "1"]),
  );
});

Deno.test("final flag check (cleared, grade)", () => {
  assertEquals(
    input(["0+600GS9L999", "0+601GS9L998P"]),
    output(["0", "1"]),
  );
  assertEquals(
    input(["0+600GGML999", "0+601GS9L999P"]),
    output(["0F", "1F"]),
  );
});

Deno.test("final flag check (dead)", () => {
  assertEquals(
    input(["0+300GS4L500", "0+300GS4L499P"]),
    output(["0", "1"]),
  );
  assertEquals(
    input(["0+300GS4L500", "0+300GS4L501P"]),
    output(["1F", "0"]),
  );
  assertEquals(
    input(["0+300GS4L500", "0+300GS4L499"]),
    output(["0F", "1F"]),
  );
});

Deno.test("final flag check (combined)", () => {
  assertEquals(
    input([
      "0+600GGML999",
      "0+610GGML999P",
      "0+605GS9L980P",
      "0+620GS9L975",
      "0+610GS9L970P",
      "0+600GS9L960",
    ]),
    output(["0F", "1", "2", "3", "4", "5F"]),
  );
});
