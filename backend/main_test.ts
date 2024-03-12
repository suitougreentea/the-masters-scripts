import { configureInject, modifyInjectInMemory } from "./inject_config.ts";
import { automateWholeCompetition } from "./automation.ts";
import { getAllPresetNames, getPreset } from "./preset.ts";

Deno.test("Whole competition completes", async (t) => {
  configureInject();
  modifyInjectInMemory();

  await t.step({
    name: `Manual, 25 players`,
    async fn() {
      await automateWholeCompetition(25, true, undefined, true);
    },
  });
  for (const presetName of getAllPresetNames()) {
    const preset = getPreset(presetName);
    const minPlayers = preset.supportedNumberOfPlayers[0];
    const maxPlayers = preset.supportedNumberOfPlayers[1];
    for (let numPlayers = minPlayers; numPlayers <= maxPlayers; numPlayers++) {
      await t.step({
        name: `Preset ${presetName}, ${numPlayers} players`,
        async fn() {
          await automateWholeCompetition(numPlayers, false, presetName, true);
        }
      });
    }
  }
});
