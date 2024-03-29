import { Input } from "../common/spreadsheet_exporter_types.ts";
import { ExporterBackend } from "./exporter_backend.ts";

const inMemoryData: Record<string, unknown> = {};

export const getByFilename = (filename: string) => {
  return inMemoryData[filename];
};

const setByFilename = (filename: string, content: unknown) => {
  inMemoryData[filename] = content;
};

export class InMemoryExporterBackend implements ExporterBackend {
  exportCompetition(input: Input): Promise<string> {
    const filename = Date.now() + ".json";
    setByFilename(filename, input);
    return Promise.resolve(filename);
  }
}
