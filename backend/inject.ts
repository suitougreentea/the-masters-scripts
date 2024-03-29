// Simple dependency injection container using TC39 decorator

const __brand = Symbol();
type InjectKey<T> = symbol & { [__brand]: T }
const injectKeys = new Map<symbol, InjectKey<unknown>>();

type Constructor<Args extends unknown[], T> = new (...params: Args) => T;
const injectCtorMap = new Map<Constructor<unknown[], unknown>, InjectKey<unknown>[]>();

const constructors = new Map<InjectKey<unknown>, Constructor<unknown[], unknown>>();
const singletonMap = new Map<InjectKey<unknown>, unknown>();

export const createKey = <T>(symbol: symbol): InjectKey<T> => {
  const key = injectKeys.get(symbol) as InjectKey<T> | undefined;
  if (key != null) return key;
  const created = symbol as InjectKey<T>;
  injectKeys.set(symbol, created);
  return created;
};

export const injectCtor =
  <Args extends unknown[]>(keys: [...{ [K in keyof Args]: InjectKey<Args[K]> }]) =>
  (ctor: Constructor<Args, unknown>, context: ClassDecoratorContext) => {
    context.addInitializer(() => {
      injectCtorMap.set(ctor as Constructor<unknown[], unknown>, keys);
    });
  };

export const register = <T, Args extends unknown[]>(key: InjectKey<T>, ctor: Constructor<Args, T>) => {
  constructors.set(key, ctor as Constructor<unknown[], unknown>);
};

export const resolve = <T>(key: InjectKey<T>): T => {
  const instance = singletonMap.get(key) as T | undefined;
  if (instance != null) return instance;

  const ctor = constructors.get(key);
  if (ctor == null) {
    throw new Error(
      `Constructor for key ${key.description} is not registered.`,
    );
  }

  const dependencies = injectCtorMap.get(ctor);
  let ctorArgs: unknown[] = [];
  if (dependencies != null) {
    ctorArgs = dependencies.map((e) => resolve(e));
  }

  const created = new ctor(...ctorArgs) as T;
  singletonMap.set(key, created);
  return created;
};
