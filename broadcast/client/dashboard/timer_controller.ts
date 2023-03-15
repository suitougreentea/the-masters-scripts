import {
  consume,
  css,
  customElement,
  html,
  LitElement,
  query,
  state,
} from "../deps.ts";
import "./timer_controller.ts";
import "../common/timer.ts";
import { MastersTimerElement } from "../common/timer.ts";
import { TimerWrapper } from "../common/timer_wrapper.ts";
import { createPromiseSet } from "../../common/util.ts";
import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import { commonColors } from "../common/common_values.ts";

@customElement("masters-timer-controller")
export class MastersTimerControllerElement extends LitElement {
  static styles = css`
  .toolbar {
    background-image: linear-gradient(45deg, ${commonColors.background} 85%, transparent 85%);
    width: 480px;
    padding: 8px 8px 4px;
  }

  #name {
    display: inline-block;
    margin-left: 8px;
    color: ${commonColors.textDark};
    transform: translateY(5px); /* TODO */
  }

  .timer-container {
    padding: 2px 6px;
    background-color: ${commonColors.background};
  }
  `;

  private _initializedPromise = createPromiseSet();

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  // @ts-ignore: ?
  @query("#timer", true)
  private _timer!: MastersTimerElement;

  @state()
  private _name = "";

  private _timerWrapper!: TimerWrapper;

  constructor() {
    super();
  }

  async firstUpdated() {
    await this._timer.waitForInitialization();
    this._timerWrapper = new TimerWrapper(this._timer);

    const client = await this._dashboardContext.getClient();
    const currentCompetitionSceneStageDataReplicant = await client.getReplicant(
      "currentCompetitionSceneStageData",
    );
    currentCompetitionSceneStageDataReplicant.subscribe((value) => {
      this._name = value?.metadata.name ?? "";
      this._timerWrapper.setData(value?.stageData?.players);
    });

    this._dashboardContext.addEventListener("stop-timer", () => {
      this._stop();
    });

    this._initializedPromise.resolve();
  }

  async waitForInitialization() {
    await this._initializedPromise.promise;
  }

  private async _start() {
    const client = await this._dashboardContext.getClient();
    this._timerWrapper.start();
    client.broadcastMessage("startTimer");
    this.dispatchEvent(new Event("start"));
  }

  private async _stop() {
    const client = await this._dashboardContext.getClient();
    this._timerWrapper.stop();
    client.broadcastMessage("stopTimer");
    this.dispatchEvent(new Event("stop"));
  }

  render() {
    return html`
    <div class="container">
      <div class="toolbar">
        <fluent-button appearance="accent" id="start" @click="${this._start}">Start</fluent-button>
        <fluent-button id="stop" @click="${this._stop}">Reset</fluent-button>
        <span id="name">${this._name}</span>
      </div>
      <div class="timer-container">
        <masters-timer id="timer"></masters-timer>
      </div>
    </div>
    `;
  }
}
