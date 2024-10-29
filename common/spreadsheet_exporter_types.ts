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

export type TimeDetailData = {
  moveTime: number;
  burnTime: number;
  levelStopTime: number;
  minoCount: number;
  clearCount: [number, number, number, number];
  idleTime?: number;
  sections: {
    lap: number;
    split: number;
    moveTime: number;
    burnTime: number;
    levelStopTime: number;
    minoCount: number;
    clearCount: [number, number, number, number];
    idleTime?: number;
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
      level?: number;
      grade?: Grade;
      time?: number;
      timeDetail?: TimeDetailData;
    } | undefined)[];
    result: {
      rank: number;
      name: string;
      level: number;
      grade?: Grade;
      time?: number;
      timeDiffBest?: number;
      timeDiffTop?: number;
      timeDiffPrev?: number;
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
      grade?: Grade;
      time?: number;
      timeDiffBest?: number;
      timeDiffPrev?: number;
    }[];
  }[];
  qualifierScore?: {
    players: {
      name: string;
      totalPoints: number;
      stageResults: { stageIndex: number; rankIndex: number; points: number }[];
    }[];
  };
  qualifierResult?: {
    players: {
      rank: number;
      name: string;
      points: number;
      numPlaces: number[];
      bestGameLevel: number;
      bestGameGrade?: Grade;
      bestGameTimeDiffBest?: number;
    }[];
  };
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
