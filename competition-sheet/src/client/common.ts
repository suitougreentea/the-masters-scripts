export type StageInfo = { stageName: string, players: (PlayerData | null)[] };
export type PlayerData = { name: string, handicap: number, gradeOrLevel: string | null, time: string | null };

export function runServerScript(name: string, args: unknown[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((result) => resolve(result))
      .withFailureHandler((error) => reject(error))[name].apply(null, args);
  });
}
