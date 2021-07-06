import React, { useCallback, useEffect } from 'react';
import { GameState } from '../data/GameState';
import { PlayerUIState } from '../data/PlayerUIState';
import { WorldGenStateFactory } from '../game/worldGen/WorldGenStateFactory';
import { newPlayerIntentState } from '../data/PlayerIntentState';
import { newDebugState } from '../data/DebugState';
import { newWindowState } from '../data/WindowState';
import { PlayerSaveState } from '../data/PlayerSaveState';
import { loadComputed, DEFAULT_SEED } from '../game/GameStateFactory';

export function PersistenceComponent(props: { gameState: GameState }) {
  const { gameState } = props;

  // save the game
  const onUnload = useCallback(() => {
    if (gameState.justDisabledSave) {
      console.log('skipping save because it was just disabled!');
    } else {
      PlayerUIState.store(gameState.playerUI);
      PlayerSaveState.store(gameState.playerSave);
      new WorldGenStateFactory({}).store(gameState.worldGen);
    }
    // return 'onunload'; // adds a console prompt
  }, [
    gameState.playerUI,
    gameState.justDisabledSave,
    gameState.worldGen,
    gameState.playerSave,
  ]);

  useEffect(() => {
    if (gameState.intent.newIntent.HARD_REFRESH_PAGE) {
      PlayerUIState.clear();
      new WorldGenStateFactory({}).clear();
      PlayerSaveState.clear();

      // TODO(bowei): actually force hard reload here???
      window.location.reload();
    }
  }, [gameState.intent.newIntent.HARD_REFRESH_PAGE]);

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

/**
 * Tries to read out game state info from localstorage. if not present, creates a new state
 */
export function loadOrCreate(
  seed: number | undefined | null = undefined
): GameState {
  const mySeed = seed || DEFAULT_SEED;

  const worldGenStateFactory = new WorldGenStateFactory({});
  const gameState: GameState = {
    tick: 0,
    worldGen: worldGenStateFactory.tryLoad({ seed: mySeed }),
    playerSave: PlayerSaveState.tryLoad(),
    playerUI: PlayerUIState.tryLoad(),
    computed: {
      fogOfWarStatusMap: null,
      reachableStatusMap: null,
      accessibleStatusMap: null,
    },
    intent: newPlayerIntentState(),
    windowState: newWindowState(),
    debug: newDebugState(),
    justDisabledSave: false,
  };

  loadComputed(gameState);

  return gameState;
}
