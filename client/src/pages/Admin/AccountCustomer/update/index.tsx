import { LoadingOutlined } from "@ant-design/icons";
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
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  type customerData,
  type UpdateCustomerProps,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";

interface CustomerModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateAdmin(props: CustomerModalProps) {
  const { id, isOpen, onClose, onReload } = props;
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customer, setCustomer] = useState<customerData | null>(null);

  const { refetch } = useGetCustomerByIdQuery(id);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await refetch();
      const customerData = res.data;

      if (customerData && customerData.birth_date) {
        form.setFieldsValue({
          ...customerData,
          birth_date: dayjs(customerData.birth_date),
        });
      } else {
        form.setFieldsValue(customerData);
      }

      setCustomer(customerData as customerData);
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

  const [updateCustomer] = useUpdateCustomerMutation();

  const onFinish = async (values: UpdateCustomerProps) => {
    if (!customer) return;

    const payload: UpdateCustomerProps = {
      ...values,
      birth_date: values.birth_date
        ? dayjs(values.birth_date).format("YYYY-MM-DD")
        : "",
    };

    payload.isVerified = true;

    setIsLoading(true);
    try {
      const res = await updateCustomer({
        id,
        customerData: payload,
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
        width={800}
        onCancel={onClose}
        footer={null}
        closable={false}
      >
        <Spin spinning={isLoading}>
          <h3 className="text-center">
            {"Cập nhật thông tin tài khoản khách hàng"}
          </h3>
          <Form
            form={form}
            name="update-admin-form"
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: "16px" }}
          >
            <Form.Item
              label="Full Name"
              name="full_name"
              rules={[{ required: true, message: "Please enter full name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Invalid email format" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Phone" name="phone">
              <Input />
            </Form.Item>

            <Form.Item label="Address" name="address">
              <Input />
            </Form.Item>

            <Form.Item label="Gender" name="gender">
              <Select
                options={[
                  { label: "Nam", value: "male" },
                  { label: "Nữ", value: "female" },
                  { label: "Khác", value: "other" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Birth Date" name="birth_date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Customer Type" name="customer_type">
              <Select
                options={[
                  { label: "Thường", value: "regular" },
                  { label: "Thành viên", value: "member" },
                  { label: "VIP", value: "vip" },
                  { label: "Thử nghiệm", value: "trial" },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Total Spent"
              name="total_spent"
              rules={[
                {
                  pattern: /^\d+(\.\d{1,2})?$/,
                  message: "Invalid decimal number",
                },
              ]}
            >
              <Input placeholder="0.00" />
            </Form.Item>

            <Row justify="center">
              <Space size="large">
                <Button onClick={onClose}>Cancel</Button>
                <Spin
                  spinning={false}
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                >
                  <Button type="primary" htmlType="submit">
                    Save
                  </Button>
                </Spin>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
