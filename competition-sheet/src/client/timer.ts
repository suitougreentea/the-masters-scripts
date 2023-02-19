import { runServerScript, StageTimerInfo, withLoader } from "./common";

let currentStageIndex = 0;

let startTime = -1;
let running = false;
let intervalId = -1;
const initialTimes: (number | null)[] = new Array(8);

const timerContainer = document.querySelector<HTMLDivElement>("#timer")!;
const startButton = document.querySelector<HTMLButtonElement>("#start")!;

const stageNameSpan = document.querySelector<HTMLSpanElement>("#stage-name")!;
const prevStageButton = document.querySelector<HTMLButtonElement>("#prev-stage")!;
const nextStageButton = document.querySelector<HTMLButtonElement>("#next-stage")!;
const refreshStageButton = document.querySelector<HTMLButtonElement>("#refresh-stage")!;

async function getAndApplyData(stageIndex: number) {
  try {
    const result = await runServerScript("getTimerInfo", [stageIndex]) as StageTimerInfo | null;
    if (result == null) throw new Error();

    stageNameSpan.innerText = `[${stageIndex + 1}] ${result.stageResult.name}`;
    for (let i = 0; i < 8; i++) {
      const e = result.players[i];
      (timerContainer.children[i].children[1] as HTMLDivElement).innerText = e != null ? e.name : "";
      initialTimes[i] = e != null ? e.startTime : null;
      setPlayerTime(i, e != null ? e.startTime : null);
    }
    startButton.disabled = false;
  } catch {
    stageNameSpan.innerText = `[${stageIndex + 1}] -`;
    for (let i = 0; i < 8; i++) {
      (timerContainer.children[i].children[1] as HTMLDivElement).innerText = "";
      initialTimes[i] = null;
      setPlayerTime(i, null);
    }
    startButton.disabled = true;
  }
}

function startTimer() {
  startTime = performance.now();
  running = true;
  intervalId = window.setInterval(updateTimer, 10);
  startButton.disabled = true;
}

function stopTimer() {
  window.clearInterval(intervalId);
  startTime = -1;
  running = false;
  intervalId = -1;
  startButton.disabled = false;
}

function updateTimer() {
  const now = performance.now();
  const elapsed = now - startTime;
  for (let i = 0; i < 8; i++) {
    const initialTime = initialTimes[i];
    if (initialTime != null) {
      const time = Math.max(0, initialTime - elapsed);
      setPlayerTime(i, time);
    } else {
      setPlayerTime(i, null);
    }
  }
}

function setPlayerTime(index: number, time: number | null) {
  const e = timerContainer.children[index];
  if (time != null) {
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
  } else {
    (e.children[2] as HTMLDivElement).innerText = "";
    (e.children[3] as HTMLDivElement).style.width = "0px";
  }
}

// TODO: 何番目スタートかを表示
startButton.onclick = (_) => {
  startTimer();
};

prevStageButton.onclick = (_) => {
  withLoader(async () => {
    if (currentStageIndex > 0) {
      if (running) stopTimer();
      currentStageIndex -= 1;
      await getAndApplyData(currentStageIndex);
    }
  });
};

nextStageButton.onclick = (_) => {
  withLoader(async () => {
    if (running) stopTimer();
    currentStageIndex += 1;
    await getAndApplyData(currentStageIndex);
  });
};

refreshStageButton.onclick = (_) => {
  withLoader(async () => {
    if (running) stopTimer();
    await getAndApplyData(currentStageIndex);
  });
};

function formatTime(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor(ms / 1000) % 60;
  const cent = Math.floor(ms / 10) % 100;

  return min + ":" + String(sec).padStart(2, "0") + "." + String(cent).padStart(2, "0");
}

withLoader(async () => {
  await getAndApplyData(currentStageIndex);
});
