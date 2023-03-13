namespace Preset {
  /* eslint no-shadow: off */
  export type Preset = {
    name: string;
    supportedNumberOfPlayers: [number, number];
    type: CompetitionType;
    rounds: {
      name: string;
      /** -1の場合は残りが全員入る (winners, losersの中で1回だけ使用可能) */
      numGroups?: number;
      qualifierPlayerIndices?: number[][];
      winners?: {
        numPerGroup: number;
        numWildcard: number;
        destinationRoundIndex: number;
        destinationMethod: DestinationMethod;
        handicapMethod: HandicapMethod;
      }
      losers?: {
        numPerGroup: number;
        destinationRoundIndex?: number;
        destinationMethod?: DestinationMethod;
      };
    }[];
  };

  const presets: Preset[] = [
    // 4人編成, ポイント制 (8人, 計9戦)
    {
      name: "8_4p",
      supportedNumberOfPlayers: [8, 8],
      type: "qualifierFinal",
      rounds: [
        { // 0
          name: "予選",
          qualifierPlayerIndices: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [0, 2, 4, 6],
            [1, 3, 5, 7],
            [0, 1, 4, 5],
            [2, 3, 6, 7],
            [0, 2, 5, 7],
            [1, 3, 4, 6],
          ],
        },
        { // 1
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 4人編成, ポイント制 (9人, 計10戦)
    {
      name: "9_4p",
      supportedNumberOfPlayers: [9, 9],
      type: "qualifierFinal",
      rounds: [
        { // 0
          name: "予選",
          qualifierPlayerIndices: [
            [0, 1, 3, 4],
            [2, 3, 5, 6],
            [4, 5, 7, 8],
            [0, 1, 6, 7],
            [0, 2 ,3, 8],
            [1, 2, 4, 5],
            [3, 4, 6, 7],
            [0, 5, 6, 8],
            [1, 2, 7, 8],
          ],
        },
        { // 1
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 4人編成, ポイント制 (10人, 計11戦)
    {
      name: "10_4p",
      supportedNumberOfPlayers: [10, 10],
      type: "qualifierFinal",
      rounds: [
        { // 0
          name: "予選",
          qualifierPlayerIndices: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [0, 5, 8, 9],
            [1, 4, 6, 9],
            [2, 3, 7, 8],
            [0, 3, 6, 8],
            [1, 4, 7, 9],
            [0, 2, 4, 5],
            [1, 3, 5, 7],
            [2, 6, 8, 9],
          ],
        },
        { // 1
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 4人編成, ポイント制 (11人, 計12戦)
    {
      name: "11_4p",
      supportedNumberOfPlayers: [11, 11],
      type: "qualifierFinal",
      rounds: [
        { // 0
          name: "予選",
          qualifierPlayerIndices: [
            [0, 1, 2, 5],
            [2, 3, 4, 7],
            [4, 5, 6, 9],
            [0, 6, 7, 8],
            [2, 8, 9, 10],
            [0, 1, 4, 10],
            [1, 2, 3, 6],
            [3, 4, 5, 8],
            [5, 6, 7, 10],
            [1, 7, 8, 9],
            [0, 3, 9, 10],
          ],
        },
        { // 1
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 4人編成, ポイント制 (12人, 計10戦)
    {
      name: "12_4p",
      supportedNumberOfPlayers: [12, 12],
      type: "qualifierFinal",
      rounds: [
        { // 0
          name: "予選",
          qualifierPlayerIndices: [
            [0, 5, 6, 11],
            [1, 4, 7, 10],
            [2, 3, 8, 9],
            [0, 3, 6, 9],
            [1, 2, 7, 8],
            [4, 5, 10, 11],
            [0, 2, 7, 11],
            [1, 4, 6, 9],
            [3, 5, 8, 10],
          ],
        },
        { // 1
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 1回戦2組, 2回戦1組, 敗者復活1戦1組 (10～12人, 計6戦)
    // 10: W1:[5,5]>(W2:8,L1:2); W2:[8]>(W3:4,L1:4); L1:[6]>(W3:4); W3:[8]>(W4:4)
    // 11: W1:[6,5]>(W2:8,L1:3); W2:[8]>(W3:4,L1:4); L1:[7]>(W3:4); W3:[8]>(W4:4)
    // 12: W1:[6,6]>(W2:8,L1:4); W2:[8]>(W3:4,L1:4); L1:[8]>(W3:4); W3:[8]>(W4:4)
    // TODO: ハンデの差を付けるんだっけ？
    {
      name: "12",
      supportedNumberOfPlayers: [10, 12],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 2,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 1, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 2, destinationMethod: "standard" },
        },
        { // 1
          name: "2回戦",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 2, destinationMethod: "standard" },
        },
        { // 2
          name: "敗者復活",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 3
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 4人編成, 1回戦4組, 敗者復活1戦1組, 2回戦3組 (13人, 計11戦)
    // 13: W1:[4,3,3,3]>(W2: 9,L1:4); L1:[4]>(W2:3) W2:[4,4,4]>(W3:8); W3:[4,4]>(W4:4)
    // ※ 13～15は似た形だが、必ず最下位が敗者復活に回り、1回戦勝ち上がり人数が変わってくるため、現在のシステムだと共通化できない
    {
      name: "13_4",
      supportedNumberOfPlayers: [13, 13],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 4,
          winners: { numPerGroup: -1, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: 1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 3,
          winners: { numPerGroup: 2, numWildcard: 2, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "準決勝",
          numGroups: 2,
          winners: { numPerGroup: 2, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 4人編成, 1回戦4組, 敗者復活1戦1組, 2回戦3組 (14人, 計11戦)
    // 14: W1:[4,4,3,3]>(W2:10,L1:4); L1:[4]>(W2:2) W2:[4,4,4]>(W3:8); W3:[4,4]>(W4:4)
    {
      name: "14_4",
      supportedNumberOfPlayers: [14, 14],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 4,
          winners: { numPerGroup: -1, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: 1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活",
          numGroups: 1,
          winners: { numPerGroup: 2, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 3,
          winners: { numPerGroup: 2, numWildcard: 2, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "準決勝",
          numGroups: 2,
          winners: { numPerGroup: 2, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 4人編成, 1回戦4組, 敗者復活1戦1組, 2回戦3組 (15人, 計11戦)
    // 15: W1:[4,4,4,3]>(W2:11,L1:4); L1:[4]>(W2:1) W2:[4,4,4]>(W3:8); W3:[4,4]>(W4:4)
    {
      name: "15_4",
      supportedNumberOfPlayers: [15, 15],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 4,
          winners: { numPerGroup: -1, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: 1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活",
          numGroups: 1,
          winners: { numPerGroup: 1, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 3,
          winners: { numPerGroup: 2, numWildcard: 2, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "準決勝",
          numGroups: 2,
          winners: { numPerGroup: 2, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 4人編成, 1回戦4組, 2回戦3組 (16人, 計10戦)
    // 16: W1:[4,4,4,4]>(W2:12); W2:[4,4,4]>(W3:8); W3:[4,4]>(W4:4)
    {
      name: "16_4",
      supportedNumberOfPlayers: [16, 16],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 4,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 1, destinationMethod: "standard", handicapMethod: "winnersDest" },
        },
        { // 1
          name: "2回戦",
          numGroups: 3,
          winners: { numPerGroup: 2, numWildcard: 2, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 2
          name: "準決勝",
          numGroups: 2,
          winners: { numPerGroup: 2, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 1回戦2組, 敗者復活1組, 2回戦1組, 敗者復活1組 (13～16人, 計7戦)
    // 13: W1:[7,6]>(W2:8,L1:5); L1:[5]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4) W3:[8]>(W4:4)
    // 14: W1:[7,7]>(W2:8,L1:6); L1:[6]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4) W3:[8]>(W4:4)
    // 15: W1:[8,7]>(W2:8,L1:7); L1:[7]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4) W3:[8]>(W4:4)
    // 16: W1:[8,8]>(W2:8,L1:8); L1:[8]>(L2:4); W2:[8]>(W3:4,L2:4); L2:[8]>(W3:4) W3:[8]>(W4:4)
    {
      name: "16",
      supportedNumberOfPlayers: [13, 16],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 2,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活1",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 3, destinationMethod: "standard" },
        },
        { // 3
          name: "敗者復活2",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 4
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 5, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 5
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 1回戦3組, 敗者復活1戦1組, 2回戦2組 (17～20人, 計8戦)
    // 17: W1:[6,6,5]>(W2:12,L1:5); L1:[5]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    // 18: W1:[6,6,6]>(W2:12,L1:6); L1:[6]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    // 19: W1:[7,6,6]>(W2:12,L1:7); L1:[7]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    // 20: W1:[7,7,6]>(W2:12,L1:8); L1:[8]>(W2:4); W2:[8,8]>(W3:4); W3:[8]>(W4:4)
    {
      name: "20",
      supportedNumberOfPlayers: [17, 20],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 3,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 1回戦3組, 敗者復活1戦2組, 2回戦2組 (21～24人, 計9戦)
    // 21: W1:[7,7,7]>(W2:12,L1: 9); L1:[5,4]>(W2:4); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 22: W1:[8,7,7]>(W2:12,L1:10); L1:[5,5]>(W2:4); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 23: W1:[8,8,7]>(W2:12,L1:11); L1:[6,5]>(W2:4); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 24: W1:[8,8,8]>(W2:12,L1:12); L1:[6,6]>(W2:4); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    {
      name: "24",
      supportedNumberOfPlayers: [21, 24],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 3,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活",
          numGroups: 2,
          winners: { numPerGroup: 2, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 1回戦4組, 敗者復活1戦2組, 2回戦2組 (25～28人, 計10戦)
    // 25: W1:[7,6,6,6]>(W2:12,L1:13); L1:[7,6]>(W2:4); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 26: W1:[7,7,6,6]>(W2:12,L1:14); L1:[7,7]>(W2:4); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 27: W1:[7,7,7,6]>(W2:12,L1:15); L1:[7,8]>(W2:4); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 28: W1:[7,7,7,7]>(W2:12,L1:16); L1:[8,8]>(W2:4); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    {
      name: "28",
      supportedNumberOfPlayers: [25, 28],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 4,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活",
          numGroups: 2,
          winners: { numPerGroup: 2, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 1回戦4組, 2回戦2組 (29～32人, 計8戦)
    // 29: W1:[8,7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 30: W1:[8,8,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 31: W1:[8,8,8,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 32: W1:[8,8,8,8]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    {
      name: "32",
      supportedNumberOfPlayers: [28, 32],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 4,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 1, destinationMethod: "standard", handicapMethod: "winnersDest" },
        },
        { // 1
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 2
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 1回戦5組, 2回戦2組 (33～40人, 計9戦)
    // 33: W1:[7,7,7,6,6]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 34: W1:[7,7,7,7,6]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 35: W1:[7,7,7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 36: W1:[8,7,7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 37: W1:[8,8,7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 38: W1:[8,8,8,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 39: W1:[8,8,8,8,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 40: W1:[8,8,8,8,8]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    {
      name: "40",
      supportedNumberOfPlayers: [33, 40],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 5,
          winners: { numPerGroup: 3, numWildcard: 1, destinationRoundIndex: 1, destinationMethod: "standard", handicapMethod: "winnersDest" },
        },
        { // 1
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 2
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 1回戦6組, 2回戦2組 (41～48人, 計10戦)
    // 41: W1:[7,7,7,7,7,6]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 42: W1:[7,7,7,7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 43: W1:[8,7,7,7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 44: W1:[8,8,7,7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 45: W1:[8,8,8,7,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 46: W1:[8,8,8,8,7,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 47: W1:[8,8,8,8,8,7]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    // 48: W1:[8,8,8,8,8,8]>(W2:16); W2:[8,8]>(W3:8); W3:[8]>(W4:4)
    {
      name: "48",
      supportedNumberOfPlayers: [41, 48],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 6,
          winners: { numPerGroup: 2, numWildcard: 4, destinationRoundIndex: 1, destinationMethod: "standard", handicapMethod: "winnersDest" },
        },
        { // 1
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 2
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 4, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 6人編成, 1回戦2組, 敗者復活1組, 2回戦1組, 敗者復活1組 (10～12人, 計7戦)
    // 10: W1:[5,5]>(W2:6,L1:4); L1:[4]>(L2:3); W2:[6]>(W3:3,L2:3); L2:[6]>(W3:3) W3:[6]>(W4:3)
    // 11: W1:[5,6]>(W2:6,L1:5); L1:[5]>(L2:3); W2:[6]>(W3:3,L2:3); L2:[6]>(W3:3) W3:[6]>(W4:3)
    // 12: W1:[6,6]>(W2:6,L1:6); L1:[6]>(L2:3); W2:[6]>(W3:3,L2:3); L2:[6]>(W3:3) W3:[6]>(W4:3)
    {
      name: "12_6",
      supportedNumberOfPlayers: [10, 12],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 2,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活1",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 3, destinationMethod: "standard" },
        },
        { // 3
          name: "敗者復活2",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 4
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 5, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 5
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 6人編成, 1回戦3組, 敗者復活1戦1組, 2回戦2組 (13～15人, 計8戦)
    // 13: W1:[5,4,4]>(W2:9,L1:4); L1:[4]>(W2:3); W2:[6,6]>(W3:3); W3:[6]>(W4:3)
    // 14: W1:[5,5,4]>(W2:9,L1:5); L1:[5]>(W2:3); W2:[6,6]>(W3:3); W3:[6]>(W4:3)
    // 15: W1:[5,5,5]>(W2:9,L1:6); L1:[6]>(W2:3); W2:[6,6]>(W3:3); W3:[6]>(W4:3)
    {
      name: "15_6",
      supportedNumberOfPlayers: [13, 15],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 3,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 6人編成, 1回戦3組, 敗者復活1戦2組, 2回戦2組 (16～18人, 計9戦)
    // 16: W1:[6,5,5]>(W2:9,L1:7); L1:[4,3]>(W2:3); W2:[6,6]>(W3:3); W3:[6]>(W4:3)
    // 17: W1:[6,6,5]>(W2:9,L1:8); L1:[4,4]>(W2:3); W2:[6,6]>(W3:3); W3:[6]>(W4:3)
    // 18: W1:[6,6,6]>(W2:9,L1:9); L1:[5,4]>(W2:3); W2:[6,6]>(W3:3); W3:[6]>(W4:3)
    {
      name: "18_6",
      supportedNumberOfPlayers: [16, 18],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 3,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活",
          numGroups: 2,
          winners: { numPerGroup: 1, numWildcard: 1, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 6人編成, 1回戦4組, 敗者復活1戦2組, 2回戦2組 (19～21人, 計10戦)
    // 19: W1:[5,5,5,4]>(W2:9,L1:10); L1:[5,5]>(W2:3); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 20: W1:[5,5,5,5]>(W2:9,L1:11); L1:[6,5]>(W2:3); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 21: W1:[6,5,5,5]>(W2:9,L1:12); L1:[6,6]>(W2:3); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    {
      name: "21_6",
      supportedNumberOfPlayers: [19, 21],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 4,
          winners: { numPerGroup: 2, numWildcard: 1, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" },
          losers: { numPerGroup: -1, destinationRoundIndex: 1, destinationMethod: "standard" },
        },
        { // 1
          name: "敗者復活",
          numGroups: 2,
          winners: { numPerGroup: 1, numWildcard: 1, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "losers" },
        },
        { // 2
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 4, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 4
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 6人編成, 1回戦4組, 2回戦2組 (22～24人, 計8戦)
    // 22: W1:[6,6,5,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 23: W1:[6,6,6,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 24: W1:[6,6,6,6]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    {
      name: "24_6",
      supportedNumberOfPlayers: [22, 24],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 4,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 1, destinationMethod: "standard", handicapMethod: "winnersDest" },
        },
        { // 1
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 2
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 6人編成, 1回戦5組, 2回戦2組 (25～30人, 計9戦)
    // 25: W1:[5,5,5,5,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 26: W1:[6,5,5,5,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 27: W1:[6,6,5,5,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 28: W1:[6,6,6,5,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 29: W1:[6,6,6,6,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 30: W1:[6,6,6,6,6]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    {
      name: "30_6",
      supportedNumberOfPlayers: [25, 30],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 5,
          winners: { numPerGroup: 2, numWildcard: 2, destinationRoundIndex: 1, destinationMethod: "standard", handicapMethod: "winnersDest" },
        },
        { // 1
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 2
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "決勝",
          numGroups: 1,
        },
      ]
    },

    // 6人編成, 1回戦6組, 2回戦2組 (31～36人, 計10戦)
    // 31: W1:[6,5,5,5,5,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 32: W1:[6,6,5,5,5,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 33: W1:[6,6,6,5,5,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 34: W1:[6,6,6,6,5,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 35: W1:[6,6,6,6,6,5]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    // 36: W1:[6,6,6,6,6,6]>(W2:12); W2:[6,6]>(W3:6); W3:[6]>(W4:3)
    {
      name: "36_6",
      supportedNumberOfPlayers: [31, 36],
      type: "tournament",
      rounds: [
        { // 0
          name: "1回戦",
          numGroups: 6,
          winners: { numPerGroup: 2, numWildcard: 0, destinationRoundIndex: 1, destinationMethod: "standard", handicapMethod: "winnersDest" },
        },
        { // 1
          name: "2回戦",
          numGroups: 2,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 2, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 2
          name: "準決勝",
          numGroups: 1,
          winners: { numPerGroup: 3, numWildcard: 0, destinationRoundIndex: 3, destinationMethod: "standard", handicapMethod: "winnersDest" }
        },
        { // 3
          name: "決勝",
          numGroups: 1,
        },
      ]
    },
  ];

  export function getPreset(name: string): Preset {
    const found = presets.find(e => e.name == name);
    if (found == null) throw new Error("プリセットが見つかりません: " + name);
    return found;
  }

  export function getAppropriatePresetName(numPlayers: number): string | null {
    if (numPlayers == 8) return "8_4p";
    if (numPlayers == 9) return "9_4p";
    if (numPlayers == 10) return "10_4p";
    if (numPlayers == 11) return "11_4p";
    if (numPlayers == 12) return "12_4p";
    if (13 <= numPlayers && numPlayers <= 16) return "16";
    if (17 <= numPlayers && numPlayers <= 20) return "20";
    if (21 <= numPlayers && numPlayers <= 24) return "24";
    if (25 <= numPlayers && numPlayers <= 28) return "28";
    if (29 <= numPlayers && numPlayers <= 32) return "32";
    if (33 <= numPlayers && numPlayers <= 40) return "40";
    if (41 <= numPlayers && numPlayers <= 48) return "48";
    return null;
  }

  export const manualPresetName = "manual";
}