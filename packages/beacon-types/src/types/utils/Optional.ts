export type Optional<T, K extends keyof T> = Partial<T> & Omit<T, K>
