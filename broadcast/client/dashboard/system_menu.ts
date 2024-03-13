import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import { consume, customElement, html, LitElement } from "../deps.ts";

@customElement("masters-system-menu")
export class MastersSystemMenuElement extends LitElement {
  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  async firstUpdated() {
  }

  render() {
    return html`
    <div class="container">
      Local Backend
    </div>
    `;
  }
}
