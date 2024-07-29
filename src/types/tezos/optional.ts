/**
 * @publicapi
 * @category Tezos
 */
export type Optional<T, K extends keyof T> = Partial<T> & Omit<T, K>

/**
 * @publicapi
 * @category Tezos
 */
export type omittedProperties = 'source' | 'fee' | 'counter' | 'gas_limit' | 'storage_limit'
