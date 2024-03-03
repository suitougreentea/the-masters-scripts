/**
 * 時間の数値表現として、符号付きのミリ秒を使用
 */
export type Time = number;

/**
 * 分, 秒, 1/100秒の数値から時間を作成
 * @param minutes 
 * @param seconds 
 * @param centiseconds 
 * @returns 
 */
export const createTime = (minutes: number, seconds: number, centiseconds: number): Time => {
  return minutes * 60000 + seconds * 1000 + centiseconds * 10;
}

/**
 * 時間の文字列をパース
 * @param time 0:00.00 または 0:00:00 形式の文字列
 * @returns
 */
export const stringToTime = (str: string): number | null => {
  const match = str.match(/^(\d?\d):([0-5]\d)[:.](\d\d?)$/);
  if (!match) return null;
  return Number(match[1]) * 60000 + Number(match[2]) * 1000 + Number(match[3].padEnd(3, "0"));
}

/**
 * 時間を 0:00.00 形式の文字列に変換
 * @param time
 * @returns
 */
export const timeToString = (time: number) => {
  const min = Math.floor(time / 60000);
  const sec = Math.floor(time / 1000) % 60;
  const cent = Math.floor(time / 10) % 100;
  return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0") + "." + String(cent).padStart(2, "0");
}

export const dateToTime = (date: Date): number => {
  // 時で正負判定 (ちゃんとやるなら1899/12/30との差を取る)
  return date.getMinutes() * 60000 + date.getSeconds() * 1000 + date.getMilliseconds() - (date.getHours() < 12 ? 0 : 60 * 60 * 1000);
}
