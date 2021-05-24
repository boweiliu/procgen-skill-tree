import React from 'react';

import './Sidebar.css';

export default function Sidebar(props: {
  children: React.ReactNode;
  hidden: boolean;
  placement: 'left' | 'right';
}) {
  const { children, hidden, placement } = props;

  return (
    <div
      className={
        placement === 'left' ? 'layout left-sidebar' : 'layout right-sidebar'
      }
      hidden={hidden}
    >
      <>{children}</>
    </div>
  );
}
