import React from "react";
import { MergedWallet } from "../../utils/wallets";
import Wallet from "../wallet";
import styles from "./styles.css";

interface WalletProps {
  wallets: MergedWallet[];
  onClickWallet: (id: string) => void;
  onClickOther: () => void;
  isMobile: boolean;
  small?: boolean;
  disabled?: boolean;
}

const Wallets: React.FC<WalletProps> = (props: WalletProps) => {
  return (
    <div className="wallets-list-main-wrapper">
      <div className="wallets-list-wrapper">
        {props.wallets.map((wallet) => (
          <Wallet
            key={wallet.id}
            disabled={props.disabled}
            name={wallet.name}
            description={wallet.descriptions.join(" & ")}
            image={wallet.image}
            small={props.small}
            onClick={() => props.onClickWallet(wallet.id)}
          />
        ))}
      </div>
      <button className="wallets-button" onClick={props.onClickOther}>
        {props.isMobile ? "Pair wallet on another device" : "Show QR code"}
      </button>
    </div>
  );
};

export { styles };
export default Wallets;
