import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import {
  consume,
  css,
  customElement,
  FluentNumberField,
  FluentTextField,
  html,
  LitElement,
  query,
  state,
} from "../deps.ts";
import { CompetitionSetupOptions } from "../../common/common_types.ts";

@customElement("masters-setup")
export class MastersSetupElement extends LitElement {
  static styles = css`
    .container {
      overflow-y: scroll;
      padding: 8px;
    }
  `;

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  @state()
  private _manual = false;
  @state()
  private _overridePreset = false;

  // @ts-ignore: ?
  @query("#competition-name", true)
  private _competitionNameTextField!: FluentTextField;
  // @ts-ignore: ?
  @query("#manual-num-games", true)
  private _manualNumberOfGamesNumberField!: FluentNumberField;
  // @ts-ignore: ?
  @query("#preset-name", true)
  private _presetNameTextField!: FluentTextField;

  async firstUpdated() {
  }

  private async _refreshRegisteredPlayers() {
    await this._dashboardContext.sendRequest("getCurrentRegisteredPlayers");
  }

  private async _confirmStartCompetition() {
    if (
      await this._dashboardContext.confirm(
        "大会を開始してよろしいですか？現在進行中の大会の情報は失われます。",
      )
    ) {
      const options: CompetitionSetupOptions = {
        name: String(this._competitionNameTextField.value),
        manualNumberOfGames: this._manual
          ? Number(this._manualNumberOfGamesNumberField.value)
          : undefined,
        overridePresetName: (!this._manual && this._overridePreset)
          ? String(this._presetNameTextField.value)
          : undefined,
      };
      await this._dashboardContext.sendRequest("setupCompetition", { options });
      this.dispatchEvent(new Event("setup-completed"));
    }
  }

  render() {
    return html`
    <fluent-card class="container">
      <h2>大会設定</h2>
      <div>スプレッドシート側で大会名と参加者を記入してください<br>将来のバージョンではここで入力できるようになります</div>
      <fluent-button @click=${this._refreshRegisteredPlayers}>登録されているプレイヤーを再読み込み</fluent-button>
      <div>
        <fluent-text-field id="competition-name" value="The Masters xxx">大会名:</fluent-text-field>
      </div>
      <div>
        <fluent-checkbox @change=${(e: Event) =>
      this._manual = (e.target as HTMLInputElement)
        .checked} ?checked=${this._manual}>マニュアルモード</fluent-checkbox>
      </div>
      <div>
        <fluent-number-field id="manual-num-games" value="10" ?disabled=${!this
      ._manual}>試合数:</fluent-number-field>
      </div>
      <div>
        <fluent-checkbox @change=${(e: Event) =>
      this._overridePreset = (e.target as HTMLInputElement)
        .checked} ?checked=${this._overridePreset} ?disabled=${this._manual}>プリセット名を手動で指定</fluent-checkbox>
      </div>
      <div>
        <fluent-text-field id="preset-name" value="" ?disabled=${
      this._manual || !this._overridePreset
    }>プリセット名:</fluent-text-field>
      </div>
      <fluent-button appearance="accent" @click=${this._confirmStartCompetition}>大会開始</fluent-button>
    </fluent-card>
    `;
  }
}
