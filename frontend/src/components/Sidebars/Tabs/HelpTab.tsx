import React from 'react';

export function HelpTab() {
  return (
    <>
      <div>How to play the game</div>
      <br></br>
      <div className="tab-content-body">
        <div>CONTROLS</div>
        <br></br>
        <CheckboxDiv>Use hotkey: t, y to open and close the tabs.</CheckboxDiv>
        <CheckboxDiv>Use hotkey: b to toggle strategic view.</CheckboxDiv>
        <CheckboxDiv>
          Move the tabs around using "send left/right" buttons.
        </CheckboxDiv>
        <CheckboxDiv>Open the Stats tab.</CheckboxDiv>
        <CheckboxDiv>Open the Quests tab.</CheckboxDiv>
        <br></br>
        <div>GAME</div>
        <br></br>
        <CheckboxDiv>Hover over some nodes.</CheckboxDiv>
        <CheckboxDiv>
          Left click on an available node to allocate it.
        </CheckboxDiv>
        <CheckboxDiv>
          Left click on any other node to view detailed info.
        </CheckboxDiv>
        <CheckboxDiv>
          Scroll around to see what other nodes are visible.
        </CheckboxDiv>
        <CheckboxDiv>
          Use keyboard controls (hotkeys: ijklmun) to move around the map, and
          (hotkeys: wasd) to pan around.
        </CheckboxDiv>
        <CheckboxDiv>Close the selected node tab.</CheckboxDiv>
        <br></br>
        <div>STRATEGIC VIEW</div>
        <br></br>
        <CheckboxDiv>
          Open the strategic view tab while strategic view is open.
        </CheckboxDiv>
        <CheckboxDiv>Toggle colors.</CheckboxDiv>
        <CheckboxDiv>
          Try adding an attribute to the search bar by clicking a symbol.
        </CheckboxDiv>
        <CheckboxDiv>Click search to highlight those attributes.</CheckboxDiv>
        <CheckboxDiv>Click cancel to reset the search.</CheckboxDiv>
      </div>
    </>
  );
}

function CheckboxDiv(props: { children: any }) {
  return (
    <div>
      <input type="checkbox" /> {props.children}
    </div>
  );
}
