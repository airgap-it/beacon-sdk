export const shortenString = (text: string): string => {
  if (text.length >= 12) {
    return `${text.substr(0, 5)}...${text.substr(-5)}`
  }

  return text
}
