import * as Api from "./api.ts";
import { ApiFunctions } from "./common_types.ts";
import { register } from "./inject.ts";
import {
  FileSerializerManager,
  injectKey as serializerManagerKey,
} from "./serializer.ts";
import { injectKey as playersStoreKey, PlayersStore } from "./players_store.ts";
import { injectKey as setupStoreKey, SetupStore } from "./setup_store.ts";
import {
  CompetitionStore,
  injectKey as competitionStoreKey,
} from "./competition_store.ts";

register(serializerManagerKey, FileSerializerManager);
register(playersStoreKey, PlayersStore);
register(setupStoreKey, SetupStore);
register(competitionStoreKey, CompetitionStore);

const apiFunctions = Api as ApiFunctions;

Deno.serve({ port: 8518 }, async (req) => {
  try {
    const message = await req.json();
    const functionName = message.functionName;
    console.log(functionName);
    const args = message.args;
    const returnValue = apiFunctions[functionName](...args);
    console.log(returnValue);
    const response = {
      "body": returnValue,
    };
    return Response.json(response);
  } catch (e) {
    console.error(e);
    const response = {
      "error": `${e}`,
    };
    return Response.json(response);
  }
});
