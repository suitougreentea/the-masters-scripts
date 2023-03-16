import { commonColors } from "../common/common_values.ts";
import { css, customElement, html, LitElement, property } from "../deps.ts";

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

  render() {
    const date = new Date();

    return html`
    <div class="container">
      <div>
        <span class="title">${this.value ?? ""}</span>
        <span class="date">${date.getFullYear()}/${
      date.getMonth() + 1
    }/${date.getDate()} (${
      date.toLocaleDateString("en-US", { weekday: "short" })
    })</span>
      </div>
      <div>
        <span class="location">@Retropia22</span>
      </div>
    </div>
    `;
  }
}
