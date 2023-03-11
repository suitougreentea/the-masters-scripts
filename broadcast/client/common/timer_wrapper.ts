import { StagePlayerEntry } from "../../common/common_types.ts";
import { MastersTimerElement } from "./timer.ts";

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

  stop() {
    if (!this.#timer.isRunning()) return;
    this.#timer.stop();
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
}
