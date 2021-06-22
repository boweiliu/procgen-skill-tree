import { Const } from './misc';
import { UpdaterFn, UpdaterFn2, UpdaterFnParam2 } from './updaterGenerator';

/**
 *
 * @param fn an arbitrary callback which performs some operation with side effects.
 * @returns a tuple: [batchedFn, fireBatch].
 * batchedFn takes the same arguments as fn, but the side effects are delayed until fireBatch is called.
 * if batchedFn is called multiple times, those invocations are stored in order, and then popped off in order when fireBatch is called.
 */
export function batchify<A extends any[]>(
  fn: (...args: A) => void
): [(...args: A) => void, () => void] {
  let batch: A[] = [];

  return [
    (...args: A) => {
      batch.push(args);
      // console.log({ stack: new Error().stack, batchSize: batch.length });
      // console.log({ batchSize: batch.length });
    },
    () => {
      if (batch.length !== 0) {
        console.log({ fired: batch.length });
      }
      for (let a of batch) {
        fn(...a);
      }
      batch = [];
    },
  ];
}

/**
 * Same use case and types as [batchify], however, specifically we expect [fn] to be a setState function which takes value-or-callback
 * as its single argument, and instead of calling [fn] repeatedly for each callback in the batch, we apply the callbacks in the batch
 * sequentially to get a single state update which we then provide to [fn].
 */
export function batchifySetState<T>(
  fn: UpdaterFn<T> | UpdaterFn2<T, T>
): [UpdaterFn2<T, T>, () => void] {
  let batch: UpdaterFnParam2<T, T>[] = [];

  return [
    (arg: UpdaterFnParam2<T, T>) => {
      batch.push(arg);
      // console.log({ batchSize: batch.length });
    },
    () => {
      if (batch.length === 0) {
        return;
      }
      // console.log({ fired: batch.length });
      let thisBatch = [...batch];
      batch = [];
      (fn as any)((prev: any) => {
        let next = prev;
        for (let valueOrCallback of thisBatch) {
          if (typeof valueOrCallback === 'function') {
            next = (valueOrCallback as (t: Const<T>) => Const<T>)(next);
          } else {
            next = valueOrCallback;
          }
        }
        return next;
      });
    },
  ];
}
