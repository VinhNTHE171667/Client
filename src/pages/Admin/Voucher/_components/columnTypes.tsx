import { Button, Dropdown, Space, Tag, Tooltip, Typography } from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  PercentageOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { VoucherModelTable } from "./type";
import dayjs from "dayjs";

const { Text } = Typography;

export const vouchersColumn = (): ColumnsType<VoucherModelTable> => [
  {
    title: "STT",
    dataIndex: "index",
    width: 60,
    align: "center",
    render: (_, __, index) => <Text strong>{index + 1}</Text>,
  },
  {
    title: "Mã Voucher",
    dataIndex: "code",
    render: (code) => (
      <Tag color="blue" style={{ fontWeight: 600, fontSize: 13 }}>
        {code}
      </Tag>
    ),
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    ellipsis: true,
    render: (desc) => (
      <Tooltip title={desc}>
        <Text>{desc || <i>Không có mô tả</i>}</Text>
      </Tooltip>
    ),
  },
  {
    title: "Giảm giá",
    dataIndex: "discountPercent",
    align: "center",
    render: (_, record) => {
      if (record.discountPercent) {
        return (
          <Tag icon={<PercentageOutlined />} color="green">
            {record.discountPercent}%
          </Tag>
        );
      }
      if (record.discountAmount) {
        return (
          <Tag icon={<DollarOutlined />} color="volcano">
            {record.discountAmount.toLocaleString()}₫
          </Tag>
        );
      }
      return <Tag color="default">Không</Tag>;
    },
  },
  {
    title: "Thời gian hiệu lực",
    dataIndex: "validFrom",
    render: (_, record) => (
      <div style={{ lineHeight: 1.2 }}>
        <Tooltip
          title={`Từ ${dayjs(record.validFrom).format(
            "DD/MM/YYYY"
          )} đến ${dayjs(record.validTo).format("DD/MM/YYYY")}`}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            <CalendarOutlined /> {dayjs(record.validFrom).format("DD/MM")} →{" "}
            {dayjs(record.validTo).format("DD/MM")}
          </Text>
        </Tooltip>
      </div>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    render: (_, record) => {
      return (
        <>
          <Tag color="lime">
            {record.isActive ? "Kích hoạt" : "Ngừng kích hoạt"}
          </Tag>
        </>
      );
    },
    filters: [
      { text: "Kích hoạt", value: true },
      { text: "Ngừng kích hoạt", value: false },
    ],
    onFilter: (value, record) => record.isActive === value,
  },
  {
    title: "",
    dataIndex: "operation",
    fixed: "right",
    align: "right",
    width: 60,
    render: (_, record) => {
      const renderItems = (
        onUpdate: () => void,
        onRemove: () => void
      ): MenuProps["items"] => [
        {
          label: (
            <div onClick={onUpdate}>
              <Space>
                <EditOutlined /> Cập nhật
              </Space>
            </div>
          ),
          key: "update",
        },
        { type: "divider" },
        {
          label: (
            <div onClick={onRemove} style={{ color: "red" }}>
              <Space>
                <DeleteOutlined /> Xoá
              </Space>
            </div>
          ),
          key: "remove",
        },
      ];

      return (
        <Dropdown
          menu={{
            items: renderItems(record.onUpdate!, record.onRemove!),
          }}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<EllipsisOutlined />}
            size="middle"
            style={{ color: "#595959" }}
          />
        </Dropdown>
      );
    },
  },
];
