import { type TypeDefinition } from "../common/type_definition.ts";
import "./components/timer.ts";
import { MastersTimerElement } from "./components/timer.ts";
import { denocg } from "./deps.ts";
import { TimerWrapper } from "./timer_wrapper.ts";

const client = await denocg.getClient<TypeDefinition>();

const titleInput = document.querySelector<HTMLInputElement>("#title")!;
const setInfoButton = document.querySelector<HTMLButtonElement>("#set-info")!;
const loginButton = document.querySelector<HTMLButtonElement>("#login")!;
const loginCancelButton = document.querySelector<HTMLButtonElement>(
  "#login-cancel",
)!;
const getStageInfoButton = document.querySelector<HTMLButtonElement>(
  "#get-stage-info",
)!;
const timerStartButton = document.querySelector<HTMLButtonElement>(
  "#timer-start",
)!;
const timerStopButton = document.querySelector<HTMLButtonElement>(
  "#timer-stop",
)!;
const timer = document.querySelector<MastersTimerElement>("#timer")!;
const timerWrapper = new TimerWrapper(timer);

const titleReplicant = await client.getReplicant("title");
titleReplicant.subscribe((value) => {
  titleInput.value = value ?? "";
});
setInfoButton.onclick = (_) => {
  titleReplicant.setValue(titleInput.value);
};

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

const currentStageTimerInfoReplicant = await client.getReplicant(
  "currentStageTimerInfo",
);
currentStageTimerInfoReplicant.subscribe((value) => {
  timerWrapper.setData(value?.players);
});

timerStartButton.onclick = () => {
  timerWrapper.start();
  client.broadcastMessage("startTimer");
};

timerStopButton.onclick = () => {
  timerWrapper.stop();
  client.broadcastMessage("stopTimer");
};
