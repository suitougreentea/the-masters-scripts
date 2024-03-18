import {
  StagePlayerEntry,
  StageScoreEntry,
} from "../../../common/common_types.ts";
import { Grade } from "../../../common/grade.ts";
import {
  formatScoreEditorScore,
  parseScoreEditorScore,
} from "../common/score_editor.ts";
import {
  css,
  customElement,
  FluentButton,
  FluentDialog,
  FluentTextField,
  html,
  LitElement,
  live,
  map,
  query,
  state,
} from "../deps.ts";

type DataEntry = {
  name: string | null;
  level: number | null;
  grade: Grade | null;
  time: number | null;
};
export type ScoreEditorDialogData = { score: StageScoreEntry[] };

@customElement("masters-score-editor-dialog")
export class MastersScoreEditorDialogElement extends LitElement {
  static styles = css`
    .dialog-container {
      padding: 8px;
    }

    .example-entry + .example-entry {
      margin-left: 24px;
    }

    .dialog-buttons {
      text-align: right;
    }
    `;

  private _stageIndex = -1;
  get stageIndex() {
    return this._stageIndex;
  }

  @state()
  _data: DataEntry[] = [];

  // @ts-ignore: ?
  @query("fluent-dialog", true)
  private _dialog!: FluentDialog;

  open(stageIndex: number, players: (StagePlayerEntry | null)[]) {
    this._stageIndex = stageIndex;
    this._data = players.map((e) => {
      return {
        name: e?.name ?? null,
        level: e?.level ?? null,
        grade: e?.grade ?? null,
        time: e?.time ?? null,
      };
    });
    this._dialog.hidden = false;
  }

  private _close(updated: boolean) {
    this._dialog.hidden = true;
    if (updated) {
      this.dispatchEvent(new Event("update-data"));
    }
  }

  setData(data: ScoreEditorDialogData) {
    data.score.forEach((e) => {
      const index = this._data.findIndex((p) => p.name == e.name);
      if (index >= 0) {
        this._data[index].level = e.level;
        this._data[index].grade = e.grade;
        this._data[index].time = e.time;
      }
    });
  }

  getData(): ScoreEditorDialogData {
    const score: StageScoreEntry[] = [];
    this._data.forEach((e) => {
      if (e.name == null) return;
      score.push({
        name: e.name,
        level: e.level,
        grade: e.grade,
        time: e.time,
      });
    });
    return { score };
  }

  isEmpty(): boolean {
    return this._data.every((e) =>
      e.level == null && e.grade == null && e.time == null
    );
  }

  private _changeScore(playerIndex: number, newValue: string) {
    const newScore = [...this._data];
    const currentValues = newScore[playerIndex];
    if (newValue.trim() == "") {
      newScore[playerIndex] = {
        ...currentValues,
        level: null,
        grade: null,
        time: null,
      };
    } else {
      const parsedScore = parseScoreEditorScore(newValue.trim());
      if (parsedScore != null) {
        newScore[playerIndex] = { ...currentValues, ...parsedScore };
      } else {
        newScore[playerIndex] = { ...currentValues };
      }
    }
    this._data = newScore;
  }

  private _checkEnterKey(ev: KeyboardEvent, index: number) {
    if (ev.code == "Enter") {
      if (parseScoreEditorScore((ev.target as FluentTextField).value) != null) {
        const textFields = this.renderRoot.querySelectorAll<FluentTextField>(
          "fluent-text-field",
        );
        const okButton = this.renderRoot.querySelector<FluentButton>(
          ".dialog-buttons fluent-button:first-child",
        )!;
        for (let targetIndex = index + 1; targetIndex < 8; targetIndex++) {
          if (!textFields[targetIndex].disabled) {
            textFields[targetIndex].focus();
            ev.preventDefault();
            return;
          }
        }
        okButton.focus();
        ev.preventDefault();
        return;
      }
    }
  }

  render() {
    return html`
    <fluent-dialog id="dialog-edit-stage-score" hidden trap-focus modal style="--dialog-width: 350px; --dialog-height: 460px;">
      <div class="dialog-container">
        <table>
          <thead>
            <tr>
              <th>名前</th>
              <th>スコア</th>
            </tr>
          </thead>
          <tbody>
            ${
      map(this._data, (e, i) => {
        const disabled = e.name == null;
        return html`
              <tr>
                <td>${e.name}</td>
                <td><fluent-text-field ?disabled=${disabled} .value=${
          live(formatScoreEditorScore(e))
        } @change=${(ev: Event) =>
          this._changeScore(
            i,
            (ev.target as FluentTextField).value,
          )} @keydown=${(ev: KeyboardEvent) =>
          this._checkEnterKey(ev, i)}></fluent-text-field></td>
              </tr>`;
      })
    }
          </tbody>
        <table>
        <div>
          <div><b>入力例:</b></div>
          <div>
            <span class="example-entry">443</span>
            <span class="example-entry">9:32.10</span>
            <span class="example-entry">S9 9:32:10</span>
            <span class="example-entry">S9 93210</span>
          </div>
        </div>
        <div class="dialog-buttons">
          <fluent-button appearance="accent" @click=${() =>
      this._close(true)}>OK</fluent-button>
          <fluent-button @click=${() =>
      this._close(false)}>キャンセル</fluent-button>
        </div>
      </div>
    </fluent-dialog>
    `;
  }
}
