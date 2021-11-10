import * as qrcode from 'qrcode-generator'
import { Logger } from '@airgap/beacon-core'

const logger = new Logger('QR')

/**
 * Convert data to a QR code
 *
 * @param payload The data to be encoded as a QR code
 * @param type How the QR code will be encoded
 */
export const getQrData = (payload: string, type?: 'data' | 'svg' | 'ascii'): string => {
  const typeNumber: TypeNumber = 0
  const errorCorrectionLevel: ErrorCorrectionLevel = 'L'
  const qr = (qrcode as any)(typeNumber, errorCorrectionLevel)

  if (payload.length > 500) {
    logger.warn(
      'getQrData',
      'The size of the payload in the QR code is quite long and some devices might not be able to scan it anymore. To reduce the QR size, try using a shorter "name", "appUrl" and "iconUrl"'
    )
  }

  try {
    qr.addData(payload)
    qr.make()
    if (type === 'svg') {
      return qr.createSvgTag()
    } else if (type === 'ascii') {
      const length: number = qr.getModuleCount()
      const black = '\x1B[40m  \x1B[0m'
      const white = '\x1B[47m  \x1B[0m'
      const whiteLine = new Array(length + 3).join(white)
      const blackLine = new Array(length + 3).join(black)

      let ascii = ''
      ascii += `${blackLine}\n`
      ascii += `${whiteLine}\n`
      for (let x = 0; x < length; x++) {
        ascii += white

        for (let y = 0; y < length; y++) {
          ascii += qr.isDark(x, y) ? black : white
        }

        ascii += `${white}\n`
      }
      ascii += whiteLine
      ascii += blackLine

      return ascii
    } else {
      return qr.createDataURL()
    }
  } catch (qrError) {
    console.error('error', qrError)
    throw qrError
  }
}
