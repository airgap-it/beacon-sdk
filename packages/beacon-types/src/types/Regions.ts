export enum Regions {
  EU1 = 'eu-1',
  US1 = 'us-1'
}

export interface NodeDistributions {
  [Regions.EU1]?: string[]
  [Regions.US1]?: string[]
}
