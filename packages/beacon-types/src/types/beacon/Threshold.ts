export interface Threshold {
  // The threshold is not enforced on the dapp side. It's only as an information to the user
  amount: string // The amount of mutez that can be spent within the timeframe
  timeframe: string // The timeframe within which the spending will be summed up
}
