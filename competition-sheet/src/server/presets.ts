var presets = {
  "10-12": {
    supportPlayers: [10, 12],
    firstGroups: 2,
    stages: [
      /* 0 */ { name: "1回戦A組", winners: [2, 2, 2, 2], losers: [3, 3] },
      /* 1 */ { name: "1回戦B組", winners: [2, 2, 2, 2], losers: [3, 3] },
      /* 2 */ { name: "2回戦", winners: [4, 4, 4, 4], losers: [3, 3, 3, 3] },
      /* 3 */ { name: "敗者復活", winners: [4, 4, 4, 4], losers: [null, null, null, null], consolation: true },
      /* 4 */ { name: "準決勝", winners: [5, 5, 5, 5], losers: [null, null, null, null] },
      /* 5 */ { name: "決勝", winners: [null], losers: [null, null, null] }
    ]
  },
  "13-16": {
    supportPlayers: [13, 16],
    firstGroups: 2,
    stages: [
      /* 0 */ { name: "1回戦A組", winners: [3, 3, 3, 3], losers: [2, 2, 2, 2] },
      /* 1 */ { name: "1回戦B組", winners: [3, 3, 3, 3], losers: [2, 2, 2, 2] },
      /* 2 */ { name: "敗者復活1", winners: [4, 4, 4, 4], losers: [null, null, null, null], consolation: true },
      /* 3 */ { name: "2回戦", winners: [5, 5, 5, 5], losers: [4, 4, 4, 4] },
      /* 4 */ { name: "敗者復活2", winners: [5, 5, 5, 5], losers: [null, null, null, null], consolation: true },
      /* 5 */ { name: "準決勝", winners: [6, 6, 6, 6], losers: [null, null, null, null] },
      /* 6 */ { name: "決勝", winners: [null], losers: [null, null, null] }
    ]
  },
  "17-20": {
    supportPlayers: [17, 20],
    firstGroups: 3,
    stages: [
      /* 0 */ { name: "1回戦A組", winners: [4, 4], wildcards: [3], losers: [5, 6, 5, 6] },
      /* 1 */ { name: "1回戦B組", winners: [4, 4], wildcards: [3], losers: [6, 5, 6, 5] },
      /* 2 */ { name: "1回戦C組", winners: [4, 4], wildcards: [3], losers: [5, 6, 5] },
      /* 3 */ { name: "1回戦ワイルドカード", winners: [4, 4], losers: [6], wildcard: true },
      /* 4 */ { name: "2回戦", winners: [7, 7, 7, 7], losers: [5, 6, 5, 6] },
      /* 5 */ { name: "敗者復活A", winners: [7, 7], losers: [null, null, null, null, null, null], consolation: true },
      /* 6 */ { name: "敗者復活B", winners: [7, 7], losers: [null, null, null, null, null, null], consolation: true },
      /* 7 */ { name: "準決勝", winners: [8, 8, 8, 8], losers: [null, null, null, null] },
      /* 8 */ { name: "決勝", winners: [null], losers: [null, null, null] }
    ]
  },
  "21-24": {
    supportPlayers: [21, 24],
    firstGroups: 3,
    stages: [
      /* 0 */ { name: "1回戦A組", winners: [4, 5, 4, 5, 4], wildcards: [3], losers: [null, null] },
      /* 1 */ { name: "1回戦B組", winners: [5, 4, 5, 4, 5], wildcards: [3], losers: [null, null] },
      /* 2 */ { name: "1回戦C組", winners: [4, 5, 4, 5, 4], wildcards: [3], losers: [null, null] },
      /* 3 */ { name: "1回戦ワイルドカード", winners: [5], losers: [null, null], wildcard: true },
      /* 4 */ { name: "2回戦A組", winners: [6, 6, 6, 6], losers: [null, null, null, null] },
      /* 5 */ { name: "2回戦B組", winners: [6, 6, 6, 6], losers: [null, null, null, null] },
      /* 6 */ { name: "準決勝", winners: [7, 7, 7, 7], losers: [null, null, null, null] },
      /* 7 */ { name: "決勝", winners: [null], losers: [null, null, null] }
    ]
  }
}