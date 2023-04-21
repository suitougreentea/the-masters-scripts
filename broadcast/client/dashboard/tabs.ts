import {
  consume,
  css,
  customElement,
  FluentTabs,
  html,
  LitElement,
  map,
  query,
  state,
} from "../deps.ts";
import { DashboardContext, dashboardContext } from "./dashboard_context.ts";

@customElement("masters-tabs")
export class MastersTabsElement extends LitElement {
  static styles = css`
  .container {
  }

  fluent-tabs {
    margin: 8px 0;
    --base-height-multiplier: 4;
  }

  #competition-name {
    font-weight: bold;
  }
  `;

  @consume({ context: dashboardContext })
  private _dashboardContext!: DashboardContext;

  @state()
  private _hasMetadata = false;
  @state()
  private _competitionName = "-";
  @state()
  private _roundNames: string[] = [];

  // @ts-ignore: ?
  @query("fluent-tabs", true)
  private _fluentTabs!: FluentTabs;
  private _activeTabName = "setup";
  get activeTabName() {
    return this._activeTabName;
  }

  async firstUpdated() {
    const client = await this._dashboardContext.getClient();
    const currentCompetitionMetadataReplicant = await client.getReplicant(
      "currentCompetitionMetadata",
    );
    currentCompetitionMetadataReplicant.subscribe((value) => {
      if (value != null) {
        this._hasMetadata = true;
        this._competitionName = value.name;
        this._roundNames = value.rounds.map((e) => e.name);
      } else {
        this._hasMetadata = false;
        this._competitionName = "-";
        this._roundNames = [];
      }
    });
  }

  changeTab(name: string) {
    this._fluentTabs.activeid = name;
  }

  private _onTabChange(e: Event) {
    e.preventDefault();
    this._activeTabName = (e.target as FluentTabs).activeid!;
    this.dispatchEvent(new Event("change-active-tab"));
  }

  private async _reloadCompetitionMetadata() {
    await this._dashboardContext.sendRequest("getCurrentCompetitionMetadata");
  }

  private async _confirmFinishCompetition() {
    if (
      await this._dashboardContext.confirm(
        "大会を終了してもよろしいですか？すべての試合が終わったあとに押してください。",
      )
    ) {
      const result = await this._dashboardContext.sendRequest(
        "finishCompetition",
      );
      await this._dashboardContext.alert(
        `${result.exportedUrl}に結果がエクスポートされました`,
      );
      if (await this._dashboardContext.confirm("結果をツイートしますか？")) {
        const message =
          `${this._competitionName}の結果です。\n${result.exportedUrl}`;
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURI(message)}`,
        );
      }
      await this._dashboardContext.sendRequest("toggleResultScene", {
        show: false,
      });
      await this._dashboardContext.sendRequest(
        "unsetCompetitionSceneStageData",
      );
      await this._dashboardContext.sendRequest(
        "unsetResultSceneData",
      );
      this.dispatchEvent(new Event("finish-competition"));
    }
  }

  render() {
    return html`
    <span class="start">
      <span id="competition-name">${this._competitionName}</span>
    </span>
    <fluent-tabs class="container" orientation="vertical" @change=${this._onTabChange}>
      <fluent-tab slot="tab" id="setup">セットアップ</fluent-tab>
      ${
      map(
        this._roundNames,
        (e, i) => html`<fluent-tab slot="tab" id="round${i}">${e}</fluent-tab>`,
      )
    }
      <fluent-tab-panel slot="tabpanel"></fluent-tab-panel>
      ${
      map(this._roundNames, () =>
        html`<fluent-tab-panel slot="tabpanel"></fluent-tab-panel>`)
    }
    </fluent-tabs>
    <span class="end">
      <fluent-button @click=${this._reloadCompetitionMetadata}>大会設定を再読み込み</fluent-button>
      <fluent-button appearance="accent" .disabled=${!this
      ._hasMetadata} @click=${this._confirmFinishCompetition}>大会を終了</fluent-button>
    </span>
    `;
  }
}
