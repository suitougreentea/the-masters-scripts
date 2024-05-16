import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import { css, html, LitElement } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { consume } from "@lit-labs/context";
import { NumberField, TextField } from "@fluentui/web-components";
import {
  CompetitionSetupOptions,
  Participant,
  RegisteredPlayerEntry,
} from "../../../common/common_types.ts";
import "./player_registration_dialog.ts";
import "./participants_editor_dialog.ts";
import { MastersPlayerRegistrationDialogElement } from "./player_registration_dialog.ts";
import { MastersParticipantsEditorDialogElement } from "./participants_editor_dialog.ts";
import { formatGroup } from "../../common/util.ts";
import { commonColors } from "../common/common_values.ts";
import { qrcode } from "qrcode";
import { timeToString } from "../../../common/time.ts";

@customElement("masters-setup")
export class MastersSetupElement extends LitElement {
  static styles = css`
    .container {
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

    .qr {
      width: 200px;
      height: 200px;
    }

    #participants {
      table-layout: fixed;
      font-size: 14px;
      border-spacing: 0px;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    #participants tr:nth-child(even) {
      background-color: ${commonColors.tableLightGray};
    }

    #participants th {
      background-color: ${commonColors.tableLightGray};
    }

    #participants tr.error {
      background-color: ${commonColors.tableHighlight};
    }

    #participants td {
      padding: 0px 4px;
    }

    #participants col:nth-child(1) {
      width: 120px;
    }
    #participants col:nth-child(2) {
      width: 70px;
    }

    #participants td:nth-child(1) {
      text-align: left;
      overflow: hidden;
    }
    #participants td:nth-child(2) {
      text-align: center;
    }

    masters-player-registration-dialog, masters-participants-editor-dialog {
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
  @state()
  private _participants: Participant[] = [];
  @state()
  private _registrationUrl: string | null = null;
  @state()
  private _registrationUrlQr: string | null = null;

  // @ts-ignore: ?
  @query("#competition-name", true)
  private _competitionNameTextField!: TextField;
  // @ts-ignore: ?
  @query("#manual-num-games", true)
  private _manualNumberOfGamesNumberField!: NumberField;
  // @ts-ignore: ?
  @query("#preset-name", true)
  private _presetNameTextField!: TextField;
  // @ts-ignore: ?
  @query("masters-player-registration-dialog", true)
  private _playerRegistrationDialog!: MastersPlayerRegistrationDialogElement;
  // @ts-ignore: ?
  @query("masters-participants-editor-dialog", true)
  private _participantsEditorDialog!: MastersParticipantsEditorDialogElement;

  async firstUpdated() {
    const client = await this._dashboardContext.getClient();
    const currentRegisteredPlayersReplicant = await client.getReplicant(
      "currentRegisteredPlayers",
    );
    currentRegisteredPlayersReplicant.subscribe((value) => {
      this._registeredPlayers = value ?? [];
    });

    const currentParticipantsReplicant = await client.getReplicant(
      "currentParticipants",
    );
    currentParticipantsReplicant.subscribe((value) => {
      this._participants = value ?? [];
    });

    const registrationUrlReplicant = await client.getReplicant(
      "registrationUrl",
    );
    registrationUrlReplicant.subscribe(async (value) => {
      this._registrationUrl = value ?? null;
      this._registrationUrlQr = value != null
        ? await qrcode(value) as unknown as string
        : null; // is type definition wrong?
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

  private async _refreshParticipants() {
    await this._dashboardContext.sendRequest("getCurrentParticipants");
  }

  private _openParticipantsEditorDialog() {
    this._participantsEditorDialog.open(
      this._participants,
      this._registeredPlayers.map((player) => player.name),
    );
  }

  private async _setParticipants(participants: Participant[]) {
    await this._dashboardContext.sendRequest("setParticipants", {
      participants,
    });
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

    const participants = this._participants.map((participant) => ({
      ...participant,
      error: (this._registeredPlayers.find((e) => e.name == participant.name) ==
          null || participant.firstRoundGroupIndex == null),
    }));

    // deno-fmt-ignore
    const registrationUrlQr =
      this._registrationUrlQr != null
      ? html`<div>
        <a target="_blank" href=${this._registrationUrl}>
          <img class="qr" src=${this._registrationUrlQr}>
        </a>
      </div>`
      : null;

    // deno-fmt-ignore
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
            ${map(sortedRegisteredPlayers, (player) =>
              html`
              <tr>
                <td>${player.name}</td>
                <td>${timeToString(player.bestTime)}</td>
                <td>${player.comment.split("\n").map((line) => html`${line}<br>`)}</td>
                <td><fluent-button @click=${() => this._openPlayerUpdateDialog(player.originalIndex)}>編集</fluent-button></td>
              </tr>
              `
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2>大会設定</h2>
        <div>
          <fluent-text-field id="competition-name" value="The Masters xxx">大会名:</fluent-text-field>
        </div>
        <div>
          <fluent-checkbox
            @change=${(e: Event) => this._manual = (e.target as HTMLInputElement).checked}
            ?checked=${this._manual}>
            マニュアルモード
          </fluent-checkbox>
        </div>
        <div style=${styleMap({ display: this._manual ? null : "none" })}>
          <fluent-number-field id="manual-num-games"  value="10">試合数:</fluent-number-field>
        </div>
        <div style=${styleMap({ display: this._manual ? "none" : null })}>
          <fluent-checkbox
            @change=${(e: Event) => this._overridePreset = (e.target as HTMLInputElement).checked}
            ?checked=${this._overridePreset}>
            プリセット名を手動で指定
          </fluent-checkbox>
        </div>
        <div style=${styleMap({ display: this._manual || !this._overridePreset ? "none" : null })}>
          <fluent-text-field id="preset-name" value="">プリセット名:</fluent-text-field>
        </div>
        <h3>参加者</h3>
        ${registrationUrlQr}
        <fluent-button appearance="accent" @click=${this._openParticipantsEditorDialog}>編集</fluent-button>
        <fluent-button @click=${this._refreshParticipants}>再読み込み</fluent-button>
        <table id="participants">
          <colgroup>
            <col>
            <col>
            <col>
            <col>
          </colgroup>
          <thead>
            <tr>
              <th>名前</th>
              <th>1回戦組</th>
            </tr>
          </thead>
          <tbody>
            ${map(participants, (participant) =>
              html`
              <tr class=${classMap({ error: participant.error })}>
                <td>${participant.name}</td>
                <td>${participant.firstRoundGroupIndex != null ? formatGroup(participant.firstRoundGroupIndex) : "-"}</td>
              </tr>
              `
            )}
          </tbody>
        </table>
        <fluent-button appearance="accent" @click=${this._confirmStartCompetition}>大会開始</fluent-button>
      </div>
    </fluent-card>

    <masters-player-registration-dialog @update-data=${(e: Event) => {
      const editor = e.target as MastersPlayerRegistrationDialogElement;
      this._registerOrUpdatePlayer(editor.getOldName(), editor.getData());
    }}></masters-player-registration-dialog>
    <masters-participants-editor-dialog @update-data=${(e: Event) => {
      const editor = e.target as MastersParticipantsEditorDialogElement;
      this._setParticipants(editor.getData());
    }}></masters-participants-editor-dialog>
    `;
  }
}
