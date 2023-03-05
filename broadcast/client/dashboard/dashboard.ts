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

    #system-menu {
      position: absolute;
      right: 8px;
    }

    #column-view {
      flex-grow: 1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }

    .column {
      box-sizing: border-box;
    }

    .column + .column {
      border-left: 1px solid rgb(128, 128, 128);
    }

    #setup {
      grid-column: 3;
    }

    #chat {
      grid-column: 4;
    }
    `;
  private _initializedPromise = createPromiseSet();

  // @ts-ignore: ?
  @query("#timer-controller", true)
  private _timerController!: MastersTimerControllerElement;

  @provide({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;
  private _clientPromiseResolve!: (
    client: denocg.Client<TypeDefinition>,
  ) => void;

  constructor() {
    super();

    const { promise, resolve } = createPromiseSet<
      denocg.Client<TypeDefinition>
    >();
    this._dashboardContext = {
      getClient(): Promise<denocg.Client<TypeDefinition>> {
        return promise;
      },
    };
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

  render() {
    return html`
    <div class="container">
      <masters-system-menu id="system-menu"></masters-system-menu>
      <masters-timer-controller id="timer-controller"></masters-timer-controller>
      <masters-tabs id="tabs"></masters-tabs>
      <div id="column-view">
        <masters-setup id="setup" class="column"></masters-setup>
        <masters-chat id="chat" class="column"></masters-chat>
      </div>
    </div>
    `;
  }
}
