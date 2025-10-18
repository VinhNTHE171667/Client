import { Button, Dropdown, Space, Tag, Tooltip, type MenuProps } from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { DoctorModelTable } from "./type";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";

export const doctorColumn = (): ColumnsType<DoctorModelTable> => [
  {
    title: "STT",
    dataIndex: "index",
    width: 60,
    align: "center",
    render: (_, __, index) => <span>{index + 1}</span>,
  },
  {
    title: "Bác sĩ",
    dataIndex: "full_name",
    render: (_, record) => (
      <Space size={12}>
        <AvatarTable
          src={record.avatar ?? NoAvatarImage}
          alt="avatar"
          fallback={NoAvatarImage}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {record.full_name}
          </div>
          <div style={{ color: "#8c8c8c", fontSize: 12 }}>{record.email}</div>
        </div>
      </Space>
    ),
  },
  {
    title: "Giới tính",
    dataIndex: "gender",
    align: "center",
    render: (text) => {
      const genderMap: Record<string, { label: string; color: string }> = {
        male: { label: "Nam", color: "geekblue" },
        female: { label: "Nữ", color: "magenta" },
        other: { label: "Khác", color: "default" },
      };
      const { label, color } = genderMap[text] || genderMap.other;
      return <Tag color={color}>{label}</Tag>;
    },
    filters: [
      { text: "Nam", value: "male" },
      { text: "Nữ", value: "female" },
      { text: "Khác", value: "other" },
    ],
    onFilter: (value, record) => record.gender === value,
  },
  {
    title: "Số điện thoại",
    dataIndex: "phone",
    width: 140,
  },
  {
    title: "Tiểu sử",
    dataIndex: "biography",
    render: (biography) => {
      return (
        <span className="text-muted fst-italic">
          {biography || "Không có tiểu sử"}
        </span>
      );
    },
  },
  {
    title: "Chuyên môn",
    dataIndex: "specialization",
  },
  {
    title: "Năm kinh nghiệm",
    dataIndex: "experience_years",
    align: "center",
    sorter: (a, b) => a.experience_years - b.experience_years,
    onFilter: (value, record) => record.experience_years === value,
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    align: "center",
    render: (_, record) => (
      <Tag color={record.isActive ? "success" : "error"}>
        {record.isActive ? "Kích hoạt" : "Ngừng kích hoạt"}
      </Tag>
    ),
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
    align: "center",
    render: (_, record) => {
      const menuItems: MenuProps["items"] = [
        {
          key: "edit",
          label: (
            <div onClick={() => record.onUpdate?.()}>
              <Space>
                <EditOutlined /> Cập nhật
              </Space>
            </div>
          ),
        },
        {
          type: "divider",
        },
        {
          key: "delete",
          label: (
            <div onClick={() => record.onRemove?.()}>
              <Space>
                <DeleteOutlined /> Xóa
              </Space>
            </div>
          ),
        },
      ];

      return (
        <Tooltip title="Thao tác" placement="left">
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <Button
              type="text"
              icon={<EllipsisOutlined style={{ fontSize: 18 }} />}
            />
          </Dropdown>
        </Tooltip>
      );
    },
  },
];
