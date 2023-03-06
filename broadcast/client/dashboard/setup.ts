import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import {
  consume,
  css,
  customElement,
  FluentTextField,
  html,
  LitElement,
  query,
  Replicant,
  state,
} from "../deps.ts";

@customElement("masters-setup")
export class MastersSetupElement extends LitElement {
  static styles = css`
  `;

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  // @ts-ignore: ?
  @query("#title", true)
  private _titleInput!: FluentTextField;
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
      <h2>大会設定</h2>
      <fluent-text-field id="title" value=${this._title} style="width:100%"></fluent-text-field><br>
      <fluent-button appearance="accent" id="set-info">Set</fluent-button>
    </div>
    `;
  }
}
