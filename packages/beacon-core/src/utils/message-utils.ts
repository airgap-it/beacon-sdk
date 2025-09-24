export const isWrappedMessageVersion = (version?: string): boolean => {
  if (!version) {
    return false
  }

  const parsed = Number(version)

  return Number.isFinite(parsed) && parsed >= 3
}

