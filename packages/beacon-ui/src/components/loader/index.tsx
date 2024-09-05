import React from "react";
import styles from "./styles.css";

interface LoaderProps {}

const Loader: React.FC<LoaderProps> = () => {
  return <div className="loader"></div>;
};

export { styles };
export default Loader;
