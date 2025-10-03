import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { Button, Form, Input, Modal, Row, Space, Spin, Switch } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import { useCreateSpaMutation, type CreateSpaProps } from "@/services/account";
import { extractErrorMessage } from "@/utils/func";

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

  const [createSpa] = useCreateSpaMutation();

  const onFinish = async (values: CreateSpaProps) => {
    setIsLoading(true);

    const payload = {
      ...values,
    };

    try {
      const res = await createSpa(payload);

      if (!res.error) {
        onReload();
        showSuccess("Tạo spa thành công");
        onClose();
      } else {
        const err = res.error as {
          data?: { message?: string | string[] };
        };

        showError(
          "Tạo spa thất bại",
          extractErrorMessage(err) || "Đã xảy ra lỗi khi tạo spa."
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
          <h3 className="text-center">Tạo spa mới</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: "16px" }}
            initialValues={{ isActive: true }}
          >
            <Form.Item
              label="Tên Spa"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên spa" }]}
            >
              <Input placeholder="Nhập tên spa" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                placeholder="Nhập mật khẩu"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>

            <Form.Item label="Website" name="website">
              <Input placeholder="Nhập website (nếu có)" />
            </Form.Item>

            <Form.Item label="Logo" name="logo">
              <Input placeholder="URL hình ảnh logo (nếu có)" />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
              <Input.TextArea placeholder="Mô tả spa (nếu có)" rows={3} />
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
                  Tạo spa
                </Button>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
