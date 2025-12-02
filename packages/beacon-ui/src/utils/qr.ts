import qrcode from 'qrcode-generator'
import { Logger } from '@airgap/beacon-core'

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
    const size = height || width || 160
    const typeNumber = 0 // Auto-detect size based on data length
    const errorCorrectionLevel = 'L' // Low error correction
    const qr = qrcode(typeNumber, errorCorrectionLevel)
    qr.addData(payload)
    qr.make()
    
    const cellSize = Math.floor(size / qr.getModuleCount())
    const margin = 0
    
    return qr.createSvgTag(cellSize, margin)
  } catch (qrError) {
    console.error('error', qrError)
    throw qrError
  }
}
