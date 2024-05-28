import {
  StagePlayerEntry,
  StageScoreEntry,
  StageScoreValue,
} from "../../../common/common_types.ts";
import { ScoreHistory } from "../../common/type_definition.ts";
import {
  formatScoreEditorScore,
  parseScoreEditorScore,
} from "../common/score_editor.ts";
import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { live } from "lit/directives/live.js";
import { Button, Select, TextField } from "@fluentui/web-components";

type ScoreChoice = {
  type: "previous" | "history" | "current";
  score: StageScoreValue;
};
// TODO: score, scoreChoiceIndexだけmutableなので、たぶん分けた方がいい
type DataEntry = {
  name: string;
  score: StageScoreValue;
  scoreChoices: ScoreChoice[];
  scoreChoiceIndex: number;
};
export type ScoreEditorDialogData = { score: StageScoreEntry[] };

const formatChoiceType = (type: ScoreChoice["type"]) => {
  if (type == "previous") return "以前入力";
  if (type == "history") return "履歴";
  if (type == "current") return "直近";
  return "";
};

@customElement("masters-score-editor-dialog")
export class MastersScoreEditorDialogElement extends LitElement {
  static styles = css`
    .dialog-container {
      padding: 8px;
    }

    .name {
      min-width: 120px;
    }

    fluent-select {
      min-width: 200px;
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
  _data: (DataEntry | undefined)[] = [];

  @state()
  _visible: boolean = false;

  open(
    stageIndex: number,
    players: (StagePlayerEntry | undefined)[],
    scoreHistory: ScoreHistory,
  ) {
    this._stageIndex = stageIndex;
    this._data = players.map((entry, playerIndex) => {
      if (entry == null) return undefined;
      const history = scoreHistory.players[playerIndex];

      const scoreChoices: ScoreChoice[] = [];
      if (entry.level != null || entry.grade != null || entry.time != null) {
        scoreChoices.push({
          type: "previous",
          score: {
            level: entry.level,
            grade: entry.grade,
            time: entry.time,
            timeDetail: entry.timeDetail,
          },
        });
      }
      history.history.forEach((e) =>
        scoreChoices.push({
          type: "history",
          score: e,
        })
      );
      if (history.current != null) {
        scoreChoices.push({
          type: "current",
          score: history.current,
        });
      }

      const previousIndex = scoreChoices.findIndex((e) => e.type == "previous");
      const currentIndex = scoreChoices.findIndex((e) => e.type == "current");
      let scoreChoiceIndex = -1;
      if (currentIndex >= 0) scoreChoiceIndex = currentIndex;
      if (previousIndex >= 0) scoreChoiceIndex = previousIndex;

      const dataEntry: DataEntry = {
        name: entry.name,
        score: {
          level: entry.level,
          grade: entry.grade,
          time: entry.time,
          timeDetail: entry.timeDetail,
        },
        scoreChoices,
        scoreChoiceIndex,
      };

      if (currentIndex >= 0 && scoreChoiceIndex == currentIndex) {
        // 初期値を設定
        dataEntry.score = { ...scoreChoices[currentIndex].score };
      }

      return dataEntry;
    });
    this._visible = true;
  }

  private _close(updated: boolean) {
    this._visible = false;
    if (updated) {
      this.dispatchEvent(new Event("update-data"));
    }
  }

  getData(): ScoreEditorDialogData {
    const score: StageScoreEntry[] = [];
    this._data.forEach((e) => {
      if (e == null) return;
      score.push({
        name: e.name,
        level: e.score?.level,
        grade: e.score?.grade,
        time: e.score?.time,
        timeDetail: e.score?.timeDetail,
      });
    });
    return { score };
  }

  private _changeScore(playerIndex: number, newValue: string) {
    if (this._data[playerIndex] == null) return;

    const newScore = [...this._data];
    if (newValue.trim() == "") {
      newScore[playerIndex] = {
        ...newScore[playerIndex]!,
        score: {
          ...newScore[playerIndex]!.score,
          level: undefined,
          grade: undefined,
          time: undefined,
        },
      };
    } else {
      const parsedScore = parseScoreEditorScore(newValue.trim());
      if (parsedScore != null) {
        newScore[playerIndex] = {
          ...newScore[playerIndex]!,
          score: {
            ...newScore[playerIndex]!.score,
            ...parsedScore,
          },
        };
      } else {
        newScore[playerIndex] = { ...newScore[playerIndex]! };
      }
    }
    this._data = newScore;
  }

  private _changeScoreChoice(playerIndex: number, newValue: string) {
    if (this._data[playerIndex] == null) return;

    const newScore = [...this._data];
    let choiceIndex = Number(newValue);
    if (isNaN(choiceIndex)) choiceIndex = -1;
    if (choiceIndex == -1) {
      newScore[playerIndex] = {
        ...newScore[playerIndex]!,
        score: {
          level: undefined,
          grade: undefined,
          time: undefined,
        },
        scoreChoiceIndex: choiceIndex,
      };
    } else {
      newScore[playerIndex] = {
        ...newScore[playerIndex]!,
        score: { ...newScore[playerIndex]!.scoreChoices[choiceIndex].score },
        scoreChoiceIndex: choiceIndex,
      };
    }
    this._data = newScore;
  }

  private _checkEnterKey(ev: KeyboardEvent, index: number) {
    if (ev.code == "Enter") {
      if (parseScoreEditorScore((ev.target as TextField).value) != null) {
        const textFields = this.renderRoot.querySelectorAll<TextField>(
          "fluent-text-field",
        );
        const okButton = this.renderRoot.querySelector<Button>(
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
    // deno-fmt-ignore
    return html`
    <fluent-dialog 
      id="dialog-edit-stage-score"
      ?hidden=${!this._visible} trap-focus modal
      style="--dialog-width: 460px; --dialog-height: 460px;">
      ${this._visible
        ? html`
        <div class="dialog-container">
          <table>
            <thead>
              <tr>
                <th>名前</th>
                <th>OCR</th>
                <th>スコア</th>
              </tr>
            </thead>
            <tbody>
              ${map(this._data, (e, i) => {
                const disabled = e == null;
                return html`
                <tr>
                  <td class="name">${e?.name}</td>
                  <td>
                    <fluent-select
                      ?disabled=${disabled}
                      .value=${e?.scoreChoiceIndex != null ? String(e.scoreChoiceIndex) : ""}
                      @change=${(ev: Event) => this._changeScoreChoice(i, (ev.target as Select).value)}>
                      <fluent-option value="-1">-</fluent-option>
                      ${map(e?.scoreChoices ?? [], (choice, choiceIndex) => {
                        return html`
                        <fluent-option value="${choiceIndex}">[${formatChoiceType(choice.type)}] ${formatScoreEditorScore(choice.score)}</fluent-option>
                        `
                      })}
                    </fluent-select>
                  </td>
                  <td>
                    <fluent-text-field
                      ?disabled=${disabled}
                      .value=${live(e?.score != null ? formatScoreEditorScore(e.score) : "")}
                      @change=${(ev: Event) => this._changeScore(i, (ev.target as TextField).value)}
                      @keydown=${(ev: KeyboardEvent) => this._checkEnterKey(ev, i)}>
                    </fluent-text-field>
                  </td>
                </tr>`;
              })}
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
            <fluent-button appearance="accent" @click=${() => this._close(true)}>OK</fluent-button>
            <fluent-button @click=${() => this._close(false)}>キャンセル</fluent-button>
          </div>
        </div>
      ` : undefined}
    </fluent-dialog>
    `;
  }
}
