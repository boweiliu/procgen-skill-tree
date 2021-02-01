import "./StatsOverview.css";

import classnames from "classnames";
import React, { useState } from "react";
import { GameState, Quest, ResourceNontrivialType, ResourceType } from "../data/GameState";

type Props = {
  playerResourceAmounts?: { [k in ResourceType]: number };
};

export default React.memo(StatsOverviewComponent);

function StatsOverviewComponent({
  playerResourceAmounts,
}: Props) {
  const resourceType: ResourceNontrivialType = ResourceNontrivialType.Mana0;
  return (
    <>
      <h2> Stats overview: </h2>
      <table className={classnames({ table: true })}>
        <tr>
          <td>
            Current
                </td>
          <td>
            {playerResourceAmounts?.[resourceType]} {resourceType}
          </td>
        </tr>
        <tr>
          <td>
            SP spent
                </td>
          <td>
            {13 /* TODO */}
          </td>
        </tr>
      </table>
    </>
  );
}