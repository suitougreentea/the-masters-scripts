import {
  RegisteredPlayerEntry,
  StagePlayerEntry,
} from "../../../common/common_types.ts";
import { OcrResult } from "../../common/type_definition.ts"; // TODO: Experimental
import { commonColors } from "../common/common_values.ts";
import { getDiffTime } from "../../common/util.ts";
import {
  classMap,
  css,
  customElement,
  html,
  LitElement,
  map,
  property,
} from "../deps.ts";
import { timeToString } from "../../../common/time.ts";

const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

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
      text-shadow: 0 0 5px black;
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

    /* TODO: Experimental */
    @keyframes health-animation {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
    .health {
      position: absolute;
      top: 10px;
      width: 150px;
      height: 30px;
      background: linear-gradient(0deg, var(--health-color), transparent);
      animation: health-animation 1s linear 0s infinite alternate;
    }
    .player:nth-child(odd) .health {
      left: 60px;
    }
    .player:nth-child(even) .health {
      right: 60px;
    }

    .name {
      position: absolute;
      top: 10px;
      font-size: 24px;
      line-height: 24px;
      text-shadow: 0 0 5px black;
    }
    .player:nth-child(odd) .name {
      left: 60px;
    }
    .player:nth-child(even) .name {
      right: 60px;
    }
    
    .detail {
      position: absolute;
      top: 77px;
      width: 210px;
      height: 310px;
      border-radius: 5px;
      background: rgba(0, 0, 0, 0.97);
      box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.7);
      padding: 12px;
    }

    .player:nth-child(odd) .detail {
      left: 20px;
    }
    .player:nth-child(even) .detail {
      right: 20px;
    }

    .detail-name {
      font-size: 20px;
    }

    hr {
      border: none;
      border-top: 1px solid ${commonColors.textDark};
    }

    dl {
      display: grid;
      margin: 0;
      row-gap: 10px;
    }

    dt {
      grid-column: 1;
      text-align: left;
    }

    dd {
      grid-column: 2;
      text-align: right;
    }

    .offset-handicap {
      color: ${commonColors.handicapTextDark};
    }
    .offset-advantage {
      color: ${commonColors.advantageTextDark};
    }

    .free {
      height: 100px;
      word-wrap: break-word;
      overflow: hidden;
      text-align: left;
    }
    `;

  @property()
  data?: (StagePlayerEntry | null)[] = this._createEmptyData();

  @property()
  showDetail? = true;

  @property()
  registeredPlayers: RegisteredPlayerEntry[] = [];

  // TODO: Experimental
  private _healthDivs: HTMLDivElement[] = [];

  private _createEmptyData(): (StagePlayerEntry | null)[] {
    return [...new Array(8)].map((_) => null);
  }

  firstUpdated() {
    // TODO: Experimental
    this._healthDivs = [];
    this.renderRoot.querySelectorAll(".health").forEach((e) =>
      this._healthDivs.push(e as HTMLDivElement)
    );
  }

  setOcrResult(result?: OcrResult | null) {
    this._healthDivs.forEach((e) => {
      e.style.setProperty("--health-color", "transparent");
    });

    if (result == null) return;
    result.status.forEach((status, i) => {
      const healthColor = status.health == "CAUTION"
        ? "rgb(150, 150, 0)"
        : status.health == "DANGER"
        ? "rgb(180, 0, 0)"
        : "transparent";
      this._healthDivs[i].style.setProperty("--health-color", healthColor);
    });
  }

  render() {
    const data = this.data ?? this._createEmptyData();
    const isDataEmpty = data.every((e) => e == null);

    return html`
    <div class="container">
      ${
      map(data, (e, i) =>
        html`
        <div class="player">
          <div class=${
          classMap({ "id": true, "id-inactive": !isDataEmpty && e == null })
        }>${i + 1}</div>
          <!-- TODO: Experimental -->
          <div class="health"></div>
          <div class="name">${e?.name}</div>
          ${
          this.showDetail && e != null
            ? html`
          <div class="detail">
            <div class="detail-name">${e?.name}</div>
            <hr>
            <dl class="best-time">
              <dt>自己ベスト</dt>
              <dd>${e != null ? timeToString(e.rawBestTime) : null}</dd>
              <dt>スタート</dt>
              <dd>
                ${e != null ? timeToString(e.startTime) : null}
                <br>
                ${
              (() => {
                const handicap = e?.handicap ?? 0;
                if (handicap > 0) {
                  return html`<div class="offset-handicap">[Hdcp. +${handicap}]</div>`;
                } else if (handicap < 0) {
                  return html`<div class="offset-advantage">[Adv. ${handicap}]</div>`;
                } else {
                  return html`<div class="offset-neutral">[±0]</div>`;
                }
              })()
            }
              </dd>
              <dt>スタート順</dt>
              <dd>${e != null ? ordinals[e.startOrder - 1] : null}</dd>
              <dt>前の人から</dt>
              <dd>${
              e != null ? `+${timeToString(getDiffTime(data, i))}` : null
            }</dd>
            </dl>
            <hr>
            <div class="free">
              ${
              (this.registeredPlayers.find((p) => p.name == e.name)?.comment ??
                "").split("\n").map((line) => html`${line}<br>`)
            }
            </div>
          </div>
          `
            : null
        }
        </div>
        `)
    }
    </div>
    `;
  }
}
