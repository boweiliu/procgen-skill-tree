type UpdaterFnParam2<T, W> =
  | ((prev: T, prevWhole: W) => T)
  | (T extends Function ? never : T); // (T | ((prev: T, prevWhole: W) => T));
type UpdaterFn2<T, W> = (arg: UpdaterFnParam2<T, W>) => void;

/**
 * Represent the type which has the same deep object struture as T but instead of values, it has
 * functions on [getUpdater], [enqueueUpdate], and [update] attached to every level of the object structure.
 */
export type UpdaterGeneratorType2<T, W = T> = {
  [k in keyof T]: (T[k] extends { [kkt: string]: any }
    ? UpdaterGeneratorType2<T[k], W>
    : {}) & {
    getUpdater: () => UpdaterFn2<T[k], W>;
    enqueueUpdate: UpdaterFn2<T[k], W>;
  };
} & {
  getUpdater: () => UpdaterFn2<T, W>;
  enqueueUpdate: UpdaterFn2<T, W>;
};

// helper method for the recursion
function updaterGenerator2Helper<T, W>(
  dataObject: T,
  dataUpdater: UpdaterFn2<T, W>
): UpdaterGeneratorType2<T, W> {
  const updaters: UpdaterGeneratorType2<T, W> = {} as any;
  updaters.getUpdater = () => dataUpdater;
  updaters.enqueueUpdate = dataUpdater;
  if (typeof dataObject !== 'object') return updaters;
  else {
    const keys: (keyof T)[] = Object.keys(dataObject) as any;
    keys.forEach((key: keyof T) => {
      if (key === 'enqueueUpdate' || key === 'getUpdater' || key === 'update') {
        throw Error(
          `Invalid key in updaterGenerator: ${key} conflicts with reserved keywords enqueueUpdate, update, getUpdater.`
        );
      }
      function keyUpdater(
        newValueOrCallback: UpdaterFnParam2<T[typeof key], W>
      ) {
        if (typeof newValueOrCallback === 'function') {
          dataUpdater((oldData: T, wholeData: W) => {
            const newKey = (newValueOrCallback as (
              prev: T[typeof key],
              whole: W
            ) => T[typeof key])(oldData[key], wholeData);
            if (oldData[key] === newKey) {
              return oldData; // no update detected, no need to update anything
            } else {
              const newData = {
                ...oldData,
                [key]: newKey,
              };
              return newData;
            }
          });
        } else {
          dataUpdater((oldData, wholeData) => ({
            ...oldData,
            [key]: newValueOrCallback,
          }));
        }
      }
      updaters[key] = (updaterGenerator2Helper<T[typeof key], W>(
        dataObject[key],
        keyUpdater
      ) as unknown) as typeof updaters[typeof key];
    });
    return updaters;
  }
}

/**
 * Convenience method for generating setState<FancyObject.sub.component>() from setState<FancyObject> callbacks.
 * If used in react, recommended that this be memoized.
 *
 * @generic T should be a data-only object - nested objects are allowed but arrays, sets not supported
 * @param dataObject ANY instance of T, used only for its keys. MUST have all keys present
 * @param setState an updater function, which can be called as: dataUpdater(newT) or
 *   dataUpdater((oldT) => { return newTFromOldT(oldT) }) ; e.g. react setState() function.
 * @return a deep object that has the same keys as T, except each key also has a getUpdater()/set/update member;
 *   the getUpdater() on a subobject of T acts similarly to the [setState] param but to the subobject rather than the whole object;
 *   the whole object is also available as the second argument of the callback
 * e.g. :
 *   let gameStateUpdater = updaterGenerator(skeletonObject, setGameState);
 *   let setName = gameStateUpdater.player.name.getUpdater();
 *   gameStateUpdater.player.name.set(newName);
 *   gameStateUpdater.player.name.update((oldName, wholeObject) => oldName + " ");
 *
 */
export function updaterGenerator2<T>(
  dataObject: T,
  setState: UpdaterFn<T>
): UpdaterGeneratorType2<T> {
  const dataUpdater2 = (stateCallbackFunction: UpdaterFnParam2<T, T>) => {
    if (typeof stateCallbackFunction === 'function') {
      setState((prev: T) => {
        // if T is a function type already, typescript correctly notifies us that this will fail
        const next = (stateCallbackFunction as (prev: T, prevWhole: T) => T)(
          prev,
          prev
        );
        // console.log(" in updater generator 2", { next });
        return next;
      });
    } else {
      setState(stateCallbackFunction);
    }
  };
  return updaterGenerator2Helper<T, T>(dataObject, dataUpdater2);
}

export type UpdaterFnParam<T> =
  | (T extends Function ? never : T)
  | ((prev: T) => T);
export type UpdaterFn<T> = (arg: UpdaterFnParam<T>) => void;
