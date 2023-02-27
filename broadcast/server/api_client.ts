import { ApiFunctions } from "../common/common_types.ts";
import { AppsScriptApi } from "./apps_script_api.ts";

const scriptId =
  "AKfycbyaIO-yeTXnTW6_0EEav-Z_EYHDShVAnE0CZFkT1MFlUXFihXC-vsLTfWQxi9yuEkxmhA";

export class ApiClient {
  static getScopes(): string[] {
    return ["https://www.googleapis.com/auth/spreadsheets"];
  }

  #appsScriptApi: AppsScriptApi;

  constructor(appsScriptApi: AppsScriptApi) {
    this.#appsScriptApi = appsScriptApi;
  }

  async runCommand<TName extends keyof ApiFunctions>(
    functionName: TName,
    parameters: Parameters<ApiFunctions[TName]>,
  ): Promise<ReturnType<ApiFunctions[TName]>> {
    return await this.#appsScriptApi.runCommand(
      scriptId,
      functionName,
      parameters,
    ) as ReturnType<ApiFunctions[TName]>;
  }
}
