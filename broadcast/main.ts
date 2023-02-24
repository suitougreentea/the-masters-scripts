import { TypeDefinition } from "./common/type_definition.ts";
import { ApiClient } from "./server/api-client.ts";
import { AppsScriptApi } from "./server/apps-script-api.ts";
import { denocg } from "./server/deps.ts";

export const config: denocg.ServerConfig<TypeDefinition> = {
  socketPort: 8515,
  assetsPort: 8514,
  assetsRoot: "./client",
  replicants: {
    currentStageInfo: { persistent: false },
  },
};

const server = await denocg.launchServer(config);

const appsScriptApi = new AppsScriptApi(8516, ApiClient.getScopes());
await appsScriptApi.initialize();
const apiClient = new ApiClient(appsScriptApi);

let currentLoginPromise: Promise<void> | null = null;
let currentLoginAbort: AbortController | null = null;

server.registerRequestHandler("login", () => {
  currentLoginAbort = new AbortController();
  currentLoginPromise = appsScriptApi.auth({
    abortController: currentLoginAbort,
  });
  (async () => {
    try {
      await currentLoginPromise;
      server.broadcastMessage("loginResult", { success: true });
    } catch {
      server.broadcastMessage("loginResult", { success: false });
    } finally {
      currentLoginAbort = null;
      currentLoginPromise = null;
    }
  })();
  return { url: appsScriptApi.getAuthUrl() };
});

server.registerRequestHandler("cancelLogin", () => {
  currentLoginAbort?.abort();
});

const currentStageInfoReplicant = await server.getReplicant("currentStageInfo");
server.registerRequestHandler("getStageInfo", async () => {
  const result = await apiClient.runCommand("getStageInfo", [0]);
  currentStageInfoReplicant.setValue(result.stageInfo);
});
