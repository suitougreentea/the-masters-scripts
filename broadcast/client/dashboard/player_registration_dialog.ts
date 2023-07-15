import { RegisteredPlayerEntry } from "../../common/common_types.ts";
import { formatTime, parseTime } from "../../common/util.ts";
import {
  css,
  customElement,
  FluentDialog,
  FluentTextField,
  html,
  LitElement,
  live,
  query,
  state,
} from "../deps.ts";

@customElement("masters-player-registration-dialog")
export class MastersPlayerRegistrationDialogElement extends LitElement {
  static styles = css`
    .dialog-container {
      padding: 8px;
      user-select: none;
    }

    fluent-text-field {
      width: 100%;
    }

    fluent-text-area {
      width: 100%;
      --base-height-multiplier: 15;
      /* height: 150px; */
    }

    .dialog-buttons {
      margin-top: 8px;
      text-align: right;
    }
    `;

  @state()
  private _oldName: string | null = null;
  @state()
  private _name = "";
  @state()
  private _bestTime: number | null = null;
  @state()
  private _comment = "";

  // @ts-ignore: ?
  @query("fluent-dialog", true)
  private _dialog!: FluentDialog;

  openRegister() {
    this._oldName = null;
    this._name = "";
    this._bestTime = null;
    this._comment = "";
    this._dialog.hidden = false;
  }

  openUpdate(player: RegisteredPlayerEntry) {
    this._oldName = player.name;
    this._name = player.name;
    this._bestTime = player.bestTime;
    this._comment = player.comment;
    this._dialog.hidden = false;
  }

  private _close(updated: boolean) {
    this._dialog.hidden = true;
    if (updated) {
      this.dispatchEvent(new Event("update-data"));
    }
  }

  getOldName(): string | null {
    return this._oldName;
  }

  getData(): RegisteredPlayerEntry {
    return {
      name: this._name,
      bestTime: this._bestTime!,
      comment: this._comment,
    };
  }

  render() {
    const isInvalid = this._bestTime == null;

    return html`
    <fluent-dialog id="dialog-player-registration" hidden trap-focus modal style="--dialog-width: 400px; --dialog-height: 325px;">
      <div class="dialog-container">
        <div>
          <fluent-text-field .value=${live(this._name)} @change=${(ev: Event) =>
      this._name =
        (ev.target as FluentTextField).value}>名前</fluent-text-field>
        </div>
        <div>
          <fluent-text-field .value=${
      live(this._bestTime != null ? formatTime(this._bestTime) : "")
    } @change=${(ev: Event) => {
      this._bestTime = parseTime((ev.target as FluentTextField).value);
      this.requestUpdate();
    }}>自己ベスト</fluent-text-field>
        </div>
        <div>
          <fluent-text-area .value=${live(this._comment)} @change=${(
      ev: Event,
    ) =>
      this._comment =
        (ev.target as FluentTextField).value}>コメント</fluent-text-area>
        </div>
        <div class="dialog-buttons">
          <fluent-button appearance="accent" @click=${() =>
      this._close(true)} ?disabled=${isInvalid}>OK</fluent-button>
          <fluent-button @click=${() =>
      this._close(false)}>キャンセル</fluent-button>
        </div>
      </div>
    </fluent-dialog>
    `;
  }
}
