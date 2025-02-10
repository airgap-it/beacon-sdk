import { ConfigurableAlertProps } from '../../../common'
import Info from '../../../../components/info'
import Alert from '../../../../components/alert'

const InfoAlert = ({ title, body, data, open, onClose }: ConfigurableAlertProps) => {
  return (
    <Alert open={open} onCloseClick={onClose}>
      <Info
        bigIcon
        icon={
          <svg
            fill="currentColor"
            strokeWidth="0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            height="1em"
            width="1em"
            style={{ overflow: 'hidden' }}
            color="#494949"
          >
            <path
              d="M85.57 446.25h340.86a32 32 0 0 0 28.17-47.17L284.18 82.58c-12.09-22.44-44.27-22.44-56.36 0L57.4 399.08a32 32 0 0 0 28.17 47.17Z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="32px"
            ></path>
            <path
              d="m250.26 195.39 5.74 122 5.73-121.95a5.74 5.74 0 0 0-5.79-6h0a5.74 5.74 0 0 0-5.68 5.95Z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="32px"
            ></path>
            <path d="M256 397.25a20 20 0 1 1 20-20 20 20 0 0 1-20 20Z"></path>
          </svg>
        }
        title={title || 'No title'}
        description={body || 'No description'}
        data={data}
        buttons={[
          {
            label: 'Close',
            type: 'primary',
            onClick: onClose
          }
        ]}
      />
    </Alert>
  )
}
export default InfoAlert
