import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import { consume, customElement, html, LitElement, state } from "../deps.ts";

@customElement("masters-system-menu")
export class MastersSystemMenuElement extends LitElement {
  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  @state()
  private _loginInProgress = false;

  async firstUpdated() {
  }

  private async _login() {
    const client = await this._dashboardContext.getClient();
    const urlInfo = await client.requestToServer("login");
    window.open(urlInfo.url);

    const waitForLoginResult = () =>
      new Promise<void>((resolve, reject) => {
        const listener = (result: { success: boolean }) => {
          client.removeMessageListener("loginResult", listener);
          if (result.success) {
            resolve();
          } else {
            reject();
          }
        };
        client.addMessageListener("loginResult", listener);
      });
    try {
      this._loginInProgress = true;
      await waitForLoginResult();
    } finally {
      this._loginInProgress = false;
    }
  }

  private async _cancelLogin() {
    const client = await this._dashboardContext.getClient();
    await client.requestToServer("cancelLogin");
  }

  render() {
    return html`
    <div class="container">
      <button id="login" ?disabled="${this._loginInProgress}" @click="${this._login}">Login</button>
      <button id="login-cancel" ?disabled="${!this
      ._loginInProgress}" @click="${this._cancelLogin}">Cancel</button>
    </div>
    `;
  }
}
