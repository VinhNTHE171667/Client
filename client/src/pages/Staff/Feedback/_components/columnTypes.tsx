/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Dropdown, Space, Tag, type MenuProps } from "antd";
import {
  EllipsisOutlined,
  CheckOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";
import { statusTagColor, translateStatus } from "@/utils/format";
import type { FeedbackTableProps } from "./type";
import { feedbackStatus } from "@/common/types/auth";

export const FeedbackColumn = (): ColumnsType<FeedbackTableProps> => [
  {
    title: "STT",
    dataIndex: "index",
    width: 70,
    align: "center",
    render: (_, __, index) => <span>{index + 1}</span>,
  },
  {
    title: "Khách hàng",
    dataIndex: "customer",
    render: (_, record) => (
      <Space size={12}>
        <AvatarTable
          src={record.customer.avatar ?? NoAvatarImage}
          alt="avatar"
          fallback={NoAvatarImage}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {record.customer.full_name}
          </div>
          <div style={{ color: "#8c8c8c", fontSize: 12 }}>
            {record.customer.email}
          </div>
        </div>
      </Space>
    ),
  },
  {
    title: "Dịch vụ",
    dataIndex: "service",
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {record.service.name}
        </div>
        <div style={{ color: "#8c8c8c", fontSize: 12 }}>
          {record.service.price.toLocaleString("vi-VN")}₫
        </div>
      </div>
    ),
  },
  {
    title: "Đánh giá",
    dataIndex: "rating",
    align: "center",
    render: (rating: number | string) => {
      const numericRating = Number(rating) || 0;
      return (
        <span>
          {"★".repeat(Math.round(numericRating))}
          {"☆".repeat(5 - Math.round(numericRating))} (
          {numericRating.toFixed(1)})
        </span>
      );
    },
  },

  {
    title: "Bình luận",
    dataIndex: "comment",
    ellipsis: true,
    render: (comment: string) => <span>{comment || "—"}</span>,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    align: "center",
    width: 130,
    render: (status: string) => (
      <Tag color={statusTagColor(status)}>{translateStatus(status)}</Tag>
    ),
  },
  {
    title: "Hành động",
    dataIndex: "operation",
    key: "operation",
    fixed: "right",
    align: "right",
    width: 80,
    render: (_, record) => {
      const renderItems = (
        record: FeedbackTableProps,
        onApprove: () => Promise<void>,
        onReject: () => Promise<void>
      ): MenuProps["items"] => {
        const items: MenuProps["items"] = [];

        if (record.status === feedbackStatus.Pending) {
          items.push({
            key: "0",
            label: (
              <a onClick={onApprove}>
                <Space>
                  <CheckOutlined /> Xác nhận
                </Space>
              </a>
            ),
          });
          items.push({
            key: "1",
            label: (
              <a onClick={onReject}>
                <Space>
                  <EditOutlined /> Hủy đánh giá
                </Space>
              </a>
            ),
          });
        }

        return items;
      };

      return (
        <Dropdown
          menu={{
            items: renderItems(record, record.onApprove!, record.onReject!),
          }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<EllipsisOutlined style={{ fontSize: 18 }} />}
            disabled={!(record.status === feedbackStatus.Pending)}
          />
        </Dropdown>
      );
    },
  },
];
