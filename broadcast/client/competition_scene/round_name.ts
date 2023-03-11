import { commonColors } from "../common/common_values.ts";
import { css, customElement, html, LitElement, property } from "../deps.ts";

@customElement("masters-round-name")
export class MastersRoundNameElement extends LitElement {
  static styles = css`
    .container {
      color: ${commonColors.textDark};
      text-align: center;
    }
    .ja {
      font-size: 36px;
      line-height: 36px;
    }
    .en {
      margin-top: 8px;
      font-size: 24px;
      line-height: 24px;
    }
    `;

  @property()
  name?: string;

  #translateName(ja: string): string {
    const qualifierMatch = ja.match(/^予選 Heat(\d+)$/);
    if (qualifierMatch) return `Qualifier Round Heat ${qualifierMatch[1]}`;

    const winnersRoundMatch = ja.match(/^(\d+)回戦/);
    if (winnersRoundMatch) {
      const groupMatch = ja.match(/(.)組$/);
      return groupMatch
        ? `Round ${winnersRoundMatch[1]} Group ${groupMatch[1]}`
        : `Round ${winnersRoundMatch[1]}`;
    }

    const losersRoundMatch = ja.match(/^敗者復活(\d+)?/);
    if (losersRoundMatch) {
      const base = losersRoundMatch[1]
        ? `Consolation Round ${losersRoundMatch[1]}`
        : `Consolation Round`;
      const groupMatch = ja.match(/(.)組$/);
      return groupMatch ? `${base} Group ${groupMatch[1]}` : `${base}`;
    }

    const semifinalMatch = ja.match(/^準決勝/);
    if (semifinalMatch) {
      const groupMatch = ja.match(/(.)組$/);
      return groupMatch
        ? `Semifinal Round Group ${groupMatch[1]}`
        : `Semifinal Round`;
    }

    const finalMatch = ja.match(/^決勝$/);
    if (finalMatch) return `Final Round`;

    return "";
  }

  render() {
    const japaneseName = this.name ?? "";
    const englishName = this.#translateName(japaneseName);

    return html`
    <div class="container">
      <div class="ja">${japaneseName}</span>
      <div class="en">${englishName}</span>
    </div>
    `;
  }
}
