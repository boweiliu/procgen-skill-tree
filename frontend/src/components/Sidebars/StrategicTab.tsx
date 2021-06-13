import React, { useCallback, useEffect, useState } from 'react';
import { GameState } from '../../data/GameState';
import { Attribute } from '../../game/worldGen/nodeContents/NodeContentsFactory';
import { AttributeSymbolMap } from '../../game/worldGen/nodeContents/NodeContentsRendering';

export const StrategicTab = React.memo(StrategicTabComponent);

function StrategicTabComponent(props: { gameState: GameState }) {
  const { gameState } = props;

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

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
      <div>{showAdvancedSearch ? 'Custom' : 'Basic'} search</div>
      <br></br>
      <div className="tab-content-body">
        <br></br>
        <div>
          Symbols: {/* TODO(bowei): need tooltip text here */}
          <button>{AttributeSymbolMap[Attribute.RED0]}</button>
          <button>{AttributeSymbolMap[Attribute.RED1]}</button>
          <button>{AttributeSymbolMap[Attribute.RED2]}</button>
          <button>{AttributeSymbolMap[Attribute.DEL0]}</button>
          <button>{AttributeSymbolMap[Attribute.DEL1]}</button>
          <button>{AttributeSymbolMap[Attribute.DEL2]}</button>
        </div>
        <br></br>
        <div>
          Highlight: <input type={'text'}></input>
          <button>✔️</button>
          <button>🚫</button>
        </div>
        {showAdvancedSearch ? (
          <>
            <div>
              Highlight 2: <input type={'text'}></input>
              <button>Apply</button>
              <button>Cancel</button>
            </div>
            <br></br>
            <div>Filter:</div>
            <br></br>
            <div>
              Show if: <input type={'text'}></input>
              <button>Apply</button>
              <button>Cancel</button>
            </div>
            <br></br>
            <div>Color:</div>
            <br></br>
            <div>
              Grayscale by: <input type={'text'}></input>
              <button>Apply</button>
              <button>Cancel</button>
            </div>
            <div>
              Color by: <input type={'text'}></input>
              <button>Apply</button>
              <button>Cancel</button>
            </div>
            <br></br>
            <div>Shape:</div>
            <br></br>
            <div>
              Shape = | if: <input type={'text'}></input>
              <button>Apply</button>
              <button>Cancel</button>
            </div>
            <br></br>
            <br></br>
            <div>
              <input type={'text'}></input>
              <button>Save config</button>
            </div>
            <div>
              <input type={'text'}></input>
              <button>Load config</button>
            </div>
            <div>
              <button>Reset to defaults</button>
            </div>
            <br></br>
            <div>
              <button
                onClick={() => {
                  setShowAdvancedSearch(false);
                }}
              >
                Use basic search
              </button>
            </div>
          </>
        ) : (
          <>
            <br></br>
            <div>
              <button
                onClick={() => {
                  setShowAdvancedSearch(true);
                }}
              >
                Use custom search
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
