import { createKey } from "./inject.ts";

export const injectKey = createKey<SerializerManager>(
  Symbol("SerializerManager"),
);

export interface SerializerManager {
  getSerializer<T>(path: string): Serializer<T>;
}

export interface Serializer<T> {
  serialize(value: T): void;
  deserialize(): T | null;
}

export class FileSerializerManager {
  #serializers = new Map<string, Serializer<any>>();

  getSerializer<T>(path: string) {
    const serializer = this.#serializers.get(path);
    if (serializer != null) return serializer as Serializer<T>;
    const created = new FileSerializer(path);
    this.#serializers.set(path, created);
    return created as Serializer<T>;
  }
}

export class FileSerializer<T> implements Serializer<T> {
  #path: string;

  constructor(path: string) {
    this.#path = path;
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
