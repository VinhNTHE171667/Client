import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Col,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import {
  useCreateStaffMutation,
  useGetAllRolesMutation,
  type CreateStaffProps,
} from "@/services/account";
import { extractErrorMessage } from "@/utils/func";
import FancyFormItem from "@/components/FancyFormItem";
import FancyButton from "@/components/FancyButton";

interface SpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

interface Roles {
  id: string;
  name: string;
  description: string;
}

export default function AddStaff(props: SpaModalProps) {
  const { isOpen, onClose, onReload } = props;
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Roles[]>([]);

  const [getAllRoles] = useGetAllRolesMutation();
  const [createStaff] = useCreateStaffMutation();

  const handleGetRoles = async () => {
    setIsLoading(true);
    try {
      const res = await getAllRoles();
      const tempRes = res.data;
      setRoles(tempRes ?? []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError("Lỗi", error.message);
      } else {
        showError("Lỗi", "Đã xảy ra lỗi không xác định.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      handleGetRoles();
    }
  }, [isOpen]);

  const onFinish = async (values: CreateStaffProps) => {
    setIsLoading(true);
    const payload = {
      ...values,
      positionID: values.positionID.toString(),
    };

    try {
      const res = await createStaff(payload);

      if (!res.error) {
        onReload();
        showSuccess("Tạo nhân viên spa thành công");
        onClose();
      } else {
        showError(
          "Tạo nhân viên spa thất bại",
          extractErrorMessage(res.error) ||
            "Đã xảy ra lỗi khi tạo nhân viên spa."
        );
      }
    } catch {
      showError(
        "Đã có lỗi xảy ra",
        "Vui lòng kiểm tra lại thông tin và thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={isOpen} width={800} onCancel={onClose} footer={null}>
      <Spin spinning={isLoading}>
        <h3 className="text-center mb-4">Tạo nhân viên mới</h3>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ padding: "0 24px 16px" }}
          initialValues={{ isActive: true }}
        >
          <Row gutter={[24, 12]}>
            <Col span={12}>
              <FancyFormItem
                label="Họ và tên"
                name="full_name"
                type="text"
                placeholder="Nhập họ và tên nhân viên spa"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập họ và tên nhân viên",
                  },
                ]}
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
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                ]}
              />
            </Col>

            <Col span={12}>
              <Form.Item
                label="Chức vụ"
                name="positionID"
                rules={[{ required: true, message: "Vui lòng chọn chức vụ" }]}
              >
                <Select placeholder="Chọn chức vụ" style={{ borderRadius: 8 }}>
                  {roles.map((role) => (
                    <Select.Option key={role.id} value={role.id}>
                      {role.name}
                    </Select.Option>
                  ))}
                </Select>
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
                label="Tạo nhân viên spa"
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
