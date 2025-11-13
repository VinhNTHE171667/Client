/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";
import type { InvoiceProps } from "@/services/appointment";

export const InvoiceColumn = (): ColumnsType<InvoiceProps> => [
  {
    title: "STT",
    dataIndex: "index",
    width: 70,
    align: "center",
    render: (_, __, index) => <span>{index + 1}</span>,
  },
  // {
  //   title: "Mã hoá đơn",
  //   dataIndex: "id",
  //   ellipsis: true,
  //   width: 240,
  // },
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
    title: "Loại hoá đơn",
    dataIndex: "invoice_type",
    align: "center",
    width: 120,
    render: (value) =>
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
    render: (value) => {
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
      return <Tag color={colorMap[value]}>{textMap[value]}</Tag>;
    },
  },
  {
    title: "Trạng thái thanh toán",
    dataIndex: "payment_status",
    align: "center",
    width: 150,
    render: (value) => {
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
      return <Tag color={colorMap[value]}>{textMap[value]}</Tag>;
    },
  },
  {
    title: "Phương thức thanh toán",
    dataIndex: "payment_method",
    align: "center",
    width: 150,
    render: (value) =>
      value ? (
        <Tag color={value === "qr" ? "cyan" : "geekblue"}>
          {value === "qr" ? "QR" : "Tiền mặt"}
        </Tag>
      ) : (
        <em>—</em>
      ),
  },
  {
    title: "Tổng tiền",
    dataIndex: "total",
    align: "right",
    width: 150,
    render: (value) =>
      Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
  },
  {
    title: "Giảm giá",
    dataIndex: "discount",
    align: "right",
    width: 120,
    render: (value) =>
      Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
  },
  {
    title: "Thành tiền",
    dataIndex: "finalAmount",
    align: "right",
    width: 150,
    render: (value) =>
      Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    align: "center",
    width: 150,
    render: (value) => dayjs(value).format("DD/MM/YYYY HH:mm"),
    sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
  },
];
