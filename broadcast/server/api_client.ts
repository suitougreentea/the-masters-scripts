import { ApiFunctions } from "../common/common_types.ts";
import { AppsScriptApi } from "./apps_script_api.ts";

const scriptId =
  "AKfycbx7AmqeEJ7LWszHrJjgO63EgdzVJ5RKiQa6iCsWZyyvnzxFqU9CoZN7QNoD5o6YmwuT7A";

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
    return await this.#appsScriptApi.runCommand(
      scriptId,
      functionName,
      parameters,
    ) as ReturnType<ApiFunctions[TName]>;
  }
}
