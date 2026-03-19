import {
  CompetitionMetadata,
  Participant,
  QualifierResult,
  QualifierResultEntry,
  StageResultEntry,
  StageSetupResult,
  SupplementComparisonData,
  SupplementComparisonEntry,
} from "../common/common_types.ts";

export type CompetitionSetupResult = {
  metadata: CompetitionMetadata;
};

export type RoundSetupResult = {
  stages: StageSetupResult[];
};

export type RoundDependencyDefinition = {
  type: "firstRoundEntry";
} | {
  type: "qualifierRoundResult";
} | {
  type: "tournamentRoundResult";
  roundIndex: number;
};

export type RoundDependencyData = {
  type: "firstRoundEntry";
  data: Participant[];
} | {
  type: "qualifierRoundResult";
  result: QualifierResultEntry[];
} | {
  type: "tournamentRoundResult";
  roundIndex: number;
  stageResults: {
    result: StageResultEntry[];
  }[];
  supplementComparisons: {
    rankId: string;
    comparison: SupplementComparisonEntry[];
  }[];
};

export type RoundFinalizeResult = {
  type: "qualifierResult";
  result: QualifierResult;
} | {
  type: "supplementComparisons";
  comparisons: SupplementComparisonData[];
};

export type StageResultEntryStub = Omit<
  StageResultEntry,
  "rank" | "timeDiffTop" | "timeDiffPrev"
>;

export type QualifierResultEntryStub = Omit<QualifierResultEntry, "rank">;

export type SupplementComparisonEntryStub = Omit<
  SupplementComparisonEntry,
  "rank" | "timeDiffPrev"
>;

/**
 * 以前のラウンドの結果が揃っていないのでセットアップが続けられない
 */
export class NotReadyError extends Error {
  constructor() {
    super();
    this.name = "NotReadyError";
    Object.setPrototypeOf(this, NotReadyError.prototype);
  }
}
