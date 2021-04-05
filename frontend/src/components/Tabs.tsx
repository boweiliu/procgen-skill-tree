import React from 'react';
import './Tabs.css';

export default function Tabs({ value, labels, onChange }: any) {
  return (
    <div className={'tab-label-container'}>
      {labels.map((label: any, i: any) => (
        <Tab onClick={onChange} value={i} active={value === i} key={i}>
          {label}
        </Tab>
      ))}
    </div>
  );
}

function Tab({ onClick, value, active, children }: any) {
  const handleClick = () => {
    onClick(value);
  };
  return (
    <div className={active ? 'tab-label active' : 'tab-label inactive'}>
      <div onClick={handleClick}>{children}</div>
    </div>
  );
}
