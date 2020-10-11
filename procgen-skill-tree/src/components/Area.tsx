import React from "react";
import "./Area.css";

export function Area(props: { data: string }) {
  let { data } = props;
  return (
    <div>
      <span> got data: {data.toString()} </span>
      <canvas
        width={window.innerWidth * .875}
        height={window.innerHeight  * .875}
        onClick={(e) => {
          alert(e.clientX);
        }}
      />
    </div>
  );
}
