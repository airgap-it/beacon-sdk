/**
 * Geographic region where a beacon node is located. This list can be changed in the future to be more specific, but for now it should cover most general areas.
 */
export enum Regions {
  EU_EAST = 'eu-east',
  EU_WEST = 'eu-west',
  US_EAST = 'us-east',
  US_WEST = 'us-west',
  CENTRAL_AMERICA = 'central-america',
  SOUTH_AMERICA = 'south-america',
  ASIA_EAST = 'asia-east',
  ASIA_WEST = 'asia-west',
  AFRICA = 'africa',
  AUSTRALIA = 'australia'
}

export type NodeDistributions = Record<Regions | string, string[]>
