import { RegisteredPlayerEntry } from "../../common/common_types.ts";
import {
  AddParticipantArgs,
  QueryPlayerResult,
  RegisterPlayerArgs,
  UpdatePlayerArgs,
} from "../../common/user_server_types.ts";

export type ActionHandler = {
  open(url: string): void;
  close(url: string): void;
  queryPlayer(name: string): Promise<QueryPlayerResult>;
  registerPlayer(entry: RegisteredPlayerEntry): void;
  updatePlayer(oldName: string, entry: RegisteredPlayerEntry): void;
  addParticipant(name: string): void;
};

const errorToBody = (e: unknown) => {
  if (e instanceof Error) {
    return { error: e.message };
  } else {
    return { error: `${e}` };
  }
};

const createKeepAliveResponse = (
  onOpen: () => void,
  onClose: () => void,
): Response => {
  const encoder = new TextEncoder();
  let id = -1;
  const responseBody = new ReadableStream({
    start(controller) {
      onOpen();
      id = setInterval(
        () => controller.enqueue(encoder.encode("data: keepalive\n\n")),
        1000,
      );
    },
    cancel() {
      onClose();
      clearInterval(id);
    },
  });

  const response = new Response(responseBody, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
  return response;
};

export class UserServer {
  #port: number;
  #actionHandler: ActionHandler;

  constructor(port: number, actionHandler: ActionHandler) {
    this.#port = port;
    this.#actionHandler = actionHandler;

    Deno.serve({ port: this.#port }, async (req) => {
      const url = new URL(req.url);
      switch (url.pathname) {
        case "/": {
          if (req.method != "POST") {
            return new Response(undefined, { status: 405 });
          }
          try {
            const body = await req.json();
            const url = body.url;
            if (url == null) throw new Error("url not specified");

            return createKeepAliveResponse(() => {
              this.#actionHandler.open(url);
            }, () => {
              this.#actionHandler.close(url);
            });
          } catch (e) {
            return Response.json(errorToBody(e), { status: 402 });
          }
        }
        case "/register/queryPlayer": {
          const { name } = await req.json();
          const player = await this.#actionHandler.queryPlayer(name);
          return Response.json(player);
        }
        case "/register/registerPlayer": {
          try {
            const { playerEntry } = await req.json() as RegisterPlayerArgs;
            await this.#actionHandler.registerPlayer(playerEntry);
            return Response.json({});
          } catch (e) {
            return Response.json(errorToBody(e), { status: 402 });
          }
        }
        case "/register/updatePlayer": {
          try {
            const { oldName, playerEntry } = await req
              .json() as UpdatePlayerArgs;
            await this.#actionHandler.updatePlayer(oldName, playerEntry);
            return Response.json({});
          } catch (e) {
            return Response.json(errorToBody(e), { status: 402 });
          }
        }
        case "/register/addParticipant": {
          try {
            const { name } = await req.json() as AddParticipantArgs;
            await this.#actionHandler.addParticipant(name);
            return Response.json({});
          } catch (e) {
            return Response.json(errorToBody(e), { status: 402 });
          }
        }
        default:
          return new Response(undefined, { status: 404 });
      }
    });
  }
}
