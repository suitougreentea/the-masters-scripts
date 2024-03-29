import { commonColors } from "../common/common_values.ts";
import {
  css,
  customElement,
  html,
  LitElement,
  property,
  state,
} from "../deps.ts";

@customElement("masters-title")
export class MastersTitleElement extends LitElement {
  static styles = css`
    .container {
      width: 1620px;
      color: ${commonColors.textDark};
      line-height: 36px;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }
    .title {
      font-size: 36px;
    }
    .date {
      margin-left: 16px;
      font-size: 24px;
    }
    .location {
      font-size: 24px;
    }
    `;

  @property()
  value?: string;

  @state()
  private _dateString?: string;
  private _dateUpdateInterval?: number;

  connectedCallback() {
    super.connectedCallback();
    this._updateDate();
    this._dateUpdateInterval = setInterval(() => this._updateDate(), 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._dateUpdateInterval != null) {
      clearInterval(this._dateUpdateInterval);
      this._dateUpdateInterval = undefined;
    }
  }

  private _updateDate() {
    this._dateString;
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const hours = date.getHours();
    const minutes = date.getMinutes();
    // deno-fmt-ignore
    this._dateString = `${year}/${month}/${day} (${weekday}) ${hours}:${String(minutes).padStart(2, "0")}`;
  }

  render() {
    // deno-fmt-ignore
    return html`
    <div class="container">
      <div>
        <span class="title">${this.value ?? ""}</span>
        <span class="date">${this._dateString}</span>
      </div>
      <div>
        <span class="location">@Retropia22</span>
      </div>
    </div>
    `;
  }
}
