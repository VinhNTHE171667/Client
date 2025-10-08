import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  useCreateCustomerMutation,
  type CreateCustomerProps,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function AddCustomer(props: CustomerModalProps) {
  const { isOpen, onClose, onReload } = props;

  const [form] = useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen]);

  const [createCustomer] = useCreateCustomerMutation();

  const onFinish = async (values: CreateCustomerProps) => {
    setIsLoading(true);

    const payload = {
      full_name: values.full_name,
      gender: values.gender,
      birth_date: dayjs(values.birth_date).format("YYYY-MM-DD").toString(),
      password: values.password,
      phone: values.phone,
      email: values.email,
      address: values.address,
      customer_type: "regular",
      total_spent: String(0),
      isActive: true,
      isVerified: true,
    };

    try {
      const res = await createCustomer(payload).unwrap();

      if (!res.error) {
        onReload();
        showSuccess("Tạo khách hàng thành công");
        onClose();
      } else {
        const err = res.error as {
          data?: { message?: string | string[] };
        };

        showError(
          "Tạo khách hàng thất bại",
          extractErrorMessage(err) || "Đã xảy ra lỗi khi tạo khách hàng."
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
        width={800}
        onCancel={onClose}
        footer={null}
        closable={false}
      >
        <Spin spinning={isLoading}>
          <h3 className="text-center">Tạo khách hàng mới</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: "16px" }}
          >
            <Form.Item
              label="Họ và tên"
              name="full_name"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input placeholder="Nhập họ tên" />
            </Form.Item>

            <Form.Item
              label="Giới tính"
              name="gender"
              rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
            >
              <Select
                placeholder="Chọn giới tính"
                options={[
                  { label: "Nam", value: "male" },
                  { label: "Nữ", value: "female" },
                  { label: "Khác", value: "other" },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Ngày sinh"
              name="birth_date"
              rules={[{ required: true, message: "Vui lòng chọn ngày sinh" }]}
            >
              <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
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

            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>

            <Row justify="center">
              <Space size="large">
                <Button onClick={onClose}>Huỷ</Button>
                <Button type="primary" htmlType="submit">
                  Tạo khách hàng
                </Button>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
