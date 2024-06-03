import { OcrPlayerStatus, OcrResult } from "../common/type_definition.ts";

type Message = {
  op: 0;
  d: unknown;
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
        return new Response(undefined, { status: 501 });
      }

      const { socket, response } = Deno.upgradeWebSocket(req);

      socket.addEventListener("open", () => {
        this.#clients.add(socket);
        this.dispatchEvent(new CustomEvent("connect"));
      });
      socket.addEventListener("message", (event) => {
        try {
          const decoded = JSON.parse(event.data) as Message;
          if (decoded.op == 0) {
            this.dispatchEvent(
              new CustomEvent("data", { detail: upgradeOcrResult(decoded.d) }),
            );
          }
        } catch (e) {
          console.error(e);
        }
      });
      socket.addEventListener("close", () => {
        this.#clients.delete(socket);
        this.dispatchEvent(new CustomEvent("disconnect"));
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

  hasClient() {
    return this.#clients.size > 0;
  }
}

export function upgradeOcrResult(data: unknown): OcrResult {
  if (data == null) throw new Error("Incompatible data received");
  if (!Object.hasOwn(data, "status")) {
    throw new Error("Incompatible data received");
  }

  // deno-lint-ignore no-explicit-any
  const status = (data as any).status;

  return {
    // deno-lint-ignore no-explicit-any
    status: status.map((s: any) =>
      ({
        frameTime: s.frameTime ?? 0,
        playing: s.playing ?? false,
        level: s.level ?? 0,
        grade: s.grade ?? 0,
        gameTime: s.gameTime ?? 0,
        health: s.health ?? "HEALTHY",
        moveTime: s.moveTime ?? 0,
        burnTime: s.burnTime ?? 0,
        levelStopTime: s.levelStopTime ?? 0,
        minoCount: s.minoCount ?? 0,
        clearCount: s.clearCount ?? [0, 0, 0, 0],
        // deno-lint-ignore no-explicit-any
        sections: s.sections?.map((e: any) =>
          ({
            lap: e.lap ?? 0,
            split: e.split ?? 0,
            moveTime: e.moveTime ?? 0,
            burnTime: e.burnTime ?? 0,
            levelStopTime: e.levelStopTime ?? 0,
            minoCount: e.minoCount ?? 0,
            clearCount: e.clearCount ?? [0, 0, 0, 0],
          }) satisfies OcrPlayerStatus["sections"][number]
        ) ?? [],
      }) satisfies OcrPlayerStatus
    ),
  };
}
