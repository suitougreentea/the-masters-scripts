import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../common/title.ts";
import "./player_info.ts";
import "./round_name.ts";
import "../common/timer.ts";
import { MastersTitleElement } from "../common/title.ts";
import { MastersPlayerInfoElement } from "./player_info.ts";
import { MastersRoundNameElement } from "./round_name.ts";
import { MastersTimerElement } from "../common/timer.ts";
import { TimerWrapper } from "../common/timer_wrapper.ts";
import {
  RegisteredPlayerEntry,
  StagePlayerEntry,
} from "../../../common/common_types.ts";
import { createPromiseSet, PromiseSet } from "../../common/util.ts";
import { commonColors } from "../common/common_values.ts";
import { OcrResult, PlayingPlayerData } from "../../common/type_definition.ts";

@customElement("masters-competition")
export class MastersCompetitionElement extends LitElement {
  static styles = css`
  .container {
    width: 1920px;
    height: 1080px;
    background-image: url("/images/background-competition.png");
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
    top: 150px;
    left: 1310px;
    width: 550px;
    height: 256px;
  }

  #timer-placeholder {
    position: absolute;
    top: 150px;
    left: 1310px;
    width: 550px;
    height: 256px;
    background-color: ${commonColors.background};
  }
  `;

  #initializedPromise: PromiseSet<void> = createPromiseSet();
  #roundName!: MastersRoundNameElement;
  #title!: MastersTitleElement;
  #playerInfo!: MastersPlayerInfoElement;
  #timer!: MastersTimerElement;
  #timerWrapper!: TimerWrapper;
  #timerPlaceholder!: HTMLDivElement;

  constructor() {
    super();
  }

  async firstUpdated() {
    this.#title = this.renderRoot.querySelector<MastersTitleElement>("#title")!;
    this.#playerInfo = this.renderRoot.querySelector<MastersPlayerInfoElement>(
      "#player-info",
    )!;
    this.#roundName = this.renderRoot.querySelector<MastersRoundNameElement>(
      "#round-name",
    )!;
    this.#timer = this.renderRoot.querySelector<MastersTimerElement>("#timer")!;
    await this.#timer.waitForInitialization();
    this.#timerWrapper = new TimerWrapper(this.#timer);
    this.#timerPlaceholder = this.renderRoot.querySelector<HTMLDivElement>(
      "#timer-placeholder",
    )!;
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

  setTimerData(data?: (StagePlayerEntry | null)[]) {
    this.#timerWrapper.setData(data);
    this.#playerInfo.data = data;
    this.#timer.style.display = data != null ? "unset" : "none";
    this.#timerPlaceholder.style.display = data != null ? "none" : "unset";
  }

  setRegisteredPlayers(players: RegisteredPlayerEntry[]) {
    this.#playerInfo.registeredPlayers = players;
  }

  startTimer() {
    if (this.#timerWrapper == null) return;
    this.#timerWrapper.start();
    this.#playerInfo.showDetail = false;
  }

  resetTimer() {
    if (this.#timerWrapper == null) return;
    this.#timerWrapper.reset();
    this.#playerInfo.showDetail = true;
  }

  setOcrResult(result?: OcrResult | null) {
    this.#timerWrapper.setOcrResult(result);

    // TODO: Experimental
    this.#playerInfo.setOcrResult(result);
  }

  setPlayingPlayerData(data?: PlayingPlayerData[] | null) {
    this.#timerWrapper.setPlayingPlayerData(data);
    this.#playerInfo.setPlayingPlayerData(data);
  }

  render() {
    // deno-fmt-ignore
    return html`
    <div class="container">
      <masters-title id="title"></masters-title>
      <masters-player-info id="player-info"></masters-player-info>
      <masters-round-name id="round-name"></masters-round-name>
      <masters-timer id="timer"></masters-timer>
      <div id="timer-placeholder"></div>
    </div>
    `;
  }
}
