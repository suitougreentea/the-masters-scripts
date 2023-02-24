import { runServerScript, withLoader } from "./common";

let currentStageIndex = 0;

let startTime = -1;
let running = false;
let intervalId = -1;
const initialTimes: (number | null)[] = new Array(8);

const timerContainer = document.querySelector<HTMLDivElement>("#timer")!;
const timerPlayerTemplate = document.querySelector<HTMLTemplateElement>("#timer-player")!;
const timerPlayers: {
  id: HTMLDivElement,
  name: HTMLDivElement,
  time: HTMLDivElement,
  gauge: HTMLDivElement,
  startOrder: HTMLDivElement,
  diffTime: HTMLDivElement,
}[] = [];
for (let i = 0; i < 8; i++) {
  const player = document.importNode(timerPlayerTemplate.content, true);
  const id = player.querySelector<HTMLDivElement>(".id")!;
  const name = player.querySelector<HTMLDivElement>(".name")!;
  const time = player.querySelector<HTMLDivElement>(".time")!;
  const gauge = player.querySelector<HTMLDivElement>(".gauge")!;
  const startOrder = player.querySelector<HTMLDivElement>(".start-order")!;
  const diffTime = player.querySelector<HTMLDivElement>(".diff-time")!;
  id.innerText = String(i + 1);
  timerContainer.appendChild(player);
  timerPlayers.push({ id, name, time, gauge, startOrder, diffTime });
}

const startButton = document.querySelector<HTMLButtonElement>("#start")!;

const stageNameSpan = document.querySelector<HTMLSpanElement>("#stage-name")!;
const prevStageButton = document.querySelector<HTMLButtonElement>("#prev-stage")!;
const nextStageButton = document.querySelector<HTMLButtonElement>("#next-stage")!;
const refreshStageButton = document.querySelector<HTMLButtonElement>("#refresh-stage")!;

async function getAndApplyData(stageIndex: number) {
  try {
    const result = await runServerScript("getTimerInfo", [stageIndex]);

    const getDiffTime = (playerIndex: number) => {
      const players = result.stageTimerInfo.players;
      const player = players[playerIndex];
      if (player == null) return 0;

      if (player.startOrder == 1) return 0;

      // startOrderが1つ先の人を探す
      let targetIndex = -1;
      players.forEach((e, i) => {
        if (e == null) return;
        if (e.startOrder < player.startOrder) {
          if (targetIndex == -1 || players[targetIndex]!.startOrder < e.startOrder) {
            targetIndex = i;
          }
        }
      });
      if (targetIndex == -1) return 0; // unreachable?

      return player.startTime - players[targetIndex]!.startTime;
    };

    stageNameSpan.innerText = `[${stageIndex + 1}] ${result.stageTimerInfo.stageResult.name}`;
    for (let i = 0; i < 8; i++) {
      const playerInfo = result.stageTimerInfo.players[i];
      const player = timerPlayers[i];
      if (playerInfo != null) {
        player.name.innerText = playerInfo.name;
        initialTimes[i] = playerInfo.startTime;
        setPlayerTime(i, playerInfo.startTime);
        player.startOrder.innerText = playerInfo.startOrder + ":";
        player.diffTime.innerText = "+" + formatTime(getDiffTime(i));
      } else {
        player.name.innerText = "";
        initialTimes[i] = null;
        setPlayerTime(i, null);
        player.startOrder.innerText = "";
        player.diffTime.innerText = "";
      }
    }
    startButton.disabled = false;
    prevStageButton.disabled = stageIndex == 0;
    nextStageButton.disabled = result.isLast;
  } catch {
    stageNameSpan.innerText = `[${stageIndex + 1}] -`;
    for (let i = 0; i < 8; i++) {
      const player = timerPlayers[i];
      player.name.innerText = "";
      initialTimes[i] = null;
      setPlayerTime(i, null);
      player.startOrder.innerText = "";
      player.diffTime.innerText = "";
    }
    startButton.disabled = true;
    prevStageButton.disabled = false;
    nextStageButton.disabled = false;
  }
}

function startTimer() {
  startTime = performance.now();
  running = true;
  intervalId = window.setInterval(updateTimer, 10);
  startButton.disabled = true;
  timerPlayers.forEach(e => {
    e.startOrder.style.display = "none";
    e.diffTime.style.display = "none";
  });
}

function stopTimer() {
  window.clearInterval(intervalId);
  startTime = -1;
  running = false;
  intervalId = -1;
  startButton.disabled = false;
  timerPlayers.forEach(e => {
    e.startOrder.style.display = "block";
    e.diffTime.style.display = "block";
  });
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
}

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
