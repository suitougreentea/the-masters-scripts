import tinycolor from "tinycolor2";
import { type TimerData } from "./main.ts";

const loader = document.querySelector<HTMLDivElement>("#loader")!;
export async function withLoader(action: () => Promise<void>) {
  try {
    loader.style.display = "block";
    await action();
  } finally {
    loader.style.display = "none";
  }
}

export function runServerScript(name: string, args: unknown): unknown {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((result) => {
        const data = JSON.parse(result);
        if (data.error) {
          reject(data.error);
        } else if (data.result) {
          resolve(data.result);
        } else {
          reject();
        }
      })
      .withFailureHandler((error) => reject(error))[name].apply(undefined, [
        JSON.stringify(args),
      ]);
  });
}

let startTime = -1;
let elapsedTime = 0;
let intervalId = -1;
const getEmptyData = (): TimerData =>
  [...new Array(8)].map((_) => ({
    name: "",
    startTime: 0,
  }));
let currentData = getEmptyData();

const timerContainer = document.querySelector<HTMLDivElement>("#timer")!;
const timerPlayerTemplate = document.querySelector<HTMLTemplateElement>(
  "#timer-player",
)!;
const timerPlayers: {
  id: HTMLDivElement;
  name: HTMLDivElement;
  time: HTMLDivElement;
  gauge: HTMLDivElement;
}[] = [];
for (let i = 0; i < 8; i++) {
  const player = document.importNode(timerPlayerTemplate.content, true);
  const id = player.querySelector<HTMLDivElement>(".id")!;
  const name = player.querySelector<HTMLDivElement>(".name")!;
  const time = player.querySelector<HTMLDivElement>(".time")!;
  const gauge = player.querySelector<HTMLDivElement>(".gauge")!;
  id.innerText = String(i + 1);
  timerContainer.appendChild(player);
  timerPlayers.push({ id, name, time, gauge });
}

const spreadsheetInput = document.querySelector<HTMLInputElement>(
  "#spreadsheet",
)!;
const gameInput = document.querySelector<HTMLInputElement>("#game")!;
const getButton = document.querySelector<HTMLButtonElement>("#get")!;

const startButton = document.querySelector<HTMLButtonElement>("#start")!;
const resetButton = document.querySelector<HTMLButtonElement>("#reset")!;

const getData = (url: string, gameIndex: number) => {
  withLoader(async () => {
    try {
      const data = await runServerScript("getData", {
        spreadsheet: url,
        game: gameIndex,
      }) as TimerData;
      currentData = data;
    } catch (e) {
      console.error(e);
      currentData = getEmptyData();
    }
    updateRender();
  });
};

const startTimer = () => {
  startTime = performance.now();
  intervalId = setInterval(tickTimer, 10);
  startButton.disabled = true;
};

const stopTimer = () => {
  startTime = -1;
  elapsedTime = 0;
  clearInterval(intervalId);
  intervalId = -1;
  startButton.disabled = false;
  updateRender();
};

const tickTimer = () => {
  const now = performance.now();
  elapsedTime = now - startTime;
  updateRender();
};

const updateRender = () => {
  for (let i = 0; i < 8; i++) {
    const playerInfo = currentData[i];
    const player = timerPlayers[i];
    player.name.innerText = playerInfo.name;

    if (playerInfo.name != null && playerInfo.name != "") {
      const initialTime = playerInfo.startTime;
      const time = Math.max(0, initialTime - elapsedTime);
      setPlayerTime(i, time);
    } else {
      setPlayerTime(i, undefined);
    }
  }
};

const setPlayerTime = (index: number, time: number | undefined) => {
  const player = timerPlayers[index];
  if (time != null) {
    player.time.innerText = formatTime(time);
    player.gauge.style.width = (time / 200) + "px";
    let color = "#35a16b";
    if (time < 10000) color = "#faf500";
    if (time < 5000) {
      const t = (1000 - (time % 1000)) / 1000;
      const u = Math.sqrt(t);
      color = tinycolor.mix("#ff2800", "#faf500", u * 100).toRgbString();
    }
    player.gauge.style.background = color;
  } else {
    player.time.innerText = "";
    player.gauge.style.width = "0px";
  }
};

getButton.onclick = (_) => {
  const spreadsheet = spreadsheetInput.value;
  const gameIndex = Number(gameInput.value) - 1;
  getData(spreadsheet, gameIndex);
};

startButton.onclick = (_) => {
  startTimer();
};

resetButton.onclick = (_) => {
  stopTimer();
};

const formatTime = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor(ms / 1000) % 60;
  const cent = Math.floor(ms / 10) % 100;

  return min + ":" + String(sec).padStart(2, "0") + "." +
    String(cent).padStart(2, "0");
};
