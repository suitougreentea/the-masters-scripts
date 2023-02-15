import { runServerScript } from "./common";

let startTime = -1;
let running = false;
let intervalId = -1;
const initialTimes: number[] = new Array(8);

const timerContainer = document.querySelector<HTMLDivElement>("#timer")!;
const startButton = document.querySelector<HTMLButtonElement>("#startButton")!;
const resetButton = document.querySelector<HTMLButtonElement>("#resetButton")!;

// TODO: 何番目スタートかを表示
startButton.onclick = (_) => {
  startTime = performance.now();
  running = true;
  intervalId = window.setInterval(updateTimer, 10);
  startButton.disabled = true;
};

resetButton.onclick = (_) => {
  window.clearInterval(intervalId);
  startTime = -1;
  running = false;
  intervalId = -1;
  for (let i = 0; i < 8; i++) {
    setPlayerTime(i, initialTimes[i]);
  }
  startButton.disabled = false;
  updateData();
};

function formatTime(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor(ms / 1000) % 60;
  const cent = Math.floor(ms / 10) % 100;

  return min + ":" + String(sec).padStart(2, "0") + "." + String(cent).padStart(2, "0");
}

type TimerData = { name: string, time: number }[];

async function updateData() {
  if (running) return;

  const result = await runServerScript("getTimerData", []) as TimerData;

  for (let i = 0; i < 8; i++) {
    const data = result[i];
    const player = timerContainer.children[i];
    (player.children[1] as HTMLDivElement).innerText = data.name;
    setPlayerTime(i, data.time);
    initialTimes[i] = data.time;
  }
}

function updateTimer() {
  const now = performance.now();
  const elapsed = now - startTime;
  for (let i = 0; i < 8; i++) {
    const time = Math.max(0, initialTimes[i] - elapsed);
    setPlayerTime(i, time);
  }
}

function setPlayerTime(index: number, time: number) {
  const e = timerContainer.children[index];
  (e.children[2] as HTMLDivElement).innerText = formatTime(time);
  (e.children[3] as HTMLDivElement).style.width = (time / 200) + "px";
  let color = "#35a16b";
  if (time < 10000) color = "#faf500";
  if (time < 5000) {
    const t = (1000 - (time % 1000)) / 1000;
    const u = Math.sqrt(t);
    color = tinycolor.mix("#ff2800", "#faf500", u * 100).toRgbString();
  }
  (e.children[3] as HTMLDivElement).style.background = color;
}

window.setInterval(updateData, 10000);
updateData();
