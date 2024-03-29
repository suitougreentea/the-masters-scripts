import { createKey } from "./inject.ts";

export const injectKey = createKey<SerializerManager>(
  Symbol("SerializerManager"),
);

export interface SerializerManager {
  getSerializer<T>(name: string): Serializer<T>;
}

export interface Serializer<T> {
  serialize(value: T): void;
  deserialize(): T | null;
}

export class FileSerializerManager {
  #serializers = new Map<string, Serializer<unknown>>();

  getSerializer<T>(name: string) {
    const serializer = this.#serializers.get(name);
    if (serializer != null) return serializer as Serializer<T>;
    const created = new FileSerializer(name);
    this.#serializers.set(name, created);
    return created as Serializer<T>;
  }
}

export class FileSerializer<T> implements Serializer<T> {
  #name: string;
  #path: string;

  constructor(name: string) {
    this.#name = name;
    this.#path = `./data/${name}.json`;
  }

  serialize(value: T) {
    Deno.writeTextFileSync(this.#path, JSON.stringify(value));
  }

  deserialize(): T | null {
    try {
      const text = Deno.readTextFileSync(this.#path);
      return JSON.parse(text);
    } catch (e) {
      console.warn(e);
      return null;
    }
  }
}
