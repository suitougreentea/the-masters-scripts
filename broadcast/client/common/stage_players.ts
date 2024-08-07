import { StagePlayerEntry } from "../../../common/common_types.ts";
import { timeToStringNullable } from "../../../common/time.ts";
import { formatLevelOrGradeNullable } from "../../common/util.ts";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { classMap } from "lit/directives/class-map.js";
import { commonColors } from "./common_values.ts";

@customElement("masters-stage-players")
export class MastersStagePlayersElement extends LitElement {
  static styles = css`
  table {
    width: 490px;
    table-layout: fixed;
    font-size: 14px;
    border: 2px solid ${commonColors.tablePlayers};
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
    width: 70px;
  }
  col:nth-child(4) {
    width: 35px;
  }
  col:nth-child(5) {
    width: 70px;
  }
  col:nth-child(6) {
    width: 16px;
  }
  col:nth-child(7) {
    width: 70px;
  }
  col:nth-child(8) {
    width: 40px;
  }
  col:nth-child(9) {
    width: 70px;
  }

  td {
    border: 1px solid ${commonColors.tableCellBorder};
  }

  th {
    background-color: ${commonColors.tablePlayers};
    color: ${commonColors.textDark};
  }

  tr:nth-child(2n) {
    background-color: ${commonColors.tableLightGray};
  }

  th:nth-child(3), th:nth-child(4), th:nth-child(5), th:nth-child(6) {
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
    text-align: center;
    font-weight: bold;
  }
  td:nth-child(7) {
    text-align: right;
  }
  td:nth-child(8) {
    text-align: right;
  }
  td:nth-child(9) {
    text-align: right;
  }

  .p1 {
    background-color: ${commonColors.backgroundP1};
  }
  .p2 {
    background-color: ${commonColors.backgroundP2};
  }
  .advantage {
    color: ${commonColors.advantageTextLight};
  }
  .handicap {
    color: ${commonColors.handicapTextLight};
  }
  `;

  @property()
  data: (StagePlayerEntry | undefined)[] = [
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ];

  render() {
    const renderHandicap = (handicap: number) => {
      if (handicap < 0) {
        return html`<span class="advantage">${handicap}</span>`;
      }
      if (handicap > 0) {
        return html`<span class="handicap">+${handicap}</span>`;
      }
      return undefined;
    };
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
        <col>
        <col>
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th>名前</th>
          <th>自己ベスト</th>
          <th>Hdcp</th>
          <th>調整ベスト</th>
          <th>順</th>
          <th>スタート</th>
          <th colspan="2">スコア</th>
        </tr>
      </thead>
      <tbody>
        ${map(this.data, (e, i) => {
          const d = e ?? {
            name: undefined,
            bestTime: undefined,
            handicap: 0,
            rawBestTime: undefined,
            startOrder: undefined,
            startTime: undefined,
            level: undefined,
            grade: undefined,
            time: undefined,
          };
          const sideClass = classMap({
            p1: d.startOrder != null && 1 <= d.startOrder && d.startOrder <= 4,
            p2: d.startOrder != null && 5 <= d.startOrder && d.startOrder <= 8,
          });
          return html`
          <tr>
            <td class=${sideClass}>${i + 1}</td>
            <td class=${sideClass}>${d.name}</td>
            <td>${timeToStringNullable(d.rawBestTime)}</td>
            <td>${renderHandicap(d.handicap)}</td>
            <td>${timeToStringNullable(d.bestTime)}</td>
            <td>${d.startOrder}</td>
            <td>${timeToStringNullable(d.startTime)}</td>
            <td>${formatLevelOrGradeNullable({ level: d.level, grade: d.grade })}</td>
            <td>${timeToStringNullable(d.time)}</td>
          </tr>
          `;
        })}
      </tbody>
    </table>
    `;
  }
}
