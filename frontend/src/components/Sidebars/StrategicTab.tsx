import React, { useCallback, useState } from 'react';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { GameState } from '../../data/GameState';
import { Attribute } from '../../game/worldGen/nodeContents/NodeContentsFactory';
import { AttributeSymbolMap } from '../../game/worldGen/nodeContents/NodeContentsRendering';

export const StrategicTab = React.memo(StrategicTabComponent);

// TODO(bowei): prune down state
function StrategicTabComponent(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
}) {
  const { gameState, updaters } = props;

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [highlightInputValue, setHighlightInputValue] = useState('');

  const onFocus = useCallback(() => {
    updaters.playerUI.isTextBoxFocused.enqueueUpdate(true);
  }, [updaters]);
  const onBlur = useCallback(() => {
    updaters.playerUI.isTextBoxFocused.enqueueUpdate(false);
  }, [updaters]);

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
          <button
            onKeyDown={(e) => {
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              // needed to preserve textbox focus: https://stackoverflow.com/questions/12154954/how-to-make-element-not-lose-focus-when-button-is-pressed
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
            }}
            onClick={(e) => {
              e.preventDefault();
              setHighlightInputValue((prev) => prev + '[RED]');
            }}
          >
            {AttributeSymbolMap[Attribute.RED0]}
          </button>
          <button>{AttributeSymbolMap[Attribute.RED1]}</button>
          <button>{AttributeSymbolMap[Attribute.RED2]}</button>
          <button>{AttributeSymbolMap[Attribute.DEL0]}</button>
          <button>{AttributeSymbolMap[Attribute.DEL1]}</button>
          <button>{AttributeSymbolMap[Attribute.DEL2]}</button>
        </div>
        <br></br>
        <div>
          Highlight:{' '}
          <input
            type={'text'}
            onFocus={onFocus}
            onChange={(e) => {
              setHighlightInputValue(e.target.value);
            }}
            onBlur={onBlur}
            value={highlightInputValue}
          ></input>
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
