import { Participant } from "../common/common_types.ts";
import { createKey, injectCtor } from "./inject.ts";
import {
  injectKey as serializerManagerKey,
  Serializer,
  SerializerManager,
} from "./serializer.ts";

export const injectKey = createKey<SetupStore>(Symbol("SetupStore"));

type Type = {
  participants: Participant[];
};

@injectCtor([serializerManagerKey])
export class SetupStore {
  #serializer: Serializer<Type>;
  #participants: Participant[] = [];

  constructor(serializerManager: SerializerManager) {
    this.#serializer = serializerManager.getSerializer("setup");
    this.#deserialize();
  }

  #deserialize() {
    const deserialized = this.#serializer.deserialize();
    this.#participants = deserialized?.participants ?? [];
  }

  #serialize() {
    this.#serializer.serialize({
      participants: this.#participants,
    });
  }

  getParticipants() {
    return this.#participants;
  }

  setParticipants(participants: Participant[]) {
    this.#participants = participants;
    this.#serialize();
  }
}
