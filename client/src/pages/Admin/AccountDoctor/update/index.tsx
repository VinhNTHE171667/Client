import { LoadingOutlined } from "@ant-design/icons";
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
  useGetDoctorByIdQuery,
  useUpdateDoctorMutation,
  type UpdateDoctorProps,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import { useGetServicesMutation } from "@/services/services";
import FancyFormItem from "@/components/FancyFormItem";
import FancyButton from "@/components/FancyButton";

interface DoctorModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateDoctor(props: DoctorModalProps) {
  const { id, isOpen, onClose, onReload } = props;
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);
  // const [doctor, setDoctor] = useState<DoctorData | null>(null);

  const { refetch } = useGetDoctorByIdQuery(id);
  const [getService] = useGetServicesMutation();
  const [serviceOptions, setServiceOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const handleGetServices = async () => {
    try {
      const res = await getService();
      if (res.data) {
        setServiceOptions(
          res.data.map((service: { id: string; name: string }) => ({
            label: service.name,
            value: service.id,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  const fetchDoctor = async () => {
    setIsLoading(true);
    try {
      const res = await refetch();
      const doctorData = res.data;
      if (doctorData) {
        // setDoctor(doctorData);
        form.setFieldsValue({
          ...doctorData,
          experience_years: String(doctorData.experience_years || ""),
          serviceIds: doctorData.services?.map((s) => s.id) || [],
        });
      }
    } catch {
      showError("Lấy thông tin bác sĩ thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && id) {
      form.resetFields();
      handleGetServices();
      fetchDoctor();
    }
  }, [isOpen, id]);

  const [updateDoctor] = useUpdateDoctorMutation();

  const onFinish = async (values: UpdateDoctorProps) => {
    setIsLoading(true);
    try {
      const payload: UpdateDoctorProps = {
        ...values,
        experience_years: Number(values.experience_years) || 0,
      };

      const res = await updateDoctor({ id, specialData: payload });

      if (!res.error) {
        showSuccess("Cập nhật bác sĩ thành công");
        onReload();
        onClose();
      } else {
        showError(
          "Cập nhật thất bại"
          // extractErrorMessage(res.error as any) || "Đã xảy ra lỗi khi cập nhật."
        );
      }
    } catch {
      showError(
        "Đã có lỗi xảy ra"
        // extractErrorMessage(error as any) || "Vui lòng thử lại."
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
      <Spin spinning={isLoading} indicator={<LoadingOutlined spin />}>
        <h3 className="text-center">Cập nhật thông tin bác sĩ</h3>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ margin: "16px" }}
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

          <Row justify="center">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <FancyButton
                onClick={() => form.submit()}
                icon={<></>}
                label="Cập nhật bác sĩ"
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
