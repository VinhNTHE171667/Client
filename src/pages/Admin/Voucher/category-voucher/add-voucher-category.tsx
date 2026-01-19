import { useState } from "react";
import { Button, Form, Input, Modal, Switch, Space, message } from "antd";
import { useCreateVoucherCategoryMutation } from "@/services/voucher";

interface AddVoucherCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function AddVoucherCategory({
  isOpen,
  onClose,
  onReload,
}: AddVoucherCategoryProps) {
  const [form] = Form.useForm();
  const [createCategory] = useCreateVoucherCategoryMutation();

  const handleSubmit = async (values: any) => {
    try {
      await createCategory(values).unwrap();
      message.success("Thêm danh mục voucher thành công");
      form.resetFields();
      onClose();
      onReload();
    } catch (error) {
      message.error("Thêm danh mục voucher thất bại");
    }
  };

  return (
    <Modal
      title="Thêm danh mục voucher"
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
          initialValue={true}
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit">
              Thêm
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
