import { css, customElement, html, LitElement } from "../deps.ts";
import "./title.ts";
import "./player_info.ts";
import "./round_name.ts";
import "../common/timer.ts";
import { MastersTitleElement } from "./title.ts";
import { MastersPlayerInfoElement } from "./player_info.ts";
import { MastersRoundNameElement } from "./round_name.ts";
import { MastersTimerElement } from "../common/timer.ts";
import { TimerWrapper } from "../common/timer_wrapper.ts";
import { StageTimerPlayerData } from "../../common/common_types.ts";
import { createPromiseSet, PromiseSet } from "../../common/util.ts";

@customElement("masters-competition")
export class MastersCompetitionElement extends LitElement {
  static styles = css`
  .container {
    width: 1920px;
    height: 1080px;
    background-image: url("/images/background.png");
  }

  #title {
    position: absolute;
    top: 1000px;
    left: 245px;
  }

  #round-name {
    position: absolute;
    top: 65px;
    left: 1320px;
    width: 540px;
  }

  #timer {
    position: absolute;
    top: 140px;
    left: 1320px;
    width: 540px;
  }
  `;

  #initializedPromise: PromiseSet<void> = createPromiseSet();
  #roundName!: MastersRoundNameElement;
  #title!: MastersTitleElement;
  #playerInfo!: MastersPlayerInfoElement;
  #timer!: MastersTimerElement;
  #timerWrapper!: TimerWrapper;

  constructor() {
    super();
  }

  async firstUpdated() {
    this.#title = this.renderRoot.querySelector<MastersTitleElement>("#title")!;
    this.#playerInfo = this.renderRoot.querySelector<MastersPlayerInfoElement>(
      "#player-info",
    )!;
    await this.#playerInfo.waitForInitialization();
    this.#roundName = this.renderRoot.querySelector<MastersRoundNameElement>(
      "#round-name",
    )!;
    this.#timer = this.renderRoot.querySelector<MastersTimerElement>("#timer")!;
    await this.#timer.waitForInitialization();
    this.#timerWrapper = new TimerWrapper(this.#timer);
    this.#initializedPromise.resolve();
  }

  async waitForInitialization() {
    await this.#initializedPromise.promise;
  }

  setTitleText(text: string) {
    this.#title.value = text;
  }

  setRoundNameText(name: string) {
    this.#roundName.name = name;
  }

  setTimerData(data?: (StageTimerPlayerData | null)[]) {
    this.#timerWrapper.setData(data);
    this.#playerInfo.setData(data);
  }

  startTimer() {
    if (this.#timerWrapper == null) return;
    this.#timerWrapper.start();
  }

  stopTimer() {
    if (this.#timerWrapper == null) return;
    this.#timerWrapper.stop();
  }

  render() {
    return html`
    <div class="container">
      <masters-title id="title"></masters-title>
      <masters-player-info id="player-info"></masters-player-info>
      <masters-round-name id="round-name"></masters-round-name>
      <masters-timer id="timer"></masters-timer>
    </div>
    `;
  }
}
