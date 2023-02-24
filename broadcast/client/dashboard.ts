import { type TypeDefinition } from "../common/type_definition.ts";
import { denocg } from "./deps.ts";

const client = await denocg.getClient<TypeDefinition>();

const loginButton = document.querySelector<HTMLButtonElement>("#login")!;
const loginCancelButton = document.querySelector<HTMLButtonElement>(
  "#login-cancel",
)!;
const getStageInfoButton = document.querySelector<HTMLButtonElement>(
  "#get-stage-info",
)!;

loginCancelButton.disabled = true;
loginButton.onclick = async (_) => {
  const urlInfo = await client.requestToServer("login");
  window.open(urlInfo.url);

  const waitForLoginResult = () =>
    new Promise<void>((resolve, reject) => {
      const listener = (result: { success: boolean }) => {
        client.removeMessageListener("loginResult", listener);
        if (result.success) {
          resolve();
        } else {
          reject();
        }
      };
      client.addMessageListener("loginResult", listener);
    });
  try {
    loginButton.disabled = true;
    loginCancelButton.disabled = false;
    await waitForLoginResult();
  } finally {
    loginButton.disabled = false;
    loginCancelButton.disabled = true;
  }
};
loginCancelButton.onclick = async (_) => {
  await client.requestToServer("cancelLogin");
};

getStageInfoButton.onclick = async (_) => {
  await client.requestToServer("getStageInfo");
};
