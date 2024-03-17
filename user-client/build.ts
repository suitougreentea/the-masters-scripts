import * as esbuild from "esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";

const mode = Deno.args[0];
if (mode != "build" && mode != "watch") throw new Error("Invalid command");
const watch = mode == "watch";

const options: esbuild.BuildOptions = {
  entryPoints: [
    "./register.ts",
  ],
  platform: "browser",
  bundle: true,
  format: "esm",
  outbase: "./",
  outdir: "./",
  outExtension: { ".js": ".bundle.js" },
  plugins: [...denoPlugins({ configPath: `${import.meta.dirname}/deno.json` })],
  tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } },
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
  Deno.exit();
}
