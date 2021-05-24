import React from 'react';

import './Sidebar.css';

export default function Sidebar(props: {
  children: React.ReactNode;
  hidden: boolean;
  setSidebarHidden: () => void;
  placement: 'left' | 'right';
}) {
  const { children, hidden, setSidebarHidden, placement } = props;

  return (
    <div
      className={
        placement === 'left' ? 'layout left-sidebar' : 'layout right-sidebar'
      }
      hidden={hidden}
    >
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
