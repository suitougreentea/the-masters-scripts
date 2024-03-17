import {
  StagePlayerEntry,
  StageSetupPlayerEntry,
} from "../../../common/common_types.ts";
import { commonColors } from "../common/common_values.ts";
import {
  classMap,
  css,
  customElement,
  FluentDialog,
  FluentRadioGroup,
  FluentTextField,
  html,
  LitElement,
  live,
  map,
  query,
  state,
} from "../deps.ts";

type Mode = "reorder" | "reset";
type ReorderPlayerEntry = { name: string | null; startOrder: number };
type ResetDataEntry = { name: string | null; handicap: number };
export type PlayerNamesEditorData = {
  mode: "reorder";
  players: (string | null)[];
} | { mode: "reset"; players: StageSetupPlayerEntry[] };

@customElement("masters-player-names-editor-dialog")
export class MastersPlayerNamesEditorDialogElement extends LitElement {
  static styles = css`
    .dialog-container {
      padding: 8px;
      user-select: none;
    }

    .dialog-buttons {
      text-align: right;
    }

    .type {
      margin-bottom: 12px;
    }

    .reorder-container {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .left-side {
    }

    .middle-side {
      display: flex;
      align-items: center;
    }

    .right-side {
    }

    .player {
      width: 150px;
      height: 32px;
      line-height: 32px;
      padding: 4px;
      border: 1px solid gray;
      border-radius: 3px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
    }

    .right-side>div {
      display: flex;
      align-items: center;
    }

    .right-side .position {
      width: 20px;
    }

    .p1 {
      background-color: ${commonColors.backgroundP1};
    }
    .p2 {
      background-color: ${commonColors.backgroundP2};
    }
    .moved {
      opacity: 0.5;
    }

    fluent-text-field {
      width: 185px;
    }
    `;

  private _stageIndex = -1;
  get stageIndex() {
    return this._stageIndex;
  }

  @state()
  private _mode: Mode = "reorder";
  @state()
  private _reorderPlayers: ReorderPlayerEntry[] = [];
  @state()
  private _reorderPositions: (string | null)[] = [];
  @state()
  private _resetData: ResetDataEntry[] = [];

  private _currentDragSide: "left" | "right" | null = null;
  private _currentDragIndex = -1;
  private _currentDropSide: "left" | "right" | null = null;
  private _currentDropIndex = -1;

  // @ts-ignore: ?
  @query("fluent-dialog", true)
  private _dialog!: FluentDialog;

  open(
    stageIndex: number,
    data: (StagePlayerEntry | null)[],
    initialMode: Mode,
  ) {
    this._stageIndex = stageIndex;
    this._reorderPlayers = [];
    data.forEach((e) => {
      if (e == null) return;
      this._reorderPlayers.push({
        name: e.name,
        startOrder: e.startOrder,
      });
    });
    this._reorderPositions = [null, null, null, null, null, null, null, null];
    this._resetData = data.map((e) => {
      return {
        name: e?.name ?? null,
        handicap: e?.handicap ?? 0,
      };
    });
    this._mode = initialMode;
    this._dialog.hidden = false;
  }

  private _close(updated: boolean) {
    this._dialog.hidden = true;
    if (updated) {
      this.dispatchEvent(new Event("update-data"));
    }
  }

  getData(): PlayerNamesEditorData {
    if (this._mode == "reorder") {
      const players = [...this._reorderPositions];
      return { mode: "reorder", players };
    } else if (this._mode == "reset") {
      const players: StageSetupPlayerEntry[] = [];
      this._resetData.forEach((e) => {
        if (e.name == null) return;
        players.push({
          name: e.name,
          handicap: e.handicap,
        });
      });
      return { mode: "reset", players };
    }
    throw new Error();
  }

  private _changeResetEntry(
    playerIndex: number,
    column: string,
    newValue: string,
  ) {
    const newData = [...this._resetData];
    const currentValues = newData[playerIndex];
    if (column == "name") {
      newData[playerIndex] = {
        ...currentValues,
        name: newValue != "" ? newValue : null,
      };
    } else if (column == "handicap") {
      const parsed = Number(newValue);
      if (!isNaN(parsed)) {
        newData[playerIndex] = {
          ...currentValues,
          handicap: parsed,
        };
      }
    }
    this._resetData = newData;
  }

  private _startDragLeft(_e: DragEvent, index: number) {
    this._currentDragSide = "left";
    this._currentDragIndex = index;
  }

  private _endDragLeft(e: DragEvent, index: number) {
    if (this._currentDragSide == "left" && this._currentDragIndex == index) {
      if ((e.dataTransfer?.dropEffect ?? "none") != "none") {
        if (this._currentDropSide == "right" && this._currentDropIndex >= 0) {
          const reorderPositions = [...this._reorderPositions];
          reorderPositions[this._currentDropIndex] =
            this._reorderPlayers[this._currentDragIndex].name;
          this._reorderPositions = reorderPositions;
        }
      }
    }

    this._currentDragSide = null;
    this._currentDragIndex = -1;
    this._currentDropSide = null;
    this._currentDropIndex = -1;
  }

  private _enterDragLeft(e: DragEvent) {
    if (this._currentDragSide == "right") {
      this._currentDropSide = "left";
      this._currentDropIndex = -1;
      e.preventDefault();
    }
  }

  private _overDragLeft(e: DragEvent) {
    if (this._currentDragSide == "right") {
      this._currentDropSide = "left";
      this._currentDropIndex = -1;
      e.preventDefault();
    }
  }

  private _startDragRight(_e: DragEvent, index: number) {
    this._currentDragSide = "right";
    this._currentDragIndex = index;
  }

  private _endDragRight(e: DragEvent, index: number) {
    if (this._currentDragSide == "right" && this._currentDragIndex == index) {
      if ((e.dataTransfer?.dropEffect ?? "none") != "none") {
        if (
          this._currentDropSide == "right" && this._currentDropIndex >= 0 &&
          this._currentDragIndex != this._currentDropIndex
        ) {
          const reorderPositions = [...this._reorderPositions];
          reorderPositions[this._currentDropIndex] =
            reorderPositions[this._currentDragIndex];
          reorderPositions[this._currentDragIndex] = null;
          this._reorderPositions = reorderPositions;
        }
        if (this._currentDropSide == "left") {
          const reorderPositions = [...this._reorderPositions];
          reorderPositions[this._currentDragIndex] = null;
          this._reorderPositions = reorderPositions;
        }
      }
    }

    this._currentDragSide = null;
    this._currentDragIndex = -1;
    this._currentDropSide = null;
    this._currentDropIndex = -1;
  }

  private _enterDragRight(e: DragEvent, index: number) {
    this._currentDropSide = "right";
    this._currentDropIndex = index;
    e.preventDefault();
  }

  private _overDragRight(e: DragEvent, index: number) {
    this._currentDropSide = "right";
    this._currentDropIndex = index;
    e.preventDefault();
  }

  render() {
    const formatHandicap = (handicap: number) => {
      if (handicap > 0) return `+${handicap}`;
      if (handicap < 0) return `${handicap}`;
      return "";
    };
    const playerSideClass = (startOrder: number, moved: boolean) => {
      return classMap({
        player: true,
        p1: 1 <= startOrder && startOrder <= 4,
        p2: 5 <= startOrder && startOrder <= 8,
        moved,
      });
    };

    let isInvalid = false;
    return html`
    <fluent-dialog id="dialog-edit-player-names" hidden trap-focus modal style="--dialog-width: 400px; --dialog-height: 440px;">
      <div class="dialog-container">
        <fluent-radio-group class="type" .value=${live(this._mode)} @change=${(
      e: Event,
    ) => this._mode = (e.target as FluentRadioGroup).value as Mode}>
          <fluent-radio value="reorder">並べ替え</fluent-radio>
          <fluent-radio value="reset">再設定</fluent-radio>
        </fluent-radio-group>
        ${
      (() => {
        if (this._mode == "reorder") {
          const leftSide = this._reorderPlayers.map((e) => ({
            ...e,
            moved: false,
          }));
          const rightSide: ReorderPlayerEntry[] = [];
          this._reorderPositions.forEach((name) => {
            if (name == null) {
              rightSide.push({ name: null, startOrder: -1 });
            } else {
              const index = leftSide.findIndex((e) => e.name == name);
              leftSide[index].moved = true;
              rightSide.push({ ...leftSide[index] });
            }
          });
          isInvalid = leftSide.some((e) => !e.moved);

          return html`
            <div class="reorder-container">
              <div class="left-side"
                @dragenter=${this._enterDragLeft}
                @dragover=${this._overDragLeft}
              >
                ${
            map(leftSide, (e, i) => {
              return html`<div class=${
                playerSideClass(e.startOrder, e.moved)
              } draggable=${!e.moved ? "true" : "false"}
                    @dragstart=${(ev: DragEvent) => this._startDragLeft(ev, i)}
                    @dragend=${(ev: DragEvent) => this._endDragLeft(ev, i)}
                  >${e.name}</div>`;
            })
          }
              </div>
              <div class="middle-side">→</div>
              <div class="right-side">
                ${
            map(rightSide, (e, i) => {
              return html`
                  <div>
                    <div class="position">${i + 1}</div>
                    <div class=${
                playerSideClass(e.startOrder, false)
              } draggable=${e.name != null ? "true" : "false"}
                    @dragstart=${(ev: DragEvent) => this._startDragRight(ev, i)}
                    @dragend=${(ev: DragEvent) => this._endDragRight(ev, i)}
                    @dragenter=${(ev: DragEvent) => this._enterDragRight(ev, i)}
                    @dragover=${(ev: DragEvent) => this._overDragRight(ev, i)}
                    >${e.name}</div>
                  </div>
                  `;
            })
          }
              </div>
            </div>
            `;
        } else if (this._mode == "reset") {
          return html`
            <table>
              <thead>
                <tr>
                  <th>名前</th>
                  <th>Hdcp</th>
                </tr>
              </thead>
              <tbody>
                ${
            map(this._resetData, (e, i) => {
              return html`
                  <tr>
                    <td><fluent-text-field .value=${
                live(e.name ?? "")
              } @change=${(e: Event) =>
                this._changeResetEntry(
                  i,
                  "name",
                  (e.target as FluentTextField).value,
                )}></fluent-text-field></td>
                    <td><fluent-text-field .value=${
                live(formatHandicap(e.handicap))
              } @change=${(e: Event) =>
                this._changeResetEntry(
                  i,
                  "handicap",
                  (e.target as FluentTextField).value,
                )}></fluent-text-field></td>
                  </tr>`;
            })
          }
              </tbody>
            <table>
            `;
        }
        return null;
      })()
    }
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
