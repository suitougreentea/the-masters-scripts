import { denocg } from "./deps.ts";
import { type TypeDefinition } from "../common/type_definition.ts";
const client = await denocg.getClient<TypeDefinition>();

export const timeToString = (time: number) => {
  const min = Math.floor(time / 60000);
  const sec = Math.floor(time / 1000) % 60;
  const cent = Math.floor(time / 10) % 100;
  return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0") + "." + String(cent).padStart(2, "0");
}

const container = document.createElement("div");
container.style.display = "flex";
container.style.flexWrap = "wrap";
document.body.appendChild(container);

const infoPres: HTMLPreElement[] = [];
for (let i = 0; i < 8 ; i++) {
  const infoPre = document.createElement("pre")
  infoPre.style.margin = "10px";
  container.appendChild(infoPre);
  infoPres.push(infoPre);
}

const replicant = await client.getReplicant("latestOcrResult");
replicant.subscribe(value => {
  if (value == null) return;
  const { status } = value;

  status.forEach((s, i) => {
    const infoPre = infoPres[i];

    let text = "";
    text += `${s.playing ? "PLAYING" : "NOT PLAYING"}\n`;
    text += `Level: ${s.level}\n`;
    text += `Time: ${timeToString(s.gameTime)}\n`;
    text += "---------------------------\n";
    text += "         [lap]     [split] \n";
    s.sections.forEach((section, i) => {
      const level0 = `${i * 100}`.padStart(3, "0")
      const level1 = `${i == 9 ? "999" : (i + 1) * 100}`
      text += `${level0}-${level1}  ${timeToString(section.lap)}  ${timeToString(section.split)}\n`;
    });

    infoPre.innerText = text;
  });
});