import { RegisteredPlayerEntry } from "./common_types.ts";

export type QueryPlayerResult = {
  registeredPlayerEntry: RegisteredPlayerEntry | null,
  participating: boolean,
};

export type RegisterPlayerArgs = {
  playerEntry: RegisteredPlayerEntry;
};

export type UpdatePlayerArgs = {
  oldName: string;
  playerEntry: RegisteredPlayerEntry;
};

export type AddParticipantArgs = {
  name: string;
};
