import { StageResultEntry } from "../../../common/common_types.ts";
import { timeToStringNullable } from "../../../common/time.ts";
import { formatLevelOrGradeNullable } from "../../common/util.ts";
import {
  classMap,
  css,
  customElement,
  html,
  LitElement,
  map,
  property,
} from "../deps.ts";
import { commonColors } from "./common_values.ts";

@customElement("masters-stage-result")
export class MastersStageResultElement extends LitElement {
  static styles = css`
  table {
    width: 440px;
    table-layout: fixed;
    font-size: 14px;
    border: 2px solid ${commonColors.tableResult};
    border-collapse: collapse;
    background-color: white;
  }

  col:nth-child(1) {
    width: 16px;
  }
  col:nth-child(2) {
    width: auto;
  }
  col:nth-child(3) {
    width: 40px;
  }
  col:nth-child(4) {
    width: 70px;
  }
  col:nth-child(5) {
    width: 70px;
  }
  col:nth-child(6) {
    width: 70px;
  }
  col:nth-child(7) {
    width: 70px;
  }

  td {
    border: 1px solid ${commonColors.tableCellBorder};
  }

  th {
    background-color: ${commonColors.tableResult};
    color: ${commonColors.textDark};
  }

  tr:nth-child(2n) {
    background-color: ${commonColors.tableLightGray};
  }

  tr.winners-end td, tr.wildcard-end td {
    border-bottom: 1px solid ${commonColors.tableResult};
  }

  th:nth-child(4), th:nth-child(5), th:nth-child(6) {
    font-size: 90%;
  }

  td:nth-child(1) {
    text-align: center;
  }
  td:nth-child(2) {
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  td:nth-child(3) {
    text-align: right;
  }
  td:nth-child(4) {
    text-align: right;
  }
  td:nth-child(5) {
    text-align: right;
  }
  td:nth-child(6) {
    text-align: right;
  }
  td:nth-child(7) {
    text-align: right;
  }
  `;

  @property()
  data: StageResultEntry[] = [];
  @property()
  numWinners = 0;
  @property()
  hasWildcard = false;

  render() {
    // deno-fmt-ignore
    return html`
    <table>
      <colgroup>
        <col>
        <col>
        <col>
        <col>
        <col>
        <col>
        <col>
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th>名前</th>
          <th colspan="2">スコア</th>
          <th>調整タイム</th>
          <th>差:トップ</th>
          <th>差:上位</th>
        </tr>
      </thead>
      <tbody>
        ${map(this.data, (e, i) => {
          const rowClass = classMap({
            "winners-end": i == this.numWinners - 1,
            "wildcard-end": this.hasWildcard && i == this.numWinners,
          });
          return html`
          <tr class=${rowClass}>
            <td>${e.rank}</td>
            <td>${e.name}</td>
            <td>${formatLevelOrGradeNullable({ level: e.level, grade: e.grade })}</td>
            <td>${timeToStringNullable(e.time)}</td>
            <td>${timeToStringNullable(e.timeDiffBest)}</td>
            <td>${timeToStringNullable(e.timeDiffTop)}</td>
            <td>${timeToStringNullable(e.timeDiffPrev)}</td>
          </tr>
          `;
        })}
      </tbody>
    </table>
    `;
  }
}
