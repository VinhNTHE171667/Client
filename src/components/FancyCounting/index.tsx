"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

type AnimatedCounterProps = {
  to: number;
  from?: number;
  duration?: number;
  format?: (value: number) => string;
  style?: React.CSSProperties;
  className?: string;
};

export default function FancyCounting({
  to,
  from = 0,
  duration = 2,
  format = (v) => v.toString(),
  style,
  className,
}: AnimatedCounterProps) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  const [value, setValue] = useState(from);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      setValue(v);
    });

    const controls = animate(count, to, {
      duration,
      ease: "easeOut",
    });

    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [to, duration]);

  return (
    <motion.span style={style} className={className}>
      {format(value)}
    </motion.span>
  );
}
