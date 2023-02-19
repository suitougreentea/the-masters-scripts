export type StageSetupResult = { roundIndex: number, groupIndex: number, name: string, numPlayers: number, numWinners: number, hasWildcard: boolean, numLosers: number };

export type StagePlayerEntry = { name: string, handicap: number };
export type StageInfo = { setupResult: StageSetupResult, ready: boolean, players: (StagePlayerEntry | null)[] };
export type StageTimerInfo = { stageResult: StageSetupResult, ready: boolean, players: (StageTimerPlayerData | null)[] };
export type StageTimerPlayerData = { name: string, rawBestTime: number, handicap: number, bestTime: number, startOrder: number, startTime: number };

export function runServerScript(name: string, args: unknown[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((result) => resolve(result))
      .withFailureHandler((error) => reject(error))[name].apply(null, args);
  });
}

const loader = document.querySelector<HTMLDivElement>("#loader")!;

export async function withLoader(action: () => Promise<void>) {
  try {
    loader.style.display = "block";
    await action();
  } finally {
    loader.style.display = "none";
  }
}
