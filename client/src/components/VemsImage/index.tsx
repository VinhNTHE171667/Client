import { useState, forwardRef } from "react";
import NoImage from "@/assets/img/defaultAvatar.jpg";
import classNames from "classnames";

import styles from "./VemsImage.module.scss";

type VemsImageProps = {
  src: string;
  alt: string;
  className: string;
  fallback: string;
};

const VemsImage = (
  {
    src,
    alt,
    className,
    fallback: customFallback = NoImage,
    ...props
  }: VemsImageProps,
  ref: React.LegacyRef<HTMLImageElement>
) => {
  // const [fallback, setFallBack] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    // setFallBack(customFallback);
    setHasError(true);
  };

  const finalSrc = !src || hasError ? customFallback : src;

  return (
    <img
      className={classNames(styles.wrapper, className)}
      ref={ref}
      src={finalSrc}
      alt={alt}
      {...props}
      onError={handleError}
    />
  );
};

export default forwardRef(VemsImage);
