import React, { useCallback, useEffect, useState } from 'react';
import { GameState } from '../../data/GameState';

export const StrategicTab = React.memo(StrategicTabComponent);

function StrategicTabComponent(props: { gameState: GameState }) {
  const { gameState } = props;

  if (gameState.playerUI.isPixiHidden) {
    return (
      <>
        <div>Strategic view is not open!</div>
        <br></br>
        <div>Click [m] to toggle strategic view.</div>
      </>
    );
  }
  return (
    <>
      <div>Strategic view controls</div>
      <br></br>
      <div className="tab-content-body">
        <div>Filter by:</div>
      </div>
    </>
  );
}
