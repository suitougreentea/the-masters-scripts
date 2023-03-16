import {
  classMap,
  css,
  customElement,
  html,
  LitElement,
  map,
  property,
  query,
} from "../deps.ts";
import "../common/qualifier_result.ts";
import "../common/qualifier_score.ts";
import "../common/stage_players.ts";
import "../common/stage_result.ts";
import "../common/supplement_comparison.ts";
import "../common/title.ts";
import { createPromiseSet, PromiseSet } from "../../common/util.ts";
import { commonColors } from "../common/common_values.ts";
import { ResultSceneData } from "../../common/type_definition.ts";

const height = 880;

@customElement("masters-result")
export class MastersResultElement extends LitElement {
  static styles = css`
  .container {
    width: 1920px;
    height: 1080px;
    background-image: url("/images/background-result.png");
  }

  #title {
    position: absolute;
    top: 1000px;
    left: 245px;
  }

  .result-container {
    position: absolute;
    top: 80px;
    left: 80px;
    width: 1150px;
    height: ${height}px;
    display: flex;
    justify-content: space-between;
  }

  .result-container.single {
    justify-content: center;
  }

  .stage-result-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 32px;
  }

  .stage-result-container .heading {
    color: ${commonColors.textDark};
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 10px;
  }

  .stage-result-container masters-stage-players,
  .stage-result-container masters-stage-result {
    zoom: 125%;
  }

  .round-result-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    overflow: hidden;
  }

  .round-result-container .heading {
    color: ${commonColors.textDark};
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 10px;
  }

  .round-result-container masters-stage-players,
  .round-result-container masters-stage-result,
  .round-result-container masters-supplement-comparison,
  .round-result-container masters-qualifier-score,
  .round-result-container masters-qualifier-result {
    /* zoom: 90%; */
  }

  .next-stage-name {
    position: absolute;
    top: 100px;
    left: 1310px;
    width: 550px;
    color: ${commonColors.textDark};
    text-align: right;
  }

  .next-stage-name > span:nth-child(1) {
    font-size: 18px;
  }

  .next-stage-name > span:nth-child(2) {
    font-size: 24px;
  }
  `;

  #initializedPromise: PromiseSet<void> = createPromiseSet();

  @property()
  title = "";

  @property()
  data: ResultSceneData | null = null;

  // @ts-ignore: ?
  @query(".round-result-container", false)
  private _roundResultContainer?: HTMLDivElement;

  private _scrollHandle: { stop: () => void } | null = null;

  constructor() {
    super();
  }

  firstUpdated() {
    this.#initializedPromise.resolve();
  }

  async waitForInitialization() {
    await this.#initializedPromise.promise;
  }

  async updated() {
    this._scrollHandle?.stop();
    this._scrollHandle = null;
    const roundResultContainer = this._roundResultContainer;
    if (roundResultContainer == null) return;

    roundResultContainer.style.justifyContent = `normal`;
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 0));
    const scrollHeight = roundResultContainer.scrollHeight;

    if (scrollHeight > height) {
      this._scrollHandle = this._startScroll(
        roundResultContainer,
        scrollHeight,
        height,
      );
    } else {
      roundResultContainer.style.justifyContent = `center`;
    }
  }

  private _startScroll(
    target: HTMLDivElement,
    contentHeight: number,
    visibleHeight: number,
  ): { stop: () => void } {
    const length = 2000 + (contentHeight - visibleHeight) * 30 + 2000;

    let stopped = false;
    const startTime = performance.now();
    const stop = () => stopped = true;
    const body = () => {
      const time = performance.now();
      const cycleTime = (time - startTime) % length;
      if (cycleTime < 2000) {
        target.scroll(0, 0);
      } else if (cycleTime < length - 2000) {
        const y = (cycleTime - 2000) / 30;
        target.scroll(0, y);
      } else {
        target.scroll(0, contentHeight - visibleHeight);
      }
    };
    const loop = () => {
      if (stopped) return;
      body();
      requestAnimationFrame(loop);
    };
    loop();
    return { stop };
  }

  render() {
    let hasRoundColumn = false;
    if (this.data != null) {
      const roundData = this.data.roundData;
      // if (roundData.stageData.some(e => e.result.length > 0)) hasRoundColumn = true;
      if (
        roundData.supplementComparisons.some((e) => e.comparison.length > 0)
      ) hasRoundColumn = true;
      if (roundData.qualifierScore != null) hasRoundColumn = true;
      if ((roundData.qualifierResult?.result ?? []).length > 0) {
        hasRoundColumn = true;
      }
    }

    return html`
    <div class="container">
      <masters-title id="title" .value=${this.title}></masters-title>
      <div class=${
      classMap({ "result-container": true, "single": !hasRoundColumn })
    }>
        ${
      (() => {
        if (this.data != null) {
          const stageMetadata =
            this.data.roundData.metadata.stages[this.data.currentStageIndex];
          const stageData =
            this.data.roundData.stageData[this.data.currentStageIndex];
          return html`
            <div class="stage-result-container">
              <div>
                <div class="heading">${stageMetadata.name} プレイヤー</div>
                <masters-stage-players .data=${stageData.players}></masters-stage-players>
              </div>
              <div>
                <div class="heading">${stageMetadata.name} リザルト</div>
                <masters-stage-result .data=${stageData.result} .numWinners=${stageMetadata.numWinners} .hasWildcard=${stageMetadata.hasWildcard}></masters-stage-result>
              </div>
            </div>
            `;
        }
        return null;
      })()
    }
        ${
      (() => {
        if (hasRoundColumn) {
          const roundData = this.data!.roundData;
          return html`
            <div class="round-result-container">
              ${
            (() => {
              if (roundData.qualifierScore) {
                return html`
                  <div>
                    <div class="heading">予選スコア</div>
                    <masters-qualifier-score .data=${roundData.qualifierScore.players} .stageMetadata=${roundData.metadata.stages}></masters-qualifier-score>
                  </div>
                  `;
              }
              return null;
            })()
          }
              ${
            (() => {
              if (roundData.qualifierResult) {
                return html`
                  <div>
                    <div class="heading">予選リザルト</div>
                    <masters-qualifier-result .data=${roundData.qualifierResult.result}></masters-qualifier-result>
                  </div>
                  `;
              }
              return null;
            })()
          }
              ${
            map(
              roundData.supplementComparisons,
              (supplementComparison, supplementComparisonIndex) => {
                const supplementComparisonMetadata = roundData.metadata
                  .supplementComparisons[supplementComparisonIndex];
                if (supplementComparison.comparison.length > 0) {
                  return html`
                  <div>
                    <div class="heading">${supplementComparisonMetadata.name}</div>
                    <masters-supplement-comparison .data=${supplementComparison.comparison}></masters-supplement-comparison>
                  </div>
                  `;
                }
                return null;
              },
            )
          }
              ${
            /*map(roundData.stageData, (stageData, stageIndex) => {
                const stageMetadata = roundData.metadata.stages[stageIndex];
                return html`
                <div>
                  <div class="heading">${stageMetadata.name} プレイヤー</div>
                  <masters-stage-players .data=${stageData.players}></masters-stage-players>
                </div>
                `;
              })*/
            null}
              ${
            /*map(roundData.stageData, (stageData, stageIndex) => {
                const stageMetadata = roundData.metadata.stages[stageIndex];
                if (stageData.result.length > 0) {
                  return html`
                  <div>
                    <div class="heading">${stageMetadata.name} リザルト</div>
                    <masters-stage-result .data=${stageData.result} .numWinners=${stageMetadata.numWinners} .hasWildcard=${stageMetadata.hasWildcard}></masters-stage-result>
                  </div>
                  `;
                }
                return null;
              })*/
            null}
            </div>
            `;
        }
        return null;
      })()
    }
      </div>
      ${
      (() => {
        if (this.data?.nextStageName != null) {
          return html`<div class="next-stage-name"><span>Next &gt;&gt; </span><span>${this.data.nextStageName}</span></div>`;
        } else {
          return html`<div class="next-stage-name"></div>`;
        }
      })()
    }
    </div>
    `;
  }
}
