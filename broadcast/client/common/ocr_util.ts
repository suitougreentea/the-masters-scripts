import {
  StagePlayerEntry,
  StageScoreEntry,
} from "../../../common/common_types.ts";
import { Grade } from "../../../common/grade.ts";
import { OcrResult } from "../../common/type_definition.ts";

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
