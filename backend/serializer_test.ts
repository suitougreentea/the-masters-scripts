import { Serializer } from "./serializer.ts";
import { SerializerManager } from "./serializer.ts";

export class InMemorySerializerManager implements SerializerManager {
  #serializers = new Map<string, InMemorySerializer<any>>();

  getSerializer<T>(path: string) {
    const serializer = this.#serializers.get(path);
    if (serializer != null) return serializer as InMemorySerializer<T>;
    const created = new InMemorySerializer(path);
    this.#serializers.set(path, created);
    return created as InMemorySerializer<T>;
  }

  setValue<T>(path: string, value: T | null) {
    this.getSerializer(path).setValue(value);
  }
}

export class InMemorySerializer<T> implements Serializer<T> {
  #path: string;
  #serializedValue: T | null = null;

  constructor(path: string) {
    this.#path = path;
  }

  serialize(value: T) {
    this.#serializedValue = value;
  }

  deserialize(): T | null {
    return this.#serializedValue;
  }

  setValue(value: T | null) {
    this.#serializedValue = value;
  }
}
