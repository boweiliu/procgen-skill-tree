life cycle - pixi components need to react to state changes, trigger state changes, and also try to put most of their logic in the game ticker loop.


example: keyboard component.


keypress states (up, down, justup etc) should be in the [state] of a parent component. those should be passed as props to keyboard component.
keyboard components needs to keep track of its own state, holding a queue of events. every game tick, it will need to process those events and 
send updates back up to the keypress state object, and also update its own state. keypress state updates should trigger rerenders on other
children of the parent component who have certain keypress states transmitted to them through props.

rendered point node - needs to have some logic in the constructor to handle static information, e.g. instantiating the pixi sprite of the correct
size and setting pixi flags and so forth. it may have some graphics animation that plays out, for which it will need to keep track of the animation
state in its [state] and update the animation correctly every tick. Apart from that, certain properties [props] may also influence how the
component is rendered, e.g. isSelected, isAllocated information passed from the parent. Finally, the rendered point node needs to listen
for onClick events and correctly trigger updates on the parent state. this should ideally also be batched up to do the processing every tick
rather than on every event.

parent component - this needs to maintain a list of children, and how to derive their props from its own props + state. initially, the parent
should instantiate its own pixi container and add the children as child containers. then, every game tick, it does its own state management,
then asks all children to perform their state & upwards-props updates, then recomputes props for its children and triggers (pure) renders on
itself and all changed children.

proposal: (note that args, updaters are strict subsets of props in terms of usage; they are a bit more idiomatic/clearer naming)
* constructor(args, props) // args - things that the component doesn't have to listen for changes. both are passed down from parent
* this.queuedEvents // used for onEvent listeners, to delay action until the next tick; perhaps this should interact with the global event queue?
* globalEventQueue.push(eventAction: (delta, prevProps, prevState, updaters) => void)
  and then in the root component, every tick:
  globalEventQueue.map((eventAction) => eventAction(
* this.state, this.setState // local state only accessible to this entity and its children.
* updateState(delta, props) { // component is given new props which should be stored; also edits this.state . typically looks like:
// OPEN QUESTION: props will be stale if updaters() gets called here?? queued events have race conditions?? what if update causes other components to need updates - is there a long dependency tree there?
    if (!this.shouldUpdate()) { return }  // this should be library code
    updateSelf(); // update self state based on props
    this.children.map((it) => it.update(...));
  }
* render(delta, props) // pure, only accesses this.state. delta == ticksSinceLastRender is so common that we explicitly have a param for it. this would also be a good place to create new children if necessary. sample implementation: {
    this.children.map((it) => it.render(...));
    renderSelf();
  }
* componentDidUpdate(props, updaters) { // sends state updates upwards

* shouldUpdate(props) // optional, default true if missing, also allows returning a priority/timestamp. library boilerplate here to shallow check props
* shouldRender(props) // optional, default implementation is true, contains logic for skipping the render
* this.children // some data about my children and how to compute child props, updaters from my state, props, updaters
* this.createChild(ChildComponentClass, args, function propsFactory(myProps, myState) { return childProps }, function updaterFactory(myUpdaters, myProps, myState) { return childUpdaters }) {
    // should essentially do new ChildComponentClass(args, propsFactory(this.props, this.state))
    // also needs to store the factories so the factories can be re-called with updated myprops and mystate when in the update loop
    // this.updateChild(child) { child.get().update(delta, propsFactory(this), updaterFactory(this) }

* TODO: think about coroutines and destroying/deactivating: (https://github.com/johnfn/ld-starter-code/blob/master/src/library/entity.ts, https://github.com/johnfn/ld-starter-code/blob/master/src/library/base_game.ts)
* TODO: beware of dependency loops; react can detect them but we cannot
* TODO: some sort of pub-sub to avoid everyone rerendering when not necessary? instead of asking everyone all the time.

* TL;DR the flow is:
* constructor, initialize state based on const args and initial props
* immediately after the constructor, first render again with initial props
* onX => enqueues event actions onto global event queue; event actions can modify state and parent state
* ticker tick goes off
* in root component, global event queue fires off callbacks, editing state everywhere
* shouldUpdateState fires recursively, conditioning: 
* updateState fires recursively, causing state updates to flow down as props to children // should prevState/prevProps be kept here and in the previous method??
* shouldRender fires recursively, conditioning:
* render fires recursively, redrawing everything based on props & state. if new children are constructed, they get constructed, rendered, and then the parent continues its own rendering.
* componentDidMount for newly created components. actions here are put onto global event queue and delayed until next tick.
* componentDidUpdate fires recursively, all actions here are put onto global event queue and delayed until next tick
* componentDidUnmount ??

for comparison: react has
* render() // reads the current value of this.props and this.state; pure
* constructor(props) // initialize state and bind event handlers 
* componentDidMount() // after 1st render; can optionally trigger immediate 2nd render by editing state
* componentDidUpdate(prevProps, prevState) // after 2nd and subsequent renders
* componentWillUnmount() // cleanup/destructor
* shouldComponentUpdate(nextProps, nextState) // If you are confident you want to write it by hand, you may compare this.props with nextProps and this.state with nextState and return false to tell React the update can be skipped. Note that returning false does not prevent child components from re-rendering when their state changes.
* PureComponent, React.memo - similar


and philosophy - https://reactjs.org/docs/design-principles.html

---
If something is offscreen, we can delay any logic related to it. If data is arriving faster than the frame rate, we can coalesce and batch updates. We can prioritize work coming from user interactions (such as an animation caused by a button click) over less important background work (such as rendering new content just loaded from the network) to avoid dropping frames.

To be clear, we are not taking advantage of this right now. However the freedom to do something like this is why we prefer to have control over scheduling, and why setState() is asynchronous. Conceptually, we think of it as “scheduling an update”.
---

