import React from "react";
export default function TabContent({ showContent, children }) {
  return <div hidden={!showContent}>{children}</div>;
}
