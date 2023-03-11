import {
  StagePlayerEntry,
  StageScoreEntry,
} from "../../common/common_types.ts";
import {
  formatLevelOrGradeNullable,
  formatTimeNullable,
  parseGrade,
  parseLevelOrGrade,
  parseTime,
} from "../../common/util.ts";
import {
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

    .dialog-buttons {
      text-align: right;
    }
    `;

  @state()
  _data: DataEntry[] = [];

  // @ts-ignore: ?
  @query("fluent-dialog", true)
  private _dialog!: FluentDialog;

  open(players: (StagePlayerEntry | null)[]) {
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

  private _changeScore(playerIndex: number, column: string, newValue: string) {
    const newScore = [...this._data];
    const currentValues = newScore[playerIndex];
    if (column == "levelOrGrade") {
      const { level, grade } = parseLevelOrGrade(newValue);
      if (level == null && grade == null) {
        if (currentValues.time != null) {
          // GMを埋める
          newScore[playerIndex] = {
            ...currentValues,
            level: 999,
            grade: parseGrade("GM"),
          };
        } else {
          // 空に
          newScore[playerIndex] = {
            ...currentValues,
            level,
            grade,
          };
        }
      } else if (level != null && grade == null) {
        // 窒息時なので時間を消す
        newScore[playerIndex] = {
          ...currentValues,
          level,
          grade,
          time: null,
        };
      } else {
        // 完走時
        newScore[playerIndex] = {
          ...currentValues,
          level,
          grade,
        };
      }
    } else if (column == "time") {
      const time = parseTime(newValue);
      if (time != null) {
        if (currentValues.grade != null) {
          // 段位そのまま
          newScore[playerIndex] = {
            ...currentValues,
            level: 999,
            time,
          };
        } else {
          // GMを埋める
          newScore[playerIndex] = {
            ...currentValues,
            level: 999,
            grade: parseGrade("GM"),
            time,
          };
        }
      } else {
        // 時間を空に
        newScore[playerIndex] = {
          ...currentValues,
          time,
        };
      }
    }
    this._data = newScore;
  }

  private _clearScore(playerIndex: number) {
    const newScore = [...this._data];
    const currentValues = newScore[playerIndex];
    newScore[playerIndex] = {
      ...currentValues,
      level: null,
      grade: null,
      time: null,
    };
    this._data = newScore;
  }

  render() {
    return html`
    <fluent-dialog id="dialog-edit-stage-score" hidden trap-focus modal style="--dialog-width: 500px; --dialog-height: 430px;">
      <div class="dialog-container">
        <table>
          <thead>
            <tr>
              <th>名前</th>
              <th>レベル/段位</th>
              <th>タイム</th>
              <th></th>
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
          live(
            formatLevelOrGradeNullable({ level: e.level, grade: e.grade }) ??
              "",
          )
        } @change=${(e: Event) =>
          this._changeScore(
            i,
            "levelOrGrade",
            (e.target as FluentTextField).value,
          )}></fluent-text-field></td>
                <td><fluent-text-field ?disabled=${disabled} .value=${
          live(formatTimeNullable(e.time) ?? "")
        } @change=${(e: Event) =>
          this._changeScore(
            i,
            "time",
            (e.target as FluentTextField).value,
          )}></fluent-text-field></td>
                <td><fluent-button ?disabled=${disabled} @click=${() =>
          this._clearScore(i)}>Clear</fluent-button></td>
              </tr>`;
      })
    }
          </tbody>
        <table>
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
