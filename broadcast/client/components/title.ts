import { commonColors } from "../../common/common_values.ts";
import { css, customElement, html, LitElement, property } from "../deps.ts";

@customElement("masters-title")
export class MastersTitleElement extends LitElement {
  static styles = css`
    .container {
      color: ${commonColors.text};
      line-height: 36px;
    }
    .title {
      font-size: 36px;
    }
    .date {
      margin-left: 16px;
      font-size: 24px;
    }
    `;

  @property()
  value?: string;

  render() {
    const date = new Date();

    return html`
    <div class="container">
      <span class="title">${this.value ?? ""}</span>
      <span class="date">${date.getFullYear()}/${
      date.getMonth() + 1
    }/${date.getDate()} (${
      date.toLocaleDateString("en-US", { weekday: "short" })
    })</span>
    </div>
    `;
  }
}
