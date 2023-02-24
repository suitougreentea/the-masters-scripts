// 型定義のみなのでデプロイ不要

type StageSetupResult = {
  roundIndex: number;
  groupIndex: number;
  name: string;
  numPlayers: number;
  numWinners: number;
  hasWildcard: boolean;
  numLosers: number;
};

type StageInfo = {
  setupResult: StageSetupResult;
  ready: boolean;
  players: (StagePlayerEntry | null)[];
};
type StagePlayerEntry = {
  name: string;
  handicap: number;
};

type StageTimerInfo = {
  stageResult: StageSetupResult;
  ready: boolean;
  players: (StageTimerPlayerData | null)[];
};
type StageTimerPlayerData = {
  name: string;
  rawBestTime: number;
  handicap: number;
  bestTime: number;
  startOrder: number;
  startTime: number;
};

type ApiFunctions = {
  setupCompetition: (manual: boolean, manualNumberOfGames: number) => void;
  getStageInfo: (stageIndex: number) => { stageInfo: StageInfo, isLast: boolean };
  reorderPlayers: (stageIndex: number, names: (string | null)[]) => void;
  leaveStage: (stageIndex: number) => void;
  getTimerInfo: (stageIndex: number) => { stageTimerInfo: StageTimerInfo, isLast: boolean }
};

/* #begin-export
export { StageSetupResult, StageInfo, StagePlayerEntry, StageTimerInfo, StageTimerPlayerData, ApiFunctions };
*/