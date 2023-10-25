import QRCode from 'qrcode-svg'
import { Logger } from '@mavrykdynamics/beacon-core'

const logger = new Logger('QR')

/**
 * Convert data to a QR code
 *
 * @param payload The data to be encoded as a QR code
 * @param type How the QR code will be encoded
 */
export const getQrData = (payload: string, height?: number, width?: number): string => {
  if (payload.length > 500) {
    logger.warn(
      'getQrData',
      'The size of the payload in the QR code is quite long and some devices might not be able to scan it anymore. To reduce the QR size, try using a shorter "name", "appUrl" and "iconUrl"'
    )
  }
  try {
    const qrcode = new QRCode({
      color: 'black',
      content: payload,
      join: true, // Join adjacent modules into a single path element
      ecl: 'L', // Error correction level,
      height: height,
      width: width
    })
    return qrcode.svg()
  } catch (qrError) {
    console.error('error', qrError)
    throw qrError
  }
}
