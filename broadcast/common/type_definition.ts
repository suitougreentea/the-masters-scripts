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
  StageSetupResult,
  SupplementComparisonData,
} from "./common_types.ts";

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
  nextStageName: string | null;
};

// TODO: Experimental
export type OcrResult = {
  status: {
    frameTime: number;
    playing: boolean;
    level: number;
    grade: number;
    gameTime: number;
    sections: {
      lap: number;
      split: number;
    }[];
  }[];
};

type EmptyObject = Record<keyof unknown, never>;

export type TypeDefinition = {
  replicants: {
    currentRegisteredPlayers: RegisteredPlayerEntry[] | null;
    currentParticipants: Participant[] | null;
    currentCompetitionMetadata: CompetitionMetadata | null;
    currentRoundData: RoundData | null;
    currentCompetitionSceneStageData: CompetitionSceneStageData | null;
    currentResultSceneData: ResultSceneData | null;
    resultSceneActive: boolean;
    // TODO: Experimental
    latestOcrResult: OcrResult | null;
  };

  messages: {
    loginResult: { params: { success: boolean } };
    startTimer: EmptyObject;
    stopTimer: EmptyObject;
  };

  requests: {
    login: { result: { url: string } };
    cancelLogin: EmptyObject;
    checkLogin: EmptyObject;
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
      params: { stageIndex: number; names: (string | null)[] };
    };
    setStageScore: { params: { stageIndex: number; score: StageScoreData } };
    finishCompetitionWithExport: { result: { exportedUrl: string } };
    finishCompetitionWithoutExport: EmptyObject;
    sendStageDataToCompetitionScene: { params: { stageIndex: number } };
    unsetCompetitionSceneStageData: EmptyObject;
    setResultSceneData: { params: { stageIndex: number } };
    unsetResultSceneData: EmptyObject;
    toggleResultScene: { params: { show: boolean } };
    // TODO: Experimental
    resetOcrState: EmptyObject;
  };
};
