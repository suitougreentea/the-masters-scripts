import { type TypeDefinition } from "../common/type_definition.ts";
import "./components/timer.ts";
import { denocg } from "./deps.ts";
import { MastersTimerElement } from "./components/timer.ts";
import { TimerWrapper } from "./timer_wrapper.ts";

const client = await denocg.getClient<TypeDefinition>();

const timer = document.querySelector<MastersTimerElement>("#timer")!;
const timerWrapper = new TimerWrapper(timer);
const currentStageTimerInfoReplicant = await client.getReplicant("currentStageTimerInfo");
currentStageTimerInfoReplicant.subscribe((value) => {
  timerWrapper.setData(value?.players);
});

client.addMessageListener("startTimer", () => {
  timerWrapper.start();
});
client.addMessageListener("stopTimer", () => {
  timerWrapper.stop();
});
