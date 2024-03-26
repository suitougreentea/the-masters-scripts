import { TextLineStream } from "https://deno.land/std@0.141.0/streams/mod.ts";

const stdoutWriter = Deno.stdout.writable.getWriter();
const stderrWriter = Deno.stderr.writable.getWriter();

class MergedWriterStream<W> extends WritableStream<W> {
  constructor(writer: WritableStreamDefaultWriter<W>) {
    const sink: UnderlyingSink<W> = {
      write(chunk) {
        writer.write(chunk);
      }
    };
    super(sink);
  }
}

class PrependNameStream extends TransformStream<string, string> {
  constructor(name: string) {
    const transformer: Transformer<string, string> = {
      transform(chunk, controller) {
        // TODO: appending \n should be a job of another TransformStream
        controller.enqueue(`[${name}] ${chunk}\n`);
      },
    };
    super(transformer);
  }
}

const spawn = async (name: string, execPath: string, args: string[], cwd: string): Promise<boolean> => {
  const command = new Deno.Command(
    execPath,
    {
      args,
      cwd,
      stdout: "piped",
      stderr: "piped",
    }
  );
  const process = command.spawn();

  process.stdout
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .pipeThrough(new PrependNameStream(name))
    .pipeThrough(new TextEncoderStream())
    .pipeTo(new MergedWriterStream(stdoutWriter));
  process.stderr
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .pipeThrough(new PrependNameStream(name))
    .pipeThrough(new TextEncoderStream())
    .pipeTo(new MergedWriterStream(stderrWriter));

  return (await process.status).success
}

const createTimeoutAbortSignal = (timeout: number) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller.signal;
}

const checkLoop = async (func: () => Promise<boolean>, interval: number, count: number): Promise<boolean> => {
  for (let i = 0; i < count; i++) {
    const result = await func();
    if (result) return true;
    await new Promise(r => setTimeout(r, interval));
  }
  return false;
};

const skipBuild = Deno.args.indexOf("--skip-build") >= 0;
const skipUserController = Deno.args.indexOf("--skip-user-controller") >= 0;

if (!skipBuild) {
  console.log("Building Broadcast");
  const broadcastBuilderSuccess = await spawn("Broadcast Builder", Deno.execPath(), ["task", "build"], import.meta.dirname + "/../broadcast/");
  if (broadcastBuilderSuccess) {
    console.log("Building Broadcast OK");
  } else {
    console.error("Building Broadcast FAILED");
    if (!confirm("Continue?")) Deno.exit(1);
  }
  console.log("Building User Controller");
  const userControllerBuilder = await spawn("User Controller Builder", Deno.execPath(), ["task", "build"], import.meta.dirname + "/../user-controller/");
  if (userControllerBuilder) {
    console.log("Building User Controller OK");
  } else {
    console.error("Building User Controller FAILED");
    if (!confirm("Continue?")) Deno.exit(1);
  }
}

console.log("Launching Backend");
spawn("Backend", Deno.execPath(), ["task", "start"], import.meta.dirname + "/../backend/");
console.log("Checking connection to Backend");
const backendConnectionCheck = await checkLoop(async () => {
  try {
    const response = await fetch("http://localhost:8518/", {
      method: "POST",
      body: JSON.stringify({ functionName: "mastersGetRegisteredPlayers", args: [] }),
      signal: createTimeoutAbortSignal(2000),
    });
    return response.status == 200;
  } catch {
    return false;
  }
}, 1000, 5);
if (backendConnectionCheck) {
  console.log("Connection to Backend OK");
} else {
  console.error("Connection to Backend FAILED");
  if (!confirm("Continue?")) Deno.exit(1);
}

console.log("Launching Broadcast");
spawn("Broadcast", Deno.execPath(), ["task", "start"], import.meta.dirname + "/../broadcast/");
console.log("Checking connection to Broadcast");
const broadcastConnectionCheck = await checkLoop(async () => {
  try {
    const response = await fetch("http://localhost:8514/", { signal: createTimeoutAbortSignal(2000) });
    return response.status == 404;
  } catch {
    return false;
  }
}, 1000, 5);
if (broadcastConnectionCheck) {
  console.log("Connection to Broadcast OK");
} else {
  console.error("Connection to Broadcast FAILED");
  if (!confirm("Continue?")) Deno.exit(1);
}
console.log("Checking connection to Broadcast User Controller Server");
const broadcastUserControllerServerConnectionCheck = await checkLoop(async () => {
  try {
    const response = await fetch("http://localhost:8519/", { signal: createTimeoutAbortSignal(2000) });
    return response.status == 405;
  } catch {
    return false;
  }
}, 1000, 5);
if (broadcastUserControllerServerConnectionCheck) {
  console.log("Connection to Broadcast User Controller Server OK");
} else {
  console.error("Connection to Broadcast User Controller Server FALIED");
  if (!confirm("Continue?")) Deno.exit(1);
}

if (!skipUserController) {
  console.log("Launching User Controller");
  spawn("User Controller", Deno.execPath(), ["task", "start"], import.meta.dirname + "/../user-controller/");
  const userControllerConnectionCheck = await checkLoop(async () => {
    try {
      const response = await fetch("http://localhost:8520/", { signal: createTimeoutAbortSignal(2000) });
      return response.status == 401 || response.status == 404;
    } catch {
      return false;
    }
  }, 1000, 5);
  if (userControllerConnectionCheck) {
    console.log("Connection to User Controller OK");
  } else {
    console.error("Connection to User Controller FALIED");
    if (!confirm("Continue?")) Deno.exit(1);
  }
}

console.log("Opening Broadcast dashboard");
// TODO: windows only!
spawn("Dashboard launcher", "cmd", ["/c", "start", "http://localhost:8514/dashboard.html"], import.meta.dirname!.toString());
