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
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  type customerData,
  type UpdateCustomerProps,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";
import FancyFormItem from "@/components/FancyFormItem";
import FancyButton from "@/components/FancyButton";

interface CustomerModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateCustomer(props: CustomerModalProps) {
  const { id, isOpen, onClose, onReload } = props;
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [customer, setCustomer] = useState<customerData | null>(null);

  const { refetch } = useGetCustomerByIdQuery(id);
  const [updateCustomer] = useUpdateCustomerMutation();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await refetch();
      const customerData = res.data;

      if (customerData) {
        form.setFieldsValue({
          ...customerData,
          birth_date: customerData.birth_date
            ? dayjs(customerData.birth_date)
            : null,
        });
        setCustomer(customerData as customerData);
      }
    } catch {
      showError("Lấy thông tin khách hàng thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && id) {
      form.resetFields();
      fetchData();
    }
  }, [isOpen, id]);

  const onFinish = async (values: UpdateCustomerProps) => {
    if (!customer) return;

    const payload: UpdateCustomerProps = {
      ...values,
      birth_date: values.birth_date
        ? dayjs(values.birth_date).format("YYYY-MM-DD")
        : "",
      isVerified: true,
    };

    setIsLoading(true);
    try {
      const res = await updateCustomer({ id, customerData: payload });
      if (!res.error) {
        showSuccess("Cập nhật tài khoản thành công");
        onReload();
        onClose();
      } else {
        showError(
          "Cập nhật tài khoản thất bại",
          extractErrorMessage(res.error) ||
            "Đã xảy ra lỗi khi cập nhật tài khoản."
        );
      }
    } catch {
      showError(
        "Đã có lỗi xảy ra"
        // extractErrorMessage(error) || "Vui lòng thử lại sau."
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
      title="Cập nhật thông tin khách hàng"
    >
      <Spin spinning={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ padding: "0 24px 16px" }}
        >
          <Row gutter={[24, 12]}>
            <Col span={12}>
              <FancyFormItem
                label="Họ và tên"
                name="full_name"
                type="text"
                placeholder="Nhập họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
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

            <Col span={12}>
              <FancyFormItem
                label="Số điện thoại"
                name="phone"
                type="text"
                placeholder="Nhập số điện thoại"
              />
            </Col>

            <Col span={12}>
              <FancyFormItem
                label="Địa chỉ"
                name="address"
                type="text"
                placeholder="Nhập địa chỉ"
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
              />
            </Col>

            <Col span={12}>
              <Form.Item label="Ngày sinh" name="birth_date">
                <DatePicker
                  format="YYYY-MM-DD"
                  style={{ width: "100%", borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <FancyFormItem
                label="Loại khách hàng"
                name="customer_type"
                type="select"
                options={[
                  { label: "Thường", value: "regular" },
                  { label: "Thành viên", value: "member" },
                  { label: "VIP", value: "vip" },
                  { label: "Thử nghiệm", value: "trial" },
                ]}
              />
            </Col>

            <Col span={12}>
              <Form.Item
                label="Tổng chi tiêu"
                name="total_spent"
                rules={[
                  {
                    pattern: /^\d+(\.\d{1,2})?$/,
                    message: "Giá trị không hợp lệ (chỉ số thập phân)",
                  },
                ]}
              >
                <Input placeholder="0.00" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" className="mt-4">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <FancyButton
                onClick={() => form.submit()}
                icon={<></>}
                label="Cập nhật khách hàng"
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
