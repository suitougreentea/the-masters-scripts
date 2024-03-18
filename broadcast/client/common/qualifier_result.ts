import { QualifierResultEntry } from "../../../common/common_types.ts";
import { formatLevelOrGradeNullable } from "../../common/util.ts";
import { timeToStringNullable } from "../../../common/time.ts";
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

@customElement("masters-qualifier-result")
export class MastersQualifierResultElement extends LitElement {
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
    width: 24px;
  }
  col:nth-child(2) {
    width: auto;
  }
  col:nth-child(3) {
    width: 30px;
  }
  col:nth-child(4) {
    width: 24px;
  }
  col:nth-child(5) {
    width: 24px;
  }
  col:nth-child(6) {
    width: 24px;
  }
  col:nth-child(7) {
    width: 24px;
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
    background-color: ${commonColors.tableSupplementComparison};
    color: ${commonColors.textDark};
  }

  tr:nth-child(2n) {
    background-color: ${commonColors.tableLightGray};
  }

  tr.winners-end td {
    border-bottom: 1px solid ${commonColors.tableSupplementComparison};
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
    font-weight: bold;
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
  td:nth-child(8) {
    text-align: right;
  }
  td:nth-child(9) {
    text-align: right;
  }
  `;

  @property()
  data: QualifierResultEntry[] = [];

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
        <col>
        <col>
        <col>
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th>名前</th>
          <th>Pts.</th>
          <th>#1</th>
          <th>#2</th>
          <th>#3</th>
          <th>#4</th>
          <th colspan="2">ベストスコア</th>
        </tr>
      </thead>
      <tbody>
        ${
      map(this.data, (e, i) => {
        const rowClass = classMap({
          "winners-end": i == 3,
        });
        return html`
          <tr class=${rowClass}>
            <td>${e.rank}</td>
            <td>${e.name}</td>
            <td>${e.points}</td>
            <td>${e.numPlaces[0]}</td>
            <td>${e.numPlaces[1]}</td>
            <td>${e.numPlaces[2]}</td>
            <td>${e.numPlaces[3]}</td>
            <td>${
          formatLevelOrGradeNullable({
            level: e.bestGameLevel,
            grade: e.bestGameGrade,
          })
        }</td>
            <td>${timeToStringNullable(e.bestGameTimeDiffBest)}</td>
          </tr>
          `;
      })
    }
      </tbody>
    </table>
    `;
  }
}
