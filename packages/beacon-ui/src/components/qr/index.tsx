import { Component } from 'solid-js'
import { getQrData } from 'src/utils/qr'
import styles from './styles.css'

interface QRProps {
  payload: string
  onClickLearnMore?: () => void
}

const QR: Component<QRProps> = (props: QRProps) => {
  const isMobile = window.innerWidth <= 800

  const qrSVG = isMobile ? getQrData(props.payload, 240, 240) : getQrData(props.payload, 160, 160)
  const div = document.createElement('div')
  div.innerHTML = qrSVG

  return (
    <div class="qr-wrapper">
      <div class="qr-left">
        {!isMobile && <h3>Or scan to connect</h3>}
        {!isMobile && <p>Open Temple Wallet on your mobile phone and scan.</p>}
        {isMobile && <p>Scan QR code with a Beacon-compatible wallet.</p>}

        {props.onClickLearnMore && (
          <div style={{ 'margin-top': 'auto' }}>
            <p
              class="qr-more-info"
              onClick={() => {
                if (props.onClickLearnMore) props.onClickLearnMore()
              }}
            >
              Learn more
            </p>
          </div>
        )}
      </div>
      <div class="qr-right">{div}</div>
    </div>
  )
}

export { styles }
export default QR
