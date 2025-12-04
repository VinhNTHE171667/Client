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
import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  useGetCustomersMutation,
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
  const [
    triggerGetCustomers,
    {
      data: allCustomers = [],
      isLoading: loadingCustomers,
      isFetching: isFetchingCustomers,
    },
  ] = useGetCustomersMutation();

  const fetchData = useCallback(async () => {
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
  }, [refetch, form, setCustomer]);

  useEffect(() => {
    if (isOpen && id) {
      form.resetFields();
      triggerGetCustomers(undefined, true);
      fetchData();
    }
  }, [isOpen, id, form, triggerGetCustomers, fetchData]);

  const onFinish = async (values: UpdateCustomerProps) => {
    if (!customer || allCustomers.length === 0) {
      showError("Dữ liệu chưa tải đầy đủ");
      return;
    }

    const normalizedPhone = values.phone?.trim();
    const normalizedEmail = values.email?.trim().toLowerCase();

    const phoneExists = allCustomers.some(
      (c: any) => c.phone === normalizedPhone && c.id !== id
    );
    const emailExists = allCustomers.some(
      (c: any) =>
        c.email &&
        normalizedEmail &&
        c.email.toLowerCase() === normalizedEmail &&
        c.id !== id
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

    const payload: UpdateCustomerProps = {
      full_name: values.full_name.trim(),
      gender: values.gender,
      birth_date: values.birth_date
        ? dayjs(values.birth_date).format("YYYY-MM-DD")
        : "",
      phone: normalizedPhone,
      email: normalizedEmail || "",
      address: values.address?.trim() || "",
      customer_type: values.customer_type,
      total_spent: values.total_spent || "0",
      isActive: values.isActive,
      isVerified: true,
    };

    setIsLoading(true);
    try {
      await updateCustomer({ id, customerData: payload }).unwrap();
      showSuccess("Cập nhật tài khoản thành công");
      onReload();
      onClose();
      form.resetFields();
    } catch (error: any) {
      const msg =
        extractErrorMessage(error) ||
        error?.data?.message ||
        "Đã xảy ra lỗi khi cập nhật tài khoản. Vui lòng thử lại.";
      showError("Cập nhật tài khoản thất bại", msg);
      console.error("Update customer error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isModalLoading = isLoading || loadingCustomers || isFetchingCustomers;

  return (
    <Modal
      open={isOpen}
      width={800}
      onCancel={onClose}
      footer={null}
      title="Cập nhật thông tin khách hàng"
      closable={!isModalLoading}
      maskClosable={false}
      destroyOnClose
    >
      <Spin spinning={false}>
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
                readOnly={true}
              />
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
                label="Địa chỉ"
                name="address"
                type="text"
                placeholder="Nhập địa chỉ"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
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
                rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
                placeholder="Chọn giới tính"
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
                  style={{ width: "100%", borderRadius: 8 }}
                  placeholder="Chọn ngày sinh"
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
                placeholder="Chọn loại khách hàng"
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
            <Col span={12}>
              <FancyFormItem
                label="Trạng thái"
                name="isActive"
                type="select"
                options={[
                  { label: "Active", value: true },
                  { label: "Disable", value: false },
                ]}
                placeholder="Chọn trạng thái"
              />
            </Col>
          </Row>
          <Row justify="end" className="mt-4">
            <Space size="large">
              <Button onClick={onClose} disabled={isModalLoading}>
                Huỷ
              </Button>
              <FancyButton
                onClick={() => form.submit()}
                label="Cập nhật khách hàng"
                variant="primary"
                size="small"
                loading={isModalLoading}
                className="w-100"
              />
            </Space>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}
