import { showError, showSuccess } from "@/libs/toast";
import {
  useGetSpaByIdQuery,
  useUpdateSpaMutation,
  type UpdateSpaProps,
} from "@/services/account";
import { extractErrorMessage } from "@/utils/func";
import { Button, Form, Input, Modal, Row, Space, Spin, Switch } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";

interface SpaModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateSpa(props: SpaModalProps) {
  const { id, isOpen, onClose, onReload } = props;
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: spaData } = useGetSpaByIdQuery(id, {
    skip: !isOpen || !id,
  });

  useEffect(() => {
    if (spaData) {
      form.setFieldsValue(spaData);
    }
  }, [spaData]);

  useEffect(() => {
    if (isOpen && id) {
      form.resetFields();
      if (spaData) {
        form.setFieldsValue(spaData);
      }
    }
  }, [isOpen, id, spaData]);

  const [updateSpa] = useUpdateSpaMutation();

  const onFinish = async (values: UpdateSpaProps) => {
    setIsLoading(true);
    try {
      const res = await updateSpa({
        id,
        spaData: values,
      });

      if (!res.error) {
        showSuccess("Cập nhật tài khoản thành công");
        onReload();
        onClose();
      } else {
        const err = res.error as {
          data?: { message?: string | string[] };
        };
        showError(
          "Cập nhật tài khoản thất bại",
          extractErrorMessage(err) || "Đã xảy ra lỗi khi cập nhật tài khoản."
        );
      }
    } catch (error) {
      showError(
        "Đã có lỗi xảy ra",
        extractErrorMessage(
          error as { data?: { message?: string | string[] } }
        ) || "Vui lòng kiểm tra lại thông tin và thử lại"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={isOpen}
        width={700}
        onCancel={onClose}
        footer={null}
        closable={false}
      >
        <Spin spinning={isLoading}>
          <h3 className="text-center">Cập nhật thông tin Spa</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: 16 }}
          >
            <Form.Item
              label="Tên Spa"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên spa" }]}
            >
              <Input placeholder="Nhập tên spa" />
            </Form.Item>

            <Form.Item label="Địa chỉ" name="address">
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>

            <Form.Item label="Số điện thoại" name="phone">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ type: "email", message: "Email không hợp lệ" }]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>

            <Form.Item label="Website" name="website">
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item label="Logo (URL)" name="logo">
              <Input placeholder="URL logo" />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
              <Input.TextArea placeholder="Nhập mô tả ngắn" rows={4} />
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
                  Lưu lại
                </Button>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
