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
  useGetCustomersMutation,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
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

  const [
    triggerGetCustomers,
    {
      data: allCustomers = [],
      isLoading: loadingCustomers,
      isFetching: isFetchingCustomers,
    },
  ] = useGetCustomersMutation();

  const [createCustomer, { isLoading: isCreating }] =
    useCreateCustomerMutation();

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      triggerGetCustomers(undefined, true);
    }
  }, [isOpen, form, triggerGetCustomers]);

  const onFinish = async (values: any) => {
    const normalizedPhone = values.phone?.trim();
    const normalizedEmail = values.email?.trim().toLowerCase();

    const phoneExists = allCustomers.some(
      (c: any) => c.phone === normalizedPhone
    );

    const emailExists = allCustomers.some(
      (c: any) =>
        c.email && normalizedEmail && c.email.toLowerCase() === normalizedEmail
    );

    if (phoneExists) {
      form.setFields([
        { name: "phone", errors: ["Số điện thoại này đã được sử dụng"] },
      ]);
      showError("Trùng số điện thoại", "Khách hàng với số này đã tồn tại");
      return;
    }

    if (emailExists) {
      form.setFields([
        { name: "email", errors: ["Email này đã được đăng ký"] },
      ]);
      showError("Trùng email", "Vui lòng sử dụng email khác");
      return;
    }

    // Validate định dạng SĐT VN
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      form.setFields([
        {
          name: "phone",
          errors: ["Số điện thoại phải bắt đầu bằng 0 và có 10-11 số"],
        },
      ]);
      return;
    }

    setIsLoading(true);

    const payload = {
      full_name: values.full_name.trim(),
      gender: values.gender,
      birth_date: dayjs(values.birth_date).format("YYYY-MM-DD"),
      password: values.password,
      phone: normalizedPhone,
      email: normalizedEmail || null,
      address: values.address?.trim() || "",
      customer_type: "regular",
      total_spent: "0",
      isActive: true,
      isVerified: true,
    };

    try {
      await createCustomer(payload).unwrap();
      showSuccess("Tạo khách hàng thành công!");
      onReload();
      onClose();
      form.resetFields();
    } catch (error: any) {
      const msg =
        error?.data?.message ||
        "Đã xảy ra lỗi khi tạo khách hàng. Vui lòng thử lại.";

      showError("Tạo khách hàng thất bại", msg);
      console.error("Create customer error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isModalLoading =
    isLoading || isCreating || loadingCustomers || isFetchingCustomers;

  return (
    <Modal
      open={isOpen}
      width={800}
      onCancel={onClose}
      footer={null}
      closable={!isModalLoading}
      maskClosable={false}
      destroyOnClose
    >
      <Spin spinning={false}>
        <h3 className="text-center mb-6 text-xl font-semibold">
          Tạo khách hàng mới
        </h3>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ margin: "0 24px" }}
        >
          <Row gutter={[24, 16]}>
            <Col span={12}>
              <FancyFormItem
                label="Họ và tên"
                name="full_name"
                type="text"
                placeholder="Nhập họ và tên"
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
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày sinh"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu" },
                  { min: 6, message: "Mật khẩu phải từ 6 ký tự trở lên" },
                ]}
              >
                <Input.Password
                  placeholder="Nhập mật khẩu"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <FancyFormItem
                label="Số điện thoại"
                name="phone"
                type="text"
                placeholder="0901234567"
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
                placeholder="example@gmail.com"
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
                placeholder="Nhập địa chỉ thường trú"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
              />
            </Col>
          </Row>

          <Row justify="center" className="mt-8">
            <Space size="large">
              <Button onClick={onClose} disabled={isModalLoading}>
                Hủy
              </Button>
              <FancyButton
                htmlType="submit"
                label="Tạo khách hàng"
                variant="primary"
                loading={isModalLoading}
              />
            </Space>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}
