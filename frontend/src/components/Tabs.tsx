import React from 'react';
import './Tabs.css';

export default function Tabs(props: {
  value: number;
  labels: React.ReactNode[];
  onChange: (t: number) => void;
}) {
  const { value, labels, onChange } = props;
  return (
    <div className={'tab-label-container'}>
      <div className={'tab-label-container-padding'}></div>
      {labels.map((label: React.ReactNode, i: number) => (
        <Tab onClick={onChange} value={i} active={value === i} key={i}>
          {label}
        </Tab>
      ))}
      <div className={'tab-label-container-padding'}></div>
    </div>
  );
}

export function Tab<T>(props: {
  onClick: (t: T) => void;
  value: T;
  active: boolean;
  children: React.ReactNode;
}) {
  const { onClick, value, active, children } = props;
  const handleClick = () => {
    onClick(value);
  };
  return (
    <div className={active ? 'tab-label active' : 'tab-label inactive'}>
      <div onClick={handleClick}>{children}</div>
    </div>
  );
}
