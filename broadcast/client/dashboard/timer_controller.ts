import { consume, customElement, html, LitElement, query } from "../deps.ts";
import "./timer_controller.ts";
import "../common/timer.ts";
import { MastersTimerElement } from "../common/timer.ts";
import { TimerWrapper } from "../common/timer_wrapper.ts";
import { createPromiseSet } from "../../common/util.ts";
import { StageTimerPlayerData } from "../../common/common_types.ts";
import { DashboardContext, dashboardContext } from "./dashboard_context.ts";

@customElement("masters-timer-controller")
export class MastersTimerControllerElement extends LitElement {
  private _initializedPromise = createPromiseSet();

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  // @ts-ignore: ?
  @query("#timer", true)
  private _timer!: MastersTimerElement;

  private _timerWrapper!: TimerWrapper;

  constructor() {
    super();
  }

  async firstUpdated() {
    await this._timer.waitForInitialization();
    this._timerWrapper = new TimerWrapper(this._timer);

    const client = await this._dashboardContext.getClient();
    const currentStageTimerInfoReplicant = await client.getReplicant(
      "currentStageTimerInfo",
    );
    currentStageTimerInfoReplicant.subscribe((value) => {
      this._setData(value?.players);
    });

    this._initializedPromise.resolve();
  }

  async waitForInitialization() {
    await this._initializedPromise.promise;
  }

  private _setData(data?: (StageTimerPlayerData | null)[]) {
    this._timerWrapper.setData(data);
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
      <button id="start" @click="${this._start}">Start</button>
      <button id="stop" @click="${this._stop}">Stop</button>
      <masters-timer id="timer"></masters-timer>
    </div>
    `;
  }
}
