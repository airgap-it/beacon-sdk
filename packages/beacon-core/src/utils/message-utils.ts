export const MESSAGE_WRAPPED_FROM_VERSION = 3

export const usesWrappedMessages = (version?: string): boolean => {
  if (!version) {
    return false
  }

  const parsed = Number(version)

  return Number.isFinite(parsed) && parsed >= MESSAGE_WRAPPED_FROM_VERSION
}

