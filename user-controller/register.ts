import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { classMap } from "lit/directives/class-map.js";
import { stringToTimeFuzzy, timeToString } from "../common/time.ts";
import {
  AddParticipantArgs,
  QueryPlayerResult,
  RegisterPlayerArgs,
  UpdatePlayerArgs,
} from "../common/user_controller_server_types.ts";
import {
  fluentButton,
  fluentProgressRing,
  fluentTextArea,
  fluentTextField,
  provideFluentDesignSystem,
  TextArea,
  TextField,
} from "@fluentui/web-components";
import { RegisteredPlayerEntry } from "../common/common_types.ts";
provideFluentDesignSystem().register(
  fluentButton(),
  fluentTextArea(),
  fluentTextField(),
  fluentProgressRing(),
);

const sendRequest = async (uri: string, args: unknown): Promise<unknown> => {
  const response = await fetch(uri, {
    method: "POST",
    body: JSON.stringify(args),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("Invalid response");
  }
  if (body.error != null) {
    throw new Error(body.error);
  }
  return body;
};

@customElement("masters-register")
export class MastersPlayerInfoElement extends LitElement {
  static styles = css`
  #root {
    margin: 1.5em;
  }

  .row {
    width: 100%;
    margin: 10px 0;
    display: flex;
    > * {
      flex-grow: 1;
    }
  }

  .message {
    padding: 0.5em;
    border-width: 1px;
    border-style: solid;
    border-radius: 0.2em;
  }

  .message-hidden {
    display: none;
  }

  .message-info {
    background-color: #ecf6fd;
    border-color: #44aaee;
  }

  .message-error {
    background-color: #ffeaef;
    border-color: #ff3366;
  }

  .loader {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  `;

  @state()
  private _name: string = "";
  @state()
  private _bestTime: number | null = null;
  @state()
  private _comment: string = "";
  @state()
  private _participating: boolean = false;
  @state()
  private _queryCompleted: boolean = false;
  @state()
  private _showLoader: boolean = false;
  @state()
  private _currentMessage: { type: number; message: string } | null = null;

  private _oldName: string | null = null;
  private _currentMessageTimeout: number | null = null;

  private async _withLoaderAndMessage(body: () => Promise<string>) {
    try {
      this._showLoader = true;
      const okMessage = await body();
      this._showMessage(0, okMessage);
    } catch (e) {
      const errorMessage = (e as Error).message;
      this._showMessage(1, errorMessage);
    } finally {
      this._showLoader = false;
    }
  }

  private _showMessage(type: number, message: string) {
    if (this._currentMessageTimeout != null) {
      clearTimeout(this._currentMessageTimeout);
      this._currentMessageTimeout = null;
    }
    this._currentMessage = { type, message };
    // TODO: currently editing control is reset when timeout because of live directive
    /*
    this._currentMessageTimeout = setTimeout(() => {
      this._currentMessage = null;
      this._currentMessageTimeout = null;
    }, 3000);
    */
  }

  private async _findPlayer() {
    await this._withLoaderAndMessage(async () => {
      await this._findPlayerCore();
      return "検索完了";
    });
  }

  private async _findPlayerCore() {
    try {
      if (this._name == "") throw new Error("名前が空です");
      const json = await sendRequest("/register/queryPlayer", {
        name: this._name,
      }) as QueryPlayerResult;
      if (json.registeredPlayerEntry != null) {
        this._oldName = json.registeredPlayerEntry.name;
        this._bestTime = json.registeredPlayerEntry.bestTime;
        this._comment = json.registeredPlayerEntry.comment;
      } else {
        this._oldName = null;
        this._bestTime = null;
        this._comment = "";
      }
      this._queryCompleted = true;
      this._participating = json.participating;
    } catch (e) {
      this._oldName = null;
      this._bestTime = null;
      this._comment = "";
      this._queryCompleted = false;
      this._participating = false;
      throw e;
    }
  }

  private async _registerOrUpdatePlayer() {
    await this._withLoaderAndMessage(async () => {
      await this._registerOrUpdatePlayerCore();
      await this._findPlayerCore();
      return "登録完了";
    });
  }

  private async _registerOrUpdatePlayerCore() {
    if (this._name == "") throw new Error("名前が空です");
    if (this._bestTime == null) throw new Error("タイムが空です");
    const playerEntry: RegisteredPlayerEntry = {
      name: this._name,
      bestTime: this._bestTime,
      comment: this._comment,
    };

    if (this._oldName == null) {
      await sendRequest(
        "/register/registerPlayer",
        { playerEntry } as RegisterPlayerArgs,
      );
    } else {
      await sendRequest(
        "/register/updatePlayer",
        { oldName: this._oldName, playerEntry } as UpdatePlayerArgs,
      );
    }
    this._oldName = this._name;
  }

  private async _participate() {
    await this._withLoaderAndMessage(async () => {
      await this._participateCore();
      return "登録完了";
    });
  }

  private async _participateCore() {
    const name = this._name;
    await sendRequest(
      "/register/addParticipant",
      { name } as AddParticipantArgs,
    );
    this._participating = true;
  }

  render() {
    let loader = html``;
    if (this._showLoader) {
      // deno-fmt-ignore
      loader = html`
      <div class="loader">
        <fluent-progress-ring class="spinner"></fluent-progress-ring>
      </div>
      `;
    }

    // deno-fmt-ignore
    return html`
    <div id="root">
      <div class="row">
        <fluent-text-field
          .value=${live(this._name)}
          @change=${(ev: Event) => this._name = (ev.target as TextField).value.trim()}>
          ${this._oldName == null
            ? "プレイヤー名"
            : `プレイヤー名 (これまで: ${this._oldName})`
          }
        </fluent-text-field>
      </div>
      <div class="row">
        <fluent-button appearance="accent" @click=${this._findPlayer}>
          ${this._queryCompleted ? "再検索" : "検索"}
        </fluent-button>
      </div>
      <hr>
      <div class="row">
        <fluent-text-field
          ?disabled=${!this._queryCompleted}
          .value=${live(this._bestTime != null ? timeToString(this._bestTime) : "")}
          @change=${(ev: Event) => {
            this._bestTime = stringToTimeFuzzy((ev.target as TextField).value);
            this.requestUpdate();
          }}>
          自己ベスト
        </fluent-text-field>
      </div>
      <div class="row">
        <fluent-text-area
          ?disabled=${!this._queryCompleted}
          .value=${live(this._comment)}
          @change=${(ev: Event) => this._comment = (ev.target as TextArea).value}>
          コメント
        </fluent-text-area>
      </div>
      <div class="row">
        <fluent-button appearance="accent"
          ?disabled=${!this._queryCompleted}
          @click=${this._registerOrUpdatePlayer}>
          ${this._oldName == null ? "情報の登録" : "情報の更新"}
        </fluent-button>
      </div>
      <div class="row">
        <fluent-button appearance="accent"
          ?disabled=${this._oldName == null || this._participating}
          @click=${this._participate}>
          ${this._participating ? "参加登録済" : "参加登録"}
        </fluent-button>
      </div>
      <div
        class=${classMap({
          "message": true,
          "message-hidden": this._currentMessage == null,
          "message-info": this._currentMessage?.type == 0,
          "message-error": this._currentMessage?.type == 1,
        })}>
        ${this._currentMessage?.message}
      </div>
      ${loader}
    </div>
    `;
  }
}
