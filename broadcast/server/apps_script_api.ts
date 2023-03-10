import { serve } from "https://deno.land/std@0.161.0/http/server.ts";
import {
  OAuth2Client,
  Tokens as OAuth2Tokens,
} from "https://deno.land/x/oauth2_client@v1.0.0/mod.ts";
import {
  Cookie,
  deleteCookie,
  getCookies,
  setCookie,
} from "https://deno.land/std@0.161.0/http/cookie.ts";
import {
  CredentialsClient,
  Script,
} from "https://googleapis.deno.dev/v1/script:v1.ts";

type Tokens = {
  accessToken: string;
  refreshToken: string;
  expireTime: number;
};

export class AppsScriptApi {
  #oauth2Client!: OAuth2Client;
  #oauth2Port: number;
  #oauth2Scopes: string[];
  #sessions: Record<string, { state: string; codeVerifier: string }> = {};
  #authPromiseResolve: ((token: Tokens) => void) | null = null;
  #authPromiseReject: ((reason?: unknown) => void) | null = null;
  #currentTokens: Tokens | null = null;

  constructor(oauth2Port: number, oauth2Scopes: string[]) {
    this.#oauth2Port = oauth2Port;
    this.#oauth2Scopes = oauth2Scopes;
  }

  async initialize() {
    const configText = await Deno.readTextFile("./apps-script-api-conf.json");
    const config = JSON.parse(configText);

    this.#oauth2Client = new OAuth2Client({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      authorizationEndpointUri: "https://accounts.google.com/o/oauth2/auth",
      tokenUri: "https://accounts.google.com/o/oauth2/token",
      redirectUri: `http://localhost:${this.#oauth2Port}/oauth2_callback`,
      defaults: {
        scope: this.#oauth2Scopes,
      },
    });

    try {
      const readTokens = JSON.parse(
        Deno.readTextFileSync("./apps-script-api-tokens.json"),
      );
      if (
        typeof readTokens.accessToken != "string" ||
        typeof readTokens.refreshToken != "string" ||
        typeof readTokens.expireTime != "number"
      ) {
        throw new Error("Invalid tokens file");
      }
      this.#currentTokens = readTokens;
    } catch (e) {
      console.warn(e);
    }
    this.#currentTokens;

    serve((request) => this.#handleRequest(request), {
      port: this.#oauth2Port,
    });
  }

  #convertTokens(tokens: OAuth2Tokens, refresh: boolean): Tokens {
    if (tokens.refreshToken == null && !refresh) {
      throw new Error("Token info not sufficient");
    }
    if (tokens.expiresIn == null) {
      throw new Error("Token info not sufficient");
    }
    const refreshToken = tokens.refreshToken ??
      this.#currentTokens?.refreshToken;
    if (refreshToken == null) {
      throw new Error("Authorize first");
    }
    return {
      accessToken: tokens.accessToken,
      refreshToken,
      expireTime: Date.now() + tokens.expiresIn * 1000,
    };
  }

  #setAndSaveTokens(tokens: Tokens) {
    this.#currentTokens = tokens;
    Deno.writeTextFileSync(
      "./apps-script-api-tokens.json",
      JSON.stringify(tokens),
    );
  }

  async auth(options?: { abortController?: AbortController }) {
    try {
      const tokens = await this.#authInternal(options?.abortController);
      this.#setAndSaveTokens(tokens);
    } catch (e) {
      console.error(e);
    }
  }

  #authInternal(abortController?: AbortController): Promise<Tokens> {
    return new Promise((resolve, reject) => {
      this.#authPromiseResolve = resolve;
      this.#authPromiseReject = reject;
      if (abortController != null) {
        abortController.signal.onabort = (_) => {
          reject(new DOMException("AbortError"));
          this.#finalizeAuth();
        };
      }
    });
  }
  #finalizeAuth() {
    this.#sessions = {};
    this.#authPromiseResolve = null;
    this.#authPromiseReject = null;
  }

  getAuthUrl() {
    return `http://localhost:${this.#oauth2Port}/oauth2_auth`;
  }

  async #handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (this.#authPromiseResolve != null) {
      if (path == "/oauth2_auth") {
        const state = crypto.randomUUID();
        const { uri, codeVerifier } = await this.#oauth2Client.code
          .getAuthorizationUri({
            state,
          });

        const sessionId = crypto.randomUUID();
        this.#sessions[sessionId] = { state, codeVerifier };

        const sessionCookie: Cookie = {
          name: "session",
          value: sessionId,
          httpOnly: true,
          sameSite: "Lax",
        };
        const headers = new Headers({ Location: uri.toString() });
        setCookie(headers, sessionCookie);

        return new Response(null, { status: 302, headers });
      }
      if (path == "/oauth2_callback") {
        const sessionCookie = getCookies(request.headers)["session"];
        const loginState = this.#sessions[sessionCookie];
        if (!loginState) {
          throw new Error("Invalid session");
        }

        const tokens = await this.#oauth2Client.code.getToken(
          request.url,
          loginState,
        );
        const convertedTokens = this.#convertTokens(tokens, false);
        this.#authPromiseResolve?.(convertedTokens);
        this.#finalizeAuth();

        const headers = new Headers();
        deleteCookie(headers, "session");

        return new Response("Completed! You may close this page.", { headers });
      }
    }

    return new Response("Not Found", { status: 404 });
  }

  async checkAuth() {
    if (this.#currentTokens == null) throw new Error("Authorize first");
    console.log("Tokens refreshing");
    const newTokens = await this.#oauth2Client.refreshToken.refresh(
      this.#currentTokens.refreshToken,
    );
    const convertedTokens = this.#convertTokens(newTokens, true);
    this.#setAndSaveTokens(convertedTokens);
  }

  async runCommand(
    scriptId: string,
    functionName: string,
    parameters: unknown[],
  ): Promise<unknown> {
    if (this.#currentTokens == null) throw new Error("Authorize first");
    if (this.#currentTokens.expireTime < Date.now() + 480000) {
      await this.checkAuth();
    }
    const accessToken = this.#currentTokens.accessToken;

    const credentialsClient: CredentialsClient = {
      // projectId: ""
      getRequestHeaders(_uri: string) {
        return Promise.resolve({ Authorization: `Bearer ${accessToken}` });
      },
    };
    const operation = await new Script(credentialsClient).scriptsRun(scriptId, {
      function: functionName,
      parameters,
    });
    if (operation.done) {
      return operation.response?.result;
    }
    if (operation.error) {
      throw new Error(operation.error.message);
    }
    throw new Error("Unknown error");
  }
}
