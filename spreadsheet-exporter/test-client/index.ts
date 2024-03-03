import { Data } from "../../common/spreadsheet_exporter_types.ts"

const entrypoint = Deno.readTextFileSync(import.meta.dirname + "/.entrypoint");

if (import.meta.main) {
  if (Deno.args.length == 0) {
    throw new Error("Must specify input file index (1-)");
  }
  const inputFilename = `input${Deno.args[0]}.json`;

  const data: Data = {
    credential: Deno.readTextFileSync(import.meta.dirname + "/.credential"),
    input: JSON.parse(Deno.readTextFileSync(import.meta.dirname + "/" + inputFilename)),
  };

  const response = await fetch(entrypoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
  const body = await response.text();
  console.log(body);
}
