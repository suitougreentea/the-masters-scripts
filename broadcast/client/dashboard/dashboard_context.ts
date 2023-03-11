import { TypeDefinition } from "../../common/type_definition.ts";
import {
  createContext,
  denocg,
  RequestName,
  RequestParams,
  RequestResult,
} from "../deps.ts";

export class DashboardContext extends EventTarget {
  #clientPromise: Promise<denocg.Client<TypeDefinition>>;
  #requestInProgress = true;

  constructor(clientPromise: Promise<denocg.Client<TypeDefinition>>) {
    super();
    this.#clientPromise = clientPromise;
  }

  getClient(): Promise<denocg.Client<TypeDefinition>> {
    return this.#clientPromise;
  }

  isRequestInProgress(): boolean {
    return this.#requestInProgress;
  }

  async sendRequest<TKey extends RequestName<TypeDefinition>>(
    ...[name, params]: RequestParams<TypeDefinition, TKey> extends undefined
      ? [name: TKey, params?: undefined]
      : [name: TKey, params: RequestParams<TypeDefinition, TKey>]
  ): Promise<RequestResult<TypeDefinition, TKey>> {
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
    } finally {
      this.#requestInProgress = false;
      this.dispatchEvent(new Event("request-ended"));
    }
  }

  // TODO: Modal実装
  async confirm(message: string): Promise<boolean> {
    await Promise.resolve();
    return window.confirm(message);
  }

  async alert(message: string) {
    await Promise.resolve();
    return window.alert(message);
  }
}

export const dashboardContext = createContext<DashboardContext>(
  Symbol("dashboard"),
);
