import * as Pixi from "pixi.js";
import { batchifySetState } from "../../lib/util/batchify";
import { UpdaterFn, updaterGenerator2 } from "../../lib/util/updaterGenerator";

type Props = {};

type State = {};

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
    parentState: ParentStateType
  ) => ChildPropsType;
};

/**
 * LifecycleHandlerConstructor <- this should take the usual props, and will return new proxy, new base component(props), the handler object which has the construct() property and that function in it
 */
// class and interface merging??? https://stackoverflow.com/questions/44153378/typescript-abstract-optional-method
export abstract class LifecycleHandlerBase<P extends Props, S extends State> {
  // public, only to interface with non lifecycleHandler classes that we have yet to refactor
  public abstract container: Pixi.Container;
  protected abstract state: S;
  private _staleProps: P;
  private _children: ChildInstructions<any, any, P, S>[];

  constructor(props: P) {
    this._staleProps = props;
    this._children = []; // child implementation should register child class and props factory in constructor?
  }
  _didConstruct(props: P) {
    this._children.forEach((child) => {
      child.instance = new child.childClass(
        child.propsFactory(props, this.state)
      );
      this.container.addChild(child.instance.container);
    });
    this.renderSelf(props);
    this.didMount();
  }

  useState(initialState: S) {
    const setState: UpdaterFn<S> = ((valueOrCallback) => {
      if (typeof valueOrCallback === "function") {
        this.state = (valueOrCallback as ((s: S) => S))(this.state);
      } else {
        this.state = valueOrCallback;
      }
    })
    const [batchedSetState, fireBatch] = batchifySetState(setState);
    const stateUpdaters = updaterGenerator2<S>(initialState, batchedSetState);

    return {
      state: initialState,
      setState,
      fireStateUpdaters: fireBatch,
      stateUpdaters
    };
  }
  // NOTE(bowei): this is public because the root of component hierarchy needs to be bootstrapped from pixi react bridge
  public _update(nextProps: P) {
    const staleState = { ...this.state };
    this.fireStateUpdaters();
    this.updateSelf(nextProps);
    if (!this.shouldUpdate(this._staleProps, staleState, nextProps, this.state))
      return;
    this.updateChildren(nextProps); // implementation should call children._update in here
    this.renderSelf(nextProps);
    this._setStaleProps(nextProps);
    new Promise((resolve) => resolve(this.didUpdate()));
  }

  protected abstract fireStateUpdaters(): void 
  protected abstract didMount(): void 
  protected abstract updateSelf(nextProps: P): void 
  protected abstract shouldUpdate(staleProps: P, staleState: S, nextProps: P, state: S): boolean 
  protected updateChildren(nextProps: P) {
    this._children.forEach(({ instance, propsFactory }) => {
      instance._update(propsFactory(nextProps, this.state));
    });
  }
  protected abstract renderSelf(nextProps: P): void 
  protected abstract didUpdate(): void 
  protected abstract willUnmount(): void 

  _setStaleProps(nextProps: P) {
    this._staleProps = nextProps;
  }
}

export type LifecycleHandlerType<P, S> = LifecycleHandlerBase<P, S>;
export const LifecycleHandler = new Proxy(LifecycleHandlerBase, {
  construct: (target, args) => {
    const instance = new (target as any)(args[0]);
    instance._didConstruct(args[0]);
    return instance;
  },
});

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
  updaters: "stuff";
  args: "other stuff";
};
type ReferenceState = {
  lalalala: "hahahah";
};

export class Reference extends LifecycleHandler<ReferenceProps, ReferenceState> {
  public container: Pixi.Container
  public state: ReferenceState
  constructor(props: ReferenceProps) {
    super(props);
    this.container = new Pixi.Container();
    this.state = {
      lalalala: "hahahah",
    };
  }

  updateSelf(nextProps: ReferenceProps) { }
  renderSelf(nextProps: ReferenceProps) { }
  didMount() { } 
  didUpdate() { }
  shouldUpdate(): boolean { return true; }
  fireStateUpdaters() { }
  willUnmount() { }
}
