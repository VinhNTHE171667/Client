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
  useCreateVoucherMutation,
  type CreateVoucherProps,
  type VoucherFormValues,
  useGetVoucherCategoriesQuery,
  type VoucherCategory,
} from "@/services/voucher";
import { useGetServicesMutation } from "@/services/services";
import FancyButton from "@/components/FancyButton";
import { useGetCustomersMutation } from "@/services/account";

const { RangePicker } = DatePicker;

interface AddVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function AddVoucher({
  isOpen,
  onClose,
  onReload,
}: AddVoucherProps) {
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [createVoucher] = useCreateVoucherMutation();
  const [getCustomers] = useGetCustomersMutation();
  const [getServices] = useGetServicesMutation();

  const [customerOptions, setCustomerOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; value: string; prefix: string }[]
  >([]);

  const [maxServicePrice, setMaxServicePrice] = useState<number>(0);
  const [selectedCategoryPrefix, setSelectedCategoryPrefix] =
    useState<string>("");

  const { data: categories = [] } = useGetVoucherCategoriesQuery(undefined, {
    skip: !isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      loadCustomers();
      loadServices();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers().unwrap();
      setCustomerOptions(
        res.map((c: any) => ({
          label: `${c.full_name} - ${c.email}`,
          value: c.id,
        }))
      );
    } catch {
      console.error("Failed to load customers");
    }
  };

  const loadServices = async () => {
    try {
      const res = await getServices();
      if (res?.data) {
        const prices = res.data.map((s: any) => Number(s.price || 0));
        setMaxServicePrice(Math.max(...prices));
      }
    } catch {
      console.error("Failed to load services");
    }
  };

  useEffect(() => {
    if (categories.length > 0) {
      setCategoryOptions(
        categories
          .filter((cat: VoucherCategory) => cat.isActive)
          .map((cat: VoucherCategory) => ({
            label: cat.name,
            value: cat.id,
            prefix: cat.prefix,
          }))
      );
    }
  }, [categories]);

  const handleCategoryChange = (_: string, option: any) => {
    const prefix = option?.prefix || "";
    setSelectedCategoryPrefix(prefix);

    form.setFieldsValue({ code: "" });
  };

  const handleGenerateCode = () => {
    if (!selectedCategoryPrefix) {
      showError("Thông báo", "Vui lòng chọn danh mục voucher trước.");
      return;
    }

    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const generatedCode = `${selectedCategoryPrefix}${randomPart}`;

    form.setFieldsValue({ code: generatedCode });
    form.validateFields(["code"]);
  };

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

      const res = await createVoucher(payload);

      showSuccess("Tạo voucher thành công");
      onReload();
      onClose();
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
          Tạo Voucher mới
        </h3>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ margin: "16px 24px" }}
          initialValues={{ isActive: true }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Danh mục Voucher" name="categoryId">
                <Select
                  placeholder="Chọn danh mục"
                  options={categoryOptions}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  onChange={handleCategoryChange}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Mã Voucher"
                name="code"
                rules={[
                  { required: true, message: "Vui lòng nhập mã voucher" },
                ]}
              >
                <Row gutter={8}>
                  <Col span={18}>
                    <Form.Item name="code" noStyle>
                      <Input placeholder="Nhập mã voucher" />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Button type="primary" block onClick={handleGenerateCode}>
                      Tạo mã
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
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
              placeholder="Nhập mô tả"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Giảm tiền (VNĐ)"
                name="discountAmount"
                rules={[
                  {
                    validator(_, value) {
                      if (value && value > maxServicePrice) {
                        return Promise.reject(
                          `Không được vượt quá ${maxServicePrice.toLocaleString()} VNĐ`
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={maxServicePrice}
                  formatter={(v) => (v ? Number(v).toLocaleString() : "")}
                  parser={(v) => v.replace(/[^\d]/g, "")}
                  suffix="₫"
                  onChange={(value) => {
                    if (value > maxServicePrice) {
                      form.setFieldsValue({
                        discountAmount: maxServicePrice,
                      });
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="Giảm theo %" name="discountPercent">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  suffix="%"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Giảm tối đa (VNĐ)"
                name="maxDiscount"
                rules={[
                  { required: true, message: "Vui lòng nhập mức giảm tối đa" },
                  {
                    validator(_, value) {
                      if (value > maxServicePrice) {
                        return Promise.reject(
                          `Không được lớn hơn ${maxServicePrice.toLocaleString()} VNĐ`
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(v) => (v ? Number(v).toLocaleString() : "")}
                  suffix="₫"
                />
              </Form.Item>
            </Col>
          </Row>

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

          <Form.Item label="Áp dụng cho khách hàng" name="customerIds">
            <Select
              mode="multiple"
              placeholder="Chọn khách hàng"
              options={customerOptions}
              allowClear
              showSearch
            />
          </Form.Item>

          <Row justify="center">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <FancyButton
                label="Tạo Voucher"
                variant="primary"
                onClick={() => form.submit()}
                loading={isLoading}
              />
            </Space>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}
