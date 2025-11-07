import { LoadingOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";
import {
  useGetMembershipByIdMutation,
  useUpdateMembershipMutation,
  type membershipDatas,
  type UpdateMembershipDto,
} from "@/services/membership";
import FancyButton from "@/components/FancyButton";
import { CustomerTypeEnum } from "@/common/types/auth";

interface UpdateMembershipProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateMembership({
  id,
  isOpen,
  onClose,
  onReload,
}: UpdateMembershipProps) {
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);

  const [getMembershipById] = useGetMembershipByIdMutation();
  const [updateMembership] = useUpdateMembershipMutation();

  // const [membershipData, setMembershipData] = useState<membershipDatas>();

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !id) return;
      try {
        const res = await getMembershipById(id);
        if ("data" in res) {
          // setMembershipData(res.data);
          const data = res.data;
          if (!data) return;

          form.setFieldsValue({
            name: data.name,
            minSpent: Number(data.minSpent),
            maxSpent: data.maxSpent ? Number(data.maxSpent) : null,
            discountPercent: Number(data.discountPercent),
          });
        }
      } catch {
        showError("Không thể tải dữ liệu", "Vui lòng thử lại sau.");
      }
    };
    fetchData();
  }, [id, isOpen]);

  const onFinish = async (values: UpdateMembershipDto) => {
    setIsLoading(true);
    try {
      const payload: UpdateMembershipDto = {
        name: values.name,
        minSpent: Number(values.minSpent) || 0,
        maxSpent: values.maxSpent ? Number(values.maxSpent) : null,
        discountPercent: Number(values.discountPercent) || 0,
      };

      const res = await updateMembership({ id, data: payload });
      if (!("error" in res)) {
        showSuccess("Cập nhật hạng thành viên thành công");
        onReload();
        onClose();
      } else {
        const err = res.error as { data?: { message?: string | string[] } };
        showError(
          "Cập nhật thất bại",
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
      width={600}
      onCancel={onClose}
      footer={null}
      closable={false}
    >
      <Spin spinning={isLoading} indicator={<LoadingOutlined spin />}>
        <h3 className="text-center mb-4 fw-semibold text-primary">
          Cập nhật Hạng Thành Viên
        </h3>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ margin: "16px 24px" }}
        >
          <Form.Item
            label="Tên hạng thành viên"
            name="name"
            rules={[{ required: true, message: "Vui lòng chọn hạng" }]}
          >
            <Select
              placeholder="Chọn hạng thành viên"
              options={Object.keys(CustomerTypeEnum).map((key) => ({
                label: key,
                value: key,
              }))}
            />
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Chi tiêu tối thiểu (VNĐ)"
                name="minSpent"
                rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}
              >
                <InputNumber<number>
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Nhập chi tiêu tối thiểu"
                  formatter={(value) =>
                    value ? `${Number(value).toLocaleString()}₫` : ""
                  }
                  parser={(value) => Number(value?.replace(/[₫,]/g, "") || 0)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Chi tiêu tối đa (VNĐ)" name="maxSpent">
                <InputNumber<number>
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Không bắt buộc"
                  formatter={(value) =>
                    value ? `${Number(value).toLocaleString()}₫` : ""
                  }
                  parser={(value) => Number(value?.replace(/[₫,]/g, "") || 0)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Phần trăm giảm giá (%)"
            name="discountPercent"
            rules={[{ required: true, message: "Vui lòng nhập phần trăm" }]}
          >
            <InputNumber<number>
              style={{ width: "100%" }}
              min={0}
              max={100}
              formatter={(value) => `${value}%`}
              parser={(value) => Number(value?.replace("%", "") || 0)}
              placeholder="Nhập phần trăm giảm giá"
            />
          </Form.Item>

          <Row justify="center" className="mt-4">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <FancyButton
                onClick={() => form.submit()}
                label="Cập nhật Hạng"
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
