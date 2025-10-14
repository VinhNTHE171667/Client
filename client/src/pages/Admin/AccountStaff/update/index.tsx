import FancyFormItem from "@/components/FancyFormItem";
import { showError, showSuccess } from "@/libs/toast";
import {
  useGetStaffByIdQuery,
  useUpdateStaffMutation,
  type UpdateStaffProps,
} from "@/services/account";
import { extractErrorMessage } from "@/utils/func";
import { Button, Form, Input, Modal, Row, Space, Spin, Switch } from "antd";
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

  useEffect(() => {
    if (staffData) {
      form.setFieldsValue(staffData);
    }
  }, [staffData]);

  useEffect(() => {
    if (isOpen && id) {
      form.resetFields();
      if (staffData) {
        form.setFieldsValue(staffData);
      }
    }
  }, [isOpen, id, staffData]);

  // const [roles, setRoles] = useState<Roles[]>([]);
  // const [getAllRoles] = useGetAllRolesMutation();

  // const handleGetRoles = async () => {
  //   setIsLoading(true);
  //   try {
  //     const res = await getAllRoles();

  //     const tempRes = res.data;
  //     console.log("tempRes", tempRes);

  //     setRoles(
  //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //       (tempRes ?? []).map((role: any) => ({
  //         ...role,
  //       }))
  //     );
  //   } catch (error: unknown) {
  //     if (error instanceof Error) {
  //       showError("Error", error.message);
  //     } else {
  //       showError("Error", "An unexpected error occurred.");
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   handleGetRoles();
  // }, []);

  const [updateStaff] = useUpdateStaffMutation();

  const onFinish = async (values: UpdateStaffProps) => {
    setIsLoading(true);
    try {
      const res = await updateStaff({
        id,
        staffData: {
          ...values,
        },
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
        width={700}
        onCancel={onClose}
        footer={null}
        closable={false}
      >
        <Spin spinning={isLoading}>
          <h3 className="text-center">Cập nhật thông tin nhân viên</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: 16 }}
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
              label="Email"
              name="email"
              rules={[{ type: "email", message: "Email không hợp lệ" }]}
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
                  Lưu lại
                </Button>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
