import { assertEquals } from "@std/assert";
import { parseScoreEditorScore } from "./score_editor.ts";
import { formatScoreEditorScore } from "./score_editor.ts";
import { createTime } from "../../../common/time.ts";
import { grades } from "../../../common/grade.ts";

Deno.test("parseScoreEditorScore() works", () => {
  assertEquals(parseScoreEditorScore(""), undefined);
  assertEquals(parseScoreEditorScore("invalid"), undefined);
  assertEquals(parseScoreEditorScore("1"), {
    level: 1,
    grade: undefined,
    time: undefined,
  });
  assertEquals(parseScoreEditorScore("12"), {
    level: 12,
    grade: undefined,
    time: undefined,
  });
  assertEquals(parseScoreEditorScore("443"), {
    level: 443,
    grade: undefined,
    time: undefined,
  });
  assertEquals(parseScoreEditorScore("1000"), undefined);
  assertEquals(parseScoreEditorScore("95432"), {
    level: 999,
    grade: grades.GM,
    time: createTime(9, 54, 32),
  });
  assertEquals(parseScoreEditorScore("102030"), {
    level: 999,
    grade: grades.GM,
    time: createTime(10, 20, 30),
  });
  assertEquals(parseScoreEditorScore("10:20.30"), {
    level: 999,
    grade: grades.GM,
    time: createTime(10, 20, 30),
  });
  assertEquals(parseScoreEditorScore("10:20:30"), {
    level: 999,
    grade: grades.GM,
    time: createTime(10, 20, 30),
  });
  assertEquals(parseScoreEditorScore("GM 102030"), {
    level: 999,
    grade: grades.GM,
    time: createTime(10, 20, 30),
  });
  assertEquals(parseScoreEditorScore("GM 10:20:30"), {
    level: 999,
    grade: grades.GM,
    time: createTime(10, 20, 30),
  });
  assertEquals(parseScoreEditorScore("GM 10:20.30"), {
    level: 999,
    grade: grades.GM,
    time: createTime(10, 20, 30),
  });
  assertEquals(parseScoreEditorScore("S9 95959"), {
    level: 999,
    grade: grades.S9,
    time: createTime(9, 59, 59),
  });
  assertEquals(parseScoreEditorScore("GM"), undefined);
  assertEquals(parseScoreEditorScore("S9"), undefined);
  assertEquals(parseScoreEditorScore("1 123456"), {
    level: 999,
    grade: grades["1"],
    time: createTime(12, 34, 56),
  });
});

Deno.test("formatScoreEditorScore() works", () => {
  assertEquals(
    formatScoreEditorScore({ level: 1, grade: undefined, time: undefined }),
    "1",
  );
  assertEquals(
    formatScoreEditorScore({ level: 12, grade: undefined, time: undefined }),
    "12",
  );
  assertEquals(
    formatScoreEditorScore({ level: 443, grade: undefined, time: undefined }),
    "443",
  );
  assertEquals(
    formatScoreEditorScore({
      level: 999,
      grade: grades.GM,
      time: createTime(10, 20, 30),
    }),
    "GM 10:20.30",
  );
  assertEquals(
    formatScoreEditorScore({
      level: 999,
      grade: grades.S9,
      time: createTime(9, 59, 59),
    }),
    "S9 9:59.59",
  );
});
