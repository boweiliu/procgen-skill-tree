import React from "react";

export function Area(props: { data: string }) {
  let { data } = props;
  return (
    <div>
      <span> got data: {data.toString()} </span>
      <canvas />
    </div>
  );
}
