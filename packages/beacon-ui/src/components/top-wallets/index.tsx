import React from "react";
import { MergedWallet } from "../../utils/wallets";
import Wallet from "../wallet";
import styles from "./styles.css";
import { StorageKey } from "@airgap/beacon-types";

interface TopWalletsProps {
  wallets: MergedWallet[];
  onClickWallet: (id: string) => void;
  onClickLearnMore: () => void;
  otherWallets?: { images: string[]; onClick: () => void };
  disabled?: boolean;
  isMobile: boolean;
}

const TopWallets: React.FC<TopWalletsProps> = (props: TopWalletsProps) => {
  const enableBugReport = localStorage
    ? localStorage.getItem(StorageKey.ENABLE_METRICS)
    : "false";

  return (
    <div className="top-wallets-wrapper">
      <div className="top-wallets-info">
        <h3>Connect Wallet</h3>
        {enableBugReport === "true" ? (
          <span>
            Do you wish to report a bug?{" "}
            <span
              className="top-wallets-learn-more"
              onClick={props.onClickLearnMore}
            >
              Click here
            </span>
          </span>
        ) : (
          <span>
            If you don't have a wallet, you can select a provider and create one
            now.{" "}
            <span
              className="top-wallets-learn-more"
              onClick={props.onClickLearnMore}
            >
              Learn more
            </span>
          </span>
        )}
      </div>
      <div className="top-wallets-wallets-main">
        {props.wallets.map((wallet) => (
          <Wallet
            key={wallet.id}
            disabled={props.disabled}
            mobile={props.isMobile}
            name={wallet.name}
            description={wallet.descriptions.join(" & ")}
            image={wallet.image}
            onClick={() => props.onClickWallet(wallet.id)}
            tags={wallet.tags}
          />
        ))}
        {props.otherWallets && (
          <div
            className="top-wallets-other-wallets"
            onClick={props.otherWallets.onClick}
          >
            <div className="top-wallets-other-wallets-left">
              <h3>Other Wallets</h3>
              <p>See other wallets you can use to connect</p>
            </div>
            <div className="top-wallets-other-wallets-right">
              <img src={props.otherWallets.images[0]} alt="Other Wallet 1" />
              <img
                className="top-wallets-other-wallets-center-wallet"
                src={props.otherWallets.images[1]}
                alt="Other Wallet 2"
              />
              <img src={props.otherWallets.images[2]} alt="Other Wallet 3" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { styles };
export default TopWallets;
