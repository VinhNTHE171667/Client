import React, { useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./FancySegment.module.scss";

const cx = classNames.bind(styles);

interface FancySegmentProps {
  options: { label: string; value: string }[];
  value: { label: string; value: string };
  onChange: (value: { label: string; value: string }) => void;
  size?: "small" | "middle" | "large";
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  defaultValue?: { label: string; value: string };
}

const FancySegment: React.FC<FancySegmentProps> = ({
  options,
  value,
  onChange,
  size = "middle",
  variant = "primary",
  className = "",
  defaultValue,
}) => {
  useEffect(() => {
    if (!value && defaultValue) {
      onChange(defaultValue);
    }
  }, [value, defaultValue, onChange]);

  return (
    <div className={cx("fancy-segment", `fancy-segment-${variant}`, className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx("segment-option", `segment-${size}`, {
            active: option.value === value.value,
          })}
          onClick={() => onChange(option)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default FancySegment;
