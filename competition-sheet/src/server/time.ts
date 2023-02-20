namespace Time {
  /* eslint no-shadow: off */
  export type Time = number;
  export type SpreadsheetTime = number;

  export function stringToTime(str: string): Time | null {
    const match = str.match(/^(\d?\d):([0-5]\d)[:.](\d\d?)$/);
    if (!match) return null;
    return Number(match[1]) * 60000 + Number(match[2]) * 1000 + Number(match[3].padEnd(3, "0"));
  }

  export function timeToString(time: Time) {
    const min = Math.floor(time / 60000);
    const sec = Math.floor(time / 1000) % 60;
    const cent = Math.floor(time / 10) % 100;
    return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0") + "." + String(cent).padStart(2, "0");
  }

  export function dateToTime(date: Date): Time {
    // 時で正負判定 (ちゃんとやるなら1899/12/30との差を取る)
    return date.getMinutes() * 60000 + date.getSeconds() * 1000 + date.getMilliseconds() - (date.getHours() < 12 ? 0 : 60 * 60 * 1000);
  }

  export function timeToSpreadsheetValue(time: Time | null): SpreadsheetTime | null {
    if (time == null) return null;
    return time / (24 * 60 * 60 * 1000);
  }

  export function spreadsheetValueToTime(value: unknown): Time | null {
    if (value == null) return null;
    if (value instanceof Date) return dateToTime(value);
    if (typeof value == "number") {
      return value * 24 * 60 * 60 * 1000;
    }
    if (typeof value == "string") {
      return stringToTime(value);
    }
    return null;
  }
}
