import { assertEquals } from "@std/assert";
import { ocrResultToStageScoreEntries } from "./ocr_util.ts";
import { OcrPlayerStatus } from "../../common/type_definition.ts";
import { StagePlayerEntry } from "../../../common/common_types.ts";
import { Grade, grades } from "../../../common/grade.ts";
import { createTime } from "../../../common/time.ts";
import { convertOcrPlayerStatusToStageScoreValue } from "./ocr_util.ts";

Deno.test("ocrResultToStageScoreEntries() works", () => {
  const dummyData = (level: number, grade: Grade, gameTime: number) => ({
    playing: false,
    frameTime: 0,
    level,
    grade,
    gameTime,
    health: "",
    moveTime: 0,
    burnTime: 1,
    levelStopTime: 2,
    minoCount: 3,
    clearCount: [0, 1, 2, 3],
    sections: [],
  } as OcrPlayerStatus);
  const dummyPlayer = {
    rawBestTime: 0,
    handicap: 0,
    bestTime: 0,
    startOrder: 0,
    startTime: 0,
    level: undefined,
    grade: undefined,
    time: undefined,
    timeDetail: {
      moveTime: 0,
      burnTime: 1,
      levelStopTime: 2,
      minoCount: 3,
      clearCount: [0, 1, 2, 3],
      sections: [],
    },
  } as Omit<StagePlayerEntry, "name">;

  assertEquals(
    ocrResultToStageScoreEntries({
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
      undefined,
      undefined,
      {
        ...dummyPlayer,
        name: "b",
      },
      {
        ...dummyPlayer,
        name: "a",
      },
      undefined,
      undefined,
      undefined,
      undefined,
    ]),
    [
      {
        name: "b",
        level: 750,
        grade: undefined,
        time: undefined,
      },
      {
        name: "a",
        level: 999,
        grade: grades.S9,
        time: createTime(9, 30, 0),
      },
    ],
  );
});

Deno.test("convertOcrPlayerStatusToStageScoreValue() works", () => {
  assertEquals(
    convertOcrPlayerStatusToStageScoreValue({
      playing: false,
      frameTime: 0,
      level: 100,
      grade: grades.S1,
      gameTime: 10000,
      health: "",
      moveTime: 0,
      burnTime: 1,
      levelStopTime: 2,
      minoCount: 3,
      clearCount: [0, 1, 2, 3],
      sections: [],
    }),
    {
      level: 100,
      grade: undefined,
      time: undefined,
      timeDetail: {
        moveTime: 0,
        burnTime: 1,
        levelStopTime: 2,
        minoCount: 3,
        clearCount: [0, 1, 2, 3],
        sections: [],
      },
    },
  );
  assertEquals(
    convertOcrPlayerStatusToStageScoreValue({
      playing: false,
      frameTime: 0,
      level: 999,
      grade: grades.GM,
      gameTime: 20000,
      health: "",
      moveTime: 0,
      burnTime: 1,
      levelStopTime: 2,
      minoCount: 3,
      clearCount: [0, 1, 2, 3],
      sections: [],
    }),
    {
      level: 999,
      grade: grades.GM,
      time: 20000,
      timeDetail: {
        moveTime: 0,
        burnTime: 1,
        levelStopTime: 2,
        minoCount: 3,
        clearCount: [0, 1, 2, 3],
        sections: [],
      },
    },
  );
  assertEquals(
    convertOcrPlayerStatusToStageScoreValue({
      playing: false,
      frameTime: 0,
      level: 0,
      grade: grades["9"],
      gameTime: 0,
      health: "",
      moveTime: 0,
      burnTime: 0,
      levelStopTime: 0,
      minoCount: 0,
      clearCount: [0, 0, 0, 0],
      sections: [],
    }),
    undefined,
  );
});
