import { css, customElement, html, LitElement } from "../deps.ts";

@customElement("masters-chat")
export class MastersChatElement extends LitElement {
  static styles = css`
  .container {
    height: 100%;
  }

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
  `;

  render() {
    return html`
    <div class="container">
      <iframe src="https://www.twitch.tv/embed/piertgm/chat?parent=localhost">
      </iframe>
    </div>
    `;
  }
}
