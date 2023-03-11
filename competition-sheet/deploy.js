const fs = require("fs");
const child_process = require("child_process");

if (!fs.existsSync("./package.json")) throw new Error("must be at root");

fs.rmSync("./dist", { recursive: true, force: true });
fs.mkdirSync("./dist");

const serverSources = [
  "appsscript.json",
  "api.ts",
  "competition.ts",
  "competition_sheet.ts",
  "definition.ts",
  "entry.ts",
  "exporter.ts",
  "function.ts",
  "grade.ts",
  "preset.ts",
  "test.ts",
  "time.ts",
  "util.ts",
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
