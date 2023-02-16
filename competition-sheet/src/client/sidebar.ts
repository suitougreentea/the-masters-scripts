import { runServerScript, StageInfo, withLoader } from "./common";

let currentStageIndex = -1;

const page0Container = document.querySelector<HTMLDivElement>("#page0")!;
const page1Container = document.querySelector<HTMLDivElement>("#page1")!;

const stageNameSpan = document.querySelector<HTMLSpanElement>("#stage-name")!;
const prevStageButton = document.querySelector<HTMLButtonElement>("#prev-stage")!;
const nextStageButton = document.querySelector<HTMLButtonElement>("#next-stage")!;
const refreshStageButton = document.querySelector<HTMLButtonElement>("#refresh-stage")!;

const applyPlayersOrderButton = document.querySelector<HTMLButtonElement>("#apply-players-order")!;
const applyResultButton = document.querySelector<HTMLButtonElement>("#apply-result")!;

async function getAndApplyStageInfo(stageIndex: number) {
  try {
    const result = await runServerScript("getStageInfo", [stageIndex]) as StageInfo | null;
    if (result == null) throw new Error();

    stageNameSpan.innerText = `[${stageIndex + 1}] ${result.stageName}`;
    setPlayerNames(result.players.map(e => e != null ? e.name : null));
    applyPlayersOrderButton.disabled = result.wildcard;
    applyResultButton.disabled = result.manual;
  } catch {
    stageNameSpan.innerText = `[${stageIndex + 1}] -`;
    setPlayerNames([null, null, null, null, null, null, null, null]);
    applyPlayersOrderButton.disabled = true;
    applyResultButton.disabled = true;
  }
}

async function changeStage(newIndex: number) {
  currentStageIndex = newIndex;
  if (currentStageIndex == -1) {
    stageNameSpan.innerText = "[0] ホーム";
    page0Container.style.display = "block";
    page1Container.style.display = "none";
    refreshStageButton.disabled = true;
  } else {
    await getAndApplyStageInfo(currentStageIndex);
    page0Container.style.display = "none";
    page1Container.style.display = "block";
    refreshStageButton.disabled = false;
  }
}

prevStageButton.onclick = (_) => {
  withLoader(async () => {
    if (currentStageIndex >= 0) {
      await changeStage(currentStageIndex - 1);
    }
  });
};

nextStageButton.onclick = (_) => {
  withLoader(async () => {
    await changeStage(currentStageIndex + 1);
  });
};

refreshStageButton.onclick = (_) => {
  withLoader(async () => {
    if (currentStageIndex >= 0) {
      await getAndApplyStageInfo(currentStageIndex);
    }
  });
};

const competitionSettingsForm = document.querySelector<HTMLFormElement>("#competition-settings")!;
competitionSettingsForm.onsubmit = (_) => {
  withLoader(async () => {
    await runServerScript("setupCompetition", [competitionSettingsForm]);
    await changeStage(0);
  });
};

const manualCheckbox = competitionSettingsForm.querySelector<HTMLInputElement>("input[name=manual]")!;
const manualNumberOfGamesInput = competitionSettingsForm.querySelector<HTMLInputElement>("input[name=manualNumberOfGames]")!;
manualCheckbox.onchange = (_) => {
  manualNumberOfGamesInput.disabled = !manualCheckbox.checked;
};

Sortable.create(document.querySelector("#players-sort-sortable")!);

// 並べ替えた順番になったノードを毎回取得する
function getPlayersSortableItems(): HTMLDivElement[] {
  return Array.from(document.querySelectorAll<HTMLDivElement>("#players-sort-sortable>.item"));
}

function setPlayerNames(names: (string | null)[]) {
  const playersSortableItems = getPlayersSortableItems();
  for (let i = 0; i < 8; i++) {
    const name = names[i];
    playersSortableItems[i].innerText = name != null ? name : "";
  }
}

applyPlayersOrderButton.onclick = (_) => {
  withLoader(async () => {
    const playersSortableItems = getPlayersSortableItems();
    const names: (string | null)[] = [];
    for (let i = 0; i < 8; i++) {
      const name = playersSortableItems[i].innerText;
      names.push(name != "" ? name : null);
    }
    await runServerScript("reorderPlayers", [currentStageIndex, names]);
  });
};

applyResultButton.onclick = (_) => {
  withLoader(async () => {
    await runServerScript("applyResult", [currentStageIndex]);
    currentStageIndex += 1;
    await getAndApplyStageInfo(currentStageIndex);
  });
};

changeStage(-1);