import { denoPlugins } from "@luca/esbuild-deno-loader";
import { build } from "esbuild";

const result = await build({
  bundle: true,
  write: false,
  charset: "utf8",
  entryPoints: ["page.ts"],
  outfile: "page.js",
  target: "es2017",
  plugins: [
    ...denoPlugins(),
  ],
});

const script = result.outputFiles[0].text;
const html = await Deno.readTextFile("page.html");
const css = await Deno.readTextFile("page.css");

const outHtml = html.replace(`import "./page.ts";`, script).replace(
  `@import url("./page.css");`,
  css,
);
await Deno.writeTextFile("dist/page.html", outHtml);
