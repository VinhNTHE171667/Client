import { Button, Dropdown, Space, Tag, type MenuProps } from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { CustomerModelTable } from "./type";
import type { ColumnsType } from "antd/es/table";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";
import AvatarTable from "@/components/AvatarTable";

export const customerColumn = (): ColumnsType<CustomerModelTable> => [
  {
    title: "STT",
    dataIndex: "index",
    width: 50,
    // fixed: "center",
    render: (_, __, index) => {
      return <span>{index + 1}</span>;
    },
  },
  {
    title: "Avatar",
    dataIndex: "avatar",
    render: (_, record) => {
      return (
        <AvatarTable
          src={record.avatar ?? NoAvatarImage}
          alt={"avatar"}
          // className={cx("user-avatar")}
          fallback={NoAvatarImage}
        />
      );
    },
  },
  {
    title: "Họ và tên",
    dataIndex: "full_name",
  },
  {
    title: "Giới tính",
    dataIndex: "gender",
    render: (text) => {
      return (
        <Tag
          color={text === "male" ? "blue" : text === "female" ? "pink" : "gray"}
        >
          {text === "male" ? "Nam" : text === "female" ? "Nữ" : "Khác"}
        </Tag>
      );
    },
    filters: [
      { text: "Nam", value: "male" },
      { text: "Nữ", value: "female" },
      { text: "Khác", value: "other" },
    ],
    onFilter: (value, record) => record.gender === value,
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Số điện thoại",
    dataIndex: "phone",
  },
  // {
  //   title: "Địa chỉ",
  //   dataIndex: "address",
  // },
  {
    title: "Loại khách hàng",
    dataIndex: "customer_type",
    render: (text) => {
      return (
        <Tag color={text === "vip" ? "gold" : "green"}>
          {text === "regular"
            ? "Thường"
            : text === "vip"
            ? "VIP"
            : text === "member"
            ? "Thành viên"
            : "Dùng thử"}
        </Tag>
      );
    },
    filters: [
      { text: "Thường", value: "regular" },
      { text: "VIP", value: "vip" },
      { text: "Thành viên", value: "member" },
    ],
    onFilter: (value, record) => record.customer_type === value,
  },
  {
    title: "Tổng chi tiêu",
    dataIndex: "total_spent",
    render: (text) => {
      return <span>{text} VNĐ</span>;
    },
    sorter: (a, b) => Number(a.total_spent) - Number(b.total_spent),
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
    render: (_, record) => {
      const renderItems = (
        onUpdate: () => void,
        onRemove: () => void
      ): MenuProps["items"] => {
        return [
          {
            label: (
              <a
                onClick={() => {
                  onUpdate?.();
                }}
              >
                <Space>
                  <EditOutlined /> {"Cập nhật"}
                </Space>
              </a>
            ),
            key: "0",
          },
          // {
          //   label: (
          //     <a
          //       onClick={() => {
          //         onDisable?.();
          //       }}
          //     >
          //       <Space>
          //         <MdDisabledByDefault /> Disable
          //       </Space>
          //     </a>
          //   ),
          //   key: '1'
          // },
          {
            type: "divider",
          },
          {
            label: (
              <div
                onClick={() => {
                  onRemove?.();
                }}
              >
                <Space>
                  <DeleteOutlined /> {"Xóa"}
                </Space>
              </div>
            ),
            key: "2",
          },
        ];
      };
      return (
        <>
          <Dropdown
            menu={{
              items: renderItems(record.onUpdate!, record.onRemove!),
            }}
          >
            <a onClick={(e) => e.preventDefault()}>
              <Space>
                <Button type="text" icon={<EllipsisOutlined />}></Button>
              </Space>
            </a>
          </Dropdown>
        </>
      );
    },
  },
];
