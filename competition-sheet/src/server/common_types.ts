// 型定義のみなのでデプロイ不要

/**
 * * qualifierFinal: ポイント制予選+決勝 (ラウンド数は必ず2)
 * * tournament: トーナメント
 */
type CompetitionType = "qualifierFinal" | "tournament";

/**
 * * none: 順位にかかわらず0 (内部で使っているだけ)
 * * winnersPure: 1位-10、2位-5
 * * winnersDest: 進出後のグループで1番埋まりの場合は-10、2番埋まりの場合は-5
 * * winnersDest2: 1着かつ、進出後のグループで1番埋まりの場合は-10、2番埋まりの場合は-5
 * * losers: 一律+5
 */
type HandicapMethod = "none" | "winnersPure" | "winnersDest" | "winnersDest2" | "losers";

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
type DestinationMethod = "standard";

type DestinationInfo = {
  roundIndex: number;
  method: DestinationMethod;
  handicap: HandicapMethod;
};

type CompetitionMetadata = {
  name: string;
  numPlayers?: number; // マニュアルモードのときundefined
  presetName?: string; // マニュアルモードのときundefined
  type?: CompetitionType; // マニュアルモードのときundefined
  rounds: RoundMetadata[];
};

type RoundMetadata = {
  name: string;
  stages: StageMetadata[];
  numWildcardWinners?: number;
  winnersDestination?: DestinationInfo;
  losersDestination?: DestinationInfo;
  supplementComparisons: SupplementComparisonMetadata[];
};

type StageMetadata = {
  name: string;
  numPlayers: number;
  fixedPlayerIndices?: number[]; // 予選で使う
  numWinners: number;
  hasWildcard: boolean;
  numLosers: number;
};

// rankId: T[wl]\d: 上位から (>=0, wは勝ちプレイヤーのみ抽出, lは負けプレイヤーのみ抽出), B\d: 下位から (>0), W: ワイルドカード
type SupplementComparisonMetadata = {
  rankId: string;
  name: string;
  numPlayers: number;
};

type Participant = {
  name: string;
  firstRoundGroupIndex: number | null;
};

type StageSetupResult = {
  entries: StageSetupPlayerEntry[];
};

type StageSetupPlayerEntry = {
  name: string;
  handicap: number;
};

type StagePlayerEntry = {
  name: string;
  rawBestTime: number;
  handicap: number;
  bestTime: number;
  startOrder: number;
  startTime: number;
  level: number | null;
  grade: number | null;
  time: number | null;
};

type StageResultEntry = {
  rank: number;
  name: string;
  level: number;
  grade: number | null;
  time: number | null;
  timeDiffBest: number | null;
  timeDiffTop: number | null;
  timeDiffPrev: number | null;
};

type StageData = {
  players: (StagePlayerEntry | null)[];
  result: StageResultEntry[];
};

type SupplementComparisonEntry = {
  rank: number;
  name: string;
  level: number;
  grade: number | null;
  time: number | null;
  timeDiffBest: number | null;
  timeDiffPrev: number | null;
};

type SupplementComparisonData = {
  rankId: string;
  comparison: SupplementComparisonEntry[];
};

type QualifierScoreEntry = {
  name: string;
  totalPoints: number;
  stageResults: { stageIndex: number, rankIndex: number, points: number }[];
};

type QualifierScore = {
  players: QualifierScoreEntry[];
};

type QualifierResultEntry = {
  rank: number;
  name: string;
  points: number;
  numPlaces: number[];
  bestGameLevel: number;
  bestGameGrade: number | null;
  bestGameTimeDiffBest: number | null;
};

type QualifierResult = {
  result: QualifierResultEntry[];
};

type StageScoreEntry = {
  name: string;
  level: number | null;
  grade: number | null;
  time: number | null;
};

type StageScoreData = {
  players: StageScoreEntry[];
};

type ApiFunctions = {
  mastersShowAlert: (message: string) => void;
  mastersSetParticipants: (participants: Participant[]) => void;
  mastersSetupCompetition: (manual: boolean, manualNumberOfGames: number) => void;
  mastersExportCompetition: () => { url: string };
  mastersGetCurrentCompetitionMetadata: () => CompetitionMetadata | null;
  mastersResetStage: (roundIndex: number, stageIndex: number, setup: StageSetupResult) => void;
  mastersGetStageData: (roundIndex: number, stageIndices?: number[]) => StageData[];
  mastersGetSupplementComparisonData: (roundIndex: number) => SupplementComparisonData[];
  mastersGetQualifierScore: () => QualifierScore;
  mastersGetQualifierResult: () => QualifierResult;
  mastersReorderStagePlayers: (roundIndex: number, stageIndex: number, names: (string | null)[]) => void;
  mastersSetStageScore: (roundIndex: number, stageIndex: number, score: StageScoreData) => void;
  mastersTryInitializeRound: (roundIndex: number) => boolean;
  mastersTryFinalizeRound: (roundIndex: number) => boolean;
};

/* #begin-export
export {
  type CompetitionType,
  type HandicapMethod,
  type DestinationMethod,
  type DestinationInfo,
  type CompetitionMetadata,
  type RoundMetadata,
  type StageMetadata,
  type SupplementComparisonMetadata,
  type Participant,
  type StageSetupResult,
  type StageSetupPlayerEntry,
  type StagePlayerEntry,
  type StageResultEntry,
  type StageData,
  type SupplementComparisonEntry,
  type SupplementComparisonData,
  type QualifierScoreEntry,
  type QualifierScore,
  type QualifierResultEntry,
  type QualifierResult,
  type StageScoreEntry,
  type StageScoreData,
  type ApiFunctions
};
*/