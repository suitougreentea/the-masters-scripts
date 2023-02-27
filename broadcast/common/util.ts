export function formatTime(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor(ms / 1000) % 60;
  const cent = Math.floor(ms / 10) % 100;

  return min + ":" + String(sec).padStart(2, "0") + "." +
    String(cent).padStart(2, "0");
}

export type PromiseSet<T> = {
  promise: Promise<T>;
  resolve: (result: T) => void;
  reject: (reason: unknown) => void;
};
export function createPromiseSet<T>(): PromiseSet<T> {
  let resolve: ((result: T) => void) | undefined = undefined;
  let reject: ((reason: unknown) => void) | undefined = undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}
