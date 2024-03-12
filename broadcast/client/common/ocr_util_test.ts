import { assertEquals } from "https://deno.land/std@0.215.0/assert/mod.ts";
import { ocrResultToStageScoreEntries } from "./ocr_util.ts";
import { Grade, grades } from "../../../common/grade.ts";
import { createTime } from "../../../common/time.ts";

Deno.test("ocrResultToStageScoreEntries() works", () => {
  const dummyData = (level: number, grade: Grade, gameTime: number) => ({
    playing: false,
    frameTime: 0,
    level,
    grade,
    gameTime,
    sections: [],
  });
  const dummyPlayer = {
    rawBestTime: 0,
    handicap: 0,
    bestTime: 0,
    startOrder: 0,
    startTime: 0,
    level: null,
    grade: null,
    time: null,
  };

  assertEquals(ocrResultToStageScoreEntries({
    status: [
      dummyData(0, grades["9"], 0),
      dummyData(0, grades["9"], 0),
      dummyData(750, grades.S4, createTime(7, 30, 30)),
      dummyData(999, grades.S9, createTime(9, 30, 0)),
      dummyData(0, grades["9"], 0),
      dummyData(0, grades["9"], 0),
      dummyData(0, grades["9"], 0),
      dummyData(0, grades["9"], 0),
    ],
  }, [
    null,
    null,
    {
      ...dummyPlayer,
      name: "b",
    },
    {
      ...dummyPlayer,
      name: "a",
    },
    null,
    null,
    null,
    null,
  ]), [
    {
      name: "b",
      level: 750,
      grade: null,
      time: null,
    },
    {
      name: "a",
      level: 999,
      grade: grades.S9,
      time: createTime(9, 30, 0),
    },
  ]);
});
