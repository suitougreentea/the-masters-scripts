import {
  CompetitionMetadata,
  CompetitionSetupOptions,
  Participant,
  QualifierResult,
  QualifierScore,
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

export type BroadcastStageData = {
  roundIndex: number;
  stageIndex: number;
  metadata: StageMetadata;
  stageData: StageData;
  shouldShowResult: boolean;
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
    setupCompetition: { params: { options: CompetitionSetupOptions } };
    getCurrentCompetitionMetadata: EmptyObject;
    enterRound: { params: { roundIndex: number } };
    refreshCurrentRound: EmptyObject;
    finalizeCurrentRound: EmptyObject;
    finalizeCurrentRoundIfCompleted: EmptyObject;
    leaveCurrentRound: EmptyObject;
    setCurrentStage: { params: { stageIndex: number } };
    refreshCurrentStage: EmptyObject;
    resetCurrentStage: { params: { setup: StageSetupResult } };
    reorderCurrentStagePlayers: { params: { names: (string | null)[] } };
    setCurrentStageScore: { params: { score: StageScoreData } };
    finishCompetition: { result: { exportedUrl: string } };
    sendCurrentStageDataToBroadcast: { params: { shouldShowResult: boolean } };
    unsetBroadcastStageData: EmptyObject;
  };
};
