import { Button, Form, Input, Modal, Row, Space, Spin, Switch } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";
import {
  useCreateCategoryMutation,
  type CreateCategory,
} from "@/services/services";

interface SpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function AddSpa(props: SpaModalProps) {
  const { isOpen, onClose, onReload } = props;

  const [form] = useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen]);

  const [createCategory] = useCreateCategoryMutation();

  const onFinish = async (values: CreateCategory) => {
    setIsLoading(true);

    const payload = {
      ...values,
    };

    try {
      const res = await createCategory(payload);

      if (!res.error) {
        onReload();
        showSuccess("Tạo danh mục thành công");
        onClose();
      } else {
        const err = res.error as {
          data?: { message?: string | string[] };
        };

        showError(
          "Tạo danh mục thất bại",
          extractErrorMessage(err) || "Đã xảy ra lỗi khi tạo danh mục."
        );
      }
    } catch {
      showError(
        "Đã có lỗi xảy ra",
        "Vui lòng kiểm tra lại thông tin và thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={isOpen}
        width={800}
        onCancel={onClose}
        footer={null}
        closable={false}
      >
        <Spin spinning={isLoading}>
          <h3 className="text-center">Tạo danh mục mới</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: "16px" }}
            initialValues={{ isActive: true }}
          >
            <Form.Item
              label="Tên danh mục"
              name="name"
              rules={[
                { required: true, message: "Vui lòng nhập tên danh mục" },
              ]}
            >
              <Input placeholder="Nhập tên danh mục" />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
              <Input.TextArea
                placeholder="Nhập mô tả"
                autoSize={{ minRows: 3, maxRows: 5 }}
              />
            </Form.Item>

            <Form.Item
              label="Hoạt động"
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Row justify="center">
              <Space size="large">
                <Button onClick={onClose}>Huỷ</Button>
                <Button type="primary" htmlType="submit">
                  Tạo danh mục
                </Button>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
