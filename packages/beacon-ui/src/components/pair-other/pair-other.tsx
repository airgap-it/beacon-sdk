import React, { useState, useEffect } from "react";
import QR from "../qr";
import { MergedWallet } from "../../utils/wallets";
import {
  P2PPairingRequest,
  WalletConnectPairingRequest,
} from "@airgap/beacon-types";
import "./styles.css";
import { Serializer } from "@airgap/beacon-core";

export interface PairOtherProps {
  walletList: MergedWallet[];
  p2pPayload: Promise<P2PPairingRequest> | undefined;
  wcPayload: Promise<WalletConnectPairingRequest> | undefined;
  onClickLearnMore: () => void;
}

const PairOther: React.FC<PairOtherProps> = (props: PairOtherProps) => {
  const [uiState, setUiState] = useState<"selection" | "p2p" | "walletconnect">(
    "selection"
  );
  const [hasBeacon, setHasBeacon] = useState<boolean>(false);
  const [hasWalletConnect, setHasWalletConnect] = useState<boolean>(false);
  const [qrData, setQrData] = useState<string>("");

  useEffect(() => {
    setUiState("selection");
    setQrData("");
    setHasBeacon(!!props.p2pPayload);
    setHasWalletConnect(!!props.wcPayload);
  }, [props.p2pPayload, props.wcPayload]);

  const buttonClickHandler = (state: "p2p" | "walletconnect") => {
    if (state === "p2p" && props.p2pPayload) {
      props.p2pPayload.then(async (payload) => {
        const serializer = new Serializer();
        const codeQR = await serializer.serialize(payload);
        setQrData(codeQR);
      });
    } else if (state === "walletconnect" && props.wcPayload) {
      props.wcPayload
        .then((payload) => {
          setQrData(payload.uri);
        })
        .catch((error) => console.error(error.message));
    }
    setUiState(state);
  };

  return (
    <>
      {uiState === "selection" && (
        <div>
          <span className="pair-other-info">Select QR Type</span>
          <br />
          {hasBeacon && (
            <button
              className="wallets-button"
              onClick={() => buttonClickHandler("p2p")}
            >
              Beacon
            </button>
          )}
          {hasWalletConnect && (
            <button
              className="wallets-button"
              onClick={() => buttonClickHandler("walletconnect")}
            >
              WalletConnect
            </button>
          )}
        </div>
      )}
      {uiState !== "selection" && qrData && (
        <QR
          isWalletConnect={uiState === "walletconnect"}
          isMobile={true}
          walletName={"AirGap"}
          code={qrData}
          onClickLearnMore={props.onClickLearnMore}
        />
      )}
    </>
  );
};


export default PairOther;
