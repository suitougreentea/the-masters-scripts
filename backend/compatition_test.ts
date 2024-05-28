import { assertEquals, assertGreater, assertLess } from "@std/assert";
import { compareQualifierScore, compareStageScore } from "./competition.ts";
import { grades } from "../common/grade.ts";

const testComparer = <T>(
  comparer: (a: T, b: T) => number,
  a: T,
  b: T,
  expectedResult: number,
) => {
  if (expectedResult == 0) {
    assertEquals(comparer(a, b), 0);
  } else if (expectedResult > 0) {
    assertGreater(comparer(a, b), 0);
    assertLess(comparer(b, a), 0);
  } else {
    assertLess(comparer(a, b), 0);
    assertGreater(comparer(b, a), 0);
  }
};

Deno.test("compareStageScore() for well-formed scores", () => {
  const dummy = {
    name: "",
    time: 0,
  };

  // same grade, same time
  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: 50,
    },
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: 50,
    },
    0,
  );

  // same grade (<GM), same time
  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: grades.S9,
      level: 999,
      timeDiffBest: -50,
    },
    {
      ...dummy,
      grade: grades.S9,
      level: 999,
      timeDiffBest: -50,
    },
    0,
  );

  // same level
  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: undefined,
      level: 800,
      timeDiffBest: undefined,
    },
    {
      ...dummy,
      grade: undefined,
      level: 800,
      timeDiffBest: undefined,
    },
    0,
  );

  // GM, time comparison
  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: -50,
    },
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: 50,
    },
    1,
  );

  // GM vs <GM
  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: 0,
    },
    {
      ...dummy,
      grade: grades.S9,
      level: 999,
      timeDiffBest: -50,
    },
    1,
  );

  // <GM vs <<GM
  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: grades.S9,
      level: 999,
      timeDiffBest: 0,
    },
    {
      ...dummy,
      grade: grades.S8,
      level: 999,
      timeDiffBest: 0,
    },
    1,
  );

  // GM vs level
  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: 0,
    },
    {
      ...dummy,
      grade: undefined,
      level: 998,
      timeDiffBest: undefined,
    },
    1,
  );

  // <GM vs level
  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: grades.S9,
      level: 999,
      timeDiffBest: 0,
    },
    {
      ...dummy,
      grade: undefined,
      level: 998,
      timeDiffBest: undefined,
    },
    1,
  );

  // level vs level
  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: undefined,
      level: 998,
      timeDiffBest: undefined,
    },
    {
      ...dummy,
      grade: undefined,
      level: 997,
      timeDiffBest: undefined,
    },
    1,
  );
});

Deno.test("compareStageScore() for ill-formed scores", () => {
  const dummy = {
    name: "",
    time: 0,
  };

  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: 0,
    },
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: undefined,
    },
    1,
  );

  testComparer(
    compareStageScore,
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: undefined,
    },
    {
      ...dummy,
      grade: grades.GM,
      level: 999,
      timeDiffBest: undefined,
    },
    0,
  );
});

Deno.test("compareQualifierScore()", () => {
  const dummy = {
    name: "",
  };

  // same
  testComparer(
    compareQualifierScore,
    {
      ...dummy,
      points: 10,
      numPlaces: [2, 0, 1, 0],
      bestGameGrade: grades.GM,
      bestGameLevel: 999,
      bestGameTimeDiffBest: 0,
    },
    {
      ...dummy,
      points: 10,
      numPlaces: [2, 0, 1, 0],
      bestGameGrade: grades.GM,
      bestGameLevel: 999,
      bestGameTimeDiffBest: 0,
    },
    0,
  );

  // by points
  testComparer(
    compareQualifierScore,
    {
      ...dummy,
      points: 12,
      numPlaces: [0, 4, 0, 0],
      bestGameGrade: grades.GM,
      bestGameLevel: 999,
      bestGameTimeDiffBest: 0,
    },
    {
      ...dummy,
      points: 10,
      numPlaces: [1, 1, 1, 1],
      bestGameGrade: grades.GM,
      bestGameLevel: 999,
      bestGameTimeDiffBest: 0,
    },
    1,
  );

  // by numPlaces
  testComparer(
    compareQualifierScore,
    {
      ...dummy,
      points: 10,
      numPlaces: [2, 0, 1, 0],
      bestGameGrade: grades.GM,
      bestGameLevel: 999,
      bestGameTimeDiffBest: 0,
    },
    {
      ...dummy,
      points: 10,
      numPlaces: [1, 1, 1, 1],
      bestGameGrade: grades.GM,
      bestGameLevel: 999,
      bestGameTimeDiffBest: 0,
    },
    1,
  );

  // by best game (time)
  testComparer(
    compareQualifierScore,
    {
      ...dummy,
      points: 10,
      numPlaces: [2, 0, 1, 0],
      bestGameGrade: grades.GM,
      bestGameLevel: 999,
      bestGameTimeDiffBest: -50,
    },
    {
      ...dummy,
      points: 10,
      numPlaces: [2, 0, 1, 0],
      bestGameGrade: grades.GM,
      bestGameLevel: 999,
      bestGameTimeDiffBest: 0,
    },
    1,
  );

  // by best game (grade)
  testComparer(
    compareQualifierScore,
    {
      ...dummy,
      points: 10,
      numPlaces: [2, 0, 1, 0],
      bestGameGrade: grades.GM,
      bestGameLevel: 999,
      bestGameTimeDiffBest: -50,
    },
    {
      ...dummy,
      points: 10,
      numPlaces: [2, 0, 1, 0],
      bestGameGrade: grades.S9,
      bestGameLevel: 999,
      bestGameTimeDiffBest: -100,
    },
    1,
  );

  // by best game (level)
  testComparer(
    compareQualifierScore,
    {
      ...dummy,
      points: 10,
      numPlaces: [2, 0, 1, 0],
      bestGameGrade: grades.S9,
      bestGameLevel: 999,
      bestGameTimeDiffBest: -50,
    },
    {
      ...dummy,
      points: 10,
      numPlaces: [2, 0, 1, 0],
      bestGameGrade: undefined,
      bestGameLevel: 998,
      bestGameTimeDiffBest: undefined,
    },
    1,
  );
});
