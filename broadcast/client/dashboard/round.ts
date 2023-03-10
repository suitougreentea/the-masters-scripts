import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import {
  classMap,
  consume,
  css,
  customElement,
  html,
  LitElement,
  map,
  query,
  state,
} from "../deps.ts";
import { RoundData } from "../../common/type_definition.ts";
import {
  StageMetadata,
  StageScoreData,
  StageSetupResult,
  SupplementComparisonMetadata,
} from "../../common/common_types.ts";
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
      display: grid;
      grid-template-columns: auto 420px;
      grid-gap: 8px;
    }

    .column {
      /* TODO: もっとうまいやりかたがありそう */
      height: calc(100vh - 415px);
      overflow-y: scroll;
      padding: 8px;
    }

    .stage-active h2 {
      background-color: rgb(255, 255, 230);
    }

    .stage-toolbar {
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
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
      width: 225px;
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

    .toolbar {
      grid-area: 2 / 1 / auto / span 2;
      text-align: right;
    }
  `;

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  @state()
  private _manualMode = false;
  @state()
  private _currentRoundData?: RoundData | null = null;
  @state()
  private _currentStageIndex = -1;

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
    const currentStageIndexReplicant = await client.getReplicant(
      "currentStageIndex",
    );
    currentStageIndexReplicant.subscribe((value) => {
      this._currentStageIndex = value ?? -1;
    });
  }

  private async _activateStage(stageIndex: number) {
    await this._dashboardContext.sendRequest("setCurrentStage", { stageIndex });
  }

  private async _sendToTimer() {
    await this._dashboardContext.sendRequest(
      "sendCurrentStageDataToBroadcast",
      { shouldShowResult: false },
    );
    this._dashboardContext.requestStopTimer();
  }

  private async _reloadStage() {
    await this._dashboardContext.sendRequest("refreshCurrentStage");
  }

  private _editStagePlayerNames() {
    const currentStageData =
      this._currentRoundData!.stageData[this._currentStageIndex];
    this._playerNamesEditorDialog.open(
      currentStageData.players,
      this._manualMode ? "reset" : "reorder",
    );
  }

  private _editStageScore() {
    const currentStageData =
      this._currentRoundData!.stageData[this._currentStageIndex];
    this._scoreEditorDialog.open(currentStageData.players);
  }

  private async _updateStagePlayerNames(data: PlayerNamesEditorData) {
    if (data.mode == "reorder") {
      const names = data.players;
      await this._dashboardContext.sendRequest("reorderCurrentStagePlayers", {
        names,
      });
    } else if (data.mode == "reset") {
      const setup: StageSetupResult = { entries: data.players };
      await this._dashboardContext.sendRequest("resetCurrentStage", { setup });
    }
  }

  private async _updateStageScore(data: ScoreEditorDialogData) {
    const score: StageScoreData = { players: data.score };
    await this._dashboardContext.sendRequest("setCurrentStageScore", { score });
    await this._dashboardContext.sendRequest("finalizeCurrentRoundIfCompleted");
  }

  private async _reloadRound() {
    await this._dashboardContext.sendRequest("refreshCurrentRound");
  }

  private async _forceFinalizeRound() {
    await this._dashboardContext.sendRequest("finalizeCurrentRound");
  }

  render() {
    return html`
    <div class="container">
      <fluent-card class="column">
        ${
      map(this._currentRoundData?.stageData ?? [], (e, i) => {
        const stageMetadata: StageMetadata =
          this._currentRoundData!.metadata.stages[i];
        const isActive = i == this._currentStageIndex;
        return html`
          <div class=${classMap({ "stage": true, "stage-active": isActive })}>
            <h2>${stageMetadata.name}</h2>
            <div class="stage-toolbar">
              <div>
                <fluent-button appearance="accent" .disabled=${isActive} @click=${() =>
          this._activateStage(i)}>選択</fluent-button>
                <fluent-button .disabled=${!isActive} @click=${this._sendToTimer}>タイマーに送信</fluent-button>
              </div>
              <div>
                <fluent-button .disabled=${!isActive} @click=${this._reloadStage}>再読み込み</fluent-button>
              </div>
            </div>
            <div class="stage-container">
              <div class="stage-players-container">
                <masters-stage-players .data=${e.players}></masters-stage-players>
                ${
          isActive
            ? html`
                <div class="stage-players-overlay">
                  <div class="stage-players-edit stage-players-edit-player-names" @click=${this._editStagePlayerNames}>
                    <div class="stage-players-edit-overlay">編集</div>
                  </div>
                  <div class="stage-players-edit stage-players-edit-score" @click=${this._editStageScore}>
                    <div class="stage-players-edit-overlay">編集</div>
                  </div>
                </div>
                `
            : null
        }
              </div>
              <masters-stage-result .data=${e.result} .numWinners=${stageMetadata.numWinners} .hasWildcard=${stageMetadata.hasWildcard}></masters-stage-result>
            </div>
          </div>
          `;
      })
    }
      </fluent-card>
      <fluent-card class="column">
        ${
      this._currentRoundData?.qualifierScore != null
        ? html`
        <h2>予選スコア</h2>
        <masters-qualifier-score .data=${this._currentRoundData.qualifierScore.players} .stageMetadata=${this._currentRoundData.metadata.stages}></masters-qualifier-score>
        `
        : null
    }
        ${
      this._currentRoundData?.qualifierResult != null
        ? html`
        <h2>予選リザルト</h2>
        <masters-qualifier-result .data=${this._currentRoundData.qualifierResult.result}></masters-qualifier-result>
        `
        : null
    }
        ${
      map(this._currentRoundData?.supplementComparisons ?? [], (e, i) => {
        const comparisonMetadata: SupplementComparisonMetadata =
          this._currentRoundData!.metadata.supplementComparisons[i];
        return html`
          <h2>${comparisonMetadata.name}</h2>
          <masters-supplement-comparison .data=${e.comparison}></masters-supplement-comparison>
          `;
      })
    }
      </fluent-card>
      <div class="toolbar">
        <fluent-button @click=${this._reloadRound}>ラウンドデータを再読み込み</fluent-button>
        <fluent-button @click=${this._forceFinalizeRound}>ラウンド結果を再計算</fluent-button>
      </div>
    </div>

    <masters-player-names-editor-dialog @update-data=${(e: Event) =>
      this._updateStagePlayerNames(
        (e.target as MastersPlayerNamesEditorDialogElement).getData(),
      )}></masters-player-names-editor-dialog>
    <masters-score-editor-dialog @update-data=${(e: Event) =>
      this._updateStageScore(
        (e.target as MastersScoreEditorDialogElement).getData(),
      )}></masters-score-editor-dialog>
    `;
  }
}
