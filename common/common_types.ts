import { Grade } from "./grade.ts";

/**
 * * qualifierFinal: ポイント制予選+決勝 (ラウンド数は必ず2)
 * * tournament: トーナメント
 */
export type CompetitionType = "qualifierFinal" | "tournament";

/**
 * * none: 順位にかかわらず0 (内部で使っているだけ)
 * * winnersPure: 1位-10、2位-5
 * * winnersDest: 進出後のグループで1番埋まりの場合は-10、2番埋まりの場合は-5
 * * winnersDest2: 1着かつ、進出後のグループで1番埋まりの場合は-10、2番埋まりの場合は-5
 * * losers: 一律+5
 */
export type HandicapMethod =
  | "none"
  | "winnersPure"
  | "winnersDest"
  | "winnersDest2"
  | "losers";

/**
 * * standard: 順位で並べて、同順位内は結果をソートしてスネーク状に埋める
 *             ※ 複数のラウンドからプレイヤーが来る場合、先のラウンドの分が先に埋まる
 *
 * 「スネーク状」とは以下のような埋め方
 * ```
 * 試合1: 1 6 7 12
 * 試合2: 2 5 8 11
 * 試合3: 3 4 9 10
 * ```
 */
export type DestinationMethod = "standard";

export type DestinationInfo = {
  roundIndex: number;
  method: DestinationMethod;
  handicap: HandicapMethod;
};

export type CompetitionSetupOptions = {
  name: string;
  manualNumberOfGames?: number;
  overridePresetName?: string;
};

export type CompetitionMetadata = {
  name: string;
  numPlayers?: number; // マニュアルモードのときundefined
  presetName?: string; // マニュアルモードのときundefined
  type?: CompetitionType; // マニュアルモードのときundefined
  rounds: RoundMetadata[];
};

export type RoundMetadata = {
  name: string;
  stages: StageMetadata[];
  numWildcardWinners?: number;
  winnersDestination?: DestinationInfo;
  losersDestination?: DestinationInfo;
  supplementComparisons: SupplementComparisonMetadata[];
};

export type StageMetadata = {
  name: string;
  numPlayers: number;
  fixedPlayerIndices?: number[]; // 予選で使う
  numWinners: number;
  hasWildcard: boolean;
  numLosers: number;
};

// rankId: T[wl]\d: 上位から (>=0, wは勝ちプレイヤーのみ抽出, lは負けプレイヤーのみ抽出), B\d: 下位から (>0), W: ワイルドカード
export type SupplementComparisonMetadata = {
  rankId: string;
  name: string;
  numPlayers: number;
};

export type RegisteredPlayerEntry = {
  name: string;
  bestTime: number;
  comment: string;
};

export type Participant = {
  name: string;
  firstRoundGroupIndex?: number;
};

export type StageSetupResult = {
  entries: StageSetupPlayerEntry[];
};

export type StageSetupPlayerEntry = {
  name: string;
  handicap: number;
};

export type TimeDetail = {
  moveTime: number;
  burnTime: number;
  levelStopTime: number;
  minoCount: number;
  clearCount: [number, number, number, number];
  sections: {
    lap: number;
    split: number;
    moveTime: number;
    burnTime: number;
    levelStopTime: number;
    minoCount: number;
    clearCount: [number, number, number, number];
  }[];
};

export type StagePlayerEntry = {
  name: string;
  rawBestTime: number;
  handicap: number;
  bestTime: number;
  startOrder: number;
  startTime: number;
  level?: number;
  grade?: Grade;
  time?: number;
  timeDetail?: TimeDetail;
};

export type StageResultEntry = {
  rank: number;
  name: string;
  level: number;
  grade?: Grade;
  time?: number;
  timeDiffBest?: number;
  timeDiffTop?: number;
  timeDiffPrev?: number;
};

export type StageData = {
  players: (StagePlayerEntry | undefined)[];
  result: StageResultEntry[];
};

export type SupplementComparisonEntry = {
  rank: number;
  name: string;
  level: number;
  grade?: Grade;
  time?: number;
  timeDiffBest?: number;
  timeDiffPrev?: number;
};

export type SupplementComparisonData = {
  rankId: string;
  comparison: SupplementComparisonEntry[];
};

export type QualifierScoreEntry = {
  name: string;
  totalPoints: number;
  provisionalRankIndex: number;
  stageResults: { stageIndex: number; rankIndex: number; points: number }[];
};

export type QualifierScore = {
  players: QualifierScoreEntry[];
};

export type QualifierResultEntry = {
  rank: number;
  name: string;
  points: number;
  numPlaces: number[];
  bestGameLevel: number;
  bestGameGrade?: Grade;
  bestGameTimeDiffBest?: number;
};

export type QualifierResult = {
  result: QualifierResultEntry[];
};

export type StageScoreValue = {
  level?: number;
  grade?: Grade;
  time?: number;
  timeDetail?: TimeDetail;
};

export type StageScoreEntry = {
  name: string;
  level?: number;
  grade?: Grade;
  time?: number;
  timeDetail?: TimeDetail;
};

export type StageScoreData = {
  players: StageScoreEntry[];
};

export type ApiFunctions = {
  mastersGetRegisteredPlayers: () => RegisteredPlayerEntry[];
  mastersRegisterPlayer: (player: RegisteredPlayerEntry) => void;
  mastersUpdatePlayer: (oldName: string, player: RegisteredPlayerEntry) => void;
  mastersGetParticipants: () => Participant[];
  mastersSetParticipants: (participants: Participant[]) => void;
  mastersSetupCompetition: (options: CompetitionSetupOptions) => void;
  mastersExportCompetition: () => { url: string };
  mastersGetCurrentCompetitionMetadata: () => CompetitionMetadata | undefined;
  mastersResetStage: (
    roundIndex: number,
    stageIndex: number,
    setup: StageSetupResult,
  ) => void;
  mastersGetStageData: (
    roundIndex: number,
    stageIndices?: number[],
  ) => StageData[];
  mastersGetSupplementComparisonData: (
    roundIndex: number,
  ) => SupplementComparisonData[];
  mastersGetQualifierScore: () => QualifierScore;
  mastersGetQualifierResult: () => QualifierResult;
  mastersReorderStagePlayers: (
    roundIndex: number,
    stageIndex: number,
    names: (string | undefined)[],
  ) => void;
  mastersSetStageScore: (
    roundIndex: number,
    stageIndex: number,
    score: StageScoreData,
  ) => void;
  mastersTryInitializeRound: (roundIndex: number) => boolean;
  mastersTryFinalizeRound: (roundIndex: number) => boolean;
};
