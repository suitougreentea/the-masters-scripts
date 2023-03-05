import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import {
  consume,
  customElement,
  html,
  LitElement,
  query,
  Replicant,
  state,
} from "../deps.ts";

@customElement("masters-setup")
export class MastersSetupElement extends LitElement {
  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  // @ts-ignore: ?
  @query("#title", true)
  private _titleInput!: HTMLInputElement;
  // @ts-ignore: ?
  @query("#set-info", true)
  private _setInfoButton!: HTMLButtonElement;

  private _titleReplicant!: Replicant<string>;

  @state()
  private _title = "";

  async firstUpdated() {
    const client = await this._dashboardContext.getClient();

    this._titleReplicant = await client.getReplicant("title");
    this._titleReplicant.subscribe((value) => {
      this._title = value ?? "";
    });
    this._setInfoButton.onclick = (_) => {
      this._titleReplicant.setValue(this._titleInput.value);
    };
  }

  render() {
    return html`
    <div class="container">
      <input id="title" value=${this._title}></input>
      <button id="set-info">Set</button>
    </div>
    `;
  }
}
