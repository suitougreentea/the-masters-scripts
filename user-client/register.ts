import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { stringToTimeFuzzy, timeToString } from "../common/time.ts";
import {
  AddParticipantArgs,
  QueryPlayerResult,
  RegisterPlayerArgs,
  UpdatePlayerArgs,
} from "../common/user_server_types.ts";
import {
  fluentButton,
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

  private _oldName: string | null = null;

  private async _findPlayer() {
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
  }

  private async _registerOrUpdatePlayer() {
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
    const name = this._name;
    await sendRequest(
      "/register/addParticipant",
      { name } as AddParticipantArgs,
    );
    this._participating = true;
  }

  render() {
    return html`
    <div id="root">
      <div class="row">
        <fluent-text-field
          .value=${live(this._name)}
          @change=${(ev: Event) => this._name = (ev.target as TextField).value}
        >
          ${
      this._oldName == null
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
          .value=${
      live(this._bestTime != null ? timeToString(this._bestTime) : "")
    }
          @change=${(ev: Event) => {
      this._bestTime = stringToTimeFuzzy((ev.target as TextField).value);
      this.requestUpdate();
    }}
        >自己ベスト</fluent-text-field>
      </div>
      <div class="row">
        <fluent-text-area
          ?disabled=${!this._queryCompleted}
          .value=${live(this._comment)}
          @change=${(ev: Event) =>
      this._comment = (ev.target as TextArea).value}
        >コメント</fluent-text-area>
      </div>
      <div class="row">
        <fluent-button appearance="accent"
          ?disabled=${!this._queryCompleted}
          @click=${this._registerOrUpdatePlayer}
        >${this._oldName == null ? "情報の登録" : "情報の更新"}</fluent-button>
      </div>
      <div class="row">
        <fluent-button appearance="accent"
          ?disabled=${this._oldName == null || this._participating}
          @click=${this._participate}
        >${this._participating ? "参加登録済" : "参加登録"}</fluent-button>
      </div>
    </div>
    `;
  }
}
