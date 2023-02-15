import { runServerScript, StageInfo } from "./common";

let currentStageIndex = -1;

const loader = document.querySelector<HTMLDivElement>("#loader")!;

async function runServerScriptWithLoader(name: string, args: unknown[]): Promise<unknown> {
  loader.style.display = "block";
  try {
    const result = await runServerScript(name, args);
    return result;
  } finally {
    loader.style.display = "none";
  }
}

const page0Container = document.querySelector<HTMLDivElement>("#page0")!;
const page1Container = document.querySelector<HTMLDivElement>("#page1")!;

const competitionSettingsForm = document.querySelector<HTMLFormElement>("#competition-settings")!;
competitionSettingsForm.onsubmit = (_) => {
  runServerScriptWithLoader("setupCompetition", [competitionSettingsForm]);
};

const presetNameSelect = competitionSettingsForm.querySelector<HTMLSelectElement>("select[name=presetName]")!;
const manualNumberOfGamesInput = competitionSettingsForm.querySelector<HTMLInputElement>("input[name=manualNumberOfGames]")!;
presetNameSelect.onchange = (_) => {
  manualNumberOfGamesInput.disabled = presetNameSelect.selectedIndex > 0;
};

competitionSettingsForm.querySelector<HTMLOptionElement>("option[value=manual]")!.selected = true;

const prevStageButton = document.querySelector<HTMLButtonElement>("#prev-stage")!;
const nextStageButton = document.querySelector<HTMLButtonElement>("#next-stage")!;
const stageNameSpan = document.querySelector<HTMLSpanElement>("#stage-name")!;

const refreshPlayersButton = document.querySelector<HTMLButtonElement>("#refresh-players")!;
const applyPlayersOrderButton = document.querySelector<HTMLButtonElement>("#apply-players-order")!;

async function getAndApplyStageInfo(stageIndex: number): Promise<boolean> {
  try {
    const result = await runServerScriptWithLoader("getStageInfo", [stageIndex]);
    if (result != null) {
      applyStageInfo(result as StageInfo);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

prevStageButton.onclick = async (ev) => {
  if (currentStageIndex == 0) {
    page0Container.style.display = "block";
    page1Container.style.display = "none";
    stageNameSpan.innerText = "ホーム";
    currentStageIndex = -1;
  } else if (currentStageIndex > 0) {
    if (await getAndApplyStageInfo(currentStageIndex - 1)) {
      currentStageIndex -= 1;
    }
  }
};

nextStageButton.onclick = async (ev) => {
  if (currentStageIndex == -1) {
    page0Container.style.display = "none";
    page1Container.style.display = "block";
  }
  if (await getAndApplyStageInfo(currentStageIndex + 1)) {
    currentStageIndex += 1;
  }
};

function applyStageInfo(result: StageInfo) {
  stageNameSpan.innerText = result.stageName;
  setPlayerNames(result.players.map(e => e != null ? e.name : null));
}

Sortable.create(document.querySelector("#players-sort>.players-sort-sortable")!);

// 並べ替えた順番になったノードを毎回取得する
function getPlayersSortableItems(): HTMLDivElement[] {
  return Array.from(document.querySelectorAll<HTMLDivElement>("#players-sort>.players-sort-sortable>.item"));
}

function setPlayerNames(names: (string | null)[]) {
  const playersSortableItems = getPlayersSortableItems();
  for (let i = 0; i < 8; i++) {
    const name = names[i];
    playersSortableItems[i].innerText = name != null ? name : "";
  }
}

refreshPlayersButton.onclick = async (ev) => {
  await getAndApplyStageInfo(currentStageIndex);
};

applyPlayersOrderButton.onclick = async (ev) => {
  const playersSortableItems = getPlayersSortableItems();
  const names: (string | null)[] = [];
  for (let i = 0; i < 8; i++) {
    const name = playersSortableItems[i].innerText;
    names.push(name != "" ? name : null);
  }
  runServerScriptWithLoader("reorderPlayers", [currentStageIndex, names]);
};

function setTimer() {
  runServerScriptWithLoader("setTimer", [currentStageIndex]);
}

function setResult() {
  runServerScriptWithLoader("setResult", [currentStageIndex, false]);
}

function setNext() {
  runServerScriptWithLoader("setNext", [currentStageIndex]);
}

