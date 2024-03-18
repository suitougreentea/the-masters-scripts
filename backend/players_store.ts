import { RegisteredPlayerEntry } from "../common/common_types.ts";
import { createKey, injectCtor } from "./inject.ts";
import {
  injectKey as serializerManagerKey,
  Serializer,
  SerializerManager,
} from "./serializer.ts";

export const injectKey = createKey<PlayersStore>(Symbol("PlayersStore"));

type Type = {
  registeredPlayers: RegisteredPlayerEntry[];
};

@injectCtor([serializerManagerKey])
export class PlayersStore {
  #serializer: Serializer<Type>;
  #registeredPlayers: RegisteredPlayerEntry[] = [];

  constructor(serializerManager: SerializerManager) {
    this.#serializer = serializerManager.getSerializer("players");
    this.#deserialize();
  }

  #deserialize() {
    const deserialized = this.#serializer.deserialize();
    this.#registeredPlayers = deserialized?.registeredPlayers ?? [];
  }

  #serialize() {
    this.#serializer.serialize({
      registeredPlayers: this.#registeredPlayers,
    });
  }

  getRegisteredPlayers(): RegisteredPlayerEntry[] {
    return this.#registeredPlayers;
  }

  registerPlayer(player: RegisteredPlayerEntry) {
    const index = this.#registeredPlayers.findIndex((e) =>
      e.name == player.name
    );
    if (index >= 0) {
      throw new Error("A player with the same name already exists");
    }
    this.#registeredPlayers.push(player);
    this.#serialize();
  }

  updatePlayer(oldName: string, player: RegisteredPlayerEntry) {
    const index = this.#registeredPlayers.findIndex((e) => e.name == oldName);
    if (index < 0) throw new Error("No matching player found");
    if (oldName != player.name) {
      const dupeCheck = this.#registeredPlayers.findIndex((e) =>
        e.name == player.name
      );
      if (dupeCheck >= 0) {
        throw new Error("A player with the same name already exists");
      }
    }
    this.#registeredPlayers[index] = player;
    this.#serialize();
  }

  getPlayer(name: string): RegisteredPlayerEntry | null {
    return this.#registeredPlayers.find((e) => e.name == name) ?? null;
  }
}
