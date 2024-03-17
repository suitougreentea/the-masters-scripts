import { ApiFunctions } from "../../common/common_types.ts";
import { LocalApi } from "./local_api.ts";

export class ApiClient {
  #localApi: LocalApi;

  constructor(localApi: LocalApi) {
    this.#localApi = localApi;
  }

  async runCommand<TName extends keyof ApiFunctions>(
    functionName: TName,
    parameters: Parameters<ApiFunctions[TName]>,
  ): Promise<ReturnType<ApiFunctions[TName]>> {
    const response = await this.#localApi.runCommand(
      "",
      "mastersCallApiAsJson",
      [functionName, JSON.stringify(parameters)],
    );
    if (response === undefined) {
      return undefined as ReturnType<ApiFunctions[TName]>;
    }
    return JSON.parse(response as string) as ReturnType<ApiFunctions[TName]>;
  }
}
