import { getByFilename } from "../exporter_backend_dev.ts";
import { configureInject, modifyInjectInMemory } from "../inject_config.ts";
import { automateWholeCompetition } from "../automation.ts";
import { setSerializerValue } from "../serializer_dev.ts";

if (import.meta.main) {
  if (Deno.args.length == 0) {
    throw new Error("Specify number of players");
  }
  const numPlayers = Number(Deno.args[0]);

  setSerializerValue("players", JSON.parse(Deno.readTextFileSync(import.meta.dirname + "/../data_test/players.json")));

  configureInject();
  modifyInjectInMemory();

  const { exportUrl } = await automateWholeCompetition(numPlayers, false, undefined, true);
  const data = getByFilename(exportUrl!);
  const filename = `generated_${numPlayers}.json`;
  Deno.writeTextFileSync(filename, JSON.stringify(data, undefined, 2));
  console.log(`Written: ${filename}`);
}
