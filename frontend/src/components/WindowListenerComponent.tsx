import React from 'react';
// import UAParser from 'ua-parser-js';
import { GameState } from '../data/GameState';
import { WindowState } from '../data/WindowState';
import { UpdaterGeneratorType2 } from '../lib/util/updaterGenerator';

type Props = {
  updaters: UpdaterGeneratorType2<WindowState, GameState>;
};

type State = {};

// TODO(bowei): on mobile, for either ios or android, when in portrait locked orientation, we want to serve a landscape
// experience - similar to a native app which is landscape locked.
// (on mobile in already landscape orientation, and in all desktop, serve ordinary orientation.)
// also note that android webapp supports manifest.json setting orientation, but not in the browser
// FOR NOW - ignore this
// https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation
// https://stackoverflow.com/questions/14360581/force-landscape-orientation-mode

// const browser = new UAParser().getBrowser();
// let forceRotate = false;
// if (
//   browser.name === 'Mobile Safari' &&
//   window.innerWidth < window.innerHeight
// ) {
//   forceRotate = true;
// }
//     <div className={classnames({ App: true, "force-landscape": forceRotate })}>
/*
.force-landscape {
  transform: rotate(90deg);
}
*/

/**
 * Empty react element with listeners for window changes.
 */
export class WindowListenerComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize);
    window.addEventListener('orientationchange', this.handleWindowResize);
  }

  // NOTE(bowei): does using e.repeat here break when window loses focus??
  private handleWindowResize = (e: UIEvent | Event) => {
    const newSize = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
    this.props.updaters.enqueueUpdate((prev) => {
      // console.log("executing window state update in window onresize in app");
      // const result = { ...prev };
      // result.innerWidth = window.innerWidth;
      // result.innerHeight = window.innerHeight;
      // return result;
      return {
        ...prev,
        ...newSize,
      };
    });
  };

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('orientationchange', this.handleWindowResize);
  }
  render() {
    return <> </>;
  }
}
