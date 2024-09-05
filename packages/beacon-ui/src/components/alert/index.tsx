import React, { useEffect } from "react";
import { CloseIcon, LeftIcon, LogoIcon } from "../icons";
import Loader from "../loader";

export interface AlertProps {
  content: any;
  open: boolean;
  showMore?: boolean;
  extraContent?: any;
  loading?: boolean;
  onCloseClick: () => void;
  onClickShowMore?: () => void;
  onBackClick?: () => void;
}

const Alert: React.FC<AlertProps> = (props: AlertProps) => {
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const isMobile = window.innerWidth <= 800;

  return (
    <div
      className={props.open ? "alert-wrapper-show" : "alert-wrapper-hide"}
      onClick={props.onCloseClick}
    >
      <div
        className={props.open ? "alert-modal-show" : "alert-modal-hide"}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="alert-header">
          {props.onBackClick ? (
            <div className="alert-button-icon" onClick={props.onBackClick}>
              <LeftIcon />
            </div>
          ) : (
            <div className="alert-button-icon-empty"></div>
          )}
          <div className="alert-logo">
            <LogoIcon />
          </div>
          <div className="alert-button-icon" onClick={props.onCloseClick}>
            <CloseIcon />
          </div>
        </div>
        <div
          className="alert-modal-loading-wrapper"
          style={
            props.loading
              ? {
                  opacity: 1,
                  transition: "all ease 0.3s",
                  height: "14px",
                  overflow: "unset",
                  width: "unset",
                }
              : {
                  opacity: 0,
                  transition: "all ease 0.3s",
                  height: 0,
                  overflow: "hidden",
                  width: 0,
                }
          }
        >
          <Loader />
        </div>
        <div
          className="alert-body"
          style={{ marginBottom: props.extraContent ? "" : "1.8em" }}
        >
          {props.content}
          {!isMobile && (
            <div
              className={
                props.showMore
                  ? "alert-body-extra-show"
                  : "alert-body-extra-hide"
              }
            >
              {props.extraContent && <div className="alert-divider"></div>}
              {props.extraContent}
            </div>
          )}
        </div>
        {!isMobile && props.extraContent && (
          <div className="alert-footer" onClick={props.onClickShowMore}>
            {props.showMore ? "Show less" : "Show more"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
