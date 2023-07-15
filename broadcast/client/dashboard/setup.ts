import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import {
  consume,
  css,
  customElement,
  FluentNumberField,
  FluentTextField,
  html,
  LitElement,
  map,
  query,
  state,
} from "../deps.ts";
import {
  CompetitionSetupOptions,
  RegisteredPlayerEntry,
} from "../../common/common_types.ts";
import "./player_registration_dialog.ts";
import { MastersPlayerRegistrationDialogElement } from "./player_registration_dialog.ts";
import { formatTime } from "../../common/util.ts";
import { commonColors } from "../common/common_values.ts";

@customElement("masters-setup")
export class MastersSetupElement extends LitElement {
  static styles = css`
    .container {
      width: calc(100vw - 312px);
      height: calc(100vh - 32px);
      overflow-y: scroll;
      padding: 8px;
      display: flex;
      justify-content: space-between;
    }

    .container div:nth-child(1) {
      width: 480px;
    }
    .container div:nth-child(2) {
      width: 440px;
    }

    #registered-players {
      width: 480px;
      table-layout: fixed;
      font-size: 14px;
      border-spacing: 0px;
      margin-top: 8px;
    }

    #registered-players tr:nth-child(even) {
      background-color: ${commonColors.tableLightGray};
    }

    #registered-players th {
      background-color: ${commonColors.tableLightGray};
    }

    #registered-players td {
      padding: 0px 4px;
    }

    #registered-players col:nth-child(1) {
      width: 100px;
    }
    #registered-players col:nth-child(2) {
      width: 70px;
    }
    #registered-players col:nth-child(4) {
      width: 60px;
    }

    #registered-players th:nth-child(2) {
      font-size: 90%;
    }

    #registered-players td:nth-child(1) {
      text-align: left;
      overflow: hidden;
    }

    #registered-players td:nth-child(2) {
      text-align: right;
    }

    #registered-players td:nth-child(3) {
      text-align: left;
      word-wrap: break-word;
      overflow: hidden;
    }

    #registered-players td:nth-child(4) {
      text-align: center;
    }

    masters-player-registration-dialog {
      position: relative;
      z-index: 10000;
    }
  `;

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  @state()
  private _registeredPlayers: RegisteredPlayerEntry[] = [];
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
  // @ts-ignore: ?
  @query("masters-player-registration-dialog", true)
  private _playerRegistrationDialog!: MastersPlayerRegistrationDialogElement;

  async firstUpdated() {
    const client = await this._dashboardContext.getClient();
    const currentRegisteredPlayersReplicant = await client.getReplicant(
      "currentRegisteredPlayers",
    );
    currentRegisteredPlayersReplicant.subscribe((value) => {
      this._registeredPlayers = value ?? [];
    });
  }

  private async _refreshRegisteredPlayers() {
    await this._dashboardContext.sendRequest("getCurrentRegisteredPlayers");
  }

  private _openPlayerRegistrationDialog() {
    this._playerRegistrationDialog.openRegister();
  }

  private _openPlayerUpdateDialog(index: number) {
    const player = this._registeredPlayers[index];
    this._playerRegistrationDialog.openUpdate(player);
  }

  private async _registerOrUpdatePlayer(
    oldName: string | null,
    data: RegisteredPlayerEntry,
  ) {
    if (oldName == null) {
      await this._dashboardContext.sendRequest("registerPlayer", { data });
    } else {
      await this._dashboardContext.sendRequest("updatePlayer", {
        oldName,
        data,
      });
    }
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
    const sortedRegisteredPlayers = this._registeredPlayers.map((
      player,
      i,
    ) => ({ ...player, originalIndex: i }));
    sortedRegisteredPlayers.sort((a, b) => a.name.localeCompare(b.name));
    return html`
    <fluent-card class="container">
      <div>
        <h2>登録プレイヤー一覧</h2>
        <fluent-button appearance="accent" @click=${this._openPlayerRegistrationDialog}>新規登録</fluent-button>
        <fluent-button @click=${this._refreshRegisteredPlayers}>再読み込み</fluent-button>
        <table id="registered-players">
          <colgroup>
            <col>
            <col>
            <col>
            <col>
          </colgroup>
          <thead>
            <tr>
              <th>名前</th>
              <th>自己ベスト</th>
              <th>コメント</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${
      map(sortedRegisteredPlayers, (player) =>
        html`
            <tr>
              <td>${player.name}</td>
              <td>${formatTime(player.bestTime)}</td>
              <td>${
          player.comment.split("\n").map((line) => html`${line}<br>`)
        }</td>
              <td><fluent-button @click=${() =>
          this._openPlayerUpdateDialog(
            player.originalIndex,
          )}>編集</fluent-button></td>
            </tr>
            `)
    }
          </tbody>
        </table>
      </div>

      <div>
        <h2>大会設定</h2>
        <div>スプレッドシート側で大会名と参加者を記入してください<br>将来のバージョンではここで入力できるようになります</div>
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
      </div>
    </fluent-card>

    <masters-player-registration-dialog @update-data=${(e: Event) => {
      const editor = e.target as MastersPlayerRegistrationDialogElement;
      this._registerOrUpdatePlayer(editor.getOldName(), editor.getData());
    }}></masters-player-registration-dialog>
    `;
  }
}
