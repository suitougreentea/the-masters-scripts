import { StageInfo, StageTimerInfo } from "./common_types.ts";

type EmptyObject = Record<keyof unknown, never>;

export type TypeDefinition = {
  replicants: {
    currentStageInfo: StageInfo | null;
    currentStageTimerInfo: StageTimerInfo | null;
  };

  messages: {
    loginResult: { params: { success: boolean } };
    startTimer: EmptyObject;
    stopTimer: EmptyObject;
  };

  requests: {
    login: { result: { url: string } };
    cancelLogin: EmptyObject;
    getStageInfo: EmptyObject;
  };
};
