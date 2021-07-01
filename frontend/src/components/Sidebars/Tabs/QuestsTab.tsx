import React from 'react';
import { GameState } from '../../../data/GameState';

export const QuestsTab = React.memo(QuestsTabComponent);

function QuestsTabComponent(props: { gameState: GameState }) {
  return (
    <>
      <div>Quests info</div>
      <br></br>
      <div className="tab-content-body">
        <div>Ultimate goal:</div>
        <ol>
          <li>
            <div>1000 of any attribute:</div>
            <br></br>
            <div>
              Progress: <meter value={200} min={0} max={1000}></meter> 200{' '}
              {'🔴'} / 1000
            </div>
            <br></br>
          </li>
          <li>
            <div>400 of any other attribute:</div>
            <br></br>
            <div>
              Progress: <meter value={100} min={0} max={400}></meter> 100 / 400
            </div>
            <br></br>
          </li>
        </ol>
        <div>Other goals: WIP</div>
      </div>
    </>
  );
}
