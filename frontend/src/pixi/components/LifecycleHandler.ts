import * as Pixi from 'pixi.js';
import { batchifySetState } from '../../lib/util/batchify';
import { Const } from '../../lib/util/misc';
import {
  UpdaterFn2,
  updaterGenerator2,
  UpdaterGeneratorType2,
} from '../../lib/util/updaterGenerator';

type Props = {
  args?: {
    markForceUpdate?: (self: LifecycleHandlerBase<any, any>) => void;
    [k: string]: any;
  };
  [k: string]: any;
};

type State = {};

/**
 * Bundle used for associating child components with this component.
 * Contains the childClass class reference,
 * the constructed instance itself (if already constructed),
 * and a pure function for computing child props from parent props & parent state.
 */
type ChildInstructions<
  ChildInstanceType,
  ChildPropsType extends Props,
  ParentPropsType extends Props,
  ParentStateType extends State
> = {
  childClass: new (props: ChildPropsType) => ChildInstanceType;
  instance?: ChildInstanceType;
  propsFactory: (
    parentProps: ParentPropsType,
    parentState: Const<ParentStateType>
  ) => ChildPropsType;
};

class ChildrenArray<P extends Props, S extends State> {
  private _values: ChildInstructions<
    LifecycleHandlerBase<any, any, any>,
    any,
    P,
    S
  >[] = [];

  public add<CIT extends LifecycleHandlerBase<any, any, any>, CPT>(
    c: ChildInstructions<CIT, CPT, P, S>
  ) {
    // if (
    //   this._values.indexOf(c) === -1 ||
    //   (c.instance && this.contains(c.instance))
    // ) {
    //   // do nohting - its already in here
    // }
    this._values.push(c);
  }

  public remove<CIT extends LifecycleHandlerBase<any, any, any>>(
    c: CIT
  ): ChildInstructions<CIT, any, P, S> | undefined {
    const removed = this._values.splice(
      this._values.findIndex((it) => it.instance === c),
      1
    );
    if (removed.length === 0) {
      return undefined;
    } else {
      return removed[0] as ChildInstructions<CIT, any, P, S>;
    }
  }

  public contains<CIT extends LifecycleHandlerBase<any, any, any>>(
    c: CIT
  ): boolean {
    return this._values.findIndex((it) => it.instance === c) > -1;
  }

  public get<CIT extends LifecycleHandlerBase<CPT, any>, CPT>(
    c: CIT
  ): ChildInstructions<CIT, CPT, P, S> | undefined {
    return this._values.find((it) => it.instance === c) as
      | ChildInstructions<CIT, CPT, P, S>
      | undefined;
  }

  public clone(): ChildrenArray<P, S> {
    let cloned = new ChildrenArray<P, S>();
    cloned._values = [...this._values];
    return cloned;
  }

  public forEach(
    callbackfn: (
      value: ChildInstructions<LifecycleHandlerBase<any, any>, any, P, S>,
      index: number,
      array: ChildInstructions<LifecycleHandlerBase<any, any>, any, P, S>[]
    ) => void
  ) {
    this._values.forEach(callbackfn);
  }
}

// export interface LifecycleHandlerBase<P extends Props, S extends State> {
// // useful for interface merging?? https://stackoverflow.com/questions/44153378/typescript-abstract-optional-method
// }

/**
 * LifecycleHandlerConstructor <- this should take the usual props, and will return new proxy, new base component(props), the handler object which has the construct() property and that function in it
 */
// export function LifecycleHandlerConstructor<T>(props:
// class and interface merging??? https://stackoverflow.com/questions/44153378/typescript-abstract-optional-method
export abstract class LifecycleHandlerBase<
  P extends Props,
  S extends State,
  U extends UpdaterGeneratorType2<S, S> = UpdaterGeneratorType2<S, S>
> {
  // public, only to interface with non lifecycleHandler classes that we have yet to refactor
  public abstract container: Pixi.Container;
  // public, only to allow useState function below to set this.state
  // abstract, to remind implementers to set it in the constructor
  // Immutable state! use updaters to update it, and then lifecycle will handle firing the batched updates.
  public abstract state: Const<S>;

  // updater functions generate from state. The only way to update state. Also useful to pass down selectively to children.
  protected stateUpdaters?: U;

  protected _staleProps: P; // NOTE(bowei): need it for args for now; maybe we can extract out args?
  private _children: ChildrenArray<P, S> = new ChildrenArray();

  /**
   * Holds references to children which we will soon be constructing and adding to pixi hierarchy
   */
  private _childrenToConstruct: ChildrenArray<P, S> = new ChildrenArray();
  /**
   * Holds references to the children which are marked for deletion but have not been deleted and deconstructed yet
   */
  private _childrenToDestruct: ChildrenArray<P, S> = new ChildrenArray();
  /**
   * Holds children which have requested that they be forcefully updated even if props have not changed
   */
  private _forceUpdates: ChildrenArray<P, S> = new ChildrenArray();

  constructor(props: P) {
    this._staleProps = props;
  }

  protected addChild<CIT extends LifecycleHandlerBase<CPT, any, any>, CPT>(
    c: ChildInstructions<CIT, CPT, P, S>
  ) {
    this._children.add(c); // make sure children are updated
    this._childrenToConstruct.add(c); // if not already constructed/added to pixi hierarchy, queue it up
  }

  protected registerChild<CIT extends LifecycleHandlerBase<CPT, any, any>, CPT>(
    c: ChildInstructions<CIT, CPT, P, S>
  ) {
    // only add children to updateable, not constructed
    // Note that this also skips adding them to pixi hierarchy
    this._children.add(c);
  }

  protected removeChild<CIT extends LifecycleHandlerBase<any, any, any>>(
    c: CIT
  ) {
    let childInfo = this._children.remove(c); // make sure children are no longer updated
    // NOTE(bowei): do we need to call willUnount on the children here??
    childInfo && this._childrenToDestruct.add(childInfo); // queue it for destruction next update tick
  }

  /**
   * Intended to be called as part of the constructor.
   * So that subclasses of lifecycleHandler don't have to manually add this line to the constructor each time,
   * we provide a handy [engageLifecycle] method on the class reference which automatically adds it using a [Proxy<>].
   */
  private _didConstruct(props: P) {
    // this._self = this;
    this._childrenToConstruct.forEach((child) => {
      if (!child.instance) {
        child.instance = new child.childClass(
          child.propsFactory(props, this.state)
        );
      }
      // NOTE(bowei): we are assuming the derived class did NOT manually add child to pixi hierarchy, even if
      // they constructed the instance themselves (in order to e.g. hold a reference); we do that here
      this.container.addChild(child.instance.container);
    });
    this._childrenToConstruct = new ChildrenArray(); // clear the list so that we don't re-add them in the update loop
    this.renderSelf(props);
    this.didMount?.();
  }

  /**
   * callback that can be passed to child -
   * if child is not a pure component, it might need to inform us of "forced" updates for otherwise we wouldnt call any child code at all
   * (e.g. if child needs to update its own animation or hover states)
   */
  protected markForceUpdate = (childInstance: any) => {
    this._staleProps.args?.markForceUpdate?.(this); // mark us for update in OUR parent

    const childInfo = this._children.get(childInstance);
    if (childInfo) {
      this._forceUpdates.add(childInfo);
    } else {
      throw new Error(`Error, child ${childInstance} not found in ${this}`);
    }
  };

  // cannot be attached to an instance due to typescript/eslint
  // if satic, cannot be called "useState" or else react linter complains
  // Sets this.fireStateUpdaters, this.stateUpdaters if not already set.
  protected useState<S, T extends { state: Const<S> }>(
    self: T,
    initialState: S
  ) {
    const setState: UpdaterFn2<S, S> = (valueOrCallback) => {
      if (typeof valueOrCallback === 'function') {
        // self.state = (valueOrCallback as (s: S) => S as any as (s: Const<S>) => Const<S>)(self.state);
        self.state = (valueOrCallback as (s: Const<S>) => Const<S>)(self.state);
      } else {
        self.state = valueOrCallback as S as Const<S>;
      }
    };
    const [batchedSetState, fireBatch] = batchifySetState(setState);
    const stateUpdaters = updaterGenerator2<S>(initialState, batchedSetState);

    if (!this.fireStateUpdaters) {
      this.fireStateUpdaters = fireBatch;
    }
    if (!this.stateUpdaters) {
      this.stateUpdaters = stateUpdaters as any as U;
    }

    return {
      state: initialState as Const<S>,
      setState,
      fireStateUpdaters: fireBatch,
      stateUpdaters,
    };
  }

  // shim while we migrate
  public update(nextProps: P) {
    this._update(nextProps);
  }

  // NOTE(bowei): this is public because the root of component hierarchy needs to be bootstrapped from pixi react bridge
  public _update(nextProps: P) {
    // nextProps is guaranteed to be referentially a distinct object (might be shallow copy though)
    const staleState = { ...this.state };
    this.fireStateUpdaters?.(); // the ONLY place in this function where this.state is changed
    this.updateSelf?.(nextProps);
    if (
      this.shouldUpdate &&
      !this.shouldUpdate(this._staleProps, staleState, nextProps, this.state)
    ) {
      // we think we don't need to update; however, we still need to
      // update the chidlren that asked us to forcefully update them
      let forceUpdates = this._forceUpdates.clone();
      this._forceUpdates = new ChildrenArray<P, S>(); // clear the force updates of next tick
      forceUpdates.forEach((childInfo) => {
        let { instance, propsFactory } = childInfo;
        instance?._update(propsFactory(nextProps, this.state)); // why are we even calling props factory here?? theres no point... we should just tell the child to use their own stale props, like this:
        // instance._forceUpdate();
        // note that children can add themselves into forceupdate next tick as well, if they need to ensure they're continuously in there

        instance && this.didForceUpdateChild?.(instance);
      });
      // no need to do anything else -- stale props has not changed

      // this.didForceUpdate?.();
      return;
    } else {
      this.updateChildren?.(nextProps);
      this._updateChildren(nextProps); // implementation should call children._update in here
      this.renderSelf(nextProps);
      this._staleProps = nextProps;
      new Promise((resolve) => resolve(this.didUpdate?.()));
    }
  }

  /**
   * Not recommended to implement this.
   * Do any work to prepare for updating children components. Guaranteed to run before children are destroyed/updated/created.
   *
   * Will not run if shouldUpdate() === false.
   */
  protected updateChildren?(nextProps: P): void;

  // destroy, update, create in that order, so that there's no extra update right before destroy or after create
  private _updateChildren(nextProps: P) {
    this._childrenToDestruct.forEach((child) => {
      if (child.instance) {
        // should always be true
        child.instance.willUnmount?.();
        this.container.removeChild(child.instance.container);
      }
    });
    this._childrenToDestruct = new ChildrenArray();

    this._children.forEach(({ instance, propsFactory }) => {
      instance?._update(propsFactory(nextProps, this.state));
    });

    this._childrenToConstruct.forEach((child) => {
      // here we expect the child instances to be empty, but they could be already constructed, if the derived class needs to keep a reference to it
      if (!child.instance) {
        child.instance = new child.childClass(
          child.propsFactory(nextProps, this.state)
        );
      }
      this.container.addChild(child.instance.container);
    });
    this._childrenToConstruct = new ChildrenArray();
  }

  /**
   * If this component has state managed by updaters, and the updaters object has batched enqueueUpdate calls,
   * put the fireBatch method here so the lifecycle handler fires the state updaters at the correct time.
   */
  protected fireStateUpdaters?(): void;

  /**
   * Called after this class's constructor is finished calling and this component and all its children are finished rendering
   */
  protected didMount?(): void;

  /**
   * Called every tick, regardless of whether shouldUpdate is true or false.
   * Called before children are updated.
   * Called right after state updater batch is fired.
   * TODO(bowei): consider renaming this to "onTick" or something, and also making sure that it gets called in children even if they are memoized
   * @param nextProps
   */
  protected updateSelf?(nextProps: P): void;

  /**
   *
   * @param staleProps
   * @param staleState
   * @param nextProps
   * @param state
   * @returns false if staleProps == nextProps and staleState == state (which will cause the component to be memoized)
   *          true if the props or state differ significantly
   */
  protected shouldUpdate?(
    staleProps: P,
    staleState: Const<S>,
    nextProps: P,
    state: Const<S>
  ): boolean;

  /**
   * Called after children are updated,
   * Called only if shouldUpdate === true.
   */
  protected abstract renderSelf(nextProps: P): void;
  protected didUpdate?(): void;
  protected didForceUpdate?(): void;

  /**
   * Called before a component is removed
   */
  public willUnmount(): void {} // TODO(bowei): revert this to protected nullable; however it's needed for shim for now

  protected didForceUpdateChild?(child: LifecycleHandlerBase<any, any>): void;

  public toString(): string {
    return 'lifecyclehandler object';
  }
}

export type LifecycleHandlerType<P, S> = LifecycleHandlerBase<P, S>;
export const LifecycleHandler = new Proxy(LifecycleHandlerBase, {
  construct: (target, args, newTarget) => {
    const instance = Reflect.construct(target, args, newTarget);
    instance._didConstruct(...args);
    return instance;
  },
});

/**
 * Wrapper - this MUST be called on new lifecycle handler extensions in order to hook up the _didConstruct lifecycle automatically.
 * @param derived the class that extends LifecycleHandler
 * @returns the wrapped class which should be exported
 */
export function engageLifecycle<T extends object>(derived: T): T {
  return new Proxy<T>(derived, {
    construct: (target, args) => {
      const instance = new (target as any)(args[0]);
      instance._didConstruct(args[0]);
      return instance;
    },
  });
}

/**
 * First render:
 * constructor
 * renderChildren?
 * renderSelf
 * didMount
 *
 * Subsequent updates:
 *
 * fireStateUpdaters
 * updateSelf
 * shouldUpdate(props,state)?
 * updateChildren
 * children._update
 * renderSelf
 * didUpdate
 * staleProps = props
 *
 */

type ReferenceProps = {
  updaters: 'stuff';
  args: { s: 'other stuff' };
};
type ReferenceState = {
  lalalala: 'hahahah';
};

export class Reference extends LifecycleHandler<
  ReferenceProps,
  ReferenceState
> {
  public container: Pixi.Container;
  public state: ReferenceState;
  constructor(props: ReferenceProps) {
    super(props);
    this.container = new Pixi.Container();
    this.state = {
      lalalala: 'hahahah',
    };
  }

  updateSelf(nextProps: ReferenceProps) {}
  renderSelf(nextProps: ReferenceProps) {}
  didMount() {}
  didUpdate() {}
  shouldUpdate(): boolean {
    return true;
  }
  fireStateUpdaters() {}
  willUnmount() {}
}
