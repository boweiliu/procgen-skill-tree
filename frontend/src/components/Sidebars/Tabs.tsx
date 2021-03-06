import React, { useCallback } from 'react';
import './Tabs.css';

export const Tabs = React.memo(Component);

function Component(props: {
  value: number;
  labels: React.ReactNode[];
  onChange: (t: number) => void;
}) {
  const { value, labels, onChange } = props;
  return (
    <div className={'tab-label-container'}>
      {labels.map((label: React.ReactNode, i: number) => (
        <Tab onClick={onChange} value={i} active={value === i} key={i}>
          {label}
        </Tab>
      ))}
    </div>
  );
}

const Tab = React.memo(TabComponent);

function TabComponent(props: {
  onClick: (t: number) => void;
  value: number;
  active: boolean;
  children: React.ReactNode;
}) {
  const { onClick, value, active, children } = props;
  const handleClick = useCallback(() => {
    onClick(value);
  }, [onClick, value]);
  return (
    <div className={active ? 'tab-label active' : 'tab-label inactive'}>
      <div onClick={handleClick}>{children}</div>
    </div>
  );
}
