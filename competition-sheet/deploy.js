const fs = require("fs");
const child_process = require("child_process");

if (!fs.existsSync("./package.json")) throw new Error("must be at root");

fs.rmSync("./dist", { recursive: true, force: true });
fs.mkdirSync("./dist");

const serverSources = [
  "appsscript.json",
  "competition.ts",
  "definitions.ts",
  "entry.ts",
  "functions.ts",
  "players.ts",
  "presets.ts",
  "test.ts",
];

serverSources.forEach(filename => {
  console.log("Copying " + filename);
  fs.copyFileSync("./src/server/" + filename, "./dist/" + filename);
});

const clientSources = [
  "sidebar.html",
  "timer.html",
];

child_process.execSync(`npx parcel build --no-optimize --dist-dir ./dist/ ${clientSources.map(e => "./src/client/" + e).join(" ")}`, { stdio: "inherit" });

child_process.execSync("clasp push", { stdio: "inherit" });
