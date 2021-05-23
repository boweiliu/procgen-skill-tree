import React from 'react';

import './Sidebar.css';

export default function Sidebar({ children, hidden, setSidebarHidden }: any) {
  return (
    <div className="layout" hidden={hidden}>
      <div
        className="close"
        onClick={() => {
          setSidebarHidden();
        }}
      >
        ❎ Close
      </div>
      <>{children}</>
    </div>
  );
}
