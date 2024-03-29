import { Grade } from "./grade.ts";
import { Time } from "./time.ts";

export type LeaderboardData = {
  // must be sorted by bestTime
  list: {
    rank: number;
    name: string;
    bestTime: Time;
  }[];
};

export type ParticipantsData = {
  list: {
    name: string;
    bestTime: Time;
    firstRoundGroupIndex: number;
  }[];
};

export type StagesData = {
  list: {
    name: string;
    entries: ({
      name: string;
      rawBestTime: number;
      handicap: number;
      bestTime: number;
      startOrder: number;
      startTime: number;
      level: number | null;
      grade: Grade | null;
      time: number | null;
    } | null)[];
    result: {
      rank: number;
      name: string;
      level: number;
      grade: Grade | null;
      time: number | null;
      timeDiffBest: number | null;
      timeDiffTop: number | null;
      timeDiffPrev: number | null;
    }[];
    borderlines: number[];
  }[];
};

export type SupplementsData = {
  supplementComparisons: {
    name: string;
    comparison: {
      rank: number;
      name: string;
      level: number;
      grade: Grade | null;
      time: number | null;
      timeDiffBest: number | null;
      timeDiffPrev: number | null;
    }[];
  }[];
  qualifierScore: {
    players: {
      name: string;
      totalPoints: number;
      stageResults: { stageIndex: number; rankIndex: number; points: number }[];
    }[];
  } | null;
  qualifierResult: {
    players: {
      rank: number;
      name: string;
      points: number;
      numPlaces: number[];
      bestGameLevel: number;
      bestGameGrade: Grade | null;
      bestGameTimeDiffBest: number | null;
    }[];
  } | null;
};

export type Input = {
  name: string;
  leaderboard: LeaderboardData;
  participants: ParticipantsData;
  stages: StagesData;
  supplements: SupplementsData;
};

export type Data = {
  credential: string;
  input: Input;
};
