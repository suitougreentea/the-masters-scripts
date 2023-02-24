import { ApiFunctions } from "./common_types";

export function runServerScript<TName extends keyof ApiFunctions>(name: TName, args: Parameters<ApiFunctions[TName]>): Promise<ReturnType<ApiFunctions[TName]>> {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((result) => resolve(result as ReturnType<ApiFunctions[TName]>))
      .withFailureHandler((error) => reject(error))[name].apply(null, args);
  });
}

const loader = document.querySelector<HTMLDivElement>("#loader")!;

export async function withLoader(action: () => Promise<void>) {
  try {
    loader.style.display = "block";
    await action();
  } finally {
    loader.style.display = "none";
  }
}
