import React from "react";
import { Form, Input, Select, DatePicker } from "antd";
import type { Rule } from "antd/es/form";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import styles from "./FancyFormItem.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);
const { RangePicker } = DatePicker;

interface FancyFormItemProps {
  label: string;
  rules?: Rule[];
  name: string;
  placeholder?: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "phone"
    | "textarea"
    | "date"
    | "daterange"
    | "select";
  icon?: React.ReactNode;
  format?: string;
  options?: { label: string; value: string | number }[];
}

const getDefaultIcon = (type?: string, name?: string) => {
  if (type === "email" || name?.includes("email")) return <MailOutlined />;
  if (type === "password" || name?.includes("password"))
    return <LockOutlined />;
  if (type === "phone" || name?.includes("phone")) return <PhoneOutlined />;
  if (type === "date" || name?.includes("date")) return <CalendarOutlined />;
  if (name?.includes("address")) return <HomeOutlined />;
  if (name?.includes("name")) return <UserOutlined />;
  return undefined;
};

const FancyFormItem: React.FC<FancyFormItemProps> = ({
  label,
  name,
  rules = [],
  placeholder,
  type = "text",
  icon,
  format = "DD/MM/YYYY",
  options = [],
  disabled = false,
  readOnly = false,
}) => {
  const defaultIcon = icon || getDefaultIcon(type, name);

  const renderInput = () => {
    switch (type) {
      case "password":
        return (
          <Input.Password
            prefix={defaultIcon}
            placeholder={placeholder || `Nhập ${label.toLowerCase()}`}
          />
        );

      case "textarea":
        return (
          <Input.TextArea
            rows={3}
            placeholder={placeholder || `Nhập ${label.toLowerCase()}`}
          />
        );

      case "select":
        return (
          <Select
            placeholder={placeholder || `Chọn ${label.toLowerCase()}`}
            options={options}
            style={{ width: "100%" }}
          />
        );

      case "date":
        return (
          <DatePicker
            format={format}
            placeholder={placeholder || "Chọn ngày"}
            style={{ width: "100%" }}
          />
        );

      case "daterange":
        return (
          <RangePicker
            format={format}
            placeholder={["Từ ngày", "Đến ngày"]}
            style={{ width: "100%" }}
          />
        );

      default:
        return (
          <Input
            type={type}
            prefix={defaultIcon}
            placeholder={placeholder || `Nhập ${label.toLowerCase()}`}
            disabled={disabled}
            readOnly={readOnly}
          />
        );
    }
  };

  return (
    <div className={cx("fancy-form-item")}>
      <Form.Item label={label} name={name} rules={rules}>
        {renderInput()}
      </Form.Item>
    </div>
  );
};

export default FancyFormItem;
