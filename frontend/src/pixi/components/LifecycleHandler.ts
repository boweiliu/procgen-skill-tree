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

abstract class LifecycleHandlerBase<P extends Props, S extends State> {
  protected container!: PIXI.Container;
  protected state!: S;
  _staleProps: P;
  _children: ChildInstructions<any, any, P, S>[];

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

  fireStateUpdaters(): void { } 
  didMount(): void { }
  abstract updateSelf(nextProps: P): void
  shouldUpdate(staleProps: P, staleState: S, nextProps: P, state: S): boolean {
    return true;
  }
  updateChildren(nextProps: P) {
    this._children.forEach(({ instance, propsFactory }) => {
      instance._update(propsFactory(nextProps, this.state));
    });
  }
  abstract renderSelf(nextProps: P): void
  didUpdate(): void { }

  _setStaleProps(nextProps: P) {
    this._staleProps = nextProps;
  }
}

type LifecycleHandlerType<P, S> = LifecycleHandlerBase<P, S>;
export const LifecycleHandler = new Proxy(LifecycleHandlerBase, {
  construct: (target, args) => {
    const instance = new (target as any)(args[0]);
    instance._didConstruct(args[0]);
    return instance;
  },
});

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

class Reference extends LifecycleHandler<ReferenceProps, ReferenceState> {
  constructor(props: ReferenceProps) {
    super(props);
    this.state = {
      lalalala: "hahahah",
    };
  }

  updateSelf(nextProps: ReferenceProps) { }
  renderSelf(nextProps: ReferenceProps) { }
}
