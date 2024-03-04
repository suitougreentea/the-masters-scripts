import { createKey } from "./inject.ts";
import { Data, Input } from "../common/spreadsheet_exporter_types.ts";

export const injectKey = createKey<ExporterBackend>(Symbol("ExporterBackend"));

export interface ExporterBackend {
  exportCompetition(input: Input): Promise<string>;
}

export class SpreadsheetExporterBackend implements ExporterBackend {
  #entrypoint: string;
  #credential: string;

  constructor() {
    this.#entrypoint = Deno.readTextFileSync(import.meta.dirname + "/.exporter-entrypoint");
    this.#credential = Deno.readTextFileSync(import.meta.dirname + "/.exporter-credential");
  }

  async exportCompetition(input: Input): Promise<string> {
    const response = await fetch(this.#entrypoint, {
      method: "POST",
      body: JSON.stringify({ credential: this.#credential, input } satisfies Data),
    });
    const responseBody = await response.json()
    if (responseBody.error != null) {
      throw new Error(responseBody.error);
    }
    if (responseBody.exportedUrl != null) {
      return responseBody.exportedUrl;
    } else {
      throw new Error("No exportedUrl field found");
    }
  }
}
