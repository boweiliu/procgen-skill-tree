import "./StatsOverview.css";

import classnames from "classnames";
import React, { useState } from "react";
import { GameState, Quest, ResourceModifier, ResourceNontrivialType, ResourceType, ResourceTypeAndModifier } from "../data/GameState";
import { HashMap } from "../lib/util/data_structures/hash";

type Props = {
  playerResourceAmounts?: { [k in ResourceType]: number };
  playerResourceNodesAggregated?: HashMap<ResourceTypeAndModifier, number>;
};

// export default React.memo(StatsOverviewComponent); // fails with hashmap
export default StatsOverviewComponent;

function StatsOverviewComponent({
  playerResourceAmounts,
  playerResourceNodesAggregated,
}: Props) {
  // TODO: allow selecting this
  const resourceType: ResourceNontrivialType = ResourceNontrivialType.Mana0;

  console.log({ playerResourceNodesAggregated });

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
            Flat
                </td>
          <td>
            {playerResourceNodesAggregated?.get(
              new ResourceTypeAndModifier({ type: resourceType, modifier: ResourceModifier.Flat })
            ) || 0} {resourceType}
          </td>
        </tr>
        <tr>
          <td>
            Percent increased
                </td>
          <td>
            {playerResourceNodesAggregated?.get(
              new ResourceTypeAndModifier({ type: resourceType, modifier: ResourceModifier.Increased0 })
            ) || 0}{'%'}
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