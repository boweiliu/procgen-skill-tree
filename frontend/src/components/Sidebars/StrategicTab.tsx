import React, { useCallback, useState } from 'react';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { GameState } from '../../data/GameState';
import {
  Attribute,
  Modifier,
} from '../../game/worldGen/nodeContents/NodeContentsFactory';
import {
  AttributeDescriptionMap,
  AttributeSymbolMap,
  ModifierDescriptionMap,
  ModifierSymbolMap,
} from '../../game/worldGen/nodeContents/NodeContentsRendering';

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

  const onFireSearch = useCallback(() => {
    updaters.playerUI.strategicSearch.highlight1.enqueueUpdate(() => {
      return {
        value: highlightInputValue,
      };
    });
  }, [updaters, highlightInputValue]);

  // const onCancelSearch = useCallback(() => {
  //   setHighlightInputValue(gameState.playerUI.strategicSearch.highlight1.value);
  // }, [gameState.playerUI.strategicSearch.highlight1.value]);
  const onCancelSearch = useCallback(() => {
    setHighlightInputValue('');
    updaters.playerUI.strategicSearch.highlight1.enqueueUpdate(() => {
      return {
        value: '',
      };
    });
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
          <SymbolButton
            updateTextInputValue={setHighlightInputValue}
            attribute={Attribute.RED0}
          />
          <SymbolButton
            updateTextInputValue={setHighlightInputValue}
            attribute={Attribute.RED1}
          />
          <SymbolButton
            updateTextInputValue={setHighlightInputValue}
            attribute={Attribute.RED2}
          />
          <SymbolButton
            updateTextInputValue={setHighlightInputValue}
            attribute={Attribute.DEL0}
          />
          <SymbolButton
            updateTextInputValue={setHighlightInputValue}
            attribute={Attribute.DEL1}
          />
          <SymbolButton
            updateTextInputValue={setHighlightInputValue}
            attribute={Attribute.DEL2}
          />
          <TextInputButton
            updateTextInputValue={setHighlightInputValue}
            icon={'*'}
            insertedText={'[*] '}
          />
          <br></br>
          <TextInputButton
            updateTextInputValue={setHighlightInputValue}
            id={Modifier.FLAT}
            icon={ModifierSymbolMap[Modifier.FLAT]}
            insertedText={'[' + ModifierDescriptionMap[Modifier.FLAT] + '] '}
          />
          <TextInputButton
            updateTextInputValue={setHighlightInputValue}
            id={Modifier.INCREASED}
            icon={ModifierSymbolMap[Modifier.INCREASED]}
            insertedText={
              '[' + ModifierDescriptionMap[Modifier.INCREASED] + '] '
            }
          />
        </div>
        <br></br>
        <div>
          Highlight:{' '}
          <input
            type={'text'}
            onFocus={onFocus}
            onChange={(e) => {
              // need to set value manually: https://stackoverflow.com/questions/41736213/why-cant-i-change-my-input-value-in-react-even-with-the-onchange-listener
              setHighlightInputValue(e.target.value);
            }}
            onBlur={onBlur}
            value={highlightInputValue}
          ></input>
          <button onClick={onFireSearch}>🔎</button>
          <button onClick={onCancelSearch}>🚫</button>
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

function SymbolButton(props: {
  updateTextInputValue: (fn: (s: string) => string) => void;
  attribute: Attribute;
}) {
  return (
    <TextInputButton
      updateTextInputValue={props.updateTextInputValue}
      insertedText={'[' + AttributeDescriptionMap[props.attribute] + '] '}
      icon={AttributeSymbolMap[props.attribute]}
    />
  );
}

function TextInputButton(props: {
  updateTextInputValue: (fn: (s: string) => string) => void;
  icon: string;
  id?: any;
  insertedText: string;
}) {
  return (
    <button
      onMouseDown={(e) => {
        // needed to preserve textbox focus: https://stackoverflow.com/questions/12154954/how-to-make-element-not-lose-focus-when-button-is-pressed
        // keydown does NOT work here!
        e.preventDefault();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
      }}
      onClick={(e) => {
        e.preventDefault();
        props.updateTextInputValue((prev) => prev + props.insertedText);
      }}
    >
      {props.icon}
    </button>
  );
}
