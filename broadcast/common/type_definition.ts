import {
  CompetitionMetadata,
  Participant,
  QualifierResult,
  QualifierScore,
  RoundMetadata,
  StageData,
  StageMetadata,
  StageResultEntry,
  StageScoreData,
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

export type BroadcastStageData = {
  metadata: StageMetadata;
  stageData: StageData;
  resultData: StageResultEntry[] | null;
};

type EmptyObject = Record<keyof unknown, never>;

export type TypeDefinition = {
  replicants: {
    currentParticipants: Participant[] | null;
    currentCompetitionMetadata: CompetitionMetadata | null;
    currentRoundData: RoundData | null;
    currentStageIndex: number;
    currentBroadcastStageData: BroadcastStageData | null;
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
    setupCompetition: {
      params: { manual: boolean; manualNumberOfGames: number };
    };
    getCurrentCompetitionMetadata: EmptyObject;
    enterRound: { params: { roundIndex: number } };
    refreshCurrentRound: EmptyObject;
    finalizeCurrentRound: EmptyObject;
    setCurrentStage: { params: { stageIndex: number } };
    refreshCurrentStage: EmptyObject;
    reorderCurrentStagePlayers: { params: { names: (string | null)[] } };
    readyCurrentStage: EmptyObject;
    setCurrentStageScore: { params: { score: StageScoreData } };
    finishCompetition: { result: { exportedUrl: string } };
  };
};
