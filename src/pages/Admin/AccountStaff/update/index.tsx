import FancyButton from "@/components/FancyButton";
import FancyFormItem from "@/components/FancyFormItem";
import { showError, showSuccess } from "@/libs/toast";
import {
  useGetStaffByIdQuery,
  useUpdateStaffMutation,
  type UpdateStaffProps,
} from "@/services/account";
import { extractErrorMessage } from "@/utils/func";
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Switch,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";

interface StaffModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateStaff(props: StaffModalProps) {
  const { id, isOpen, onClose, onReload } = props;
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: staffData } = useGetStaffByIdQuery(id, {
    skip: !isOpen || !id,
  });

  const [updateStaff] = useUpdateStaffMutation();

  useEffect(() => {
    if (isOpen && staffData) {
      form.setFieldsValue(staffData);
    }
  }, [isOpen, staffData]);

  const onFinish = async (values: UpdateStaffProps) => {
    setIsLoading(true);
    try {
      const res = await updateStaff({
        id,
        staffData: { ...values },
      });

      if (!res.error) {
        showSuccess("Cập nhật thông tin nhân viên thành công");
        onReload();
        onClose();
      } else {
        showError(
          "Cập nhật thất bại",
          extractErrorMessage(res.error) || "Đã xảy ra lỗi khi cập nhật."
        );
      }
    } catch {
      showError(
        "Lỗi hệ thống"
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
      closable={false}
    >
      <Spin spinning={isLoading}>
        <h3 className="text-center mb-4 font-semibold text-lg">
          Cập nhật thông tin nhân viên
        </h3>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ margin: "0 24px" }}
        >
          <Row gutter={[24, 12]}>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="full_name"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập họ và tên nhân viên",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập họ và tên nhân viên"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
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
                label="Email"
                name="email"
                rules={[{ type: "email", message: "Email không hợp lệ" }]}
              >
                <Input placeholder="Nhập email" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                ]}
              >
                <Input
                  placeholder="Nhập số điện thoại"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Trạng thái hoạt động"
                name="isActive"
                valuePropName="checked"
                style={{ marginTop: 4 }}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="center" className="mt-4">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <FancyButton
                onClick={() => form.submit()}
                icon={<></>}
                label="Cập nhật nhân viên spa"
                variant="primary"
                size="small"
                loading={isLoading}
                className="w-100"
              />
            </Space>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}
