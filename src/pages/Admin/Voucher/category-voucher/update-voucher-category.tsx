import { useState, useEffect } from "react";
import { Button, Form, Input, Modal, Switch, Space, message } from "antd";
import {
  useGetVoucherCategoryByIdQuery,
  useUpdateVoucherCategoryMutation,
} from "@/services/voucher";

interface UpdateVoucherCategoryProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateVoucherCategory({
  id,
  isOpen,
  onClose,
  onReload,
}: UpdateVoucherCategoryProps) {
  const [form] = Form.useForm();
  const { data: category } = useGetVoucherCategoryByIdQuery(id, {
    skip: !isOpen && !id,
  });
  const [updateCategory] = useUpdateVoucherCategoryMutation();

  useEffect(() => {
    if (category && isOpen) {
      form.setFieldsValue({
        name: category.name,
        prefix: category.prefix,
        isActive: category.isActive,
      });
    }
  }, [category, isOpen, form]);

  const handleSubmit = async (values: any) => {
    try {
      await updateCategory({ id, body: values }).unwrap();
      message.success("Cập nhật danh mục voucher thành công");
      form.resetFields();
      onClose();
      onReload();
    } catch (error) {
      message.error("Cập nhật danh mục voucher thất bại");
    }
  };

  return (
    <Modal
      title="Cập nhật danh mục voucher"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="name"
          label="Tên danh mục"
          rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
        >
          <Input placeholder="Nhập tên danh mục" />
        </Form.Item>

        <Form.Item
          name="prefix"
          label="Prefix"
          rules={[
            { required: true, message: "Vui lòng nhập prefix (phải unique)" },
          ]}
        >
          <Input placeholder="Nhập prefix (ví dụ: TET26)" />
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Trạng thái hoạt động"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit">
              Cập nhật
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
