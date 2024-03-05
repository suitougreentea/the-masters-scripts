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
  .toolbar-container {
    display: flex;
  }

  .toolbar {
    background-image: linear-gradient(45deg, ${commonColors.background} 88%, transparent 88%);
    width: 480px;
    height: 36px;
    padding: 8px 8px 4px;
  }

  .toolbar2 {
    height: 36px;
    padding: 4px;
  }

  .toolbar span,
  .toolbar2 span {
    display: inline-block;
    transform: translateY(5px); /* TODO */
  }

  #name {
    margin-left: 8px;
    color: ${commonColors.textDark};
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

  @state()
  private _showingResult = false;

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

    const resultSceneActiveReplicant = await client.getReplicant(
      "resultSceneActive",
    );
    resultSceneActiveReplicant.subscribe((value) => {
      this._showingResult = value ?? false;
    });

    this._dashboardContext.addEventListener("stop-timer", () => {
      this._stop();
    });

    const latestOcrResultReplicant = await client.getReplicant("latestOcrResult");
    latestOcrResultReplicant.subscribe((value) => {
      this._timerWrapper.setOcrResult(value);
    })

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
    await this._dashboardContext.sendRequest("resetOcrState");
    const client = await this._dashboardContext.getClient();
    this._timerWrapper.stop();
    client.broadcastMessage("stopTimer");
    this.dispatchEvent(new Event("stop"));
  }

  private async _hideResult() {
    await this._dashboardContext.sendRequest("toggleResultScene", {
      show: false,
    });
  }

  render() {
    return html`
    <div class="container">
      <div class="toolbar-container">
        <div class="toolbar">
          <fluent-button appearance="accent" id="start" @click="${this._start}">Start</fluent-button>
          <fluent-button @click="${this._stop}">Reset</fluent-button>
          <span id="name">${this._name}</span>
        </div>
        <div class="toolbar2">
          ${
      this._showingResult
        ? html`
          <span>[リザルト画面表示中]</span>
          <!--<fluent-button @click="${this._hideResult}" ?disabled=${!this
          ._showingResult}>戻る</fluent-button>-->
          `
        : null
    }
        </div>
      </div>
      <div class="timer-container">
        <masters-timer id="timer"></masters-timer>
      </div>
    </div>
    `;
  }
}
