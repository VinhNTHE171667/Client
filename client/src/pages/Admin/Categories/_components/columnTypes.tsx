import { App, Button, Dropdown, Space, Tag, type MenuProps } from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { categoriesModelTable } from "./type";

export const categoriesColumn = (): ColumnsType<categoriesModelTable> => [
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
    title: "Tên danh mục",
    dataIndex: "name",
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
      const { modal } = App.useApp();
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
                onClick={(e) => {
                  e.stopPropagation();
                  modal.confirm({
                    title: "Bạn có chắc muốn xóa?",
                    okText: "Xóa",
                    okType: "danger",
                    cancelText: "Hủy",
                    onOk: () => onRemove?.(),
                  });
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
