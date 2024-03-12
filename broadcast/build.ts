import * as esbuild from "https://deno.land/x/esbuild@v0.17.5/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts";

const mode = Deno.args[0];
if (mode != "build" && mode != "watch") throw new Error("Invalid command");
const watch = mode == "watch";

const options: esbuild.BuildOptions = {
  entryPoints: [
    "./client/dashboard.ts",
    "./client/competition_scene.ts",
    "./client/result_scene.ts",
    "./client/ocr_info.ts",
  ],
  platform: "browser",
  bundle: true,
  format: "esm",
  outbase: "./client",
  outdir: "./client",
  outExtension: { ".js": ".bundle.js" },
  metafile: true,
  plugins: [...denoPlugins()],
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
  Deno.exit();
}
