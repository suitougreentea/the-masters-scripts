import { TextLineStream } from "https://deno.land/std@0.141.0/streams/mod.ts";

const socket = new WebSocket("ws://localhost:8517")
socket.onopen = () => {
  console.log("open")
};
socket.onmessage = (ev) => {
  try {
    const data = JSON.parse(ev.data) as { op: number };
    if (data.op == 1) {
      console.log("reset request")
      reset()
    }
  } catch (e) {
    console.error(e)
  }
}

const getInitialState = () => ({
  status: [...new Array(8)].map(_ => ({
    frameTime: 0,
    playing: false,
    level: 0,
    grade: 0,
    gameTime: 0,
    sections: [],
  })),
});

let currentState = getInitialState();

const proceedRandom = () => {
  currentState.status.forEach(status => {
    status.frameTime = Date.now();

    if (!status.playing) {
      if (status.level == 0) {
        status.playing = Math.random() < 0.01;
      } else {
        return;
      }
    }

    status.level = Math.min(status.level + (1.3 + (Math.random() - 0.5) * 0.3), 999);
    status.grade = Math.min(status.grade + (0.035 + (Math.random() - 0.5) * 0.01), 18);
    status.gameTime += 1000;

    if (status.level == 999) {
      status.playing = false;
    } else {
      status.playing = Math.random() >= 0.001;
    }
  });
};

const reset = () => {
  currentState = getInitialState();
  updating = false;
}

const send = () => {
  const data = {
    op: 0,
    d: {
      status: currentState.status.map(e => ({
        ...e,
        level: Math.round(e.level),
        grade: Math.round(e.grade),
      }))
    },
  };
  socket.send(JSON.stringify(data));
}

let updating = false;
setInterval(() => {
  if (updating) {
    proceedRandom();
  }
}, 10);

setInterval(() => {
  if (socket.readyState == WebSocket.OPEN) {
    send();
  }
}, 250);

const lineStream = Deno.stdin.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream());

for await (const command of lineStream) {
  // const command = prompt(">")
  if (command == "s") {
    updating = true;
  }
  if (command == "e") {
    updating = false;
  }
  if (command == "r") {
    reset();
  }
  if (command == "p") {
    console.log(currentState);
  }
}