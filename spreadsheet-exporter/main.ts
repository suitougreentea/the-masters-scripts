import { Data, Input } from "../common/spreadsheet_exporter_types.ts";
import { createLeaderboardSheet } from "./leaderboard.ts";
import { createParticipantsSheet } from "./participants.ts";
import { createStagesSheet } from "./stages.ts";
import { createSupplementsSheet } from "./supplements.ts";

declare let global: Record<string, (...args: any[]) => void>;

const createCredentialHash = (data: { credential: string; salt: string }) => {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_512,
    data.credential + data.salt,
  );
};

const handler = (data: Data) => {
  const scriptProperties = PropertiesService.getScriptProperties();
  const correctCredential = JSON.parse(
    scriptProperties.getProperty("CREDENTIAL_HASH") ?? "[]",
  ) as number[];
  const salt = scriptProperties.getProperty("SALT");
  if (data.credential == null) throw new Error("Invalid credential");
  const credential = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_512,
    data.credential + salt,
  );
  if (credential.some((e, i) => e != correctCredential[i])) {
    throw new Error("Invalid credential");
  }

  if (data.input == null) throw new Error("Invalid input");
  const input = data.input;
  const exportedUrl = doExport(input);

  return {
    exportedUrl,
  };
};

const doExport = (input: Input): string => {
  const ss = SpreadsheetApp.create(input.name);
  const defaultSheet = ss.getActiveSheet();

  const templatesSourceSheet = SpreadsheetApp.openById(
    "1y6_rswKXg6sxVTMbTh2tLt5PMykTKLrUOaQu3-2msyw",
  ).getActiveSheet();
  const templatesSheet = templatesSourceSheet.copyTo(ss);

  const participantsSheet = createParticipantsSheet(ss, input.participants);
  const stageSheet = createStagesSheet(ss, input.stages, templatesSheet);
  const supplementsSheet = createSupplementsSheet(
    ss,
    input.supplements,
    templatesSheet,
  );
  const leaderboardSheet = createLeaderboardSheet(ss, input.leaderboard);
  ss.deleteSheet(defaultSheet);
  ss.deleteSheet(templatesSheet);

  const fileId = ss.getId();
  const file = DriveApp.getFileById(fileId);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const folder = DriveApp.getFolderById("1Np9NBJq0rgWFhgxaUG6M2gYyrlT2juXj");
  file.moveTo(folder);
  const exportedUrl =
    `https://docs.google.com/spreadsheets/d/${fileId}/edit?usp=sharing`;
  return exportedUrl;
};

global.doPost = (e: GoogleAppsScript.Events.DoPost) => {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const data = JSON.parse(e.postData.contents);
    let result: any;
    if (e.queryString == "") {
      result = handler(data);
    } else if (e.queryString == "createCredentialHash") {
      result = createCredentialHash(data);
    }
    output.setContent(JSON.stringify(result));
  } catch (e) {
    if (e instanceof Error) {
      output.setContent(JSON.stringify({ error: e.message }));
    } else {
      output.setContent(JSON.stringify({ error: e }));
    }
  }
  return output;
};
