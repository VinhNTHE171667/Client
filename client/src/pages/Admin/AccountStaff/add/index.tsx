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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen]);

  const [roles, setRoles] = useState<Roles[]>([]);
  const [getAllRoles] = useGetAllRolesMutation();

  const handleGetRoles = async () => {
    setIsLoading(true);
    try {
      const res = await getAllRoles();

      const tempRes = res.data;
      console.log("tempRes", tempRes);

      setRoles(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tempRes ?? []).map((role: any) => ({
          ...role,
        }))
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError("Error", error.message);
      } else {
        showError("Error", "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetRoles();
  }, []);

  const [createStaff] = useCreateStaffMutation();

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
        const err = res.error as {
          data?: { message?: string | string[] };
        };

        showError(
          "Tạo nhân viên spa thất bại",
          extractErrorMessage(err) || "Đã xảy ra lỗi khi tạo nhân viên spa."
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
    <>
      <Modal
        open={isOpen}
        width={800}
        onCancel={onClose}
        footer={null}
        closable={false}
      >
        <Spin spinning={isLoading}>
          <h3 className="text-center">Tạo nhân viên spa mới</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: "16px" }}
            initialValues={{ isActive: true }}
          >
            <Form.Item
              label="Tên nhân viên spa"
              name="full_name"
              rules={[
                { required: true, message: "Vui lòng nhập tên nhân viên spa" },
              ]}
            >
              <Input placeholder="Nhập tên nhân viên spa" />
            </Form.Item>

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

            <Form.Item
              label="Giới tính"
              name="gender"
              rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
            >
              <Select
                placeholder="Chọn giới tính"
                options={[
                  { label: "Nam", value: "male" },
                  { label: "Nữ", value: "female" },
                  { label: "Khác", value: "other" },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label="Chức vụ"
              name="positionID"
              rules={[{ required: true, message: "Vui lòng chọn chức vụ" }]}
            >
              <Select placeholder="Chọn chức vụ">
                {roles.map((role) => (
                  <Select.Option key={role.id} value={role.id}>
                    {role.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Hoạt động"
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Row justify="center">
              <Space size="large">
                <Button onClick={onClose}>Huỷ</Button>
                <Button type="primary" htmlType="submit">
                  Tạo nhân viên spa
                </Button>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
