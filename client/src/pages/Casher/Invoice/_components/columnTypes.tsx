import { Space, Tag, Button, EyeOutlined } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";
import type { InvoiceProps } from "@/services/appointment";

type ViewDetailHandler = (invoice: InvoiceProps) => void;

export const InvoiceColumn = (onViewDetail: ViewDetailHandler): ColumnsType<InvoiceProps> => [
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
    width: 200,
    render: (_, record: InvoiceProps) => (
      <Space size={12}>
        <AvatarTable
          src={record.customer?.avatar ?? NoAvatarImage}
          alt="avatar"
          fallback={NoAvatarImage}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {record.customer?.full_name || "Khách hàng"}
          </div>
          <div style={{ color: "#8c8c8c", fontSize: 12 }}>
            {record.customer?.email || "N/A"}
          </div>
        </div>
      </Space>
    ),
  },
  {
    title: "Ngày hẹn",
    dataIndex: "appointment",
    width: 150,
    align: "center",
    render: (_, record: InvoiceProps) =>
      record.appointment
        ? dayjs(record.appointment.appointment_date).format("DD/MM/YYYY HH:mm")
        : "N/A",
    sorter: (a, b) =>
      dayjs(a.appointment?.appointment_date).unix() - dayjs(b.appointment?.appointment_date).unix(),
  },
  {
    title: "Dịch vụ",
    dataIndex: "details",
    width: 250,
    render: (_, record: InvoiceProps) => {
      if (!record.details || record.details.length === 0) return "N/A";
      return (
        <Space direction="vertical" size="small">
          {record.details.slice(0, 3).map((detail) => (
            <div key={detail.id}>
              <span style={{ fontWeight: 500 }}>{detail.service?.name || "Dịch vụ"}</span>
              <span style={{ color: "#666", marginLeft: 8 }}>
                x{detail.quantity} - {detail.price?.toLocaleString("vi-VN")}₫
              </span>
            </div>
          ))}
          {record.details.length > 3 && (
            <span style={{ color: "#999", fontSize: 12 }}>
              +{record.details.length - 3} dịch vụ khác
            </span>
          )}
        </Space>
      );
    },
  },
  {
    title: "Loại hoá đơn",
    dataIndex: "invoice_type",
    align: "center",
    width: 120,
    render: (value: string) =>
      value === "deposit" ? (
        <Tag color="blue">Đặt cọc</Tag>
      ) : (
        <Tag color="green">Thanh toán cuối</Tag>
      ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    align: "center",
    width: 130,
    render: (value: string) => {
      const colorMap: Record<string, string> = {
        pending: "orange",
        confirmed: "blue",
        paid: "green",
        cancelled: "red",
        completed: "purple",
      };
      const textMap: Record<string, string> = {
        pending: "Chờ xử lý",
        confirmed: "Đã xác nhận",
        paid: "Đã thanh toán",
        cancelled: "Đã huỷ",
        completed: "Hoàn tất",
      };
      return <Tag color={colorMap[value] || "default"}>{textMap[value] || value}</Tag>;
    },
  },
  {
    title: "Trạng thái thanh toán",
    dataIndex: "payment_status",
    align: "center",
    width: 150,
    render: (value: string) => {
      const colorMap: Record<string, string> = {
        unpaid: "orange",
        paid: "green",
        refunded: "red",
      };
      const textMap: Record<string, string> = {
        unpaid: "Chưa thanh toán",
        paid: "Đã thanh toán",
        refunded: "Hoàn tiền",
      };
      return <Tag color={colorMap[value] || "default"}>{textMap[value] || value}</Tag>;
    },
  },
  {
    title: "Phương thức thanh toán",
    dataIndex: "payment_method",
    align: "center",
    width: 150,
    render: (value: string) =>
      value ? (
        <Tag color={value === "qr" ? "cyan" : "geekblue"}>
          {value === "qr" ? "QR/Banking" : "Tiền mặt"}
        </Tag>
      ) : (
        <em>—</em>
      ),
  },
  {
    title: "Nhân viên thu tiền",
    dataIndex: "cashier",
    width: 180,
    render: (_, record: InvoiceProps) => (
      <Space>
        {record.cashier ? (
          <>
            <AvatarTable
              src={record.cashier.avatar ?? NoAvatarImage}
              alt="cashier avatar"
            />
            <div>
              <div style={{ fontWeight: 500 }}>{record.cashier.full_name}</div>
              <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                {record.cashier.role?.name || "Staff"}
              </div>
            </div>
          </>
        ) : (
          <span style={{ color: "#999" }}>N/A</span>
        )}
      </Space>
    ),
  },
  {
    title: "Tổng tiền",
    dataIndex: "total",
    align: "right",
    width: 150,
    render: (value: string | number) =>
      Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
    sorter: (a, b) => Number(a.total) - Number(b.total),
  },
  {
    title: "Giảm giá",
    dataIndex: "discount",
    align: "right",
    width: 120,
    render: (value: string | number) =>
      Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
    sorter: (a, b) => Number(a.discount) - Number(b.discount),
  },
  {
    title: "Thành tiền",
    dataIndex: "finalAmount",
    align: "right",
    width: 150,
    render: (value: string | number) =>
      Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
    sorter: (a, b) => Number(a.finalAmount) - Number(b.finalAmount),
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    align: "center",
    width: 150,
    render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm"),
    sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
  },
  {
    title: "Hành động",
    key: "action",
    align: "center",
    width: 120,
    render: (_, record: InvoiceProps, index: number) => (
      <Space size="middle">
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => onViewDetail(record)}
          size="small"
          title="Xem chi tiết hóa đơn"
        >
          Xem chi tiết
        </Button>
      </Space>
    ),
  },
];