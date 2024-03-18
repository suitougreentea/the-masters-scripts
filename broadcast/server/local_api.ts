// TODO: this no longer needs to be Apps Script compatible
export class LocalApi {
  constructor(_port: number, _scope: string[]) {}

  async initialize() {}

  async runCommand(
    _scriptId: string,
    functionName: string,
    args: string[],
  ): Promise<unknown> {
    if (functionName != "mastersCallApiAsJson") return {};
    const apiFunctionName = args[0];
    const apiArgs = JSON.parse(args[1]);
    const body = {
      functionName: apiFunctionName,
      args: apiArgs,
    };
    const response = await fetch("http://localhost:8518", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    if (responseJson.error != null) {
      throw new Error(responseJson.error);
    }
    return JSON.stringify(responseJson.body);
  }
}
