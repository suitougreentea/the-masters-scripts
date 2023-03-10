import { TypeDefinition } from "../../common/type_definition.ts";
import { createPromiseSet } from "../../common/util.ts";
import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import {
  css,
  customElement,
  denocg,
  html,
  LitElement,
  provide,
  query,
  state,
  styleMap,
} from "../deps.ts";
import "./system_menu.ts";
import "./timer_controller.ts";
import "./tabs.ts";
import "./setup.ts";
import "./chat.ts";
import { MastersTimerControllerElement } from "./timer_controller.ts";

@customElement("masters-dashboard")
export class MastersDashboardElement extends LitElement {
  static styles = css`
    .container {
      height: calc(100vh - 16px);
      margin: 8px;
      display: flex;
      flex-direction: column;
    }

    .loader {
      background: rgba(255, 255, 255, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #system-menu {
      position: absolute;
      right: 8px;
    }

    #tabs-container {
      display: grid;
    }

    #tabs {
      grid-area: 1 / 1 / auto / auto;
    }

    #tabs-loader {
      grid-area: 1 / 1 / auto / auto;
    }

    #column-view {
      flex-grow: 1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }

    .column {
      padding: 8px;
    }

    fluent-card {
      padding: 8px;
    }

    .column-setup {
      grid-area: 1 / 1 / auto / span 3;
    }

    .column-chat {
      grid-area: 1 / 4 / auto / auto;
      border-left: 1px solid lightgray;
    }

    #column-view-loader {
      grid-area: 1 / 1 / auto / span 3;
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

  private async _onSetupCompleted() {
    await this._dashboardContext.sendRequest("getCurrentCompetitionMetadata");
    await this._dashboardContext.sendRequest("enterRound", { roundIndex: 0 });
  }

  render() {
    const loaderStyle = styleMap({
      display: this._requestInProgress ? null : "none",
    });
    return html`
    <div class="container">
      <masters-system-menu id="system-menu"></masters-system-menu>
      <masters-timer-controller id="timer-controller"></masters-timer-controller>
      <div id="tabs-container">
        <masters-tabs id="tabs"></masters-tabs>
        <div class="loader" id="tabs-loader" style=${loaderStyle}>
          <fluent-progress-ring></fluent-progress-ring>
        </div>
      </div>
      <div id="column-view">
        <div class="column column-setup">
          <fluent-card>
            <masters-setup id="setup" @setup-completed=${this._onSetupCompleted}></masters-setup>
          </fluent-card>
        </div>
        <div class="column column-chat">
          <masters-chat id="chat"></masters-chat>
        </div>
        <div class="loader" id="column-view-loader" style=${loaderStyle}>
          <fluent-progress-ring></fluent-progress-ring>
        </div>
      </div>
    </div>
    `;
  }
}
