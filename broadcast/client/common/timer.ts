import { StagePlayerEntry } from "../../common/common_types.ts";
import { commonColors } from "../common/common_values.ts";
import { createPromiseSet, formatTime, PromiseSet } from "../../common/util.ts";
import {
  css,
  customElement,
  html,
  LitElement,
  map,
  tinycolor,
} from "../deps.ts";

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

  constructor() {
    super();
    this.#data = this.#createEmptyData();
  }

  firstUpdated() {
    const players = this.renderRoot.querySelectorAll<HTMLDivElement>(".player");
    for (let i = 0; i < 8; i++) {
      const player = players[i];
      const id = player.querySelector<HTMLDivElement>(".id")!;
      const backgroundTime = player.querySelector<HTMLDivElement>(".background-time")!;
      const name = player.querySelector<HTMLDivElement>(".name")!;
      const time = player.querySelector<HTMLDivElement>(".time")!;
      const gauge = player.querySelector<HTMLDivElement>(".gauge")!;
      const startOrder = player.querySelector<HTMLDivElement>(".start-order")!;
      const diffTime = player.querySelector<HTMLDivElement>(".diff-time")!;
      const offset = player.querySelector<HTMLDivElement>(".offset")!;
      this.#elements.push({ id, backgroundTime, name, time, gauge, startOrder, diffTime, offset });
    }

    this.#initializedPromise.resolve();
  }

  waitForInitialization() {
    return this.#initializedPromise.promise;
  }

  isRunning() {
    return this.#intervalId != null;
  }

  start() {
    if (this.isRunning()) throw new Error("Timer is running");

    this.#startTime = performance.now();
    this.#intervalId = setInterval(() => this.#updateTimer(), 10);
    this.#elements.forEach((e) => {
      e.startOrder.style.display = "none";
      e.diffTime.style.display = "none";
      e.offset.style.display = "none";
    });
  }

  stop() {
    if (!this.isRunning()) return;

    clearInterval(this.#intervalId!);
    this.#startTime = -1;
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

    const getDiffTime = (playerIndex: number) => {
      const players = this.#data;
      const player = players[playerIndex];
      if (player == null) return 0;

      if (player.startOrder == 1) return 0;

      // startOrderが1つ先の人を探す
      let targetIndex = -1;
      players.forEach((e, i) => {
        if (e == null) return;
        if (e.startOrder < player.startOrder) {
          if (
            targetIndex == -1 || players[targetIndex]!.startOrder < e.startOrder
          ) {
            targetIndex = i;
          }
        }
      });
      if (targetIndex == -1) return 0; // unreachable?

      return player.startTime - players[targetIndex]!.startTime;
    };

    for (let i = 0; i < 8; i++) {
      const player = this.#data[i];
      const element = this.#elements[i];
      if (player != null) {
        element.name.innerText = player.name;
        this.#setPlayerTime(i, player.startTime, false);
        element.startOrder.innerText = this.#ordinals[player.startOrder - 1] +
          ":";
        element.diffTime.innerText = "+" + formatTime(getDiffTime(i));
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
        this.#setPlayerTime(i, null, false);
        element.startOrder.innerText = "";
        element.diffTime.innerText = "";
        element.offset.innerText = "";
      }
    }
  }

  setData(data?: (StagePlayerEntry | null)[]) {
    if (this.isRunning()) throw new Error("Timer is running");
    this.#data = data ?? this.#createEmptyData();
    this.#reset();
  }

  #createEmptyData(): (StagePlayerEntry | null)[] {
    return [...new Array(8)].map((_) => null);
  }

  #updateTimer() {
    const now = performance.now();
    const elapsed = now - this.#startTime;
    for (let i = 0; i < 8; i++) {
      const initialTime = this.#data[i]?.startTime;
      if (initialTime != null) {
        const time = Math.max(0, initialTime - elapsed);
        this.#setPlayerTime(i, time, true);
      } else {
        this.#setPlayerTime(i, null, true);
      }
    }
  }

  #setPlayerTime(index: number, time: number | null, running: boolean) {
    const player = this.#elements[index];
    if (time != null) {
      player.id.className = "id";
      player.backgroundTime.className = time == 0 && running ? "background-time background-time-hidden" : "background-time";
      player.time.className = time == 0 && running ? "time time-hidden" : "time";
      player.time.innerText = formatTime(time);
      player.gauge.style.width = (time / 200) + "px";
      let color = "#35a16b";
      if (time < 10000) color = "#faf500";
      if (time < 5000) {
        const t = (1000 - (time % 1000)) / 1000;
        const u = Math.sqrt(t);
        color = tinycolor.mix("#ff2800", "#faf500", u * 100).toRgbString();
      }
      player.gauge.style.background = color;
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
