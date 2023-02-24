import { StageInfo } from "./common_types.ts";

type EmptyObject = Record<keyof unknown, never>;

export type TypeDefinition = {
  replicants: {
    currentStageInfo: StageInfo | null;
  };

  messages: {
    loginResult: { params: { success: boolean } };
  };

  requests: {
    login: { result: { url: string } };
    cancelLogin: EmptyObject;
    getStageInfo: EmptyObject;
  };
};
