import { Tag, Button, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import type { NotificationProps, NotificationType } from "@/services/auth";
import { BiInfoCircle } from "react-icons/bi";
import { IoLinkOutline } from "react-icons/io5";

type HandleMarkAsRead = (id: string) => void;
type LoadingState = boolean;

interface NotificationColumnProps {
  handleMarkAsRead: HandleMarkAsRead;
  isLoading: LoadingState;
  openDetailModal: (record: NotificationProps) => void;
}

export const NotificationColumn = ({
  handleMarkAsRead,
  isLoading,
  openDetailModal,
}: NotificationColumnProps): ColumnsType<NotificationProps> => [
  {
    title: "STT",
    dataIndex: "index",
    width: 70,
    align: "center",
    render: (_, __, index) => <span>{index + 1}</span>,
  },
  {
    title: "Tiêu đề",
    dataIndex: "title",
    ellipsis: true,
    width: 200,
    render: (title: string) => <strong>{title}</strong>,
  },
  {
    title: "Nội dung",
    dataIndex: "content",
    ellipsis: true,
    width: 300,
    render: (content: string) =>
      content.length > 100 ? `${content.substring(0, 100)}...` : content,
  },
  {
    title: "Loại",
    dataIndex: "type",
    align: "center",
    width: 100,
    render: (type: NotificationType) => {
      let color = "default";
      const text = type;
      switch (type) {
        case "Success":
          color = "green";
          break;
        case "Warning":
          color = "orange";
          break;
        case "Error":
          color = "red";
          break;
        case "Info":
          color = "blue";
          break;
        default:
          color = "default";
      }
      return <Tag color={color}>{text}</Tag>;
    },
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    align: "center",
    width: 150,
    render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
  },
  {
    title: "Trạng thái đọc",
    dataIndex: "isRead",
    align: "center",
    width: 120,
    render: (isRead: boolean) => (
      <Tag color={isRead ? "green" : "red"}>
        {isRead ? "Đã đọc" : "Chưa đọc"}
      </Tag>
    ),
  },
  {
    title: "Hành động",
    key: "action",
    align: "center",
    width: 180,
    render: (_, record: NotificationProps) => (
      <Space size="small">
        {!record.isRead && (
          <Button
            size="small"
            type="primary"
            onClick={() => handleMarkAsRead(record.id)}
            loading={isLoading}
          >
            Đã đọc
          </Button>
        )}
        <Button
          size="small"
          type="default"
          onClick={() => openDetailModal(record)}
          icon={<BiInfoCircle />}
        >
          Xem chi tiết
        </Button>
        {/* {record.actionUrl && (
          <Link to={record.actionUrl} target="_blank" rel="noopener noreferrer">
            <Button size="small" type="link" icon={<IoLinkOutline />}>
              Mở link
            </Button>
          </Link>
        )} */}
      </Space>
    ),
  },
];
