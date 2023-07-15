import { Participant } from "../../common/common_types.ts";
import { formatGroup, parseGroup } from "../../common/util.ts";
import { commonColors } from "../common/common_values.ts";
import {
  classMap,
  css,
  customElement,
  FluentDialog,
  FluentTextField,
  html,
  LitElement,
  live,
  map,
  query,
  state,
} from "../deps.ts";

@customElement("masters-participants-editor-dialog")
export class MastersParticipantsEditorDialogElement extends LitElement {
  static styles = css`
    .dialog-container {
      padding: 8px;
      user-select: none;
    }

    .table-container {
      height: 400px;
      overflow-y: scroll;
    }

    table {
      table-layout: fixed;
    }

    table tr.error {
      background-color: ${commonColors.tableHighlight};
    }

    table td:nth-child(1) {
      width: 250px;
    }
    table td:nth-child(2) {
      width: 100px;
    }

    table fluent-text-field {
      width: 100%;
    }

    .dialog-buttons {
      margin-top: 8px;
      text-align: right;
    }
    `;

  private _registeredNames: string[] = [];

  @state()
  private _participants: Participant[] = [];

  // @ts-ignore: ?
  @query("fluent-dialog", true)
  private _dialog!: FluentDialog;

  open(participants: Participant[], registeredNames: string[]) {
    this._participants = participants;
    this._registeredNames = registeredNames;
    this._dialog.hidden = false;
  }

  private _close(updated: boolean) {
    this._dialog.hidden = true;
    if (updated) {
      this.dispatchEvent(new Event("update-data"));
    }
  }

  getData(): Participant[] {
    return this._participants;
  }

  private _clear() {
    this._participants = [];
  }

  private _changeName(index: number, input: string) {
    const participants = [...this._participants];
    if (index >= this._participants.length) {
      participants.push({ name: input, firstRoundGroupIndex: null });
    } else {
      participants[index] = { ...participants[index], name: input };
    }

    if (
      participants[index].name == "" &&
      participants[index].firstRoundGroupIndex == null
    ) {
      participants.splice(index, 1);
    }

    this._participants = participants;
  }

  private _changeFirstRoundGroup(index: number, input: string) {
    const participants = [...this._participants];
    if (index >= this._participants.length) {
      participants.push({ name: "", firstRoundGroupIndex: parseGroup(input) });
    } else {
      participants[index] = {
        ...participants[index],
        firstRoundGroupIndex: parseGroup(input),
      };
    }

    if (
      participants[index].name == "" &&
      participants[index].firstRoundGroupIndex == null
    ) {
      participants.splice(index, 1);
    }

    this._participants = participants;
  }

  private _checkEnterKey(_ev: KeyboardEvent) {
    // TODO: 不具合多いので今のところ塞いでる
    return;
    /*
    if (ev.code == "Enter") {
      ev.preventDefault();
      await this.updateComplete;

      const textFields = this.renderRoot.querySelectorAll<FluentTextField>(
        "fluent-text-field",
      );
      const okButton = this.renderRoot.querySelector<FluentButton>(
        ".dialog-buttons fluent-button:first-child",
      )!;
      const index = Array.from(textFields).indexOf(ev.target as FluentTextField);
      if (index < 0) return;

      for (let targetIndex = index + 1; targetIndex < textFields.length; targetIndex++) {
        if (!textFields[targetIndex].disabled) {
          textFields[targetIndex].focus();
          return;
        }
      }
      okButton.focus();
    }
    */
  }

  render() {
    // one empty slot for new entry
    const participantsForRender = [...this._participants, {
      name: "",
      firstRoundGroupIndex: null,
    }].map((participant, i) => ({
      ...participant,
      error: i != this._participants.length &&
        (this._registeredNames.indexOf(participant.name) < 0 ||
          participant.firstRoundGroupIndex == null),
    }));

    return html`
    <fluent-dialog id="dialog-player-registration" hidden trap-focus modal style="--dialog-width: 400px; --dialog-height: 460px;">
      <div class="dialog-container">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>名前</th>
                <th>1回戦組</th>
              </tr>
            </thead>
            <tbody>
              ${
      map(participantsForRender, (participant, i) =>
        html`
              <tr class=${classMap({ error: participant.error })}>
                <td>
                  <fluent-text-field .value=${
          live(participant.name)
        } @change=${(ev: Event) =>
          this._changeName(
            i,
            (ev.target as FluentTextField).value,
          )} @keydown=${this._checkEnterKey}></fluent-text-field>
                </td>
                <td>
                  <fluent-text-field .value=${
          live(
            participant.firstRoundGroupIndex != null
              ? formatGroup(participant.firstRoundGroupIndex)
              : "",
          )
        } @change=${(ev: Event) => {
          this._changeFirstRoundGroup(i, (ev.target as FluentTextField).value);
          this.requestUpdate();
        }} @keydown=${this._checkEnterKey}></fluent-text-field>
                </td>
              </tr>
              `)
    }
            </tbody>
          </table>
        </div>
        <div class="dialog-buttons">
          <fluent-button appearance="accent" @click=${() =>
      this._close(true)}>OK</fluent-button>
          <fluent-button @click=${() =>
      this._close(false)}>キャンセル</fluent-button>
          <fluent-button @click=${() => this._clear()}>全削除</fluent-button>
        </div>
      </div>
    </fluent-dialog>
    `;
  }
}
