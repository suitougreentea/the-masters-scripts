type InputFile = {
  players: ({
    bestTime: number;
    handicap: number;
  } | null)[];
};

if (import.meta.main) {
  const serverAddress = Deno.args[0];
  const fileName = Deno.args[1];

  if (!fileName || !serverAddress) {
    throw new Error(
      "Usage: deno run backend_setup.ts <server_address> <file_name>",
    );
  }

  const input: InputFile = JSON.parse(Deno.readTextFileSync(fileName));

  const runCommand = async (
    functionName: string,
    args: unknown[],
  ): Promise<unknown> => {
    const body = {
      functionName,
      args,
    };
    const response = await fetch(serverAddress, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    if (responseJson.error != null) {
      throw new Error(responseJson.error);
    }
    return responseJson.body;
  };

  const ignoreErrors = async (func: () => Promise<unknown>) => {
    try {
      await func();
    } catch {
      // do nothing
    }
  };

  const playerNames = input.players.map((_, i) => `statdump_p${i + 1}`);

  // register players
  for (let i = 0; i < input.players.length; i++) {
    const player = input.players[i];
    if (player == null) continue;

    await ignoreErrors(async () =>
      await runCommand("mastersRegisterPlayer", [{
        name: playerNames[i],
        bestTime: player!.bestTime,
        comment: "",
      }])
    );
    await ignoreErrors(async () =>
      await runCommand("mastersUpdatePlayer", [
        playerNames[i],
        {
          name: playerNames[i],
          bestTime: player!.bestTime,
          comment: "",
        },
      ])
    );
  }

  // add to participants
  const participants: { name: string; firstRoundGroupIndex: undefined }[] = [];
  input.players.forEach((player, i) => {
    if (player == null) return;
    participants.push({
      name: playerNames[i],
      firstRoundGroupIndex: undefined,
    });
  });

  await runCommand("mastersSetParticipants", [participants]);
  await runCommand("mastersSetupCompetition", [{
    name: "statdump",
    manualNumberOfGames: 1,
  }]);

  const stageSetupPlayerEntries: { name: string; handicap: number }[] = [];
  input.players.forEach((player, i) => {
    if (player == null) return;
    stageSetupPlayerEntries.push({
      name: playerNames[i],
      handicap: player.handicap,
    });
  });
  const stageSetupResult = {
    entries: stageSetupPlayerEntries,
  };
  await runCommand("mastersResetStage", [0, 0, stageSetupResult]);

  const reorderedNames: (string | undefined)[] = input.players.map((
    player,
    i,
  ) => player != null ? playerNames[i] : undefined);
  await runCommand("mastersReorderStagePlayers", [0, 0, reorderedNames]);

  console.log("Success");
}
