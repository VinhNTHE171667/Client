import { Button, Modal } from "antd";
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  type?: "confirm" | "warning" | "error";
  hideCancelButton?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "confirm",
  hideCancelButton = false,
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case "warning":
        return <WarningOutlined style={{ color: "#faad14" }} />;
      case "error":
        return <CloseCircleOutlined style={{ color: "#f5222d" }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: "#1890ff" }} />;
    }
  };

  return (
    <Modal
      title={
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {getTypeIcon()}
          {title}
        </span>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        !hideCancelButton && (
          <Button key="cancel" onClick={onClose}>
            Hủy
          </Button>
        ),
        <Button
          key="confirm"
          type={type === "error" ? "primary" : "default"}
          danger={type === "error"}
          onClick={onConfirm}
        >
          Đồng ý
        </Button>,
      ]}
    >
      <div>{message}</div>
    </Modal>
  );
};

export default ConfirmModal;
