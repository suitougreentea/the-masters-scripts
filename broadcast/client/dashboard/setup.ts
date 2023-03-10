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
  `;

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  @state()
  private _manual = false;
  @state()
  private _manualNumberOfGames = 10;

  async firstUpdated() {
  }

  private async _startCompetition() {
    await this._dashboardContext.sendRequest("setupCompetition", {
      manual: this._manual,
      manualNumberOfGames: this._manualNumberOfGames,
    });
    this.dispatchEvent(new Event("setup-completed"));
  }

  render() {
    return html`
    <div class="container">
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
      <fluent-button appearance="accent" @click=${this._startCompetition}>大会開始</fluent-button>
    </div>
    `;
  }
}
