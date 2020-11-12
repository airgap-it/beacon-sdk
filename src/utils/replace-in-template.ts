export const replaceInTemplate = (text: string, placeholder: string, value: string): string =>
  text.split(`{{${placeholder}}}`).join(value)
