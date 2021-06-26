import React from 'react';

export function HelpTab() {
  return (
    <>
      <div>How to play the game</div>
      <br></br>
      <div className="tab-content-body">
        <div>CONTROLS</div>
        <br></br>
        <div>Use hotkey: t, y to open and close the tabs.</div>
        <div>Use hotkey: b to toggle strategic view.</div>
        <div>Move the tabs around using "send left/right" buttons.</div>
        <div>Open the Stats tab.</div>
        <div>Open the Quest tab.</div>
        <br></br>
        <div>GAME</div>
        <br></br>
        <div>Hover over some nodes.</div>
        <div>Left click on an available node to allocate it.</div>
        <div>Left click on any other node to view detailed info.</div>
        <div>Close the selected node tab.</div>
        <br></br>
        <div>STRATEGIC VIEW</div>
        <br></br>
        <div>Open the strategic view tab while strategic view is open.</div>
        <div>Toggle colors.</div>
        <div>
          Try adding an attribute to the search bar by clicking a symbol.
        </div>
        <div>Click search to highlight those attributes.</div>
        <div>Click cancel to reset the search.</div>
        <br></br>
      </div>
    </>
  );
}
