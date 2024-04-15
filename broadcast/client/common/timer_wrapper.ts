import { StagePlayerEntry } from "../../../common/common_types.ts";
import { MastersTimerElement } from "./timer.ts";
import { OcrResult } from "../../common/type_definition.ts";
import { PlayingPlayerData } from "../../common/type_definition.ts";

export class TimerWrapper {
  #timer: MastersTimerElement;
  #data?: (StagePlayerEntry | null)[];
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

  setData(data?: (StagePlayerEntry | null)[]) {
    this.#data = data;
    if (this.#timer.isRunning()) {
      this.#pendingSet = true;
    } else {
      this.#timer.setData(this.#data);
    }
  }

  setOcrResult(result?: OcrResult | null) {
    this.#timer.setOcrResult(result);
  }

  setPlayingPlayerData(data?: PlayingPlayerData[] | null) {
    this.#timer.setPlayingPlayerData(data);
  }
}
