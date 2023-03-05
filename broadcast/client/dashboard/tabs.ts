import {
css,
  customElement,
  html,
  LitElement,
} from "../deps.ts";

@customElement("masters-tabs")
export class MastersTabsElement extends LitElement {
  static styles = css`
  .container {
    background-color: rgb(192, 192, 192);
  }
  `

  render() {
    return html`
    <div class="container">
      <button>foo</button>
      <button>bar</button>
    </div>
    `;
  }
}