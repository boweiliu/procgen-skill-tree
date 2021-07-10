import React, { useState } from 'react';
import { GameState } from '../data/GameState';
import './HudTopComponent.css';

export function HudTopComponent(props: { gameState: GameState }) {
  const [isLocked, setLocked] = useState(true);

  return (
    <div className="hud-top-zone">
      <div className="hud-text-box">
        AP: 10/10
        <div className="hover-only empty-positioned">
          <div className="absolute-positioned hud-text-box-tooltip">
            <div>Allocation points</div>
            <div>(remaining/total).</div>
          </div>
        </div>
      </div>
      <div className="hud-text-box">
        DP: 10/10
        <div className="hover-only empty-positioned">
          <div className="absolute-positioned hud-text-box-tooltip">
            <div>Deallocation points</div>
            <div>(remaining/total).</div>
          </div>
        </div>
      </div>
      <div className="hud-text-box">
        Era: 0-Explore
        <div className="hover-only empty-positioned">
          <div className="absolute-positioned hud-text-box-tooltip">
            <div>Era (number-type).</div>
            <br />
            <div>Explore the grid</div>
            <div>and plan out</div>
            <div>the next phase.</div>
            <div>Exploit the</div>
            <div>resources and</div>
            <div>complete quests.</div>
            <div>Choose how to</div>
            <div>expand the hidden</div>
            <div>area to explore.</div>
          </div>
        </div>
      </div>
      <button
        className="hud-top-button button-1"
        disabled={isLocked}
        onClick={(e: React.MouseEvent) => {
          setLocked(true);
          // TODO(bowei): other stuff
        }}
      >
        Next era
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
