import React, { useCallback, useEffect, useState } from 'react';
import { GameState } from '../data/GameState';
import { ERA_SP_LIMITS } from '../game/actions/AllocateNode';
import { Const } from '../lib/util/misc';
import { UpdaterGeneratorType2 } from '../lib/util/updaterGenerator';
import './HudTopComponent.css';

function _extract(gameState: Const<GameState>) {
  return {
    playerSave: {
      allocationStatusMap: gameState.playerSave.allocationStatusMap,
      bookmarkedStatusMap: gameState.playerSave.bookmarkedStatusMap,
      currentEra: gameState.playerSave.currentEra,
    },
    intent: {
      newIntent: {
        MAYBE_PROGRESS_NEXT_ERA:
          gameState.intent.newIntent.MAYBE_PROGRESS_NEXT_ERA,
      },
    },
  };
}

export function HudTopComponent(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
}) {
  const { gameState, updaters } = props;
  const [isLocked, setLocked] = useState(true);

  // delay 10 secs after unlocking, then it should relock itself
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocked(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLocked]);

  const progressNextEra = useCallback(
    (e?: React.MouseEvent) => {
      setLocked(true);

      // TODO(bowei): other stuff
      updaters.playerSave.currentEra.enqueueUpdate((prev) => {
        if (prev.type === 'A') {
          return { ...prev, type: 'B' };
        } else {
          return {
            ...prev,
            type: 'A',
            index: prev.index + 1,
          };
        }
      });
    },
    [updaters]
  );

  useEffect(() => {
    if (gameState.intent.newIntent.MAYBE_PROGRESS_NEXT_ERA) {
      setLocked((isLocked) => {
        if (isLocked) return false;
        else progressNextEra();
        return true;
      });
      // if (isLocked) {
      //   setLocked(false);
      // } else {
      //   progressNextEra();
      // }
    }
  }, [gameState.intent.newIntent.MAYBE_PROGRESS_NEXT_ERA, progressNextEra]);

  const maxAllocationPoints =
    ERA_SP_LIMITS[gameState.playerSave.currentEra.index] -
    ERA_SP_LIMITS[gameState.playerSave.currentEra.index - 1];

  const remainingAllocationPoints =
    maxAllocationPoints -
    (gameState.playerSave.currentEra.type === 'A'
      ? gameState.playerSave.bookmarkedStatusMap.size() -
        gameState.playerSave.allocationStatusMap.size()
      : gameState.playerSave.allocationStatusMap.size() -
        ERA_SP_LIMITS[gameState.playerSave.currentEra.index - 1]);

  const eraTooltip =
    gameState.playerSave.currentEra.type === 'A' ? (
      <>
        <div>Explore the grid</div>
        <div>and plan out</div>
        <div>the next phase.</div>
      </>
    ) : gameState.playerSave.currentEra.type === 'B' ? (
      <>
        <div>Exploit the</div>
        <div>resources and</div>
        <div>complete quests.</div>
      </>
    ) : (
      <>
        <div>Choose how to</div>
        <div>expand the hidden</div>
        <div>area to explore.</div>
      </>
    );

  const eraName =
    gameState.playerSave.currentEra.type === 'A'
      ? 'Explore'
      : gameState.playerSave.currentEra.type === 'B'
      ? 'Exploit'
      : 'Expand';

  return (
    <div className="hud-top-zone">
      <div className="hud-text-box">
        AP: {remainingAllocationPoints}/{maxAllocationPoints}
        <div className="hover-only empty-positioned">
          <div className="absolute-positioned hud-text-box-tooltip">
            <div>Allocation points</div>
            <div>(remaining/total).</div>
          </div>
        </div>
      </div>
      <div className="hud-text-box">
        DP: {gameState.playerSave.currentEra.type === 'B' ? '10/10' : '--'}
        <div className="hover-only empty-positioned">
          <div className="absolute-positioned hud-text-box-tooltip">
            <div>Deallocation points</div>
            <div>(remaining/total).</div>
          </div>
        </div>
      </div>
      <div className="hud-text-box">
        Era: {gameState.playerSave.currentEra.index}-{eraName}
        <div className="hover-only empty-positioned">
          <div className="absolute-positioned hud-text-box-tooltip">
            <div>Era (number-type).</div>
            <br />
            {eraTooltip}
          </div>
        </div>
      </div>
      <button
        className="hud-top-button button-1"
        disabled={isLocked}
        onClick={progressNextEra}
      >
        Next era (hotkey: g)
      </button>
      <button
        className="hud-top-button button-2"
        onClick={() => {
          setLocked((it) => !it);
        }}
      >
        {isLocked ? '🔓' : '🔒'}
      </button>
    </div>
  );
}
