import React from 'react';

import './Sidebar.css';

export default function Sidebar({ children, hidden }: any) {
  return (
    <div className="layout" hidden={hidden}>
      ❎ Close
      <br />
      <br />
      <>{children}</>
    </div>
  );
}
