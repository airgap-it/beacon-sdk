/**
 * Geographic region where a beacon node is located. This list can be changed in the future to be more specific, but for now it should cover most general areas.
 */
export enum Regions {
  EUROPE_EAST = 'europe-east',
  EUROPE_WEST = 'europe-west',
  NORTH_AMERICA_EAST = 'north-america-east',
  NORTH_AMERICA_WEST = 'north-america-west',
  CENTRAL_AMERICA = 'central-america',
  SOUTH_AMERICA = 'south-america',
  ASIA_EAST = 'asia-east',
  ASIA_WEST = 'asia-west',
  AFRICA = 'africa',
  AUSTRALIA = 'australia'
}

export type NodeDistributions = Record<Regions | string, string[]>
