import { getCookies, serveFile, setCookie } from "@std/http";
import ngrok from "ngrok";

if (import.meta.main) {
  const devMode = Deno.args.indexOf("--dev") >= 0;

  const broadcastAppAddress = "http://localhost:8519";

  const passthrough = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const response = await fetch(`${broadcastAppAddress}${url.pathname}`, {
      method: request.method,
      body: request.body,
    });
    return new Response(response.body, { status: response.status });
  };

  const tokenArray = new Uint8Array(32);
  crypto.getRandomValues(tokenArray);
  const correctToken = [...tokenArray].map((e) => e.toString(16)).join("");

  Deno.serve({ port: 8520 }, async (req) => {
    const url = new URL(req.url);

    const urlToken = url.searchParams.get("token");
    if (urlToken != null) {
      const newUrl = new URL(url);
      newUrl.searchParams.delete("token");
      const headers = new Headers({ "location": newUrl.toString() });
      setCookie(headers, { name: "token", value: urlToken });
      const response = new Response(undefined, { headers, status: 302 });
      return response;
    }

    const cookies = getCookies(req.headers);
    const token = cookies["token"];
    if (!devMode && token != correctToken) {
      return new Response(undefined, { status: 401 });
    }

    switch (url.pathname) {
      case "/register":
        return await serveFile(req, "./register.html");
      case "/register.bundle.js":
        return await serveFile(req, "register.bundle.js");
      case "/register/queryPlayer":
      case "/register/registerPlayer":
      case "/register/updatePlayer":
      case "/register/addParticipant":
        return await passthrough(req);
    }
    return new Response(undefined, { status: 404 });
  });

  // create tunnel
  let url: string;
  if (devMode) {
    url = `http://localhost:8520/register?token=${correctToken}`;
  } else {
    await ngrok.authtoken(
      Deno.readTextFileSync(import.meta.dirname + "/.ngrok-authtoken"),
    );
    const listener = await ngrok.forward({ addr: 8520 });
    const nullableUrl = listener.url();
    if (nullableUrl == null) {
      throw new Error("ngrok returned null url");
    }
    url = `${nullableUrl}/register?token=${correctToken}`;
  }
  console.log(`URL: ${url}`);

  // connect to broadcast app
  const init = {
    url,
  };
  const response = await fetch(`${broadcastAppAddress}/`, {
    method: "POST",
    body: JSON.stringify(init),
  });
  for await (const _ of response.body!) { /* keep alive */ }
}
