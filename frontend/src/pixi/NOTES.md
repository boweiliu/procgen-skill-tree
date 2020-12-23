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

proposal:
* constructor(args, props) // args - things that the component doesn't have to listen for changes. both are passed down from parent
* this.queuedEvents // used for onEvent listeners, to delay action until the next tick
* this.state // local state only accessible to this entity and its children.
* update(delta, props, updaters) { // edits this.state and sends parent state updates upwards. typically looks like:
    this.children.map((it) => it.update(...));
    this.children.map((it) => it.render(...));
    updateSelf();
  }
* render(delta, props) // pure, only accesses this.state. delta == ticksSinceLastRender is so common that we explicitly have a param for it.
* shouldUpdate(props) // optional, default implementation is true, also allows returning a priority/timestamp
* shouldRender(props) // optional, default implementation is true, contains logic for skipping the render
* this.children // some data about my children and how to compute child props, updaters from my state, props, updaters

* TODO: think about coroutines and destroying/deactivating: (https://github.com/johnfn/ld-starter-code/blob/master/src/library/entity.ts, https://github.com/johnfn/ld-starter-code/blob/master/src/library/base_game.ts)

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

