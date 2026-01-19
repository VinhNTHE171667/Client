import React from "react";
import { Button } from "antd";

type IconBoxProps = {
  icon: React.ReactNode;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  bgColor?: string;
  hoverColor?: string;
  className?: string;
  onClick?: () => void;
};

const FancyIconBox: React.FC<IconBoxProps> = ({
  icon,
  size = 48,
  iconSize = 24,
  iconColor = "rgba(255, 255, 255, 0.9)",
  bgColor = "rgba(255, 255, 255, 0.25)",
  hoverColor = "#e6f4ff",
  onClick,
  className,
}) => {
  const styledIcon = React.isValidElement(icon)
    ? React.cloneElement(
        icon as React.ReactElement<{ style?: React.CSSProperties }>,
        {
          style: {
            ...((icon as React.ReactElement<{ style?: React.CSSProperties }>)
              .props?.style || {}),
            fontSize: iconSize,
            color: iconColor,
          },
        }
      )
    : icon;

  return (
    <Button
      type="text"
      onClick={onClick}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.backgroundColor = hoverColor;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.backgroundColor = bgColor;
      }}
    >
      {styledIcon}
    </Button>
  );
};

export default FancyIconBox;
