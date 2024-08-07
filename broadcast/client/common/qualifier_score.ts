import {
  QualifierScoreEntry,
  StageMetadata,
} from "../../../common/common_types.ts";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { classMap } from "lit/directives/class-map.js";
import { commonColors } from "./common_values.ts";

@customElement("masters-qualifier-score")
export class MastersQualifierScoreElement extends LitElement {
  static styles = css`
  table {
    width: 380px;
    table-layout: fixed;
    font-size: 14px;
    border: 2px solid ${commonColors.tableSupplementComparison};
    border-collapse: collapse;
    background-color: white;
  }

  col:nth-child(1) {
    width: auto;
  }
  col:nth-child(2) {
    width: 32px;
  }
  col:nth-child(n+3) {
    width: 20px;
  }

  td {
    border: 1px solid ${commonColors.tableCellBorder};
  }

  th {
    background-color: ${commonColors.tableSupplementComparison};
    color: ${commonColors.textDark};
  }

  tr:nth-child(2n) {
    background-color:${commonColors.tableLightGray};
  }

  tr.winners-end td, tr.wildcard-end td {
    border-bottom: 1px solid ${commonColors.tableSupplementComparison};
  }

  td:nth-child(1) {
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  td:nth-child(2) {
    text-align: center;
    font-weight: bold;
  }
  td:nth-child(n+3) {
    text-align: center;
  }

  .active {
    background-color: ${commonColors.tableHighlight};
  }

  .points-high {
    background-color: ${commonColors.tableHighlight2};
  }
  `;

  @property()
  data: QualifierScoreEntry[] = [];
  @property()
  stageMetadata: StageMetadata[] = [];

  render() {
    // deno-fmt-ignore
    return html`
    <table>
      <colgroup>
        <col>
        <col>
        ${map(this.stageMetadata, () => {
          return html`<col></col>`;
        })}
      </colgroup>
      <thead>
        <tr>
          <th>名前</th>
          <th>Pts.</th>
          ${map(this.stageMetadata, (_, i) => {
            return html`<th>${(i + 1) % 10}</th>`;
          })}
        </tr>
      </thead>
      <tbody>
        ${map(this.data, (e, playerIndex) => {
          const pointsClass = classMap({
            "points-high": 0 <= e.provisionalRankIndex && e.provisionalRankIndex <= 3,
          });
          return html`
          <tr>
            <td>${e.name}</td>
            <td class=${pointsClass}>${e.totalPoints}</td>
            ${map(this.stageMetadata, (metadata, stageIndex) => {
              const cellClass = classMap({
                active: metadata.fixedPlayerIndices!.indexOf(playerIndex) >= 0,
              });
              const stageResult = e.stageResults.find((stageResult) =>
                stageIndex == stageResult.stageIndex
              );
              return html`<td class=${cellClass}>${stageResult?.points}</td>`;
            })}
          </tr>
          `;
        })}
      </tbody>
    </table>
    `;
  }
}
