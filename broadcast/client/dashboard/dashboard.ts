import { TypeDefinition } from "../../common/type_definition.ts";
import { createPromiseSet } from "../../common/util.ts";
import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import {
  css,
  customElement,
  denocg,
  FluentSwitch,
  html,
  LitElement,
  live,
  provide,
  query,
  state,
  styleMap,
} from "../deps.ts";
import "./timer_controller.ts";
import "./tabs.ts";
import "./setup.ts";
import "./round.ts";
import "./chat.ts";
import { MastersTimerControllerElement } from "./timer_controller.ts";
import { MastersTabsElement } from "./tabs.ts";

@customElement("masters-dashboard")
export class MastersDashboardElement extends LitElement {
  static styles = css`
    .container {
      height: calc(100vh - 16px);
      margin: 8px;
      display: grid;
      grid-template-columns: 1fr 280px;
    }

    .container > * {
      overflow: hidden;
    }

    .loader {
      background: rgba(255, 255, 255, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #content {
      grid-area: 1 / 1 / auto / auto;
      display: grid;
      padding: 8px;
    }

    #sidebar {
      grid-area: 1 / 2 / auto / auto;
      display: grid;
      grid-template-rows: auto auto auto 1fr;
      background-color: rgb(249, 249, 249);
      border-left: 1px solid gray;
    }

    #menu {
      padding: 8px;
      border-bottom: 1px solid gray;
    }

    #tabs-container {
      display: grid;
    }

    #tabs {
      grid-area: 1 / 1 / auto / auto;
      padding: 8px;
    }

    #tabs-loader {
      grid-area: 1 / 1 / auto / auto;
    }

    #setup {
      grid-area: 1 / 1 / auto / auto;
    }

    #round {
      grid-area: 1 / 1 / auto / auto;
    }

    #content-loader {
      grid-area: 1 / 1 / auto / auto;
    }

    #timer-controller {
      grid-area: 1 / 1 / auto / auto;
      z-index: 1001;
      margin-right: 8px;
    }
    `;
  private _initializedPromise = createPromiseSet();

  // @ts-ignore: ?
  @query("#timer-controller", true)
  private _timerController!: MastersTimerControllerElement;

  private _dashboardContext: DashboardContext;
  private _clientPromiseResolve!: (
    client: denocg.Client<TypeDefinition>,
  ) => void;
  @provide({ context: dashboardContext })
  private _dashboardContextForProvide: DashboardContext; // TODO: 自分で読むとundefinedになってる気がする

  @state()
  private _requestInProgress = false;
  @state()
  private _timerVisible = false;

  // @ts-ignore: ?
  @query("#tabs", true)
  private _tabs!: MastersTabsElement;
  @state()
  private _currentActivePage = "setup";

  constructor() {
    super();

    const { promise, resolve } = createPromiseSet<
      denocg.Client<TypeDefinition>
    >();
    this._dashboardContext = new DashboardContext(promise);
    this._dashboardContextForProvide = this._dashboardContext;

    this._dashboardContext.addEventListener("request-started", () => {
      this._requestInProgress = true;
    });
    this._dashboardContext.addEventListener("request-ended", () => {
      this._requestInProgress = false;
    });

    this._dashboardContext.addEventListener("activate-timer", () => {
      if (!this._timerVisible) {
        this._timerVisible = true;
      }
    });

    this._clientPromiseResolve = resolve;
  }

  async firstUpdated() {
    await this._timerController.waitForInitialization();
    this._initializedPromise.resolve();
  }

  async waitForInitialization() {
    await this._initializedPromise.promise;
  }

  provideDenoCGClient(client: denocg.Client<TypeDefinition>) {
    this._clientPromiseResolve(client);
  }

  async restoreState() {
    const client = await this._dashboardContext.getClient();
    const metadata = (await client.getReplicant("currentCompetitionMetadata"))
      .getValue();
    const currentRoundData = (await client.getReplicant("currentRoundData"))
      .getValue();
    if (metadata != null && currentRoundData != null) {
      const tabName = `round${currentRoundData.roundIndex}`;
      await this._changeTabPage(tabName, false);
    } else {
      await this._enterTabPage("setup");
    }
  }

  private async _onChangeActiveTab(e: Event) {
    const tabName = (e.target as MastersTabsElement).activeTabName;
    await this._changeTabPage(tabName, true);
  }

  private async _changeTabPage(tabName: string, user: boolean) {
    if (tabName == this._currentActivePage) return;

    await this._leaveTabPage(this._currentActivePage);
    if (!user) this._tabs.changeTab(tabName);
    this._currentActivePage = tabName;
    await this._enterTabPage(this._currentActivePage);
  }

  private async _enterTabPage(tabName: string) {
    if (tabName == "setup") {
      await this._dashboardContext.sendRequest("enterSetup");
    }
    if (tabName.startsWith("round")) {
      const roundIndex = Number(tabName.slice(5));
      await this._dashboardContext.sendRequest("enterRound", { roundIndex });
    }
  }

  private async _leaveTabPage(tabName: string) {
    if (tabName.startsWith("round")) {
      // const roundIndex = Number(tabName.slice(5));
      // TODO: currentRoundがタブ名と一致してるか確認したい
      await this._dashboardContext.sendRequest("leaveCurrentRound");
    }
  }

  private async _onFinishCompetition() {
    await this._changeTabPage("setup", false);
  }

  private async _onSetupCompleted() {
    await this._dashboardContext.sendRequest("getCurrentCompetitionMetadata");
    await this._changeTabPage("round0", false);
  }

  render() {
    const setupPageActive = this._currentActivePage == "setup";
    const roundPageActive = this._currentActivePage.startsWith("round");

    const loaderStyle = styleMap({
      display: this._requestInProgress ? null : "none",
    });
    const setupStyle = styleMap({
      display: setupPageActive ? null : "none",
    });
    const roundStyle = styleMap({
      display: roundPageActive ? null : "none",
    });
    const timerStyle = styleMap({
      display: this._timerVisible ? null : "none",
    });
    return html`
    <div class="container">
      <div id="content">
        <masters-setup id="setup" style=${setupStyle} @setup-completed=${this._onSetupCompleted}></masters-setup>
        <masters-round id="round" style=${roundStyle}></masters-round>
        <div class="loader" id="content-loader" style=${loaderStyle}>
          <fluent-progress-ring></fluent-progress-ring>
        </div>
      </div>
      <div id="sidebar">
        <div id="menu">
          <fluent-switch ?current-checked=${
      live(this._timerVisible)
    } @change=${(ev: Event) =>
      this._timerVisible =
        (ev.target as FluentSwitch).currentChecked}>タイマー</fluent-switch>
        </div>
        <div id="tabs-container">
          <masters-tabs id="tabs" @change-active-tab=${this._onChangeActiveTab} @finish-competition=${this._onFinishCompetition}></masters-tabs>
          <div class="loader" id="tabs-loader" style=${loaderStyle}>
            <fluent-progress-ring></fluent-progress-ring>
          </div>
        </div>
        <masters-chat id="chat"></masters-chat>
      </div>
      <masters-timer-controller id="timer-controller" style=${timerStyle}></masters-timer-controller>
    </div>
    `;
  }
}
