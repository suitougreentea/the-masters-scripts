import * as Api from "./api.ts";
import { ApiFunctions } from "../common/common_types.ts";
import { configureInject, modifyInjectLocal } from "./inject_config.ts";

configureInject();
if (Deno.args[0] == "--local") {
  console.log("Running in local mode.");
  modifyInjectLocal();
}

// deno-lint-ignore no-explicit-any
type MapMaybePromise<T extends { [key: string]: (...args: any[]) => any }> = {
  [K in keyof T]:
    | T[K]
    | ((...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>);
};
const apiFunctions = Api as MapMaybePromise<ApiFunctions>;

Deno.serve({ port: 8518 }, async (req) => {
  try {
    const message = await req.json();
    const functionName = message.functionName as keyof ApiFunctions;
    // deno-lint-ignore no-explicit-any
    const apiFunction = apiFunctions[functionName] as (...args: any[]) => any;
    const args = message.args;
    const returnValueMaybePromise = apiFunction(...args);
    const returnValue = returnValueMaybePromise instanceof Promise
      ? await returnValueMaybePromise
      : returnValueMaybePromise;
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
