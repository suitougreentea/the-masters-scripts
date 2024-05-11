import {
  StagePlayerEntry,
  StageScoreEntry,
  StageScoreValue,
  TimeDetail,
} from "../../../common/common_types.ts";
import { Grade } from "../../../common/grade.ts";
import { OcrPlayerStatus, OcrResult } from "../../common/type_definition.ts";

/**
 * @deprecated
 */
export const ocrResultToStageScoreEntries = (
  result: OcrResult,
  players: (StagePlayerEntry | null)[],
): StageScoreEntry[] => {
  const entries: StageScoreEntry[] = [];

  players.forEach((player, i) => {
    if (player == null) return;
    const status = result.status[i];
    if (status.level == 0) return;
    let grade: Grade | null;
    let level: number | null;
    let time: number | null;
    if (status.level < 999) {
      // not finished
      grade = null;
      level = status.level;
      time = null;
    } else {
      // finished
      grade = status.grade;
      level = status.level;
      time = status.gameTime;
    }
    entries.push({
      name: player.name,
      grade,
      level,
      time,
    });
  });

  return entries;
};

export const convertOcrPlayerStatusToStageScoreValue = (
  status: OcrPlayerStatus,
): StageScoreValue | undefined => {
  if (status.level == 0) return undefined;
  let grade: Grade | null;
  let level: number | null;
  let time: number | null;
  if (status.level < 999) {
    // not finished
    grade = null;
    level = status.level;
    time = null;
  } else {
    // finished
    grade = status.grade;
    level = status.level;
    time = status.gameTime;
  }
  const timeDetail: TimeDetail = {
    moveTime: status.moveTime,
    burnTime: status.burnTime,
    levelStopTime: status.levelStopTime,
    minoCount: status.minoCount,
    clearCount: status.clearCount,
    sections: status.sections.map((e) => {
      return {
        lap: e.lap,
        split: e.split,
        moveTime: e.moveTime,
        burnTime: e.burnTime,
        levelStopTime: e.levelStopTime,
        minoCount: e.minoCount,
        clearCount: e.clearCount,
      };
    }),
  };
  return {
    grade,
    level,
    time,
    timeDetail,
  };
};
