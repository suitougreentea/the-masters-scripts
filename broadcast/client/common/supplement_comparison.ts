import { SupplementComparisonEntry } from "../../common/common_types.ts";
import {
  formatLevelOrGradeNullable,
  formatTimeNullable,
} from "../../common/util.ts";
import {
  css,
  customElement,
  html,
  LitElement,
  map,
  property,
} from "../deps.ts";
import { commonColors } from "./common_values.ts";

@customElement("masters-supplement-comparison")
export class MastersSupplementComparisonElement extends LitElement {
  static styles = css`
  table {
    width: 380px;
    table-layout: fixed;
    font-size: 14px;
    border: 2px solid ${commonColors.tableSupplementComparison};
    border-collapse: collapse;
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

  th:nth-child(4), th:nth-child(5) {
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
  `;

  @property()
  data: SupplementComparisonEntry[] = [];

  render() {
    return html`
    <table>
      <colgroup>
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
          <th>差:上位</th>
        </tr>
      </thead>
      <tbody>
        ${
      map(this.data, (e) => {
        return html`
          <tr>
            <td>${e.rank}</td>
            <td>${e.name}</td>
            <td>${
          formatLevelOrGradeNullable({ level: e.level, grade: e.grade })
        }</td>
            <td>${formatTimeNullable(e.time)}</td>
            <td>${formatTimeNullable(e.timeDiffBest)}</td>
            <td>${formatTimeNullable(e.timeDiffPrev)}</td>
          </tr>
          `;
      })
    }
      </tbody>
    </table>
    `;
  }
}
