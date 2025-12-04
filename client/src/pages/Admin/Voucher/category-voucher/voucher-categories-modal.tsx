import { useState } from "react";
import { Button, Modal, Table, Space, Typography, Popconfirm, Tag } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { showError, showSuccess } from "@/libs/toast";
import {
  useGetVoucherCategoriesQuery,
  useDeleteVoucherCategoryMutation,
} from "@/services/voucher";

import UpdateVoucherCategory from "./update-voucher-category";
import AddVoucherCategory from "./add-voucher-category";

const { Title } = Typography;

interface VoucherCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload?: () => void; 
}

export default function VoucherCategoriesModal({
  isOpen,
  onClose,
  onReload, 
}: VoucherCategoriesModalProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateCategoryId, setUpdateCategoryId] = useState<string>("");

  const { data: categories = [], isLoading, refetch } = useGetVoucherCategoriesQuery(undefined, { skip: !isOpen });
  const [deleteCategory] = useDeleteVoucherCategoryMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id).unwrap();
      showSuccess("Xoá danh mục voucher thành công");
      await refetch();  // Refetch categories list in modal
      if (onReload) onReload();  // Also refetch parent vouchers if provided
    } catch (error) {
      showError(
        "Xoá danh mục voucher thất bại",
        "Đã xảy ra lỗi khi xoá danh mục voucher."
      );
    }
  };

  const handleEdit = (id: string) => {
    setUpdateCategoryId(id);
    setUpdateModalOpen(true);
  };

  // Function to handle success in sub-modals: refetch modal data and optionally parent
  const handleSubModalSuccess = async () => {
    try {
      await refetch();  // Refetch categories (await to ensure complete before close)
      if (onReload) await onReload();  // Refetch vouchers (async if needed)
    } catch (error) {
      console.error("Refetch error:", error);
    }
  };

  const columns = [
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Prefix",
      dataIndex: "prefix",
      key: "prefix",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Không hoạt động"}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={<Title level={4}>Danh mục voucher</Title>}
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => setAddModalOpen(true)}>
            Thêm danh mục
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </Modal>

      <AddVoucherCategory
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onReload={handleSubModalSuccess}  
      />

      <UpdateVoucherCategory
        id={updateCategoryId}
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        onReload={handleSubModalSuccess} 
      />
    </>
  );
}