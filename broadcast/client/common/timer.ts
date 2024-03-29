import { StagePlayerEntry } from "../../../common/common_types.ts";
import { commonColors } from "../common/common_values.ts";
import {
  createPromiseSet,
  getDiffTime,
  PromiseSet,
} from "../../common/util.ts";
import { OcrResult } from "../../common/type_definition.ts";
import {
  css,
  customElement,
  html,
  LitElement,
  map,
  tinycolor,
} from "../deps.ts";
import { timeToString } from "../../../common/time.ts";

@customElement("masters-timer")
export class MastersTimerElement extends LitElement {
  static styles = css`
  .container {
    color: ${commonColors.textDark};
  }

  .container-inner {
    overflow: hidden;
  }

  .player {
    display: grid;
    align-items: center;
    grid-template-columns: 20px 120px 85px 40px 80px auto;
    height: 32px;
  }

  .background-left {
    grid-area: 1 / 1 / auto / span 2;
    height: 100%;
    background-color: ${commonColors.background};
  }

  .background-time {
    grid-area: 1 / 3 / auto / auto;
    height: 100%;
    background-color: ${commonColors.background};
    transition-property: background-color;
    transition-duration: 0.5s;
  }

  .background-time-hidden {
    background-color: transparent;
  }

  .background-right {
    grid-area: 1 / 4 / auto / span 3;
    height: 100%;
    background-color: ${commonColors.background};
  }

  .border {
    grid-area: 1 / 1 / auto / span 6;
    height: 1px;
    background-color: #444;
    transform: translateY(10px);
  }

  .id {
    grid-area: 1 / 1 / auto / auto;
    font-size: 16px;
    transform: translateY(1px);
  }

  .id-inactive {
    opacity: 0.3;
  }

  /* TODO: Experimental */
  @keyframes health-animation {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  .health {
    grid-area: 1 / 2 / auto / auto;
    height: 20px;
    background: linear-gradient(0deg, var(--health-color), transparent);
    animation: health-animation 1s linear 0s infinite alternate;
  }

  .name {
    grid-area: 1 / 2 / auto / auto;
    font-size: 20px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-right: 4px;
  }

  .time {
    grid-area: 1 / 3 / auto / auto;
    font-size: 20px;
    transition-property: color;
    transition-duration: 0.5s;
  }

  .time-hidden {
    color: transparent;
  }

  .time-level {
    text-align: center;
  }

  .gauge {
    grid-area: 1 / 4 / auto / span 3;
    height: 18px;
    transform: translateY(1px);
  }

  .start-order {
    grid-area: 1 / 4 / auto / auto;
    font-size: 16px;
    text-shadow: 0 0 5px black;
    margin-left: 2px;
    transform: translateY(1px);
  }

  .diff-time {
    grid-area: 1 / 5 / auto / auto;
    font-size: 16px;
    text-shadow: 0 0 5px black;
    transform: translateY(1px);
  }

  .offset {
    grid-area: 1 / 6 / auto / auto;
    font-size: 16px;
    text-shadow: 0 0 5px black;
    transform: translateY(1px);
  }
  `;

  #ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

  #initializedPromise: PromiseSet<void> = createPromiseSet();
  #elements: {
    id: HTMLDivElement;
    backgroundTime: HTMLDivElement;
    health: HTMLDivElement; // TODO: Experimental
    name: HTMLDivElement;
    time: HTMLDivElement;
    gauge: HTMLDivElement;
    startOrder: HTMLDivElement;
    diffTime: HTMLDivElement;
    offset: HTMLDivElement;
  }[] = [];
  #data: (StagePlayerEntry | null)[];
  #intervalId: number | null = null;
  #startTime = -1;
  #elapsedTime = 0;
  #currentOcrResult: OcrResult | null = null;

  constructor() {
    super();
    this.#data = this.#createEmptyData();
  }

  firstUpdated() {
    const players = this.renderRoot.querySelectorAll<HTMLDivElement>(".player");
    for (let i = 0; i < 8; i++) {
      const player = players[i];
      const id = player.querySelector<HTMLDivElement>(".id")!;
      const backgroundTime = player.querySelector<HTMLDivElement>(
        ".background-time",
      )!;
      const health = player.querySelector<HTMLDivElement>(".health")!; // TODO: Experimental
      const name = player.querySelector<HTMLDivElement>(".name")!;
      const time = player.querySelector<HTMLDivElement>(".time")!;
      const gauge = player.querySelector<HTMLDivElement>(".gauge")!;
      const startOrder = player.querySelector<HTMLDivElement>(".start-order")!;
      const diffTime = player.querySelector<HTMLDivElement>(".diff-time")!;
      const offset = player.querySelector<HTMLDivElement>(".offset")!;
      this.#elements.push({
        id,
        backgroundTime,
        health, // TODO: Experimental
        name,
        time,
        gauge,
        startOrder,
        diffTime,
        offset,
      });
    }

    this.#initializedPromise.resolve();
  }

  waitForInitialization() {
    return this.#initializedPromise.promise;
  }

  isRunning() {
    return this.#intervalId != null;
  }

  isStarted() {
    return this.#startTime >= 0;
  }

  start() {
    if (this.isRunning()) throw new Error("Timer is running");

    this.#startTime = performance.now();
    this.#intervalId = setInterval(() => {
      this.#tickTimer();
      this.#updateRender();
    }, 10);
    this.#elements.forEach((e) => {
      e.startOrder.style.display = "none";
      e.diffTime.style.display = "none";
      e.offset.style.display = "none";
    });
  }

  stop() {
    if (!this.isRunning()) return;

    clearInterval(this.#intervalId!);
    this.#intervalId = null;
    this.#elements.forEach((e) => {
      e.startOrder.style.display = "";
      e.diffTime.style.display = "";
      e.offset.style.display = "";
    });
    this.#reset();
  }

  #reset() {
    if (this.isRunning()) throw new Error("Timer is running");

    this.#startTime = -1;
    this.#elapsedTime = 0;
    this.#updateRender();
  }

  setData(data?: (StagePlayerEntry | null)[]) {
    if (this.isRunning()) throw new Error("Timer is running");
    this.#data = data ?? this.#createEmptyData();

    for (let i = 0; i < 8; i++) {
      const player = this.#data[i];
      const element = this.#elements[i];
      if (player != null) {
        element.name.innerText = player.name;
        element.startOrder.innerText = this.#ordinals[player.startOrder - 1] +
          ":";
        element.diffTime.innerText = "+" +
          timeToString(getDiffTime(this.#data, i));
        if (player.handicap > 0) {
          element.offset.innerText = `[Hdcp. +${player.handicap}]`;
          element.offset.style.color = commonColors.handicapTextDark.cssText;
        } else if (player.handicap < 0) {
          element.offset.innerText = `[Adv. ${player.handicap}]`;
          element.offset.style.color = commonColors.advantageTextDark.cssText;
        } else {
          element.offset.innerText = "";
          element.offset.style.color = "";
        }
      } else {
        element.name.innerText = "";
        element.startOrder.innerText = "";
        element.diffTime.innerText = "";
        element.offset.innerText = "";
      }
    }

    this.#reset();
  }

  setOcrResult(result?: OcrResult | null) {
    this.#currentOcrResult = result ?? null;
  }

  #createEmptyData(): (StagePlayerEntry | null)[] {
    return [...new Array(8)].map((_) => null);
  }

  #tickTimer() {
    const now = performance.now();
    this.#elapsedTime = now - this.#startTime;
  }

  #updateRender() {
    for (let i = 0; i < 8; i++) {
      const startTime = this.#data[i]?.startTime;
      if (startTime != null) {
        const time = Math.max(0, startTime - this.#elapsedTime);
        this.#setPlayerTime(i, time);
      } else {
        this.#setPlayerTime(i, null);
      }
    }
  }

  #setPlayerTime(index: number, time: number | null) {
    const player = this.#elements[index];
    if (time != null) {
      player.id.className = "id";
      player.backgroundTime.className = time == 0 && this.isRunning()
        ? "background-time background-time-hidden"
        : "background-time";
      player.time.className = time == 0 && this.isRunning()
        ? "time time-hidden"
        : "time";
      player.time.innerText = timeToString(time);
      player.gauge.style.width = (time / 200) + "px";
      let color = "#35a16b";
      if (time < 10000) color = "#faf500";
      if (time < 5000) {
        const t = (1000 - (time % 1000)) / 1000;
        const u = Math.sqrt(t);
        color = tinycolor.mix("#ff2800", "#faf500", u * 100).toRgbString();
      }
      player.gauge.style.background = color;
      player.health.style.setProperty("--health-color", "transparent"); // TODO: Experimental

      if (this.isStarted() && time == 0 && this.#currentOcrResult != null) {
        const status = this.#currentOcrResult.status[index];
        player.backgroundTime.className = "background-time";
        player.time.className = "time time-level";
        player.time.innerText = `${status.level}`;
        const dead = status.level < 999 && status.playing == false;
        const finished = status.level == 999;
        const stopping = status.level % 100 == 99;
        player.gauge.style.width = (status.level / 999 * 325) + "px";
        player.gauge.style.background = finished
          ? "#cbf266"
          : dead
          ? "#7f878f"
          : stopping
          ? "#ff9900"
          : "#66ccff";
        // TODO: Experimental
        const healthColor
          = status.health == "CAUTION"
          ? "rgb(150, 150, 0)"
          : status.health == "DANGER"
          ? "rgb(180, 0, 0)"
          : "transparent"
        player.health.style.setProperty("--health-color", healthColor);
      }
    } else {
      player.id.className = "id id-inactive";
      player.backgroundTime.className = "background-time";
      player.time.className = "time";
      player.time.innerText = "";
      player.gauge.style.width = "0px";
    }
  }

  render() {
    return html`
    <div class="container">
      <div class="container-inner">
      ${
      map(this.#data, (_, i) =>
        html`
        <div class="player">
          <div class="background-left"></div>
          <div class="background-time"></div>
          <div class="background-right"></div>
          <div class="border"></div>
          <div class="id">${i + 1}:</div>
          <!-- TODO: Experimental -->
          <div class="health"></div>
          <div class="name"></div>
          <div class="time"></div>
          <div class="gauge"></div>
          <div class="start-order"></div>
          <div class="diff-time"></div>
          <div class="offset"></div>
        </div>
        `)
    }
      </div>
    </div>
    `;
  }
}
