import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import {
  Button,
  Col,
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
import {
  useCreateDoctorMutation,
  type CreateDoctorProps,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import FancyFormItem from "@/components/FancyFormItem";
import { useGetServicesMutation } from "@/services/services";
import FancyButton from "@/components/FancyButton";

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function AddDoctor({
  isOpen,
  onClose,
  onReload,
}: DoctorModalProps) {
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [getService] = useGetServicesMutation();
  const [serviceOptions, setServiceOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [createDoctor] = useCreateDoctorMutation();

  const handleGetServices = async () => {
    try {
      const res = await getService();
      if (res.data) {
        setServiceOptions(
          res.data.map((s: { id: string; name: string }) => ({
            label: s.name,
            value: s.id,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      handleGetServices();
    }
  }, [isOpen]);

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
      isActive: true,
      serviceIds: values.serviceIds || [],
    };

    try {
      await createDoctor(payload).unwrap();
      showSuccess("Tạo bác sĩ thành công");
      onReload();
      onClose();
    } catch {
      showError(
        "Tạo bác sĩ thất bại"
        // extractErrorMessage(error) || "Đã xảy ra lỗi khi tạo bác sĩ."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      width={850}
      onCancel={onClose}
      footer={null}
      closable={false}
    >
      <Spin spinning={isLoading}>
        <h3 className="text-center mb-4 font-semibold text-lg">
          Tạo bác sĩ mới
        </h3>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ margin: "0 24px" }}
        >
          <Row gutter={[24, 12]}>
            <Col span={12}>
              <FancyFormItem
                label="Họ và tên"
                name="full_name"
                type="text"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
                placeholder="Nhập họ và tên"
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
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
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
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              >
                <Input.Password
                  placeholder="Nhập mật khẩu"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Chuyên môn"
                name="specialization"
                rules={[
                  { required: true, message: "Vui lòng nhập chuyên môn" },
                ]}
              >
                <Input
                  placeholder="Nhập chuyên môn"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Kinh nghiệm (năm)"
                name="experience_years"
                rules={[
                  { required: true, message: "Vui lòng nhập kinh nghiệm" },
                ]}
              >
                <Input
                  placeholder="Nhập số năm kinh nghiệm"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Dịch vụ phụ trách"
                name="serviceIds"
                rules={[{ required: true, message: "Vui lòng chọn dịch vụ" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn dịch vụ"
                  options={serviceOptions}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Tiểu sử" name="biography">
                <Input.TextArea
                  placeholder="Nhập tiểu sử bác sĩ (tùy chọn)"
                  rows={4}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="center" className="mt-4">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <FancyButton
                onClick={() => form.submit()}
                icon={<></>}
                label="Tạo bác sĩ"
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
