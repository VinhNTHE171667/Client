import { LoadingOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Row, Select, Space, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import {
  useGetDoctorByIdQuery,
  useUpdateDoctorMutation,
  type DoctorData,
  type UpdateDoctorProps,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";
import { useGetServicesMutation } from "@/services/services";

interface DoctorModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateDoctor(props: DoctorModalProps) {
  const { id, isOpen, onClose, onReload } = props;
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);

  const { refetch } = useGetDoctorByIdQuery(id);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await refetch();
      const doctorData = res.data;

      if (doctorData) {
        form.setFieldsValue({
          ...doctorData,
          experience_years: String(doctorData.experience_years),
          serviceIds: doctorData.services?.map((service) => service.id) || [],
        });
      }

      setDoctor(doctorData || null);
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
      fetchData();
    }
  }, [isOpen, id]);

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

  const [updateDoctor] = useUpdateDoctorMutation();

  const onFinish = async (values: UpdateDoctorProps) => {
    if (!doctor) return;

    const payload: UpdateDoctorProps = {
      ...values,
      experience_years: values.experience_years,
    };

    setIsLoading(true);
    try {
      const res = await updateDoctor({
        id,
        specialData: payload,
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
        width={800}
        onCancel={onClose}
        footer={null}
        closable={false}
      >
        <Spin spinning={isLoading}>
          <h3 className="text-center">
            {"Cập nhật thông tin tài khoản khách hàng"}
          </h3>
          <Form
            form={form}
            name="update-admin-form"
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: "16px" }}
          >
            <Form.Item
              label="Full Name"
              name="full_name"
              rules={[{ required: true, message: "Please enter full name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Gender" name="gender">
              <Select
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
                { required: true, message: "Please enter email" },
                { type: "email", message: "Invalid email format" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Phone" name="phone">
              <Input />
            </Form.Item>

            <Form.Item
              label="Tiểu sử"
              name="biography"
              rules={[{ required: true, message: "Vui lòng nhập tiểu sử" }]}
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
                <Button onClick={onClose}>Cancel</Button>
                <Spin
                  spinning={false}
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                >
                  <Button type="primary" htmlType="submit">
                    Save
                  </Button>
                </Spin>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
