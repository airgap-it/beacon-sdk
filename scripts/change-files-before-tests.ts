import { readFileSync, writeFileSync } from 'fs'

const replaceInFile: (file: string, src: string, dest: string) => void = (
  file: string,
  src: string,
  dest: string
): void => {
  const content: string = readFileSync(file, 'utf-8')
  const newContent: string = content.split(src).join(dest)
  writeFileSync(file, newContent)
}

/**
 * Because of issues with the module system and tests, the following import doesn't work in the tests and we have to overwrite it.
 */

replaceInFile(
  './src/utils/qr.ts',
  `import qrcode from 'qrcode-generator'`,
  `import * as qrcode from 'qrcode-generator'`
)
replaceInFile(
  './src/utils/qr.ts',
  `const qr = qrcode(typeNumber, errorCorrectionLevel)`,
  `const qr = (qrcode as any)(typeNumber, errorCorrectionLevel)`
)
