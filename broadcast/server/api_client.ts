import { ApiFunctions } from "../common/common_types.ts";
import { AppsScriptApi } from "./apps_script_api.ts";

const scriptId =
  "AKfycbzdyQoxA6NCCbqP313VvR12yZmfSV7D09qfmRIeOmRKMWpCTlmENGcfasSY9Mhsiy67";

export class ApiClient {
  static getScopes(): string[] {
    return [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ];
  }

  #appsScriptApi: AppsScriptApi;

  constructor(appsScriptApi: AppsScriptApi) {
    this.#appsScriptApi = appsScriptApi;
  }

  async runCommand<TName extends keyof ApiFunctions>(
    functionName: TName,
    parameters: Parameters<ApiFunctions[TName]>,
  ): Promise<ReturnType<ApiFunctions[TName]>> {
    const response = await this.#appsScriptApi.runCommand(
      scriptId,
      "mastersCallApiAsJson",
      [functionName, JSON.stringify(parameters)],
    );
    if (response === undefined) {
      return undefined as ReturnType<ApiFunctions[TName]>;
    }
    return JSON.parse(response as string) as ReturnType<ApiFunctions[TName]>;
  }
}
