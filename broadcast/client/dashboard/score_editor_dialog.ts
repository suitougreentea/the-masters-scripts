import {
  StagePlayerEntry,
  StageScoreEntry,
} from "../../../common/common_types.ts";
import { formatGrade, formatTime, parseGrade } from "../../common/util.ts";
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
  grade: number | null;
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

  // TODO: Experimental
  setData(data: ScoreEditorDialogData) {
    data.score.forEach((e) => {
      const index = this._data.findIndex(p => p.name == e.name);
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
      const parsedScore = this._parseScore(newValue.trim());
      if (parsedScore != null) {
        newScore[playerIndex] = { ...currentValues, ...parsedScore };
      } else {
        newScore[playerIndex] = { ...currentValues };
      }
    }
    this._data = newScore;
  }

  private _parseScore(
    value: string,
  ):
    | { level: number | null; grade: number | null; time: number | null }
    | null {
    const levelMatch = value.match(/^\d{1,3}$/);
    if (levelMatch) {
      return { level: Number(levelMatch[0]), grade: null, time: null };
    }
    const gradeAndTimeMatch = value.match(
      /^((S[456789]|GM) +)?(((\d{1,2}):(\d{1,2})[:\.](\d{1,2}))|((\d{1,2})(\d\d)(\d\d)))$/,
    );
    if (gradeAndTimeMatch) {
      const grade = parseGrade(gradeAndTimeMatch[2] ?? "GM");
      const longTime = gradeAndTimeMatch.slice(5, 8);
      const shortTime = gradeAndTimeMatch.slice(9, 12);
      let time: number;
      if (longTime[0] != null) {
        time = Number(longTime[0]) * 60000 + Number(longTime[1]) * 1000 +
          Number(longTime[2].padEnd(2, "0")) * 10;
      } else if (shortTime[0] != null) {
        time = Number(shortTime[0]) * 60000 + Number(shortTime[1]) * 1000 +
          Number(shortTime[2]) * 10;
      } else {
        throw new Error();
      }
      return { level: 999, grade, time };
    }
    return null;
  }

  private _formatScore(
    score: { level: number | null; grade: number | null; time: number | null },
  ): string {
    if (score.level != null && score.grade == null && score.time == null) {
      return String(score.level);
    }
    if (score.grade != null && score.time != null) {
      return `${formatGrade(score.grade)} ${formatTime(score.time)}`;
    }
    if (score.grade == null && score.time != null) {
      return `GM ${formatTime(score.time)}`;
    }
    return "";
  }

  private _checkEnterKey(ev: KeyboardEvent, index: number) {
    if (ev.code == "Enter") {
      if (this._parseScore((ev.target as FluentTextField).value) != null) {
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
          live(this._formatScore(e))
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
