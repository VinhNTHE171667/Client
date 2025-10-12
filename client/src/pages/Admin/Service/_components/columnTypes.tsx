import { Button, Dropdown, Space, Tag, type MenuProps } from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { servicesModelTable } from "./type";
import type { categoriesModelTable } from "../../Categories/_components/type";

export const servicesColumn = (
  categories: categoriesModelTable[]
): ColumnsType<servicesModelTable> => [
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
    title: "Hình ảnh",
    dataIndex: "images",
    width: 80,
    render: (images) => {
      const url = images?.[0]?.url;
      return url ? (
        <img
          src={url}
          alt="thumbnail"
          style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8 }}
        />
      ) : (
        <span className="text-muted fst-italic">Không có ảnh</span>
      );
    },
  },
  {
    title: "Tên dịch vụ",
    dataIndex: "name",
  },
  {
    title: "Giá",
    dataIndex: "price",
    render: (price) => {
      return <span>{new Intl.NumberFormat("vi-VN").format(price)} đ</span>;
    },
    sorter: (a, b) => a.price - b.price,
    // defaultSortOrder: "ascend",
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    render: (description) => {
      return (
        <span className="text-muted fst-italic">
          {description || "Không có mô tả"}
        </span>
      );
    },
  },
  {
    title: "Danh mục",
    dataIndex: "categoryName",
    render: (_, record) => {
      return <span>{record.category?.name || "Chưa có danh mục"}</span>;
    },
    filters: categories.map((category) => ({
      text: category.name,
      value: category.id,
    })),
    onFilter: (value, record) => record.categoryId === value,
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
