namespace Preset {
  export type StageDefinition = {
    name: string;
    winners: (number | null)[];
    wildcards?: number[];
    losers: (number | null)[];
    consolation?: boolean;
    wildcard?: boolean;
  }

  export type Preset = {
    name: string;
    supportedNumberOfPlayers: [number, number];
    numFirstRoundGroups: number;
    stages: StageDefinition[];
  }

  // 非クラシックルール 振り分けの原則:
  // 1位から順番にスネークで埋めていく
  // ワイルドカードや敗者復活は勝ち上がりの後ろから埋める
  // 例1:
  // a: A1 A2 B2 B3 C3 C4 L1 L4
  // b: B1 C1 C2 A3 A4 B4 L2 L3
  // 例2:
  // a: A1 A2 B2 WC2
  // b: B1 E1 C2 WC1
  // c: C1 D1 D2 E2
  export const presets: Record<string, Preset> = {
    // 1回戦1組と決勝のみ (5～8人, 計2戦)
    // not implemented

    // 1回戦2組 (特殊WC), 敗者復活1戦 (9人, 計6戦)
    // 9: W1:[5,4]>(W2:8,L1:1); W2:[8]>(W3:4,L1:4); L1:[5]>(W3:4); W3:[8]>(W4:4)
    // not implemented

    // 1回戦2組, 敗者復活1戦 (10～12人, 計6戦)
    // 10: W1:[5,5]>(W2:8,L1:2); W2:[8]>(W3:4,L1:4); L1:[6]>(W3:4); W3:[8]>(W4:4)
    // 11: W1:[6,5]>(W2:8,L1:3); W2:[8]>(W3:4,L1:4); L1:[7]>(W3:4); W3:[8]>(W4:4)
    // 12: W1:[6,6]>(W2:8,L1:4); W2:[8]>(W3:4,L1:4); L1:[8]>(W3:4); W3:[8]>(W4:4)
    "12_classic": {
      name: "12_classic",
      supportedNumberOfPlayers: [10, 12],
      numFirstRoundGroups: 2,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [2, 2, 2, 2], losers: [3, 3] },
        /* 1 */ { name: "1回戦B", winners: [2, 2, 2, 2], losers: [3, 3] },
        /* 2 */ { name: "2回戦", winners: [4, 4, 4, 4], losers: [3, 3, 3, 3] },
        /* 3 */ { name: "敗者復活", winners: [4, 4, 4, 4], losers: [null, null, null, null], consolation: true },
        /* 4 */ { name: "準決勝", winners: [5, 5, 5, 5], losers: [null, null, null, null] },
        /* 5 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 1回戦2組, 敗者復活2戦 (13～16人, 計7戦)
    // 13: W1:[7,6]>(W2:8,L1:5); L1:[5]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4); W3:[8]>(W4:4)
    // 14: W1:[7,7]>(W2:8,L1:6); L1:[6]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4); W3:[8]>(W4:4)
    // 15: W1:[8,7]>(W2:8,L1:7); L1:[7]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4); W3:[8]>(W4:4)
    // 16: W1:[8,8]>(W2:8,L1:8); L1:[8]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4); W3:[8]>(W4:4)
    "16_classic": {
      name: "16_classic",
      supportedNumberOfPlayers: [13, 16],
      numFirstRoundGroups: 2,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [3, 3, 3, 3], losers: [2, 2, 2, 2] },
        /* 1 */ { name: "1回戦B", winners: [3, 3, 3, 3], losers: [2, 2, 2, 2] },
        /* 2 */ { name: "敗者復活1", winners: [4, 4, 4, 4], losers: [null, null, null, null], consolation: true },
        /* 3 */ { name: "2回戦", winners: [5, 5, 5, 5], losers: [4, 4, 4, 4] },
        /* 4 */ { name: "敗者復活2", winners: [5, 5, 5, 5], losers: [null, null, null, null], consolation: true },
        /* 5 */ { name: "準決勝", winners: [6, 6, 6, 6], losers: [null, null, null, null] },
        /* 6 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 1回戦3組, 敗者復活1戦2組 (17～20人, 計8戦)
    // 17: W1:[6,6,5]>(W2:8,L1: 9); W2:[8]>(W3:4,L1:4); L1:[7,6]>(W3:4); W3:[8]>(W4:4)
    // 18: W1:[6,6,6]>(W2:8,L1:10); W2:[8]>(W3:4,L1:4); L1:[7,7]>(W3:4); W3:[8]>(W4:4)
    // 19: W1:[7,6,6]>(W2:8,L1:11); W2:[8]>(W3:4,L1:4); L1:[8,7]>(W3:4); W3:[8]>(W4:4)
    // 20: W1:[7,7,6]>(W2:8,L1:12); W2:[8]>(W3:4,L1:4); L1:[8,8]>(W3:4); W3:[8]>(W4:4)
    // aba, bab, ab
    "20_classic": {
      name: "20_classic",
      supportedNumberOfPlayers: [17, 20],
      numFirstRoundGroups: 3,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [4, 4], wildcards: [3], losers: [5, 6, 5, 6] },
        /* 1 */ { name: "1回戦B", winners: [4, 4], wildcards: [3], losers: [6, 5, 6, 5] },
        /* 2 */ { name: "1回戦C", winners: [4, 4], wildcards: [3], losers: [5, 6, 5] },
        /* 3 */ { name: "1回戦ワイルドカード", winners: [4, 4], losers: [6], wildcard: true },
        /* 4 */ { name: "2回戦", winners: [7, 7, 7, 7], losers: [5, 6, 5, 6] },
        /* 5 */ { name: "敗者復活A", winners: [7, 7], losers: [null, null, null, null, null, null], consolation: true },
        /* 6 */ { name: "敗者復活B", winners: [7, 7], losers: [null, null, null, null, null, null], consolation: true },
        /* 7 */ { name: "準決勝", winners: [8, 8, 8, 8], losers: [null, null, null, null] },
        /* 8 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 1回戦3組, 2回戦2組, 敗者復活なし (21～24人, 計7戦)
    // 21: W1:[7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3[8]>(W4:4)
    // 22: W1:[8,7,7]>(W2:16); W2:[8,8]>(W3:8); W3[8]>(W4:4)
    // 23: W1:[8,8,7]>(W2:16); W2:[8,8]>(W3:8); W3[8]>(W4:4)
    // 24: W1:[8,8,8]>(W2:16); W2:[8,8]>(W3:8); W3[8]>(W4:4)
    // abab, baba, abab
    "24_classic": {
      name: "24_classic",
      supportedNumberOfPlayers: [21, 24],
      numFirstRoundGroups: 3,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [4, 5, 4, 5, 4], wildcards: [3], losers: [null, null] },
        /* 1 */ { name: "1回戦B", winners: [5, 4, 5, 4, 5], wildcards: [3], losers: [null, null] },
        /* 2 */ { name: "1回戦C", winners: [4, 5, 4, 5, 4], wildcards: [3], losers: [null, null] },
        /* 3 */ { name: "1回戦ワイルドカード", winners: [5], losers: [null, null], wildcard: true },
        /* 4 */ { name: "2回戦A", winners: [6, 6, 6, 6], losers: [null, null, null, null] },
        /* 5 */ { name: "2回戦B", winners: [6, 6, 6, 6], losers: [null, null, null, null] },
        /* 6 */ { name: "準決勝", winners: [7, 7, 7, 7], losers: [null, null, null, null] },
        /* 7 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 1回戦4組, 2回戦2組, 敗者復活なし (25～32人, 計8戦)
    // 25: W1:[7,6,6,6]...
    // 32: W1:[8,8,8,8]...
    // abab, baba, abab, baba
    // not implemented

    // 1回戦5組, 2回戦2組, 敗者復活なし (33～40人, 計9戦)
    // 33: W1:[7,7,7,6,6]...
    // 40: W1:[8,8,8,8,8]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // not implemented

    // 4人編成, 1回戦4組, 敗者復活1戦1組, 2回戦3組 (13人, 計11戦)
    // 13: W1:[4,3,3,3]>(W2: 9,L1:4); L1:[4]>(W2:3) W2:[4,4,4]>(W3:8); W3:[4,4]>(W4:4)
    // ※ 13～15は似た形だが、必ず最下位が敗者復活に回り、1回戦勝ち上がり人数が変わってくるため、現在のシステムだと共通化できない
    "13_4pg": {
      name: "13_4pg",
      supportedNumberOfPlayers: [13, 13],
      numFirstRoundGroups: 4,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [5, 6, 7], losers: [4] },
        /* 1 */ { name: "1回戦B", winners: [6, 5], losers: [4] },
        /* 2 */ { name: "1回戦C", winners: [7, 5], losers: [4] },
        /* 3 */ { name: "1回戦D", winners: [7, 6], losers: [4] },
        /* 4 */ { name: "敗者復活", winners: [7, 6, 5], losers: [null, null, null] },
        /* 5 */ { name: "2回戦A", winners: [9, 9], wildcards: [8], losers: [null] },
        /* 6 */ { name: "2回戦B", winners: [10, 9], wildcards: [8], losers: [null] },
        /* 7 */ { name: "2回戦C", winners: [10, 10], wildcards: [8], losers: [null] },
        /* 8 */ { name: "2回戦ワイルドカード", winners: [10, 9], losers: [null], wildcard: true },
        /* 9 */ { name: "準決勝A", winners: [11, 11], losers: [null, null] },
        /*10 */ { name: "準決勝B", winners: [11, 11], losers: [null, null] },
        /*11 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 4人編成, 1回戦4組, 敗者復活1戦1組, 2回戦3組 (14人, 計11戦)
    // 14: W1:[4,4,3,3]>(W2:10,L1:4); L1:[4]>(W2:2) W2:[4,4,4]>(W3:8); W3:[4,4]>(W4:4)
    "14_4pg": {
      name: "14_4pg",
      supportedNumberOfPlayers: [14, 14],
      numFirstRoundGroups: 4,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [5, 6, 7], losers: [4] },
        /* 1 */ { name: "1回戦B", winners: [6, 5, 7], losers: [4] },
        /* 2 */ { name: "1回戦C", winners: [7, 5], losers: [4] },
        /* 3 */ { name: "1回戦D", winners: [7, 6], losers: [4] },
        /* 4 */ { name: "敗者復活", winners: [6, 5], losers: [null, null] },
        /* 5 */ { name: "2回戦A", winners: [9, 9], wildcards: [8], losers: [null] },
        /* 6 */ { name: "2回戦B", winners: [10, 9], wildcards: [8], losers: [null] },
        /* 7 */ { name: "2回戦C", winners: [10, 10], wildcards: [8], losers: [null] },
        /* 8 */ { name: "2回戦ワイルドカード", winners: [10, 9], losers: [null], wildcard: true },
        /* 9 */ { name: "準決勝A", winners: [11, 11], losers: [null, null] },
        /*10 */ { name: "準決勝B", winners: [11, 11], losers: [null, null] },
        /*11 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 4人編成, 1回戦4組, 敗者復活1戦1組, 2回戦3組 (15人, 計11戦)
    // 15: W1:[4,4,4,3]>(W2:11,L1:4); L1:[4]>(W2:1) W2:[4,4,4]>(W3:8); W3:[4,4]>(W4:4)
    "15_4pg": {
      name: "15_4pg",
      supportedNumberOfPlayers: [15, 15],
      numFirstRoundGroups: 4,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [5, 6, 7], losers: [4] },
        /* 1 */ { name: "1回戦B", winners: [6, 5, 7], losers: [4] },
        /* 2 */ { name: "1回戦C", winners: [7, 5, 6], losers: [4] },
        /* 3 */ { name: "1回戦D", winners: [7, 6], losers: [4] },
        /* 4 */ { name: "敗者復活", winners: [5], losers: [null, null, null] },
        /* 5 */ { name: "2回戦A", winners: [9, 9], wildcards: [8], losers: [null] },
        /* 6 */ { name: "2回戦B", winners: [10, 9], wildcards: [8], losers: [null] },
        /* 7 */ { name: "2回戦C", winners: [10, 10], wildcards: [8], losers: [null] },
        /* 8 */ { name: "2回戦ワイルドカード", winners: [10, 9], losers: [null], wildcard: true },
        /* 9 */ { name: "準決勝A", winners: [11, 11], losers: [null, null] },
        /*10 */ { name: "準決勝B", winners: [11, 11], losers: [null, null] },
        /*11 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 4人編成, 1回戦4組, 2回戦3組 (16人, 計10戦)
    // 16: W1:[4,4,4,4]>(W2:12); W2:[4,4,4]>(W3:8); W3:[4,4]>(W4:4)
    "16_4pg": {
      name: "16_4pg",
      supportedNumberOfPlayers: [16, 16],
      numFirstRoundGroups: 4,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [4, 5, 6], losers: [null] },
        /* 1 */ { name: "1回戦B", winners: [5, 4, 6], losers: [null] },
        /* 2 */ { name: "1回戦C", winners: [6, 4, 5], losers: [null] },
        /* 3 */ { name: "1回戦D", winners: [6, 5, 4], losers: [null] },
        /* 4 */ { name: "2回戦A", winners: [8, 8], wildcards: [7], losers: [null] },
        /* 5 */ { name: "2回戦B", winners: [9, 8], wildcards: [7], losers: [null] },
        /* 6 */ { name: "2回戦C", winners: [9, 9], wildcards: [7], losers: [null] },
        /* 7 */ { name: "2回戦ワイルドカード", winners: [9, 8], losers: [null], wildcard: true },
        /* 8 */ { name: "準決勝A", winners: [10, 10], losers: [null, null] },
        /* 9 */ { name: "準決勝B", winners: [10, 10], losers: [null, null] },
        /*10 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 1回戦3組, 敗者復活1戦1組, 2回戦2組 (17～20人, 計8戦)
    // 17: W1:[6,6,5]>(W2:12,L1:5); L1:[5]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    // 18: W1:[6,6,6]>(W2:12,L1:6); L1:[6]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    // 19: W1:[7,6,6]>(W2:12,L1:7); L1:[7]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    // 20: W1:[7,7,6]>(W2:12,L1:8); L1:[8]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    "20": {
      name: "20",
      supportedNumberOfPlayers: [17, 20],
      numFirstRoundGroups: 3,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [4, 4, 5, 5], losers: [3, 3, 3] },
        /* 1 */ { name: "1回戦B", winners: [5, 4, 4, 5], losers: [3, 3, 3] },
        /* 2 */ { name: "1回戦C", winners: [5, 5, 4, 4], losers: [3, 3] },
        /* 3 */ { name: "敗者復活", winners: [4, 5, 5, 4], losers: [null, null, null, null], consolation: true },
        /* 4 */ { name: "2回戦A", winners: [6, 6, 6, 6], losers: [null, null, null, null] },
        /* 5 */ { name: "2回戦B", winners: [6, 6, 6, 6], losers: [null, null, null, null] },
        /* 6 */ { name: "準決勝", winners: [7, 7, 7, 7], losers: [null, null, null, null] },
        /* 7 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 1回戦3組, 敗者復活1戦2組, 2回戦2組 (21～24人, 計9戦)
    // 21: W1:[7,7,7]>(W2:12,L1: 9); L1:[5,4]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    // 22: W1:[8,7,7]>(W2:12,L1:10); L1:[5,5]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    // 23: W1:[8,8,7]>(W2:12,L1:11); L1:[6,5]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    // 24: W1:[8,8,8]>(W2:12,L1:12); L1:[6,6]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    "24": {
      name: "24",
      supportedNumberOfPlayers: [21, 24],
      numFirstRoundGroups: 3,
      stages: [
        /* 0 */ { name: "1回戦A", winners: [5, 5, 6, 6], losers: [3, 3, 4, 4] },
        /* 1 */ { name: "1回戦B", winners: [6, 5, 5, 6], losers: [4, 3, 3, 4] },
        /* 2 */ { name: "1回戦C", winners: [6, 6, 5, 5], losers: [4, 4, 3, 3] },
        /* 3 */ { name: "敗者復活A", winners: [5, 6], losers: [null, null, null, null], consolation: true },
        /* 4 */ { name: "敗者復活B", winners: [6, 5], losers: [null, null, null, null], consolation: true },
        /* 5 */ { name: "2回戦A", winners: [7, 7, 7, 7], losers: [null, null, null, null] },
        /* 6 */ { name: "2回戦B", winners: [7, 7, 7, 7], losers: [null, null, null, null] },
        /* 7 */ { name: "準決勝", winners: [8, 8, 8, 8], losers: [null, null, null, null] },
        /* 8 */ { name: "決勝", winners: [null], losers: [null, null, null] }
      ]
    },

    // 6人編成, 1回戦2組, 敗者復活1戦 (8～9人, 計6戦)
    // 8: W1:[4,3]>(W2:6,L1:3); W2:[6]>(W3:3,L1:3); L1:[6]>(W3:3); W3:[6]>(W4:3)
    // 9: W1:[5,4]>(W2:6,L1:3); W2:[6]>(W3:3,L1:3); L1:[6]>(W3:3); W3:[6]>(W4:3)
    // not implemented

    // 6人編成, 1回戦2組, 敗者復活2戦 (10～12人, 計7戦)
    // 10: W1:[5,5]>(W2:6,L1:4); L1:[4]>(L2:3); W2:[6]>(W3:3,L2:3); L2:[6]>(W3:3); W3:[8]>(W4:3)
    // 11: W1:[6,5]>(W2:6,L1:5); L1:[5]>(L2:3); W2:[6]>(W3:3,L2:3); L2:[6]>(W3:3); W3:[8]>(W4:3)
    // 12: W1:[6,6]>(W2:6,L1:6); L1:[6]>(L2:3); W2:[6]>(W3:3,L2:3); L2:[6]>(W3:3); W3:[8]>(W4:3)
    // not implemented
  };

  export function getAppropriatePresetName(numPlayers: number) {
    if (10 <= numPlayers && numPlayers <= 12) return "12_classic";
    if (13 <= numPlayers && numPlayers <= 13) return "13_4pg";
    if (14 <= numPlayers && numPlayers <= 14) return "14_4pg";
    if (15 <= numPlayers && numPlayers <= 15) return "15_4pg";
    if (16 <= numPlayers && numPlayers <= 16) return "16_4pg";
    if (17 <= numPlayers && numPlayers <= 20) return "20";
    if (21 <= numPlayers && numPlayers <= 24) return "24";
    throw new Error(`${numPlayers}人に対応するプリセットが見つかりませんでした`);
  }

  export const manualPresetName = "manual";
}