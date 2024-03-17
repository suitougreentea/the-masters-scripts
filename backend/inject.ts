// Simple dependency injection container using TC39 decorator

type InjectKey<T> = {
  symbol: symbol;
  _phantom: Record<never, never> & T; // actually {}
};
const injectKeys = new Map<symbol, InjectKey<any>>();

type Constructor<T> = new (...params: any[]) => T;
const injectCtorMap = new Map<Constructor<any>, InjectKey<any>[]>();

const constructors = new Map<InjectKey<any>, Constructor<any>>();
const singletonMap = new Map<InjectKey<any>, any>();

export const createKey = <T>(symbol: symbol): InjectKey<T> => {
  const key = injectKeys.get(symbol);
  if (key != null) return key;
  const created = { symbol } as unknown as InjectKey<T>;
  injectKeys.set(symbol, created);
  return created;
};

export const injectCtor =
  (keys: InjectKey<any>[]) =>
  (ctor: Constructor<any>, context: ClassDecoratorContext) => {
    context.addInitializer(() => {
      injectCtorMap.set(ctor, keys);
    });
  };

export const register = <T>(key: InjectKey<T>, ctor: Constructor<T>) => {
  constructors.set(key, ctor);
};

export const resolve = <T>(key: InjectKey<T>): T => {
  const instance = singletonMap.get(key);
  if (instance != null) return instance;

  const ctor = constructors.get(key);
  if (ctor == null) {
    throw new Error(
      `Constructor for key ${key.symbol.description} is not registered.`,
    );
  }

  const dependencies = injectCtorMap.get(ctor);
  let ctorArgs: any[] = [];
  if (dependencies != null) {
    ctorArgs = dependencies.map((e) => resolve(e));
  }

  const created = new ctor(...ctorArgs);
  singletonMap.set(key, created);
  return created;
};
