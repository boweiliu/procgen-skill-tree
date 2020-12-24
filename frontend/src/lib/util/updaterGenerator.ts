export type UpdaterFnParam2<T, W> = T | ((prev: T, prevWhole: W) => T);
export type UpdaterFn2<T, W> = (arg: UpdaterFnParam2<T, W>) => void;
export type UpdaterGeneratorType2<T, W = T> = {
  [k in keyof T]: ((T[k] extends { [kkt: string]: any } ? UpdaterGeneratorType2<T[k], W> : {}) & {
    getUpdater: () => UpdaterFn2<T[k], W>,
    set: UpdaterFn2<T[k], W>,
    update: UpdaterFn2<T[k], W>,
  })
} & {
  getUpdater: () => UpdaterFn2<T, W>,
  set: UpdaterFn2<T, W>,
  update: UpdaterFn2<T, W>,
}

function isObject(o: any): o is { [x: string]: any } {
  return (typeof o === "object");
}

function updaterGenerator2Helper<T, W>(dataObject: T, dataUpdater: UpdaterFn2<T, W>): UpdaterGeneratorType2<T, W> {
  const updaters: UpdaterGeneratorType2<T, W> = {} as any;
  updaters.getUpdater = () => dataUpdater;
  updaters.set = dataUpdater;
  updaters.update = dataUpdater;
  if (typeof dataObject !== "object") return updaters;
  else {
    const keys: (keyof T)[] = Object.keys(dataObject) as any;
    keys.forEach((key: (keyof T)) => {
      if (key === "set" || key === "getUpdater" || key === "update") {
        throw Error(`Invalid key in updaterGenerator: ${key} conflicts with reserved keywords set, update, getUpdater.`);
      }
      function keyUpdater(newValueOrCallback: UpdaterFnParam2<T[typeof key], W>) {
        if (typeof newValueOrCallback === "function") {
          dataUpdater((oldData: T, wholeData: W) => {
            const newData = {
              ...oldData,
              [key]: (newValueOrCallback as ((prev: T[typeof key], whole: W) => T[typeof key]))(oldData[key], wholeData),
            };
            return newData;
          });
        } else {
          dataUpdater((oldData, wholeData) => ({ ...oldData, [key]: newValueOrCallback }));
        }
      }
      updaters[key] = (updaterGenerator2Helper<T[typeof key], W>(dataObject[key], keyUpdater) as unknown as (typeof updaters)[typeof key]);
    });
    return updaters;
  }
}

export function updaterGenerator2<T>(dataObject: T, setState: UpdaterFn<T>): UpdaterGeneratorType2<T> {
  const dataUpdater2 = (stateCallbackFunction: UpdaterFnParam2<T, T>) => {
    if (typeof stateCallbackFunction === 'function') {
      setState((prev: T) => {
        // if T is a function type already, typescript correctly notifies us that this will fail
        return (stateCallbackFunction as ((prev: T, prevWhole: T) => T))(prev, prev);
      })
    } else {
      setState(stateCallbackFunction);
    }
  };
  return updaterGenerator2Helper<T, T>(dataObject, dataUpdater2);
}



type UpdaterFnParam<T> = T | ((prev: T) => T);
// type UpdaterFnParam<T> = ((prev: T) => T);
export type UpdaterFn<T> = (arg: UpdaterFnParam<T>) => void;

export type UpdaterGeneratorType<T> = {
  [k in keyof T]: T[k] extends { [kkt: string]: any }
  ? (UpdaterGeneratorType<T[k]> & {
    getUpdater: () => UpdaterFn<T[k]>,
    set: UpdaterFn<T[k]>,
    update: UpdaterFn<T[k]>,
  })
  : {
    getUpdater: () => UpdaterFn<T[k]>,
    set: UpdaterFn<T[k]>,
    update: UpdaterFn<T[k]>,
  }
} & {
  getUpdater: () => UpdaterFn<T>,
  set: UpdaterFn<T>,
  update: UpdaterFn<T>,
}

/**
 * Convenience method for generating setState<FancyObject.sub.component>() from setState<FancyObject> callbacks.
 * If used in react, recommended that this be memoized.
 * 
 * @generic T should be a data-only object - nested objects are allowed but arrays, sets not supported
 * @param dataObject ANY instance of T, used only for its keys. MUST have all keys present
 * @param dataUpdater an updater function, which can be called as: dataUpdater(newT) or
 *   dataUpdater((oldT) => { return newTFromOldT(oldT) }) ; e.g. react setState() function.
 * @return a deep object that has the same keys as T, except each key also has a getUpdater()/set/update member;
 *   the getUpdater() on a subobject of T acts similarly to the dataUpdater<T> but to the subobject rather than the whole object.
 * e.g. :
 *   let gameStateUpdater = updaterGenerator(skeletonObject, setGameState);
 *   let setName = gameStateUpdater.player.name.getUpdater();
 *   gameStateUpdater.player.name.set(newName);
 *   gameStateUpdater.player.name.update(oldName => oldName + " ");
 * 
 */
export function updaterGenerator<T>(dataObject: T, dataUpdater: UpdaterFn<T>): UpdaterGeneratorType<T> {
  const updaters: UpdaterGeneratorType<T> = {} as any;
  updaters.getUpdater = () => dataUpdater;
  updaters.set = dataUpdater;
  updaters.update = dataUpdater;
  if (typeof dataObject !== "object") return updaters;
  const keys : (keyof T)[] = Object.keys(dataObject) as any as (keyof T)[];
  keys.forEach((key: (keyof T)) => {
    if (key === "set" || key === "getUpdater" || key === "update") {
      throw Error(`Invalid key in updaterGenerator: ${key} conflicts with reserved keywords set, update, getUpdater.`);
    }
    function keyUpdater(newValueOrCallback: UpdaterFnParam<T[typeof key]>) {
      if (typeof newValueOrCallback === "function") {
        dataUpdater((oldData) => {
          const newData = {
            ...oldData,
            [key]: (newValueOrCallback as Function)(oldData[key]),
          };
          return newData;
        });
      } else {
        dataUpdater((oldData) => ({ ...oldData, [key]: newValueOrCallback }));
      }
    }
    updaters[key] = updaterGenerator(dataObject[key], keyUpdater) as any;
  });
  return updaters;
}