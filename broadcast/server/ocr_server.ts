import { OcrResult } from "../common/type_definition.ts";

type Message = {
  op: 0;
  d: OcrResult;
  rid?: string;
} | {
  op: 1;
  rid?: string;
};

export class OcrServer extends EventTarget {
  #port: number;
  #clients: Set<WebSocket> = new Set();

  constructor(port: number) {
    super();
    this.#port = port;

    Deno.serve({ port: this.#port }, (req) => {
      if (req.headers.get("upgrade") != "websocket") {
        return new Response(null, { status: 501 });
      }

      const { socket, response } = Deno.upgradeWebSocket(req);

      socket.addEventListener("open", () => {
        console.log("OCR client connected");
        this.#clients.add(socket);
      });
      socket.addEventListener("message", (event) => {
        try {
          const decoded = JSON.parse(event.data) as Message;
          if (decoded.op == 0) {
            this.dispatchEvent(new CustomEvent("data", { detail: decoded.d }));
          }
        } catch (e) {
          console.error(e);
        }
      });
      socket.addEventListener("close", () => {
        console.log("OCR client disconnected");
        this.#clients.delete(socket);
      });

      return response;
    });
  }

  requestReset() {
    this.#clients.forEach((socket) => {
      const message = JSON.stringify({
        op: 1,
      });
      socket.send(message);
    });
  }
}
