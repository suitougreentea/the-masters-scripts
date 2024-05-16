import { TypeDefinition } from "../../common/type_definition.ts";
import { Client, Types } from "denocg/client";
import { createContext } from "@lit-labs/context";

export class DashboardContext extends EventTarget {
  #clientPromise: Promise<Client<TypeDefinition>>;
  #requestInProgress = true;

  constructor(clientPromise: Promise<Client<TypeDefinition>>) {
    super();
    this.#clientPromise = clientPromise;
  }

  getClient(): Promise<Client<TypeDefinition>> {
    return this.#clientPromise;
  }

  isRequestInProgress(): boolean {
    return this.#requestInProgress;
  }

  async sendRequest<TKey extends Types.RequestName<TypeDefinition>>(
    ...[name, params]: Types.RequestParams<TypeDefinition, TKey> extends
      undefined ? [name: TKey, params?: undefined]
      : [name: TKey, params: Types.RequestParams<TypeDefinition, TKey>]
  ): Promise<Types.RequestResult<TypeDefinition, TKey>> {
    try {
      this.#requestInProgress = true;
      this.dispatchEvent(new Event("request-started"));

      const client = await this.getClient();
      // TODO: 型いい感じにする
      // deno-lint-ignore no-explicit-any
      const result = await client.requestToServer(name as any, params as any);
      return result;
    } catch (e) {
      if (e.message) {
        await this.alert(e.message);
      } else {
        await this.alert(e);
      }
      throw e;
    } finally {
      this.#requestInProgress = false;
      this.dispatchEvent(new Event("request-ended"));
    }
  }

  requestResetTimer() {
    this.dispatchEvent(new Event("reset-timer"));
  }

  requestActivateTimer() {
    this.dispatchEvent(new Event("activate-timer"));
  }

  // TODO: Modal実装
  async confirm(message: string): Promise<boolean> {
    await Promise.resolve();
    return confirm(message);
  }

  async alert(message: string) {
    await Promise.resolve();
    return alert(message);
  }
}

export const dashboardContext = createContext<DashboardContext>(
  Symbol("dashboard"),
);
