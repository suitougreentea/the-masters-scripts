import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

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
    // deno-fmt-ignore
    return html`
    <div class="container">
      <iframe src="https://www.twitch.tv/embed/piertgm/chat?parent=localhost">
      </iframe>
    </div>
    `;
  }
}
