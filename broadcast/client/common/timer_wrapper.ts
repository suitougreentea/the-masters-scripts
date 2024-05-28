import { StagePlayerEntry } from "../../../common/common_types.ts";
import { MastersTimerElement } from "./timer.ts";
import { OcrResult } from "../../common/type_definition.ts";
import { PlayingPlayerData } from "../../common/type_definition.ts";

export class TimerWrapper {
  #timer: MastersTimerElement;
  #data?: (StagePlayerEntry | undefined)[];
  #pendingSet = false;

  constructor(timer: MastersTimerElement) {
    this.#timer = timer;
  }

  start() {
    if (this.#timer.isRunning()) return;
    this.#timer.start();
  }

  reset() {
    if (!this.#timer.isRunning()) return;
    this.#timer.reset();
    if (this.#pendingSet) {
      this.#timer.setData(this.#data);
      this.#pendingSet = false;
    }
  }

  setData(data: (StagePlayerEntry | undefined)[] | undefined) {
    this.#data = data;
    if (this.#timer.isRunning()) {
      this.#pendingSet = true;
    } else {
      this.#timer.setData(this.#data);
    }
  }

  setOcrResult(result: OcrResult | undefined) {
    this.#timer.setOcrResult(result);
  }

  setPlayingPlayerData(data: PlayingPlayerData[] | undefined) {
    this.#timer.setPlayingPlayerData(data);
  }
}
