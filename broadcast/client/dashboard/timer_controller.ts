import {
  consume,
  css,
  customElement,
  html,
  LitElement,
  query,
  state,
  styleMap,
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
    justify-content: space-between;
    background-color: ${commonColors.background};
    color: ${commonColors.textDark};
  }

  .toolbar-left {
    width: 480px;
    height: 36px;
    padding: 8px 8px 4px;
  }

  .toolbar-right {
    width: 200px;
    height: 36px;
    padding: 8px 8px 4px;
    text-align: right;
  }

  .toolbar-left span,
  .toolbar-right span {
    display: inline-block;
    transform: translateY(6px); /* TODO */
  }

  .open-button {
    cursor: pointer;
  }

  .close-button {
    cursor: pointer;
    margin-right: 8px;
  }

  #name {
    margin-left: 8px;
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
  private _timerVisible = false;
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

    this._dashboardContext.addEventListener("activate-timer", () => {
      if (!this._timerVisible) {
        this._timerVisible = true;
      }
    });
    this._dashboardContext.addEventListener("reset-timer", () => {
      this._reset();
    });

    const latestOcrResultReplicant = await client.getReplicant(
      "latestOcrResult",
    );
    latestOcrResultReplicant.subscribe((value) => {
      this._timerWrapper.setOcrResult(value);
    });

    this._initializedPromise.resolve();
  }

  async waitForInitialization() {
    await this._initializedPromise.promise;
  }

  private _openTimer() {
    this._timerVisible = true;
  }

  private _closeTimer() {
    this._timerVisible = false;
  }

  private async _start() {
    const client = await this._dashboardContext.getClient();
    this._timerWrapper.start();
    client.broadcastMessage("startTimer");
    this.dispatchEvent(new Event("start"));
  }

  private async _reset() {
    await this._dashboardContext.sendRequest("resetOcrState");
    const client = await this._dashboardContext.getClient();
    this._timerWrapper.reset();
    client.broadcastMessage("resetTimer");
    this.dispatchEvent(new Event("reset"));
  }

  private async _confirmReset() {
    const shouldReset = await this._dashboardContext.confirm(
      "OCRの現在の状態もリセットされます。よろしいですか？",
    );
    if (!shouldReset) return;
    this._reset();
  }

  private async _hideResult() {
    await this._dashboardContext.sendRequest("toggleResultScene", {
      show: false,
    });
  }

  render() {
    const timerContainerStyle = styleMap({
      display: this._timerVisible ? null : "none",
    });

    // deno-fmt-ignore
    return html`
    <div class="container">
      <div class="toolbar-container">
        <div class="toolbar-left">
          ${this._timerVisible
            ? html`
            <span class="close-button" @click=${this._closeTimer}>✖</span>
            <fluent-button appearance="accent" @click=${this._start}>Start</fluent-button>
            <fluent-button @click=${this._confirmReset}>Reset</fluent-button>
            <span id="name">${this._name}</span>
            `
            : html`
            <span class="open-button" @click=${this._openTimer}>▶ タイマーを表示</span>
            `
          }
        </div>
        <div class="toolbar-right">
          ${this._showingResult
            ? html`
            <span>[リザルト画面表示中]</span>
            <!--<fluent-button @click=${this._hideResult} ?disabled=${!this._showingResult}>戻る</fluent-button>-->
            `
            : null
          }
        </div>
      </div>
      <div class="timer-container" style=${timerContainerStyle}>
        <masters-timer id="timer"></masters-timer>
      </div>
    </div>
    `;
  }
}
