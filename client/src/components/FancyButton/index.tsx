import React from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styles from "./FancyButton.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark"
  | "outline"
  | "link";

interface FancyButtonProps {
  label?: string;
  icon?: React.ReactNode;
  variant?: Variant;
  size?: "small" | "middle" | "large";
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const FancyButton: React.FC<FancyButtonProps> = ({
  label,
  icon = <PlusOutlined />,
  variant = "primary",
  size = "middle",
  onClick,
  loading = false,
  disabled = false,
  className = "",
}) => {
  return (
    <Button
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      className={cx(
        "fancy-button",
        `fancy-button-${variant}`,
        `fancy-button-${size}`,
        className
      )}
    >
      {icon && <span className="d-flex align-items-center">{icon}</span>}
      {label && <span>{label}</span>}
    </Button>
  );
};

export default FancyButton;
