declare let global: Record<string, (...args: any[]) => void>

export function add(a: number, b: number): number {
  return a + b;
}

global.test = () => {
  console.log(add(1, 3));
}
