import React, { useCallback, useEffect } from 'react';
import { GameState } from '../data/GameState';
import { PlayerUIState } from '../data/PlayerUIState';

export function PersistenceComponent(props: { gameState: GameState }) {
  const { gameState } = props;

  // save the game
  const onUnload = useCallback(() => {
    if (gameState.justDisabledSave) {
      console.log('skipping save because it was just disabled!');
    } else {
      PlayerUIState.store(gameState.playerUI);
    }
    // return 'onunload'; // adds a console prompt
  }, [gameState.playerUI, gameState.justDisabledSave]);

  // NOTE(bowei): window.addEventListener does not work here i think: https://stackoverflow.com/questions/24081699/why-onbeforeunload-event-is-not-firing
  // https://gist.github.com/muzfr7/7e15582add46e74dee111002ec6cf594
  useEffect(() => {
    window.onbeforeunload = onUnload;
    return () => {
      window.onbeforeunload = null;
    };
  });

  return <> </>;
}
