import { Component, createSignal } from 'solid-js'
import { getTzip10Link } from 'src/utils/get-tzip10-link'
import { getQrData } from 'src/utils/qr'
import styles from './styles.css'

const COPY_RESET_TIMEOUT = 3000

interface QRProps {
  isMobile: boolean
  walletName: string
  code: string
  onClickLearnMore?: () => void
}

const QR: Component<QRProps> = (props: QRProps) => {
  const [copied, setCopied] = createSignal<boolean>(false)

  const payload = getTzip10Link('tezos://', props.code)

  const qrSVG = props.isMobile ? getQrData(payload, 240, 240) : getQrData(payload, 160, 160)
  const div = document.createElement('div')
  div.classList.add('qr-svg-wrapper')
  div.innerHTML = qrSVG

  async function handleCopyClipboard() {
    navigator.clipboard
      .writeText(props.code)
      .then(() => {
        if (!copied()) {
          setCopied(true)
          setTimeout(() => {
            setCopied(false)
          }, COPY_RESET_TIMEOUT)
        }
      })
      .catch((error) => {
        console.error('Error copying text: ', error)
      })
  }

  return (
    <div
      class="qr-wrapper"
      style={
        props.isMobile
          ? {
              'flex-direction': 'column',
              'align-items': 'center',
              'justify-content': 'center',
              height: '340px',
              'text-align': 'center'
            }
          : {}
      }
    >
      <div class="qr-left">
        {!props.isMobile && <h3>Or scan to connect</h3>}
        {!props.isMobile && (
          <p>{`Open ${props.walletName} Wallet on your mobile phone and scan.`}</p>
        )}
        {props.isMobile && <p>Scan QR code with a Beacon-compatible wallet.</p>}

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
      <div class="qr-right" onClick={handleCopyClipboard}>
        {div}
        {copied() && (
          <div class="qr-copy-wrapper">
            <svg
              fill="currentColor"
              stroke-width="0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              height="1em"
              width="1em"
              style="overflow: visible;"
            >
              <path d="M243.8 339.8c-10.9 10.9-28.7 10.9-39.6 0l-64-64c-10.9-10.9-10.9-28.7 0-39.6 10.9-10.9 28.7-10.9 39.6 0l44.2 44.2 108.2-108.2c10.9-10.9 28.7-10.9 39.6 0 10.9 10.9 10.9 28.7 0 39.6l-128 128zM512 256c0 141.4-114.6 256-256 256S0 397.4 0 256 114.6 0 256 0s256 114.6 256 256zM256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z"></path>
            </svg>
            <p>Copied!</p>
          </div>
        )}
        {!copied() && (
          <div class="qr-copy-wrapper">
            <svg
              fill="currentColor"
              stroke-width="0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1024 1024"
              height="1em"
              width="1em"
              style="overflow: visible;"
            >
              <path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM382 896h-.2L232 746.2v-.2h150v150z"></path>
            </svg>
            <p>Copy to clipboard</p>
          </div>
        )}
      </div>
    </div>
  )
}

export { styles }
export default QR
