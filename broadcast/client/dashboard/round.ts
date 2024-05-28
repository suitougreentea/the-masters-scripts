import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import { css, html, LitElement } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { consume } from "@lit-labs/context";
import { RoundData } from "../../common/type_definition.ts";
import {
  StageMetadata,
  StageScoreData,
  StageSetupResult,
  SupplementComparisonMetadata,
} from "../../../common/common_types.ts";
import "../common/qualifier_result.ts";
import "../common/qualifier_score.ts";
import "../common/stage_players.ts";
import "../common/stage_result.ts";
import "../common/supplement_comparison.ts";
import "./player_names_editor_dialog.ts";
import "./score_editor_dialog.ts";
import {
  MastersPlayerNamesEditorDialogElement,
  PlayerNamesEditorData,
} from "./player_names_editor_dialog.ts";
import {
  MastersScoreEditorDialogElement,
  ScoreEditorDialogData,
} from "./score_editor_dialog.ts";

@customElement("masters-round")
export class MastersRoundElement extends LitElement {
  static styles = css`
    .container {
      overflow-y: scroll;
      padding: 8px;
    }

    h2 {
      margin-block: 0.3em;
    }

    .stage-toolbar {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }

    .toolbar-label {
      font-size: 90%;
      margin-right: 8px;
    }
    
    .toolbar-spacer {
      width: 16px;
    }

    .stage-container {
      display: flex;
      justify-content: space-between;
    }

    .stage-players-container {
      display: grid;
    }

    masters-stage-players {
      grid-area: 1 / 1 / auto / auto;
    }

    .stage-players-overlay {
      grid-area: 1 / 1 / auto / auto;
      position: relative;
      z-index: 1000;
      user-select: none;
    }

    .stage-players-edit {
      position: absolute;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stage-players-edit:hover {
      background-color: rgba(0, 0, 0, 0.5);
    }

    .stage-players-edit-player-names {
      bottom: 2px;
      left: 18px;
      width: 205px;
      height: calc(100% - 27px);
    }

    .stage-players-edit-score {
      bottom: 2px;
      right: 2px;
      width: 108px;
      height: calc(100% - 27px);
    }

    .stage-players-edit .stage-players-edit-overlay {
      display: none;
      color: white;
    }

    .stage-players-edit:hover .stage-players-edit-overlay {
      display: block;
    }

    .toolbar-header {
      font-weight: bold;
    }

    .toolbar {
    }

    masters-player-names-editor-dialog, masters-score-editor-dialog {
      position: relative;
      z-index: 10000;
    }
  `;

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  @state()
  private _manualMode = false;
  @state()
  private _currentRoundData?: RoundData = undefined;

  // @ts-ignore: ?
  @query("masters-player-names-editor-dialog", true)
  private _playerNamesEditorDialog!: MastersPlayerNamesEditorDialogElement;

  // @ts-ignore: ?
  @query("masters-score-editor-dialog", true)
  private _scoreEditorDialog!: MastersScoreEditorDialogElement;

  async firstUpdated() {
    const client = await this._dashboardContext.getClient();
    const currentCompetitionMetadataReplicant = await client.getReplicant(
      "currentCompetitionMetadata",
    );
    currentCompetitionMetadataReplicant.subscribe((value) => {
      this._manualMode = value?.presetName == null;
    });
    const currentRoundDataReplicant = await client.getReplicant(
      "currentRoundData",
    );
    currentRoundDataReplicant.subscribe((value) => {
      this._currentRoundData = value;
    });
  }

  private async _sendToTimer(stageIndex: number) {
    // TODO: 仮
    await this._dashboardContext.sendRequest("getCurrentRegisteredPlayers");

    await this._dashboardContext.sendRequest(
      "sendStageDataToCompetitionScene",
      { stageIndex },
    );
    this._dashboardContext.requestResetTimer();
    await this._dashboardContext.sendRequest("toggleResultScene", {
      show: false,
    });
    this._dashboardContext.requestActivateTimer();
  }

  private async _reloadStage(stageIndex: number) {
    await this._dashboardContext.sendRequest("refreshStage", { stageIndex });
  }

  private _editStagePlayerNames(stageIndex: number) {
    const currentStageData = this._currentRoundData!.stageData[stageIndex];
    this._playerNamesEditorDialog.open(
      stageIndex,
      currentStageData.players,
      this._manualMode ? "reset" : "reorder",
    );
  }

  private async _editStageScore(stageIndex: number) {
    const currentStageData = this._currentRoundData!.stageData[stageIndex];
    const scoreHistory = await this._dashboardContext.sendRequest(
      "getScoreHistory",
    );
    this._scoreEditorDialog.open(
      stageIndex,
      currentStageData.players,
      scoreHistory.history,
    );
  }

  private async _updateStagePlayerNames(
    stageIndex: number,
    data: PlayerNamesEditorData,
  ) {
    if (data.mode == "reorder") {
      const names = data.players;
      await this._dashboardContext.sendRequest("reorderStagePlayers", {
        stageIndex,
        names,
      });
    } else if (data.mode == "reset") {
      const setup: StageSetupResult = { entries: data.players };
      await this._dashboardContext.sendRequest("resetStage", {
        stageIndex,
        setup,
      });
    }
  }

  private async _updateStageScore(
    stageIndex: number,
    data: ScoreEditorDialogData,
  ) {
    const score: StageScoreData = { players: data.score };
    await this._dashboardContext.sendRequest("setStageScore", {
      stageIndex,
      score,
    });
    await this._dashboardContext.sendRequest("finalizeCurrentRoundIfCompleted");
    await this._dashboardContext.sendRequest(
      "setResultSceneData",
      { stageIndex },
    );
    await this._dashboardContext.sendRequest("toggleResultScene", {
      show: true,
    });
  }

  private async _reloadRound() {
    await this._dashboardContext.sendRequest("refreshCurrentRound");
  }

  private async _forceFinalizeRound() {
    await this._dashboardContext.sendRequest("finalizeCurrentRound");
  }

  render() {
    // deno-fmt-ignore
    return html`
    <fluent-card class="container">
      ${map(this._currentRoundData?.stageData ?? [], (e, i) => {
        const stageMetadata: StageMetadata = this._currentRoundData!.metadata.stages[i];
        return html`
        <div class="stage">
          <h2>${stageMetadata.name}</h2>
          <div class="stage-toolbar">
            <div class="toolbar-label">プレイ前:</div>
            <fluent-button
              appearance="accent"
              @click=${() => this._editStagePlayerNames(i)}>
              プレイヤー編集
            </fluent-button>
            <div class="toolbar-spacer"></div>
            <div class="toolbar-label">プレイ後:</div>
            <fluent-button
              appearance="accent"
              @click=${() => this._editStageScore(i)}>
              スコア入力
            </fluent-button>
          </div>
          <div class="stage-container">
            <div class="stage-players-container">
              <masters-stage-players .data=${e.players}></masters-stage-players>
              <div class="stage-players-overlay">
                <div
                  class="stage-players-edit stage-players-edit-player-names"
                  @click=${() => this._editStagePlayerNames(i)}>
                  <div class="stage-players-edit-overlay">編集</div>
                </div>
                <div
                  class="stage-players-edit stage-players-edit-score"
                  @click=${() => this._editStageScore(i)}>
                  <div class="stage-players-edit-overlay">編集</div>
                </div>
              </div>
            </div>
            <masters-stage-result
              .data=${e.result}
              .numWinners=${stageMetadata.numWinners}
              .hasWildcard=${stageMetadata.hasWildcard}>
            </masters-stage-result>
          </div>
        </div>
        `;
      })
    }
    <hr>
    ${this._currentRoundData?.qualifierScore != null
      ? html`
      <h2>予選スコア</h2>
      <masters-qualifier-score
        .data=${this._currentRoundData.qualifierScore.players}
        .stageMetadata=${this._currentRoundData.metadata.stages}>
      </masters-qualifier-score>
      `
      : undefined
    }
    ${this._currentRoundData?.qualifierResult != null
      ? html`
      <h2>予選リザルト</h2>
      <masters-qualifier-result
        .data=${this._currentRoundData.qualifierResult.result}>
      </masters-qualifier-result>
      `
      : undefined
    }
    ${map(this._currentRoundData?.supplementComparisons ?? [], (e, i) => {
      const comparisonMetadata: SupplementComparisonMetadata =
        this._currentRoundData!.metadata.supplementComparisons[i];
      return html`
      <h2>${comparisonMetadata.name}</h2>
      <masters-supplement-comparison .data=${e.comparison}></masters-supplement-comparison>
      `;
    })}
      <hr>
      <div class="toolbar-header">Advanced menu:</div>
      <div class="toolbar">
        <fluent-button @click=${this._reloadRound}>ラウンドデータを再読み込み</fluent-button>
        <fluent-button @click=${this._forceFinalizeRound}>ラウンド結果を再計算</fluent-button>
      </div>
    </fluent-card>

    <masters-player-names-editor-dialog
      @update-data=${(e: Event) => {
        const editor = e.target as MastersPlayerNamesEditorDialogElement;
        this._updateStagePlayerNames(editor.stageIndex, editor.getData());
        this._sendToTimer(editor.stageIndex);
      }}
      @send-to-timer=${(e: Event) => {
        const editor = e.target as MastersPlayerNamesEditorDialogElement;
        this._sendToTimer(editor.stageIndex);
      }}>
    </masters-player-names-editor-dialog>
    <masters-score-editor-dialog
      @update-data=${(e: Event) => {
        const editor = e.target as MastersScoreEditorDialogElement;
        this._updateStageScore(editor.stageIndex, editor.getData());
      }}>
    </masters-score-editor-dialog>
    `;
  }
}
