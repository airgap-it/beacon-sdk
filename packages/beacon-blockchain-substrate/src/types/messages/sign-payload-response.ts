export type SubstrateSignPayloadResponse =
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
