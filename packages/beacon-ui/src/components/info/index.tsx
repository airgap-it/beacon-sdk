import React from "react";
import styles from "./styles.css";
import { QRCodeIcon } from "../icons";

interface InfoProps {
  title: string;
  description?: string;
  data?: string;
  icon?: any;
  border?: boolean;
  iconBadge?: boolean;
  bigIcon?: boolean;
  buttons?: {
    label: string;
    type: "primary" | "secondary";
    onClick: () => void;
  }[];
  downloadLink?: { url: string; label: string };
  onShowQRCodeClick?: (() => void) | (() => Promise<void>);
}

const Info: React.FC<InfoProps> = (props: InfoProps) => {
  return (
    <div className={`info-wrapper ${props.border ? "info-border" : ""}`}>
      {props.icon && (
        <div
          className={`info-icon ${props.iconBadge ? "info-badge" : ""}`}
          style={props.bigIcon ? { fontSize: "3.4em" } : {}}
        >
          {props.icon}
        </div>
      )}
      <h3 className="info-title">{props.title}</h3>
      {props.description && (
        <div className="info-description">{props.description}</div>
      )}
      {props.data && <pre className="info-data">{props.data}</pre>}
      <div className="info-buttons">
        {props.buttons?.map((button, index) => (
          <button
            key={index}
            className={
              button.type !== "secondary"
                ? "info-button"
                : "info-button-secondary"
            }
            onClick={button.onClick}
          >
            {button.label}
          </button>
        ))}
      </div>
      {props.downloadLink && (
        <a className="downloadLink" href={props.downloadLink.url}>
          {props.downloadLink.label}
        </a>
      )}
      {props.onShowQRCodeClick && (
        <button id="qr-code-icon" onClick={props.onShowQRCodeClick}>
          <QRCodeIcon />
        </button>
      )}
    </div>
  );
};

export { styles };
export default Info;
