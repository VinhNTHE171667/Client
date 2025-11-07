import { Button, Dropdown, Space, Tag, Typography } from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  PercentageOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { MembershipModelTable } from "./type";

const { Text } = Typography;

export const membershipsColumn = (): ColumnsType<MembershipModelTable> => [
  {
    title: "STT",
    dataIndex: "index",
    align: "center",
    width: 70,
    render: (_, __, index) => <Text strong>{index + 1}</Text>,
  },
  {
    title: "Tên hạng thành viên",
    dataIndex: "name",
    render: (name) => (
      <Tag color="blue" style={{ fontWeight: 600, fontSize: 13 }}>
        {name}
      </Tag>
    ),
  },
  {
    title: "Giảm giá",
    dataIndex: "discountPercent",
    align: "center",
    render: (_, record) => (
      <Tag
        color="green"
        icon={<PercentageOutlined />}
        style={{ fontWeight: 500 }}
      >
        {record.discountPercent}%
      </Tag>
    ),
  },
  {
    title: "Ngưỡng chi tiêu",
    dataIndex: "minSpent",
    align: "center",
    render: (_, record) => (
      <Text>
        {Number(record.minSpent).toLocaleString()}₫
        {record.maxSpent
          ? ` - ${Number(record.maxSpent).toLocaleString()}₫`
          : " trở lên"}
      </Text>
    ),
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    align: "center",
    render: (createdAt) => (
      <Text type="secondary">
        <CalendarOutlined style={{ marginRight: 4 }} />
        {dayjs(createdAt).format("DD/MM/YYYY")}
      </Text>
    ),
  },
  {
    title: "",
    dataIndex: "operation",
    fixed: "right",
    align: "right",
    width: 70,
    render: (_, record) => {
      const items: MenuProps["items"] = [
        {
          key: "edit",
          label: (
            <div onClick={record.onUpdate}>
              <Space>
                <EditOutlined /> Cập nhật
              </Space>
            </div>
          ),
        },
      ];

      return (
        <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
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
