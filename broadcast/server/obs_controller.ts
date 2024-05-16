import OBSWebSocket, {
  OBSRequestTypes,
  OBSResponseTypes,
} from "obs-websocket-js";

export class OBSController extends EventTarget {
  #address: string;
  #password: string;
  #socket: OBSWebSocket;
  #opened = false;
  get opened() {
    return this.#opened;
  }
  get identified() {
    return this.#socket.identified;
  }
  #lastConnectionAttemptTime = -1;

  constructor(address: string, password: string) {
    super();
    this.#address = address;
    this.#password = password;
    this.#socket = new OBSWebSocket();

    this.#socket.addListener("ConnectionClosed", () => {
      console.log("OBS Websocket closed");
      if (!this.#opened) return;

      // reconnection
      setTimeout(
        () => this.#connect(),
        Math.max(
          5000 - (performance.now() - this.#lastConnectionAttemptTime),
          0,
        ),
      );
    });

    this.#opened = true;
    this.#connect();
  }

  #connect() {
    console.log("Connecting to OBS");
    this.#lastConnectionAttemptTime = performance.now();
    this.#socket.connect(this.#address, this.#password).catch((e) =>
      console.error("Could not connect to OBS:", e)
    );
  }

  waitForConnection() {
    if (!this.#opened) return Promise.reject();
    if (this.#socket.identified) return Promise.resolve();
    return new Promise<void>((resolve, _) => {
      const listener = () => {
        this.#socket.addListener("Identified", listener);
        resolve();
      };
      this.#socket.addListener("Identified", listener);
    });
  }

  close() {
    this.#opened = false;
    this.#socket.disconnect();
  }

  async call<Type extends keyof OBSRequestTypes>(
    requestType: Type,
    requestData?: OBSRequestTypes[Type],
  ): Promise<OBSResponseTypes[Type]> {
    await this.waitForConnection();
    return await this.#socket.call(requestType, requestData);
  }
}
