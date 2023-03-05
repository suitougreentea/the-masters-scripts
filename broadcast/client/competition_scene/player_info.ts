import { StageTimerPlayerData } from "../../common/common_types.ts";
import { commonColors } from "../common_values.ts";
import { createPromiseSet, formatTime, PromiseSet } from "../../common/util.ts";
import { css, customElement, html, LitElement, map } from "../deps.ts";

@customElement("masters-player-info")
export class MastersPlayerInfoElement extends LitElement {
  static styles = css`
    .container {
      color: ${commonColors.text};
    }

    .player {
      position: absolute;
      width: 288px;
      height: 436px;
      text-shadow: 0 0 5px black;
    }
    .player:nth-child(odd) {
      text-align: left;
    }
    .player:nth-child(even) {
      text-align: right;
    }
    .player:nth-child(1) {
      left: 80px;
      top: 60px;
    }
    .player:nth-child(2) {
      left: 368px;
      top: 60px;
    }
    .player:nth-child(3) {
      left: 680px;
      top: 60px;
    }
    .player:nth-child(4) {
      left: 968px;
      top: 60px;
    }
    .player:nth-child(5) {
      left: 80px;
      top: 515px;
    }
    .player:nth-child(6) {
      left: 368px;
      top: 515px;
    }
    .player:nth-child(7) {
      left: 680px;
      top: 515px;
    }
    .player:nth-child(8) {
      left: 968px;
      top: 515px;
    }

    .id {
      position: absolute;
      top: 5px;
      color: rgb(160, 160, 160);
      font-size: 48px;
      line-height: 48px;
      margin: 0px 5px;
    }
    .player:nth-child(odd) .id {
      left: 0px;
    }
    .player:nth-child(even) .id {
      right: 0px;
    }

    .name {
      position: absolute;
      top: 10px;
      font-size: 24px;
      line-height: 24px;
    }
    .player:nth-child(odd) .name {
      left: 60px;
    }
    .player:nth-child(even) .name {
      right: 60px;
    }

    .best-time {
      display: none;
      position: absolute;
      top: 43px;
      font-size: 18px;
      line-height: 18px;
      font-weight: bold;
      text-shadow: 2px 2px 0 black;
    }
    .player:nth-child(odd) .best-time {
      left: 192px;
    }
    .player:nth-child(even) .best-time {
      right: 194px;
    }

    .offset {
      display: none;
      position: absolute;
      top: 64px;
      font-size: 14px;
      line-height: 14px;
      text-shadow: 2px 2px 0 black;
    }
    .player:nth-child(odd) .offset {
      left: 192px;
    }
    .player:nth-child(even) .offset {
      right: 194px;
    }
    `;

  #initializedPromise: PromiseSet<void> = createPromiseSet();
  #elements: {
    name: HTMLDivElement;
    bestTime: HTMLDivElement;
    offset: HTMLDivElement;
  }[] = [];
  #data: (StageTimerPlayerData | null)[];

  constructor() {
    super();
    this.#data = this.#createEmptyData();
  }

  firstUpdated() {
    const players = this.renderRoot.querySelectorAll<HTMLDivElement>(".player");
    for (let i = 0; i < 8; i++) {
      const player = players[i];
      const name = player.querySelector<HTMLDivElement>(".name")!;
      const bestTime = player.querySelector<HTMLDivElement>(".best-time")!;
      const offset = player.querySelector<HTMLDivElement>(".offset")!;
      this.#elements.push({ name, bestTime, offset });
    }

    this.#initializedPromise.resolve();
  }

  waitForInitialization() {
    return this.#initializedPromise.promise;
  }

  #reset() {
    for (let i = 0; i < 8; i++) {
      const player = this.#data[i];
      const element = this.#elements[i];
      if (player != null) {
        element.name.innerText = player.name;
        element.bestTime.innerText = formatTime(player.rawBestTime);
        if (player.handicap > 0) {
          element.offset.innerText = `[Hdcp. +${player.handicap}]`;
          element.offset.style.color = commonColors.handicapText.cssText;
        } else if (player.handicap < 0) {
          element.offset.innerText = `[Adv. ${player.handicap}]`;
          element.offset.style.color = commonColors.advantageText.cssText;
        } else {
          element.offset.innerText = "";
          element.offset.style.color = "";
        }
      } else {
        element.name.innerText = "";
        element.bestTime.innerText = "";
        element.offset.innerText = "";
      }
    }
  }

  setData(data?: (StageTimerPlayerData | null)[]) {
    this.#data = data ?? this.#createEmptyData();
    this.#reset();
  }

  #createEmptyData(): (StageTimerPlayerData | null)[] {
    return [...new Array(8)].map((_) => null);
  }

  render() {
    return html`
    <div class="container">
      ${
      map(this.#data, (_, i) =>
        html`
        <div class="player">
          <div class="border"></div>
          <div class="id">${i + 1}</div>
          <div class="name"></div>
          <div class="best-time"></div>
          <div class="offset"></div>
        </div>
        `)
    }
    </div>
    `;
  }
}
