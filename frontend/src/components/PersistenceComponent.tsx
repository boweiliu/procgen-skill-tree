import React, { useCallback, useEffect } from 'react';
import { GameState } from '../data/GameState';
import { PlayerUIState } from '../data/PlayerUIState';

export function PersistenceComponent(props: { gameState: GameState }) {
  const { gameState } = props;

  // save the game
  const onUnload = useCallback(() => {
    window.alert('onUnload');
    PlayerUIState.store(gameState.playerUI);
    // return 'onunload'; // adds a console prompt
  }, [gameState.playerUI]);

  useEffect(() => {
    window.onbeforeunload = onUnload;
    return () => {
      window.onbeforeunload = null;
    };
  });

  return <> </>;
}
