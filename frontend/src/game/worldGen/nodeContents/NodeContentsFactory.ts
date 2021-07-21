import { HashMap } from '../../../lib/util/data_structures/hash';
import { Vector2 } from '../../../lib/util/geometry/vector2';
import { Vector3 } from '../../../lib/util/geometry/vector3';
import { NotImplementedError } from '../../../lib/util/misc';
import { squirrel3 } from '../../../lib/util/random';
import {
  randomSwitch,
  randomTriangle,
  randomUniform,
  randomValue,
} from '../../../lib/util/randomHelpers';
import { getCoordNeighbors } from '../../lib/HexGrid';
import { STARTER_AREA_RADIUS, taxicabDistance } from '../LockFactory';

type NodeContentsFactoryConfig = {};

export interface NodeContents {
  lines: NodeContentsLine[];

  condition?: NodeContentsCondition;
}

export interface NodeContentsCondition {
  type: 'SPEND';
  attribute: Attribute;
  amount: number;
}

export interface NodeContentsLine {
  amount: number;
  attribute: Attribute;
  modifier: Modifier;
}

export enum Attribute {
  RED0 = 'RED0',
  RED1 = 'RED1',
  RED2 = 'RED2',
  DEL0 = 'DEL0',
  DEL1 = 'DEL1',
  DEL2 = 'DEL2',
}

export enum Modifier {
  FLAT = 'FLAT',
  INCREASED = 'INCREASED',
}

const WEIGHTS = {
  // for any single node, what is in it
  ROOT: {
    default: {
      EMPTY: 150,
      NO_SPEND: 100,
      SPEND: 0,
    },
    starter: {
      EMPTY: 30,
      NO_SPEND: 100,
      SPEND: 0,
    },
  },
  // if we are doing a single attribute, what attribute is it going to be
  SINGLE_COLORS: {
    [Attribute.RED0]: 100,
    [Attribute.RED1]: 100,
    [Attribute.RED2]: 100,
    [Attribute.DEL0]: 10,
    [Attribute.DEL1]: 10,
    [Attribute.DEL2]: 10,
  },
  // what modifier is it going to be (depends on biome)
  MODIFIER_TYPE: {
    starter: {
      [Modifier.FLAT]: 400,
      [Modifier.INCREASED]: 100,
    },
    default: {
      [Modifier.FLAT]: 150,
      [Modifier.INCREASED]: 100,
    },
  },
  // how many different attributes are in the cluster - 1 or 2
  ATTRIBUTE_MIX_COUNT: {
    starter: {
      1: 200,
      2: 600,
    },
    default: {
      1: 200,
      2: 600,
    },
  },
};

/**
 * Data that describes a 1st degree cluster - a grouping of nodes
 */
type ClusterInfo = {
  radius: number;
  biome: 'starter' | 'default';
};

/**
 * Data that arises from actually generating the cluster - used to make sure nodes in a cluster have a common reference to be generated off of
 */
type ClusterContents = {
  lines: {
    amount: number;
    attribute: Attribute;
    modifier: Modifier;
    baseAmount: number; // 10x the increment - used as a yardstick
    // these 2 indicate how the cluster amount was generated.
    avgAmount: number;
    perturbation: number;
  }[];
};

export class NodeContentsFactory {
  public config: NodeContentsFactoryConfig;

  // TODO(bowei): cache stuff
  private clusterCenterData: HashMap<Vector3, any>;

  constructor(config: NodeContentsFactoryConfig) {
    this.config = config;
    this.clusterCenterData = new HashMap();
  }

  private createCluster(args: {
    seed: number;
    location: Vector3;
    clusterInfo: ClusterInfo;
  }): ClusterContents {
    const { seed, clusterInfo } = args;

    const result = randomSwitch<ClusterContents>({
      seed,
      weights: WEIGHTS.ROOT[clusterInfo.biome],
      behaviors: {
        EMPTY: () => {
          return { lines: [] };
        },
        NO_SPEND: (seed: number) => {
          // cases: starter vs default biome => single vs double; modifier flat vs increased

          // first decide modifier
          const modifier = randomValue<Modifier>({
            seed,
            weights: WEIGHTS.MODIFIER_TYPE[clusterInfo.biome],
          });

          // decide primary attribute
          const primaryAttribute = randomValue<Attribute>({
            seed,
            weights: WEIGHTS.SINGLE_COLORS,
          });

          // next decide single or double
          const attributeMixCount = randomValue<'1' | '2'>({
            seed: seed + 1,
            weights: WEIGHTS.ATTRIBUTE_MIX_COUNT[clusterInfo.biome],
          });

          // generate an average amount for the cluster
          let baseAmount = modifier === Modifier.FLAT ? 20 : 5; // +20, or 5%
          const increment = baseAmount / 10; // increments of 2, or 0.5%
          let primaryAmount = baseAmount;

          // single-color clusters should be slightly more concentrated
          if (attributeMixCount === '1' && clusterInfo.radius > 1) {
            primaryAmount *= 1.6;
          }

          // perturb slightly
          let perturbation = randomTriangle({
            seed: seed + 2,
            min: -baseAmount * 0.3,
            max: baseAmount * 0.3,
            increment,
            inclusive: true,
          });

          let lines = [
            {
              attribute: primaryAttribute,
              modifier,
              baseAmount,
              avgAmount: primaryAmount,
              perturbation,
              amount: primaryAmount + perturbation,
            },
          ];

          if (attributeMixCount === '2') {
            // else, if double, decide secondary attribute
            // guarantee distinct attributes
            const secondaryAttribute = randomValue<Attribute>({
              seed: seed,
              weights: { ...WEIGHTS.SINGLE_COLORS, [primaryAttribute]: 0 },
            });

            // secondary amount should be at most primary amount, and on average, about half
            let min = baseAmount * 0.2;
            let max = primaryAmount + perturbation;
            let secondaryAmount = randomTriangle({
              seed: seed + 3,
              min,
              max,
              increment,
              inclusive: true,
            });

            // not quite the avg amount, but needs to be a round number
            let avgAmount = primaryAmount / 2 + baseAmount * 0.2;

            lines.push({
              attribute: secondaryAttribute,
              modifier,
              amount: secondaryAmount,
              baseAmount,
              avgAmount,
              perturbation: secondaryAmount - avgAmount,
            });
          }
          return { lines };
        },
        SPEND: () => {
          throw new NotImplementedError();
        },
      },
    });

    return result;
  }

  private createNode(args: {
    seed: number;
    clusterInfo: ClusterInfo;
    clusterContents: ClusterContents;
    relativeLocation: Vector3;
  }) {
    const { seed, clusterInfo, clusterContents, relativeLocation } = args;
    if (clusterContents.lines.length === 0) {
      return clusterContents;
    }

    // dont modify anything if it's a singleton cluster
    if (clusterInfo.radius === 1) {
      return clusterContents;
    }

    // amplify the center node, and (TODO) another random edge node, by 50%
    if (relativeLocation.equals(Vector3.Zero)) {
      clusterContents.lines[0].amount =
        2.0 * clusterContents.lines[0].avgAmount +
        clusterContents.lines[0].perturbation;
      if (clusterContents.lines[1]) {
        clusterContents.lines[1].amount =
          2.0 * clusterContents.lines[1].avgAmount +
          clusterContents.lines[1].perturbation;
      }
    } else {
      // find the other random edge node. it's 1-in-6 chance
      let idx = randomUniform({
        seed,
        min: 0,
        max: 6,
        inclusive: false,
      });
      let target = Object.values(getCoordNeighbors(Vector3.Zero))[idx];
      if (relativeLocation.equals(target)) {
        clusterContents.lines[0].amount =
          1.5 * clusterContents.lines[0].avgAmount +
          clusterContents.lines[0].perturbation;
        if (clusterContents.lines[1]) {
          clusterContents.lines[1].amount =
            1.5 * clusterContents.lines[1].avgAmount +
            clusterContents.lines[1].perturbation;
        }
      }
    }

    // add some minor perturbations to give it some texture
    const baseAmount = clusterContents.lines[0].baseAmount;
    let perturbation = randomUniform({
      seed: seed + Vector3ToSeed(relativeLocation),
      min: -baseAmount * 0.15,
      max: baseAmount * 0.15,
      increment: baseAmount * 0.05,
      inclusive: true,
    });
    clusterContents.lines[0].amount += perturbation;

    if (clusterContents.lines[1]) {
      clusterContents.lines[1].amount -= perturbation;
    }
    return clusterContents;
  }

  /**
   * Entry point.
   * @param args
   * @returns
   */
  public create(args: { seed: number; location: Vector3 }): NodeContents {
    const { seed, location } = args;

    // hardcode the starting point to be empty
    if (location.equals(Vector3.Zero)) {
      return {
        lines: [],
      };
    }

    // generate clusters first. for now let's use 3x3 hexagonal regions with 1x1 hexagonal fillers.
    // TODO: alternatively - use almost-regular hexagons of shape 2.3.2.3.2 or 3.4.3.4.3 - they tile the plane perfectly

    // find the closest cluster center
    let clusterCenter: Vector3;
    let clusterInfo: ClusterInfo = { radius: 0, biome: 'default' };

    let modulo3 = location.moduloPositive(3).pairXY();
    if (
      modulo3.equals(new Vector2(1, 2)) ||
      modulo3.equals(new Vector2(2, 1))
    ) {
      // not close to any cluster centers, so it's a singleton 1x1 filler cluster
      clusterCenter = location;
      clusterInfo.radius = 1;
    } else {
      clusterCenter = location.divide(3).round().multiply(3);
      clusterInfo.radius = 2;
    }

    // don't use the cluster for the starting cluster
    if (clusterCenter.equals(Vector3.Zero)) {
      clusterCenter = location;
      clusterInfo.radius = 1;
    }

    // find out if it is in the starter area or not
    if (taxicabDistance(clusterCenter.pairXY()) <= STARTER_AREA_RADIUS) {
      clusterInfo.biome = 'starter';
    } else {
      clusterInfo.biome = 'default';
    }

    // generate data for the cluster
    const clusterContents = this.createCluster({
      seed: seed + Vector3ToSeed(clusterCenter),
      location: clusterCenter,
      clusterInfo,
    });

    // use that to generate data for the node

    const result = this.createNode({
      seed: seed + Vector3ToSeed(clusterCenter),
      clusterContents,
      clusterInfo,
      relativeLocation: location.subtract(clusterCenter),
    });

    return result;
  }
}

export function Vector3ToSeed(v: Vector3) {
  return v.x + squirrel3(v.y + squirrel3(v.z));
}
