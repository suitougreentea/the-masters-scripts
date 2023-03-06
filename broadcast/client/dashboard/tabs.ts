import { css, customElement, html, LitElement } from "../deps.ts";

@customElement("masters-tabs")
export class MastersTabsElement extends LitElement {
  static styles = css`
  .container {
    background-color: rgb(249, 249, 249);
    border-bottom: 1px solid gray;
  }

  .start, .end {
    display: inline-block;
    padding: 0px 8px;
    line-height: 24px;
  }
  .start {
    border-right: 1px solid gray;
  }
  .end {
    border-left: 1px solid gray;
  }

  #competition-name {
    font-weight: bold;
  }
  `;

  render() {
    return html`
    <fluent-tabs class="container">
      <span class="start" slot="start">
        <span id="competition-name">The Masters 199th</span>
      </span>
      <fluent-tab slot="tab">トップ</fluent-tab>
      <fluent-tab slot="tab">tab2</fluent-tab>
      <fluent-tab slot="tab">tab3</fluent-tab>
      <fluent-tab-panel slot="tabpanel"></fluent-tab-panel>
      <fluent-tab-panel slot="tabpanel"></fluent-tab-panel>
      <fluent-tab-panel slot="tabpanel"></fluent-tab-panel>
      <span class="end" slot="end">
        <fluent-button>大会設定を再読み込み</fluent-button>
      </span>
    </fluent-tabs>
    `;
  }
}
