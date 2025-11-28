import { useEffect, useState } from "react";
import "@/assets/scss/homepage.scss";
import type { ImageProps } from "antd";

type ClientImageWithFallbackProps = ImageProps & {
  src: string | null;
  fallbackSrc: string;
  alt?: string;
};

const ImageWithFallback = ({
  src = "",
  alt = "",
  fallbackSrc,
  ...props
}: ClientImageWithFallbackProps) => {
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const resolvedSrc = !src || src.trim() === "" ? fallbackSrc : src;

  return (
    <>
      <img
        alt={alt}
        onError={() => setError(true)}
        src={error ? fallbackSrc : resolvedSrc}
        {...props}
      />
    </>
  );
};

export default ImageWithFallback;
