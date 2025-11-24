import { Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { voucherData } from "@/services/voucher";

export const VoucherColumn = (): ColumnsType<voucherData> => [
  {
    title: "STT",
    dataIndex: "index",
    width: 70,
    align: "center",
    render: (_, __, index) => <span>{index + 1}</span>,
  },
  {
    title: "Mã voucher",
    dataIndex: "code",
    ellipsis: true,
    width: 180,
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    ellipsis: true,
    width: 250,
  },
  {
    title: "Giảm tiền",
    dataIndex: "discountAmount",
    align: "right",
    width: 120,
    render: (value) =>
      Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
  },
  {
    title: "Giảm %",
    dataIndex: "discountPercent",
    align: "right",
    width: 100,
      render: (value) => (value != null && value !== "" ? `${value}%` : "-"),
  },
  {
    title: "Giảm tối đa",
    dataIndex: "maxDiscount",
    align: "right",
    width: 120,
    render: (value) =>
      Number(value).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
  },
  {
    title: "Thời gian hiệu lực",
    dataIndex: "validFrom",
    align: "center",
    width: 200,
    render: (_, record) =>
      `${dayjs(record.validFrom).format("DD/MM/YYYY")} - ${dayjs(
        record.validTo
      ).format("DD/MM/YYYY")}`,
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    align: "center",
    width: 100,
    render: (value) => (
      <Tag color={value ? "green" : "red"}>{value ? "Hoạt động" : "Ngưng"}</Tag>
    ),
  },
];
