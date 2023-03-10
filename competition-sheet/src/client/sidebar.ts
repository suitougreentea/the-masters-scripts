import { runServerScript, withLoader } from "./common";
import { ApiFunctions } from "./common_types";


export async function runServerScriptWithErrorDialog<TName extends keyof ApiFunctions>(name: TName, args: Parameters<ApiFunctions[TName]>): Promise<ReturnType<ApiFunctions[TName]>> {
  try {
    return await runServerScript(name, args);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    try {
      await runServerScript("showAlert", [message]);
    } catch { /* empty */ }
    throw e;
  }
}

let currentStageIndex = -1;

const page0Container = document.querySelector<HTMLDivElement>("#page0")!;
const page1Container = document.querySelector<HTMLDivElement>("#page1")!;

const stageNameSpan = document.querySelector<HTMLSpanElement>("#stage-name")!;
const prevStageButton = document.querySelector<HTMLButtonElement>("#prev-stage")!;
const nextStageButton = document.querySelector<HTMLButtonElement>("#next-stage")!;
const refreshStageButton = document.querySelector<HTMLButtonElement>("#refresh-stage")!;

const applyPlayersOrderButton = document.querySelector<HTMLButtonElement>("#apply-players-order")!;

async function getAndApplyStageInfo(stageIndex: number) {
  try {
    const result = await runServerScriptWithErrorDialog("getStageInfo", [stageIndex]);
    const numOverallStages = result.metadata.rounds.map(round => round.stages.length).reduce((a, b) => a + b);
    const isLast = stageIndex == numOverallStages - 1;

    stageNameSpan.innerText = `[${stageIndex + 1}] ${result.stageInfo.metadata.name}`;
    prevStageButton.disabled = false;
    nextStageButton.disabled = isLast;
    setPlayerNames(result.stageInfo.players.map(e => e != null ? e.name : null));
  } catch {
    stageNameSpan.innerText = `[${stageIndex + 1}] -`;
    prevStageButton.disabled = false;
    nextStageButton.disabled = false;
    setPlayerNames([null, null, null, null, null, null, null, null]);
  }
}

async function leaveStage(stageIndex: number) {
  try {
    await runServerScriptWithErrorDialog("leaveStage", [stageIndex]);
  } catch (e) {
    console.error(e);
  }
}

async function changeStage(newIndex: number) {
  if (currentStageIndex >= 0) await leaveStage(currentStageIndex);
  currentStageIndex = newIndex;
  if (currentStageIndex == -1) {
    stageNameSpan.innerText = "[0] ?????????";
    prevStageButton.disabled = true;
    nextStageButton.disabled = false;
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
    await runServerScriptWithErrorDialog("setupCompetition", [manualCheckbox.checked, Number(manualNumberOfGamesInput.value)]);
    await changeStage(0);
  });
};

const manualCheckbox = competitionSettingsForm.querySelector<HTMLInputElement>("input[name=manual]")!;
const manualNumberOfGamesInput = competitionSettingsForm.querySelector<HTMLInputElement>("input[name=manualNumberOfGames]")!;
manualCheckbox.onchange = (_) => {
  manualNumberOfGamesInput.disabled = !manualCheckbox.checked;
};

Sortable.create(document.querySelector("#players-sort-sortable")!);

// ???????????????????????????????????????????????????????????????
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
    await runServerScriptWithErrorDialog("reorderPlayers", [currentStageIndex, names]);
  });
};

changeStage(-1);