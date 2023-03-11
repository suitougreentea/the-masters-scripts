import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import {
  consume,
  css,
  customElement,
  FluentNumberField,
  html,
  LitElement,
  state,
} from "../deps.ts";

@customElement("masters-setup")
export class MastersSetupElement extends LitElement {
  static styles = css`
    .container {
      padding: 8px;
    }
  `;

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  @state()
  private _manual = false;
  @state()
  private _manualNumberOfGames = 10;

  async firstUpdated() {
  }

  private async _confirmStartCompetition() {
    if (
      await this._dashboardContext.confirm(
        "大会を開始してよろしいですか？現在進行中の大会の情報は失われます。",
      )
    ) {
      await this._dashboardContext.sendRequest("setupCompetition", {
        manual: this._manual,
        manualNumberOfGames: this._manualNumberOfGames,
      });
      this.dispatchEvent(new Event("setup-completed"));
    }
  }

  render() {
    return html`
    <fluent-card class="container">
      <h2>大会設定</h2>
      <div>スプレッドシート側で大会名と参加者を記入してください<br>将来のバージョンではここで入力できるようになります</div>
      <div>
        <fluent-checkbox @change=${(e: Event) =>
      this._manual = (e.target as HTMLInputElement)
        .checked} ?checked=${this._manual}>マニュアルモード</fluent-checkbox>
      </div>
      <div>
        <fluent-number-field value=${this._manualNumberOfGames} @change=${(
      e: Event,
    ) =>
      this._manualNumberOfGames = Number(
        (e.target as FluentNumberField).value,
      )} ?disabled=${!this._manual}>試合数:</fluent-number-field>
      </div>
      <fluent-button appearance="accent" @click=${this._confirmStartCompetition}>大会開始</fluent-button>
    </fluent-card>
    `;
  }
}
