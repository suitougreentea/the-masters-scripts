export type StageInfo = { stageName: string, players: (PlayerData | null)[], manual: boolean, wildcard: boolean };
export type PlayerData = { name: string, handicap: number, gradeOrLevel: string | null, time: string | null };
export type TimerInfo = { stageName: string, players: (TimerPlayerData | null)[], wildcard: boolean };
export type TimerPlayerData = { name: string, rawBestTime: number, handicap: number, bestTime: number, startOrder: number, startTime: number };

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
