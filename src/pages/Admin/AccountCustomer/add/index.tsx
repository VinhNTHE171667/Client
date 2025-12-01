import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Col,
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
import FancyFormItem from "@/components/FancyFormItem";
import FancyButton from "@/components/FancyButton";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function AddCustomer(props: CustomerModalProps) {
  const { isOpen, onClose, onReload } = props;

  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);

  const [createCustomer] = useCreateCustomerMutation();

  useEffect(() => {
    if (isOpen) form.resetFields();
  }, [isOpen]);

  const onFinish = async (values: CreateCustomerProps) => {
    setIsLoading(true);
    const payload = {
      full_name: values.full_name,
      gender: values.gender,
      birth_date: dayjs(values.birth_date).format("YYYY-MM-DD"),
      password: values.password,
      phone: values.phone,
      email: values.email,
      address: values.address,
      customer_type: "regular",
      total_spent: "0",
      isActive: true,
      isVerified: true,
    };

    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(values.phone)) {
      showError("Số điện thoại không hợp lệ");
      return;
    }

    try {
      const res = await createCustomer(payload).unwrap();
      if (!res.error) {
        onReload();
        showSuccess("Tạo khách hàng thành công");
        onClose();
      } else {
        showError(
          "Tạo khách hàng thất bại",
          extractErrorMessage(res.error) || "Đã xảy ra lỗi khi tạo khách hàng."
        );
      }
    } catch {
      showError(
        "Đã có lỗi xảy ra"
        // extractErrorMessage(error) ||
        //   "Vui lòng kiểm tra lại thông tin và thử lại"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      width={800}
      onCancel={onClose}
      footer={null}
      closable={false}
    >
      <Spin spinning={isLoading}>
        <h3 className="text-center mb-4">Tạo khách hàng mới</h3>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ margin: "0 24px" }}
        >
          <Row gutter={[24, 12]}>
            <Col span={12}>
              <FancyFormItem
                label="Họ và tên"
                name="full_name"
                type="text"
                placeholder="Nhập họ tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              />
            </Col>

            <Col span={12}>
              <FancyFormItem
                label="Giới tính"
                name="gender"
                type="select"
                options={[
                  { label: "Nam", value: "male" },
                  { label: "Nữ", value: "female" },
                  { label: "Khác", value: "other" },
                ]}
                placeholder="Chọn giới tính"
                rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
              />
            </Col>

            <Col span={12}>
              <Form.Item
                label="Ngày sinh"
                name="birth_date"
                rules={[{ required: true, message: "Vui lòng chọn ngày sinh" }]}
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  style={{ width: "100%", borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                style={{ marginBottom: 12 }}
              >
                <Input.Password
                  placeholder="Nhập mật khẩu"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <FancyFormItem
                label="Số điện thoại"
                name="phone"
                type="text"
                placeholder="Nhập số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                ]}
              />
            </Col>

            <Col span={12}>
              <FancyFormItem
                label="Email"
                name="email"
                type="email"
                placeholder="Nhập email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              />
            </Col>

            <Col span={24}>
              <FancyFormItem
                label="Địa chỉ"
                name="address"
                type="text"
                placeholder="Nhập địa chỉ"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
              />
            </Col>
          </Row>

          <Row justify="center" className="mt-4">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <FancyButton
                onClick={() => form.submit()}
                icon={<></>}
                label="Tạo khách hàng"
                variant="primary"
                size="small"
                loading={isLoading}
                className="w-100"
              ></FancyButton>
            </Space>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}
