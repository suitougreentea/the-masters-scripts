import { createKey, injectCtor } from "./inject.ts";
import {
  ExporterBackend,
  injectKey as exporterBackendKey,
} from "./exporter_backend.ts";
import { injectKey as playersStoreKey, PlayersStore } from "./players_store.ts";
import { injectKey as setupStoreKey, SetupStore } from "./setup_store.ts";
import {
  CompetitionStore,
  injectKey as competitionStoreKey,
} from "./competition_store.ts";
import {
  Input,
  LeaderboardData,
  ParticipantsData,
  StagesData,
  SupplementsData,
  TimeDetailData,
} from "../common/spreadsheet_exporter_types.ts";

export const injectKey = createKey<Exporter>(Symbol("Exporter"));

@injectCtor([
  exporterBackendKey,
  playersStoreKey,
  setupStoreKey,
  competitionStoreKey,
])
export class Exporter {
  #backend: ExporterBackend;
  #playersStore: PlayersStore;
  #setupStore: SetupStore;
  #competitionStore: CompetitionStore;

  constructor(
    backend: ExporterBackend,
    playersStore: PlayersStore,
    setupStore: SetupStore,
    competitionStore: CompetitionStore,
  ) {
    this.#backend = backend;
    this.#playersStore = playersStore;
    this.#setupStore = setupStore;
    this.#competitionStore = competitionStore;
  }

  async exportCompetition(): Promise<{ url: string }> {
    const allPlayers = this.#playersStore.getRegisteredPlayers();
    const allPlayersSorted = allPlayers.toSorted((a, b) =>
      a.bestTime - b.bestTime
    );
    const leaderboard: LeaderboardData = {
      list: allPlayersSorted.map((e, i) => ({
        rank: i + 1, // TODO: tie?
        name: e.name,
        bestTime: e.bestTime,
      })),
    };

    // TODO: read from competitionStore instead?
    const inputParticipants = this.#setupStore.getParticipants();
    const participants: ParticipantsData = {
      list: inputParticipants.map((e) => {
        const bestTime = allPlayers.find((p) => p.name == e.name)!.bestTime;
        return {
          name: e.name,
          bestTime: bestTime,
          firstRoundGroupIndex: e.firstRoundGroupIndex!,
        };
      }),
    };

    const metadata = this.#competitionStore.getMetadata();
    if (metadata == null) throw new Error("Competition not started");

    const stageIndices = metadata.rounds.flatMap((round, roundIndex) =>
      round.stages.map((_, stageIndex) => ({ roundIndex, stageIndex }))
    );
    const stages: StagesData = {
      list: stageIndices.map((e) => {
        const stageMetadata =
          metadata.rounds[e.roundIndex].stages[e.stageIndex];
        const name = stageMetadata.name;

        const stageData = this.#competitionStore.getStageData(
          e.roundIndex,
          e.stageIndex,
        );
        const entries = stageData.players.map((p) => {
          if (p == null) return undefined;
          const timeDetail: TimeDetailData | undefined = p.timeDetail != null
            ? {
              moveTime: p.timeDetail.moveTime,
              burnTime: p.timeDetail.burnTime,
              levelStopTime: p.timeDetail.levelStopTime,
              minoCount: p.timeDetail.minoCount,
              clearCount: [...p.timeDetail.clearCount],
              sections: p.timeDetail.sections.map((s) => ({
                lap: s.lap,
                split: s.split,
                moveTime: s.moveTime,
                burnTime: s.burnTime,
                levelStopTime: s.levelStopTime,
                minoCount: s.minoCount,
                clearCount: [...s.clearCount],
              })),
            }
            : undefined;
          return {
            name: p.name,
            rawBestTime: p.rawBestTime,
            handicap: p.handicap,
            bestTime: p.bestTime,
            startOrder: p.startOrder,
            startTime: p.startTime,
            level: p.level,
            grade: p.grade,
            time: p.time,
            timeDetail,
          };
        });

        const result = stageData.result.map((p) => {
          return {
            rank: p.rank,
            name: p.name,
            level: p.level,
            grade: p.grade,
            time: p.time,
            timeDiffBest: p.timeDiffBest,
            timeDiffTop: p.timeDiffTop,
            timeDiffPrev: p.timeDiffPrev,
          };
        });

        const borderlines: number[] = [];
        if (stageMetadata.numWinners > 0) {
          borderlines.push(stageMetadata.numWinners);
        }
        if (stageMetadata.hasWildcard) {
          borderlines.push(stageMetadata.numWinners + 1);
        }

        return {
          name,
          entries,
          result,
          borderlines,
        } satisfies StagesData["list"][number];
      }),
    };

    let supplements: SupplementsData;
    if (metadata.type == "qualifierFinal") {
      const inputQualifierScore = this.#competitionStore.getQualifierScore();
      const inputQualifierResult = this.#competitionStore.getQualifierResult();

      const qualifierScore = {
        players: inputQualifierScore.players.map((p) => {
          const stageResults = p.stageResults.map((r) => ({
            stageIndex: r.stageIndex,
            rankIndex: r.rankIndex,
            points: r.points,
          }));
          return {
            name: p.name,
            totalPoints: p.totalPoints,
            stageResults,
          };
        }),
      };
      const qualifierResult = {
        players: inputQualifierResult.result.map((p) => ({
          rank: p.rank,
          name: p.name,
          points: p.points,
          numPlaces: [...p.numPlaces],
          bestGameLevel: p.bestGameLevel,
          bestGameGrade: p.bestGameGrade,
          bestGameTimeDiffBest: p.bestGameTimeDiffBest,
        })),
      };

      supplements = {
        qualifierScore,
        qualifierResult,
        supplementComparisons: [],
      };
    } else {
      const supplementComparisonIndices = metadata.rounds.flatMap((
        round,
        roundIndex,
      ) =>
        round.supplementComparisons.map((comparison) => ({
          roundIndex,
          rankId: comparison.rankId,
        }))
      );
      const supplementComparisons = supplementComparisonIndices.map((f) => {
        const comparisonMetadata = metadata.rounds[f.roundIndex]
          .supplementComparisons.find((c) => c.rankId == f.rankId)!;

        const inputComparison =
          this.#competitionStore.getSupplementComparison(f.roundIndex, f.rankId)
            .comparison;
        const comparison = inputComparison.map((c) => {
          return {
            rank: c.rank,
            name: c.name,
            level: c.level,
            grade: c.grade,
            time: c.time,
            timeDiffBest: c.timeDiffBest,
            timeDiffPrev: c.timeDiffPrev,
          };
        }) satisfies SupplementsData["supplementComparisons"][number][
          "comparison"
        ];
        return {
          name: comparisonMetadata.name,
          comparison,
        };
      });

      supplements = {
        qualifierScore: undefined,
        qualifierResult: undefined,
        supplementComparisons,
      };
    }

    const input: Input = {
      name: `${metadata.name} Result`,
      participants,
      stages,
      supplements,
      leaderboard,
    };

    const url = await this.#backend.exportCompetition(input);
    return {
      url,
    };
  }
}
