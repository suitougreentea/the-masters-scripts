import {
  CompetitionMetadata,
  CompetitionSetupOptions,
  Participant,
  QualifierResult,
  QualifierScore,
  RegisteredPlayerEntry,
  RoundMetadata,
  StageData,
  StageMetadata,
  StageScoreData,
  StageScoreValue,
  StageSetupResult,
  SupplementComparisonData,
} from "../../common/common_types.ts";
import { Grade } from "../../common/grade.ts";

export type RoundData = {
  roundIndex: number;
  metadata: RoundMetadata;
  stageData: StageData[];
  supplementComparisons: SupplementComparisonData[];
  qualifierScore?: QualifierScore;
  qualifierResult?: QualifierResult;
};

export type CompetitionSceneStageData = {
  roundIndex: number;
  stageIndex: number;
  metadata: StageMetadata;
  stageData: StageData;
};

export type ResultSceneData = {
  roundData: RoundData;
  currentStageIndex: number;
  nextStageName?: string;
};

export type OcrPlayerStatus = {
  frameTime: number;
  playing: boolean;
  level: number;
  grade: Grade;
  gameTime: number;
  moveTime: number;
  burnTime: number;
  levelStopTime: number;
  minoCount: number;
  clearCount: [number, number, number, number];
  health?: string; // 2024-03-21, statdump_2
  levelStop?: boolean; // 2024-04-15, statdump_3
  reliable?: boolean; // 2024-04-15, statdump_3
  idleTime?: number; // 2024-10-16, statdump_4
  sections: {
    lap: number;
    split: number;
    moveTime: number;
    burnTime: number;
    levelStopTime: number;
    minoCount: number;
    clearCount: [number, number, number, number];
    idleTime?: number; // 2024-10-16, statdump_4
  }[];
};

export type ScoreHistory = {
  players: {
    history: StageScoreValue[];
    current?: StageScoreValue;
  }[];
};

// TODO: ocr_info以外に直接渡さないようにする
export type OcrResult = {
  status: OcrPlayerStatus[];
};

// TODO: 配信に乗るプレイヤー毎の情報をここに全部乗せたい
export type PlayingPlayerData = {
  standingRankIndex?: number;
  standingFinal?: boolean;
};

type EmptyObject = Record<keyof unknown, never>;

export type TypeDefinition = {
  replicants: {
    currentRegisteredPlayers?: RegisteredPlayerEntry[];
    currentParticipants?: Participant[];
    currentCompetitionMetadata?: CompetitionMetadata;
    currentRoundData?: RoundData;
    currentCompetitionSceneStageData?: CompetitionSceneStageData;
    currentResultSceneData?: ResultSceneData;
    resultSceneActive: boolean;
    latestOcrResult?: OcrResult;
    ocrConnected: boolean;
    playingPlayerData?: PlayingPlayerData[];
    registrationUrl?: string;
  };

  messages: {
    startTimer: EmptyObject;
    resetTimer: EmptyObject;
  };

  requests: {
    enterSetup: EmptyObject;
    getCurrentRegisteredPlayers: EmptyObject;
    registerPlayer: { params: { data: RegisteredPlayerEntry } };
    updatePlayer: { params: { oldName: string; data: RegisteredPlayerEntry } };
    getCurrentParticipants: EmptyObject;
    setParticipants: { params: { participants: Participant[] } };
    setupCompetition: { params: { options: CompetitionSetupOptions } };
    getCurrentCompetitionMetadata: EmptyObject;
    enterRound: { params: { roundIndex: number } };
    refreshCurrentRound: EmptyObject;
    finalizeCurrentRound: EmptyObject;
    finalizeCurrentRoundIfCompleted: EmptyObject;
    leaveCurrentRound: EmptyObject;
    refreshStage: { params: { stageIndex: number } };
    resetStage: { params: { stageIndex: number; setup: StageSetupResult } };
    reorderStagePlayers: {
      params: { stageIndex: number; names: (string | undefined)[] };
    };
    setStageScore: { params: { stageIndex: number; score: StageScoreData } };
    finishCompetitionWithExport: { result: { exportedUrl: string } };
    finishCompetitionWithoutExport: EmptyObject;
    sendStageDataToCompetitionScene: { params: { stageIndex: number } };
    unsetCompetitionSceneStageData: EmptyObject;
    setResultSceneData: { params: { stageIndex: number } };
    unsetResultSceneData: EmptyObject;
    toggleResultScene: { params: { show: boolean } };
    getScoreHistory: { result: { history: ScoreHistory } };
    resetOcrState: EmptyObject;
  };
};
