import { useState, forwardRef } from "react";
import NoImage from "@/assets/img/defaultAvatar.jpg";
import classNames from "classnames";

import styles from "./AvatarTable.module.scss";

type ImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallback: string;
};

const AvatarTable = (
  {
    src,
    alt,
    className,
    fallback: customFallback = NoImage,
    ...props
  }: ImageProps,
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
      className={classNames(styles.wrapper, className, styles["user-avatar"])}
      ref={ref}
      src={finalSrc}
      alt={alt}
      {...props}
      onError={handleError}
    />
  );
};

export default forwardRef(AvatarTable);
