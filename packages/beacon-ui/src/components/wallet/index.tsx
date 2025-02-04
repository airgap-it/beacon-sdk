import React from 'react'
import './styles.css'
import { WalletProps } from 'src/ui/common'

const Wallet: React.FC<WalletProps> = (props: WalletProps) => {
  return (
    <div className={props.disabled ? 'wallet-disabled' : ''}>
      {!props.small && (
        <div
          className={`wallet-main ${props.mobile ? 'wallet-main-mobile' : ''}`}
          onClick={props.onClick}
        >
          <div className={`wallet-main-left ${props.mobile ? 'wallet-main-left-mobile' : ''}`}>
            <h3>{props.name}</h3>
            {props.description && <p>{props.description}</p>}
            {props.tags && props.tags.length > 0 && (
              <div className="wallet-main-tags">
                {props.tags.map((tag, index) => (
                  <span key={index} className="wallet-main-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="wallet-main-right">
            <img src={props.image} alt={`${props.name} logo`} />
          </div>
        </div>
      )}
      {props.small && (
        <div className="wallet-small" onClick={props.onClick}>
          <img src={props.image} alt={`${props.name} logo`} />
          <h3>{props.name}</h3>
        </div>
      )}
    </div>
  )
}

export default Wallet
