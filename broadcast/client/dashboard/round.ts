import { DashboardContext, dashboardContext } from "./dashboard_context.ts";
import {
  consume,
  css,
  customElement,
  html,
  LitElement,
  state,
} from "../deps.ts";
import { RoundData } from "../../common/type_definition.ts";

@customElement("masters-round")
export class MastersRoundElement extends LitElement {
  static styles = css`
    .container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      grid-gap: 8px;
    }

    .column {
      /* TODO: もっとうまいやりかたがありそう */
      height: calc(100vh - 370px);
      overflow-y: scroll;
    }
  `;

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  @state()
  private _currentRoundData?: RoundData | null = null;

  async firstUpdated() {
    const client = await this._dashboardContext.getClient();
    const currentRoundDataReplicant = await client.getReplicant(
      "currentRoundData",
    );
    currentRoundDataReplicant.subscribe((value) => {
      this._currentRoundData = value;
    });
  }

  render() {
    return html`
    <div class="container">
      <fluent-card class="column">
        ${JSON.stringify(this._currentRoundData?.stageData ?? [])}
      </fluent-card>
      <fluent-card class="column">
        ${JSON.stringify(this._currentRoundData?.supplementComparisons ?? [])}
      </fluent-card>
    </div>
    `;
  }
}
