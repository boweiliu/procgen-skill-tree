import React from 'react';
export default function TabContent({ showContent, children }: any) {
  return <div hidden={!showContent}>{children}</div>;
}
