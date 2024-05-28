import { Serializer } from "./serializer.ts";
import { SerializerManager } from "./serializer.ts";

const serializers = new Map<string, InMemorySerializer<unknown>>();
const getSerializer = <T>(name: string) => {
  const serializer = serializers.get(name);
  if (serializer != null) return serializer as InMemorySerializer<T>;
  const created = new InMemorySerializer(name);
  serializers.set(name, created);
  return created as InMemorySerializer<T>;
};

export const getSerializerValue = <T>(name: string) => {
  return getSerializer<T>(name).deserialize();
};

export const setSerializerValue = <T>(name: string, value: T | undefined) => {
  return getSerializer<T>(name).setValue(value);
};

export class InMemorySerializerManager implements SerializerManager {
  getSerializer<T>(name: string) {
    return getSerializer<T>(name);
  }
}

export class InMemorySerializer<T> implements Serializer<T> {
  #name: string;
  #serializedValue?: T;

  constructor(name: string) {
    this.#name = name;
  }

  serialize(value: T) {
    this.#serializedValue = value;
  }

  deserialize(): T | undefined {
    return this.#serializedValue;
  }

  setValue(value: T | undefined) {
    this.#serializedValue = value;
  }
}
