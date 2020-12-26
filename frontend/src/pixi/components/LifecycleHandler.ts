import { PixiReactBaseComponent } from "./PixiReactBaseComponent";

type Props = {};

type State = {};

class LifecycleHandlerBase<P extends Props, S extends State> {
  state!: S;
  constructor(props: P) {
    this.staleProps = props;
  }
  _didConstruct(props: P) {
    this.renderSelf(props);
    this.didMount();
  }
  protected _update(nextProps: P) {
    const staleState = { ...this.state };
    this.fireStateUpdaters();
    this.updateSelf(nextProps);
    if (!this.shouldUpdate(this.staleProps, staleState, nextProps, this.state))
      return;
    this.updateChildren(nextProps); // implementation should call children._update in here
    this.renderSelf(nextProps);
    this._setStaleProps(nextProps);
    new Promise((resolve) => resolve(this.didUpdate()));
  }
  protected staleProps: P;
  fireStateUpdaters() {}
  didMount() {}
  updateSelf(nextProps: P) {}
  shouldUpdate(staleProps: P, staleState: S, nextProps: P, state: S): boolean {
    return true;
  }
  updateChildren(nextProps: P) {}
  renderSelf(nextProps: P) {}
  didUpdate() {}
  _setStaleProps(nextProps: P) {
    this.staleProps = nextProps;
  }
}

type LifecycleHandlerType<P, S> = LifecycleHandlerBase<P, S>;
export const LifecycleHandler = new Proxy(LifecycleHandlerBase, {
  construct: (target, args) => {
    const instance = new target(args[0]);
    instance._didConstruct(args[0]);
    return instance;
  },
});

/**
 * First render:
 * constructor
 * renderSelf
 * didMount
 *
 * Subsequent updates:
 *
 * fireStateUpdaters
 * updateSelf
 * shouldUpdate(props,state)?
 * updateChildren
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

  updateSelf(nextProps: ReferenceProps) {}
}
