import { StageTimerPlayerData } from "../../common/common_types.ts";
import { formatTime } from "../../common/util.ts";
import { LitElement, html, css, customElement, map, tinycolor } from "../deps.ts";

@customElement("masters-timer")
export class MastersTimerElement extends LitElement {
  static styles = css`
  .container {
    background-color: black;
    color: white;
  }

  .player {
    display: grid;
    align-items: end;
    grid-template-columns: 16px 85px 65px 16px auto;
    height: 24px;
    line-height: 16px;
    border-bottom: 1px solid #444;
    box-sizing: border-box;
  }

  .player .id {
    grid-row: 1;
    grid-column: 1;
    font-size: 12px;
  }

  .player .name {
    grid-row: 1;
    grid-column: 2;
    font-size: 16px;
    overflow: hidden;
    white-space: nowrap;
    margin-right: 8px;

    /* つぶす */
    width: 107%;
    transform: scaleX(85%);
    transform-origin: left;
  }

  .player .time {
    grid-row: 1;
    grid-column: 3;
    font-size: 16px;
  }

  .player .gauge {
    grid-row: 1;
    grid-column: 4 / span 2;
    height: 18px;
  }

  .player .start-order {
    grid-row: 1;
    grid-column: 4;
    font-size: 12px;
    text-shadow: 0 0 5px black;
    margin-left: 2px;
  }

  .player .diff-time {
    grid-row: 1;
    grid-column: 5;
    font-size: 12px;
    text-shadow: 0 0 5px black;
  }
  `;

  #elements: {
    name: HTMLDivElement;
    time: HTMLDivElement;
    gauge: HTMLDivElement;
    startOrder: HTMLDivElement;
    diffTime: HTMLDivElement;
  }[] = [];
  #data: (StageTimerPlayerData | null)[];
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
      const name = player.querySelector<HTMLDivElement>(".name")!;
      const time = player.querySelector<HTMLDivElement>(".time")!;
      const gauge = player.querySelector<HTMLDivElement>(".gauge")!;
      const startOrder = player.querySelector<HTMLDivElement>(".start-order")!;
      const diffTime = player.querySelector<HTMLDivElement>(".diff-time")!;
      this.#elements.push({ name, time, gauge, startOrder, diffTime });
    }
  }

  isRunning() {
    return this.#intervalId != null;
  }

  start() {
    if (this.isRunning()) throw new Error("Timer is running");

    this.#startTime = performance.now();
    this.#intervalId = setInterval(() => this.#updateTimer(), 10);
    this.#elements.forEach(e => {
      e.startOrder.style.display = "none";
      e.diffTime.style.display = "none";
    });
  }

  stop() {
    if (!this.isRunning()) return;

    clearInterval(this.#intervalId!);
    this.#startTime = -1;
    this.#intervalId = null;
    this.#elements.forEach(e => {
      e.startOrder.style.display = "";
      e.diffTime.style.display = "";
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
          if (targetIndex == -1 || players[targetIndex]!.startOrder < e.startOrder) {
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
        this.#setPlayerTime(i, player.startTime);
        element.startOrder.innerText = player.startOrder + ":";
        element.diffTime.innerText = "+" + formatTime(getDiffTime(i));
      } else {
        element.name.innerText = "";
        this.#setPlayerTime(i, null);
        element.startOrder.innerText = "";
        element.diffTime.innerText = "";
      }
    }
  }

  setData(data?: (StageTimerPlayerData | null)[]) {
    if (this.isRunning()) throw new Error("Timer is running");
    this.#data = data ?? this.#createEmptyData();
    this.#reset();
  }

  #createEmptyData(): (StageTimerPlayerData | null)[] {
    return [...new Array(8)].map(_ => null);
  }

  #updateTimer() {
    const now = performance.now();
    const elapsed = now - this.#startTime;
    for (let i = 0; i < 8; i++) {
      const initialTime = this.#data[i]?.startTime;
      if (initialTime != null) {
        const time = Math.max(0, initialTime - elapsed);
        this.#setPlayerTime(i, time);
      } else {
        this.#setPlayerTime(i, null);
      }
    }
  }

  #setPlayerTime(index: number, time: number | null) {
    const player = this.#elements[index];
    if (time != null) {
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
      player.time.innerText = "";
      player.gauge.style.width = "0px";
    }
  }

  render() {
    return html`
    <div class="container">
      ${map(this.#data, (_, i) => html`
      <div class="player">
        <div class="id">${i + 1}</div>
        <div class="name"></div>
        <div class="time"></div>
        <div class="gauge"></div>
        <div class="start-order"></div>
        <div class="diff-time"></div>
      </div>
      `)}
    </div>
    `;
  }
}
