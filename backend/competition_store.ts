import {
  CompetitionMetadata,
  QualifierResult,
  QualifierScore,
  StageData,
  SupplementComparisonData,
} from "../common/common_types.ts";
import { createKey, injectCtor } from "./inject.ts";
import {
  injectKey as serializerManagerKey,
  Serializer,
  SerializerManager,
} from "./serializer.ts";

export const injectKey = createKey<CompetitionStore>(
  Symbol("CompetitionStore"),
);

type RoundData = {
  stages: StageData[];
  supplementComparison: SupplementComparisonData[];
  qualifierResult: QualifierResult | null;
  qualifierScore: QualifierScore | null;
};

type Type = {
  metadata: CompetitionMetadata | null;
  rounds: RoundData[];
};

@injectCtor([serializerManagerKey])
export class CompetitionStore {
  #serializer: Serializer<Type>;
  #metadata: CompetitionMetadata | null = null;
  #rounds: RoundData[] = [];

  constructor(serializerManager: SerializerManager) {
    this.#serializer = serializerManager.getSerializer(
      "./data/competition.json",
    );
    this.#deserialize();
  }

  #deserialize() {
    const deserialized = this.#serializer.deserialize();
    this.#metadata = deserialized?.metadata ?? null;
    this.#rounds = deserialized?.rounds ?? [];
  }

  #serialize() {
    this.#serializer.serialize({
      metadata: this.#metadata,
      rounds: this.#rounds,
    });
  }

  reset() {
    this.#metadata = null;
    this.#rounds = [];
    this.#serialize();
  }

  getMetadata() {
    return this.#metadata;
  }

  setMetadata(metadata: CompetitionMetadata | null) {
    this.#metadata = metadata;
    this.#serialize();
  }

  setRounds(rounds: RoundData[]) {
    this.#rounds = rounds;
    this.#serialize();
  }

  getStageData(roundIndex: number, stageIndex: number) {
    return this.#rounds[roundIndex].stages[stageIndex];
  }

  setStageData(roundIndex: number, stageIndex: number, data: StageData) {
    this.#rounds[roundIndex].stages[stageIndex] = data;
    this.#serialize();
  }

  getQualifierScore() {
    const qualifierScore = this.#rounds[0]?.qualifierScore;
    if (qualifierScore == null) throw new Error("qualifierScore is null");
    return qualifierScore;
  }

  setQualifierScore(score: QualifierScore) {
    this.#rounds[0].qualifierScore = score;
    this.#serialize();
  }

  getQualifierResult() {
    const qualifierResult = this.#rounds[0]?.qualifierResult;
    if (qualifierResult == null) throw new Error("qualifierResult is null");
    return qualifierResult;
  }

  setQualifierResult(result: QualifierResult) {
    this.#rounds[0].qualifierResult = result;
    this.#serialize();
  }

  getSupplementComparison(roundIndex: number, rankId: string) {
    const comparison = this.#rounds[roundIndex].supplementComparison.find((e) =>
      e.rankId == rankId
    );
    if (comparison == null) throw new Error("comparison is null");
    return comparison;
  }

  setSupplementComparisons(
    roundIndex: number,
    supplementComparison: SupplementComparisonData[],
  ) {
    this.#rounds[roundIndex].supplementComparison = supplementComparison;
    this.#serialize();
  }
}
