import { spreadsheetValueToTime } from "../common/spreadsheet_util.ts";

// deno-lint-ignore no-explicit-any
declare let global: Record<string, (...args: any[]) => any>;

global.doGet = (_: GoogleAppsScript.Events.DoGet) => {
  return HtmlService.createHtmlOutputFromFile("page");
};

global.getData = (inputAsJson: string): string => {
  try {
    const input = JSON.parse(inputAsJson);
    const { spreadsheet, game } = input;
    const result = handleApi(spreadsheet, game);
    return JSON.stringify({ result });
  } catch (e) {
    if (e instanceof Error) {
      return JSON.stringify({ error: e.message });
    } else {
      return JSON.stringify({ error: e });
    }
  }
};

export type TimerData = {
  name: string;
  startTime: number;
}[];

const handleApi = (spreadsheetUrl: string, gameIndex: number) => {
  /*
  const urlMatch = spreadsheetUrl.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/(.*)\/.*$/);
  if (!urlMatch) throw new Error("Invalid URL");
  */
  const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
  const sheet = spreadsheet.getSheetByName("Competition")!;

  const range = sheet.getRange(3 + gameIndex * 11, 8, 8, 4);
  const data = range.getValues().map((row) => ({
    name: String(row[0]),
    startTime: spreadsheetValueToTime(row[3]),
  }));

  return data;
};
