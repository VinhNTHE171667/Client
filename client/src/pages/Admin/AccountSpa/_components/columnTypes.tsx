import { Button, Dropdown, Space, Tag, type MenuProps } from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { SpaModelTable } from "./type";

export const spaColumn = (): ColumnsType<SpaModelTable> => [
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
    title: "Tên Spa",
    dataIndex: "name",
  },
  {
    title: "Địa chỉ",
    dataIndex: "address",
  },
  {
    title: "Số điện thoại",
    dataIndex: "phone",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Gói thành viên",
    dataIndex: "membership",
    render: (_, record) => {
      const level = record.membership?.level || "Chưa có";
      const color =
        level === "PREMIUM" ? "gold" : level === "BASIC" ? "blue" : "default";

      return <Tag color={color}>{level}</Tag>;
    },
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
