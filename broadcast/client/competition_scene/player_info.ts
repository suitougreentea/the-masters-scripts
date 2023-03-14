import { StagePlayerEntry } from "../../common/common_types.ts";
import { commonColors } from "../common/common_values.ts";
import { formatTime } from "../../common/util.ts";
import { classMap, css, customElement, html, LitElement, map, property } from "../deps.ts";

@customElement("masters-player-info")
export class MastersPlayerInfoElement extends LitElement {
  static styles = css`
    .container {
      color: ${commonColors.textDark};
    }

    .player {
      position: absolute;
      width: 288px;
      height: 436px;
      text-shadow: 0 0 5px black;
    }
    .player:nth-child(odd) {
      text-align: left;
    }
    .player:nth-child(even) {
      text-align: right;
    }
    .player:nth-child(1) {
      left: 80px;
      top: 60px;
    }
    .player:nth-child(2) {
      left: 368px;
      top: 60px;
    }
    .player:nth-child(3) {
      left: 680px;
      top: 60px;
    }
    .player:nth-child(4) {
      left: 968px;
      top: 60px;
    }
    .player:nth-child(5) {
      left: 80px;
      top: 515px;
    }
    .player:nth-child(6) {
      left: 368px;
      top: 515px;
    }
    .player:nth-child(7) {
      left: 680px;
      top: 515px;
    }
    .player:nth-child(8) {
      left: 968px;
      top: 515px;
    }

    .id {
      position: absolute;
      top: 5px;
      color: rgb(160, 160, 160);
      font-size: 48px;
      line-height: 48px;
      margin: 0px 5px;
    }
    .player:nth-child(odd) .id {
      left: 0px;
    }
    .player:nth-child(even) .id {
      right: 0px;
    }
    .id-inactive {
      opacity: 0.3;
    }

    .name {
      position: absolute;
      top: 10px;
      font-size: 24px;
      line-height: 24px;
    }
    .player:nth-child(odd) .name {
      left: 60px;
    }
    .player:nth-child(even) .name {
      right: 60px;
    }

    .best-time {
      display: none;
      position: absolute;
      top: 43px;
      font-size: 18px;
      line-height: 18px;
      font-weight: bold;
      text-shadow: 2px 2px 0 black;
    }
    .player:nth-child(odd) .best-time {
      left: 192px;
    }
    .player:nth-child(even) .best-time {
      right: 194px;
    }

    .offset {
      display: none;
      position: absolute;
      top: 64px;
      font-size: 14px;
      line-height: 14px;
      text-shadow: 2px 2px 0 black;
    }
    .player:nth-child(odd) .offset {
      left: 192px;
    }
    .player:nth-child(even) .offset {
      right: 194px;
    }
    .offset-handicap {
      color: ${commonColors.handicapTextDark};
    }
    .offset-advantage {
      color: ${commonColors.advantageTextDark};
    }
    `;

  @property()
  data?: (StagePlayerEntry | null)[] = this._createEmptyData();

  private _createEmptyData(): (StagePlayerEntry | null)[] {
    return [...new Array(8)].map((_) => null);
  }

  render() {
    const data = this.data ?? this._createEmptyData();
    const isDataEmpty = data.every(e => e == null);

    return html`
    <div class="container">
      ${
      map(data, (e, i) =>
        html`
        <div class="player">
          <div class=${classMap({ "id": true, "id-inactive": !isDataEmpty && e == null })}>${i + 1}</div>
          <div class="name">${e?.name}</div>
          <div class="best-time">${e != null ? formatTime(e.rawBestTime) : null}</div>
          ${(() => {
            const handicap = e?.handicap ?? 0;
            if (handicap > 0) {
              return html`<div class="offset offset-handicap">[Hdcp. +${handicap}]</div>`
            } else if (handicap < 0) {
              return html`<div class="offset offset-advantage">[Adv. ${handicap}]</div>`
            } else {
              return html`<div class="offset"></div>`
            }
          })()}
        </div>
        `)
    }
    </div>
    `;
  }
}
