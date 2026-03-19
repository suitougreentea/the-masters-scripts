export function getNextSnakeIndex(numFilledPlayers: number[]): number {
  let state = 0;
  let changedIndex = -1;
  for (let i = 0; i < numFilledPlayers.length - 1; i++) {
    const a = numFilledPlayers[i];
    const b = numFilledPlayers[i + 1];
    if (a == b) {
      continue;
    } else if (a + 1 == b) {
      if (state != 0) throw new Error();
      state = -1;
      changedIndex = i;
    } else if (a == b + 1) {
      if (state != 0) throw new Error();
      state = 1;
      changedIndex = i;
    } else {
      throw new Error();
    }
  }

  if (state == 0) {
    if (numFilledPlayers[0] % 2 == 0) {
      // 各グループ同数で、偶数人埋まっている -> 下向き
      return 0;
    } else {
      // 各グループ同数で、奇数人埋まっている -> 上向き
      return numFilledPlayers.length;
    }
  } else if (state == -1) {
    // 後ろのグループの方が人数が多い -> 上向き
    if (numFilledPlayers[0] % 2 != 1) throw new Error();
    return numFilledPlayers.length * 2 - 1 - changedIndex;
  } else if (state == 1) {
    // 前のグループの方が人数が多い -> 下向き
    if (numFilledPlayers[0] % 2 != 1) throw new Error();
    return changedIndex + 1;
  }

  throw new Error();
}

export function resolveSnakeIndex(
  snakeIndex: number,
  numGroups: number,
): number {
  return snakeIndex < numGroups ? snakeIndex : numGroups * 2 - 1 - snakeIndex;
}
