import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { Button, Form, Input, Modal, Row, Select, Space, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import {
  useCreateDoctorMutation,
  type CreateDoctorProps,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";
import FancyFormItem from "@/components/FancyFormItem";
import { useGetServicesMutation } from "@/services/services";

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function AddDoctor(props: DoctorModalProps) {
  const { isOpen, onClose, onReload } = props;

  const [form] = useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      handleGetServices();
    }
  }, [isOpen]);

  const [getService] = useGetServicesMutation();
  const [serviceOptions, setServiceOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const handleGetServices = async () => {
    try {
      const res = await getService();
      if (res.data) {
        setServiceOptions(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res.data.map((service: any) => ({
            label: service.name,
            value: service.id,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
      return [];
    }
  };

  const [createDoctor] = useCreateDoctorMutation();

  const onFinish = async (values: CreateDoctorProps) => {
    setIsLoading(true);

    const payload = {
      full_name: values.full_name,
      gender: values.gender,
      password: values.password,
      phone: values.phone,
      email: values.email,
      biography: values.biography,
      specialization: values.specialization,
      experience_years: values.experience_years,
      isActive: values.isActive,
      serviceIds: values.serviceIds || null,
    };

    try {
      const res = await createDoctor(payload).unwrap();

      if (!res.error) {
        onReload();
        showSuccess("Tạo bác sĩ thành công");
        onClose();
      } else {
        const err = res.error as {
          data?: { message?: string | string[] };
        };

        showError(
          "Tạo khách hàng thất bại",
          extractErrorMessage(err) || "Đã xảy ra lỗi khi tạo khách hàng."
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
          <h3 className="text-center">Tạo khách hàng mới</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: "16px" }}
          >
            <FancyFormItem
              label="Họ và tên"
              name="full_name"
              type="text"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              placeholder="Nhập họ tên"
            />

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
              label="Tiểu sử"
              name="biography"
              // rules={[{ required: true, message: "Vui lòng nhập tiểu sử" }]}
            >
              <Input.TextArea placeholder="Nhập tiểu sử" />
            </Form.Item>

            <Form.Item
              label="Chuyên môn"
              name="specialization"
              rules={[{ required: true, message: "Vui lòng nhập chuyên môn" }]}
            >
              <Input placeholder="Nhập chuyên môn" />
            </Form.Item>

            <Form.Item
              label="Kinh nghiệm làm việc"
              name="experience_years"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập kinh nghiệm làm việc",
                },
              ]}
            >
              <Input placeholder="Nhập kinh nghiệm làm việc" />
            </Form.Item>

            <Form.Item
              label="Dịch vụ"
              name="serviceIds"
              // rules={[{ required: true, message: "Vui lòng chọn dịch vụ" }]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn dịch vụ"
                options={serviceOptions}
              />
            </Form.Item>

            <Row justify="center">
              <Space size="large">
                <Button onClick={onClose}>Huỷ</Button>
                <Button type="primary" htmlType="submit">
                  Tạo khách hàng
                </Button>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
