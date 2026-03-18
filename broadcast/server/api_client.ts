import { ApiFunctions } from "../../common/common_types.ts";
import { BACKEND_API_PORT } from "../../common/ports.ts";

export class ApiClient {
  async runCommand<TName extends keyof ApiFunctions>(
    functionName: TName,
    args: Parameters<ApiFunctions[TName]>,
  ): Promise<ReturnType<ApiFunctions[TName]>> {
    const body = {
      functionName,
      args,
    };
    const response = await fetch(`http://localhost:${BACKEND_API_PORT}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    if (responseJson.error != null) {
      throw new Error(responseJson.error);
    }
    console.log(responseJson);
    return responseJson.body;
  }
}
