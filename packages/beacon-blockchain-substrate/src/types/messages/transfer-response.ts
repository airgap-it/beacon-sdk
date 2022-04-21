export type SubstrateTransferResponse =
  | {
      transactionHash: string
    }
  | {
      transactionHash: string
      signature: string
      payload?: string
    }
  | {
      signature: string
      payload?: string
    }
