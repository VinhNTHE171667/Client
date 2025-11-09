import { LoadingOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";
import dayjs from "dayjs";
import {
  useGetVoucherByIdQuery,
  useUpdateVoucherMutation,
  type CreateVoucherProps,
  type VoucherFormValues,
} from "@/services/voucher";
import FancyButton from "@/components/FancyButton";
import { useGetCustomersMutation } from "@/services/account";

const { RangePicker } = DatePicker;

interface UpdateVoucherProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateVoucher({
  id,
  isOpen,
  onClose,
  onReload,
}: UpdateVoucherProps) {
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const { data: voucherData, refetch } = useGetVoucherByIdQuery(id, {
    skip: !isOpen || !id,
  });
  const [getCustomers] = useGetCustomersMutation();
  const [customerOptions, setCustomerOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [updateVoucher] = useUpdateVoucherMutation();

  useEffect(() => {
    if (isOpen && id) {
      refetch();

      const handleGetCustomers = async () => {
        try {
          const res = await getCustomers().unwrap();
          if (res)
            setCustomerOptions(
              res.map(
                (customer: {
                  id: string;
                  full_name: string;
                  email: string;
                }) => ({
                  label: `${customer.full_name} - ${customer.email}`,
                  value: customer.id,
                })
              )
            );
        } catch (error) {
          console.error("Failed to fetch customers:", error);
        }
      };

      handleGetCustomers();

      form.resetFields();
    }
  }, [isOpen, id]);

  useEffect(() => {
    if (voucherData) {
      form.setFieldsValue({
        ...voucherData,
        validRange: [
          voucherData.validFrom ? dayjs(voucherData.validFrom) : null,
          voucherData.validTo ? dayjs(voucherData.validTo) : null,
        ],
      });
    }
  }, [voucherData]);

  const onFinish = async (values: VoucherFormValues) => {
    setIsLoading(true);
    try {
      const payload: CreateVoucherProps = {
        code: values.code.trim(),
        description: values.description,
        discountAmount: Number(values.discountAmount) || 0,
        discountPercent: Number(values.discountPercent) || 0,
        maxDiscount: Number(values.maxDiscount) || 0,
        validFrom: values.validRange?.[0]?.toISOString() ?? "",
        validTo: values.validRange?.[1]?.toISOString() ?? "",
        isActive: values.isActive ?? true,
        customerIds: values.customerIds || [],
      };

      const res = await updateVoucher({ id, body: payload });

      if (!("error" in res)) {
        showSuccess("Cập nhật voucher thành công");
        onReload();
        onClose();
      } else {
        const err = res.error as { data?: { message?: string | string[] } };
        showError(
          "Cập nhật voucher thất bại",
          extractErrorMessage(err) || "Vui lòng thử lại."
        );
      }
    } catch {
      showError("Đã có lỗi xảy ra", "Vui lòng kiểm tra lại thông tin.");
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
      <Spin spinning={isLoading} indicator={<LoadingOutlined spin />}>
        <h3 className="text-center mb-4 fw-semibold text-primary">
          Cập nhật Voucher
        </h3>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ margin: "16px 24px" }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Form.Item
                label="Mã Voucher"
                name="code"
                rules={[
                  { required: true, message: "Vui lòng nhập mã voucher" },
                ]}
              >
                <Input placeholder="Nhập mã voucher" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Trạng thái"
                name="isActive"
                valuePropName="checked"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea
              placeholder="Nhập mô tả voucher"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item label="Giảm theo số tiền (VNĐ)" name="discountAmount">
                <InputNumber<number>
                  style={{ width: "100%" }}
                  placeholder="Nhập số tiền giảm"
                  min={0}
                  formatter={(value) =>
                    value ? `${Number(value).toLocaleString()}₫` : ""
                  }
                  parser={(value) => Number(value?.replace(/[₫,]/g, "") || 0)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Giảm theo %" name="discountPercent">
                <InputNumber<number>
                  style={{ width: "100%" }}
                  placeholder="Nhập phần trăm giảm"
                  min={0}
                  max={100}
                  formatter={(value) => `${value}%`}
                  parser={(value) => Number(value?.replace("%", "") || 0)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Giảm tối đa (VNĐ)" name="maxDiscount">
                <InputNumber<number>
                  style={{ width: "100%" }}
                  placeholder="Nhập mức giảm tối đa"
                  min={0}
                  formatter={(value) =>
                    value ? `${Number(value).toLocaleString()}₫` : ""
                  }
                  parser={(value) => Number(value?.replace(/[₫,]/g, "") || 0)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Áp dụng cho khách hàng" name="customerIds">
            <Select
              mode="multiple"
              placeholder="Chọn khách hàng áp dụng voucher"
              options={customerOptions}
              allowClear
              showSearch
              optionFilterProp="label"
              dropdownRender={(menu) => (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 8,
                    }}
                  >
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        const allValues = customerOptions.map((c) => c.value);
                        form.setFieldsValue({ customerIds: allValues });
                      }}
                    >
                      Chọn tất cả
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        form.setFieldsValue({ customerIds: [] });
                      }}
                    >
                      Bỏ chọn tất cả
                    </Button>
                  </div>
                  {menu}
                </>
              )}
            />
          </Form.Item>

          <Form.Item label="Thời gian hiệu lực" name="validRange">
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Row justify="center" className="mt-4">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <FancyButton
                onClick={() => form.submit()}
                label="Cập nhật Voucher"
                variant="primary"
                size="small"
                loading={isLoading}
              />
            </Space>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}
