import React from "react";
import "./Tabs.css";

export default function Tabs({ value, labels, onChange }) {
  return (
    <div className={"tab-label-container"}>
      {labels.map((label, i) => (
        <Tab onClick={onChange} value={i} active={value === i} key={i}>
          {label}
        </Tab>
      ))}
    </div>
  );
}

function Tab({ onClick, value, active, children }) {
  const handleClick = () => {
    onClick(value);
  };
  return (
    <div className={active ? "tab-label active" : "tab-label inactive"}>
      <div onClick={handleClick}>{children}</div>
    </div>
  );
}
