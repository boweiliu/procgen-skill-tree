import './StatsOverview.css';

import classnames from 'classnames';
import React, { useState } from 'react';
import {
  GameState,
  PointNodeRef,
  Quest,
  ResourceModifier,
  ResourceNontrivialType,
  ResourceType,
} from '../data/GameState';
import { HashMap, HashSet } from '../lib/util/data_structures/hash';

type Props = {
  playerResourceAmounts?: { [k in ResourceType]: number };
  playerResourceNodesAggregated?: HashMap<ResourceTypeAndModifier, number>;
  allocatedPointNodeSet: HashSet<PointNodeRef>;
};

export class ResourceTypeAndModifier {
  public type: ResourceNontrivialType;
  public modifier: ResourceModifier;

  constructor(args: {
    type: ResourceNontrivialType;
    modifier: ResourceModifier;
  }) {
    this.type = args.type;
    this.modifier = args.modifier;
  }

  public hash(): string {
    return this.type.toString() + ',' + this.modifier.toString();
  }
}

// export default React.memo(StatsOverviewComponent); // fails with hashmap
export default StatsOverviewComponent;

function StatsOverviewComponent({
  playerResourceAmounts,
  playerResourceNodesAggregated,
  allocatedPointNodeSet,
}: Props) {
  // TODO: allow selecting this
  const resourceType: ResourceNontrivialType = ResourceNontrivialType.Mana0;

  return (
    <>
      <h2> Stats overview: </h2>
      <div>{resourceType}</div>
      <br></br>
      <table className={classnames({ table: true })}>
        <tr>
          <td>Flat</td>
          <td>
            +
            {playerResourceNodesAggregated?.get(
              new ResourceTypeAndModifier({
                type: resourceType,
                modifier: ResourceModifier.Flat,
              })
            ) || 0}
          </td>
        </tr>
        <tr>
          <td>% increased</td>
          <td>
            {playerResourceNodesAggregated?.get(
              new ResourceTypeAndModifier({
                type: resourceType,
                modifier: ResourceModifier.Increased0,
              })
            ) || 0}
            {'%'}
          </td>
        </tr>
        <tr>
          <td>Total</td>
          <td>{playerResourceAmounts?.[resourceType]}</td>
        </tr>
        <tr>
          <td>SP spent</td>
          <td>{allocatedPointNodeSet.size()}</td>
        </tr>
      </table>
    </>
  );
}
