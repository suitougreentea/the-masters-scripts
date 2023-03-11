import * as esbuild from "https://deno.land/x/esbuild@v0.17.5/mod.js";
import { httpImports } from "./esbuild-plugin/esbuild-plugin-http-imports.ts";

const mode = Deno.args[0];
if (mode != "build" && mode != "watch") throw new Error("Invalid command");
const watch = mode == "watch";

const options: esbuild.BuildOptions = {
  entryPoints: ["./client/dashboard.ts", "./client/competition_scene.ts"],
  platform: "browser",
  bundle: true,
  format: "esm",
  outbase: "./client",
  outdir: "./client",
  outExtension: { ".js": ".bundle.js" },
  metafile: true,
  plugins: [
    httpImports(),
    {
      name: "append-comments",
      setup: (build) => {
        build.onEnd((result) => {
          Object.keys(result.metafile?.outputs ?? {}).forEach((path) => {
            const input = Deno.readTextFileSync(path);
            const output =
              "// deno-lint-ignore-file\n// deno-fmt-ignore-file\n" + input;
            Deno.writeTextFileSync(path, output);
          });
        });
      },
    },
  ],
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
  Deno.exit();
}
