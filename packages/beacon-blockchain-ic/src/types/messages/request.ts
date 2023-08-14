export interface JsonRPCRequest<M, T> {
    id: number
    jsonrpc: "2.0"
    method: M
    params: T
}

