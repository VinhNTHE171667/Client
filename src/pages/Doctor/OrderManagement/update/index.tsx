import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  TimePicker,
  Select,
  message,
  Space,
  Modal,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import {
  useGetAppointmentByIdMutation,
  useUpdateAppointmentMutation,
  type AppointmentProps,
} from "@/services/appointment";
import styles from "../add/CreateAppointment.module.scss";
import {
  useGetCustomersMutation,
  useGetPublicDoctorProfileMutation,
} from "@/services/account";
import { showError } from "@/libs/toast";

type Props = {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onReload?: () => void;
};

const UpdateAppointmentModal: React.FC<Props> = ({
  appointmentId,
  isOpen,
  onClose,
  onReload,
}) => {
  const [form] = Form.useForm();
  const [updateAppointment, { isLoading }] = useUpdateAppointmentMutation();

  const [getAppointmentById] = useGetAppointmentByIdMutation();
  const [appointment, setAppointment] = useState<AppointmentProps>();

  const [doctorSelected, setDoctorSelected] = useState<string>("");

  const [getServiceByDoctor] = useGetPublicDoctorProfileMutation();
  const [services, setServices] = useState<
    {
      id: string;
      name: string;
      description: string;
      price: number;
      images:
        | {
            alt: string;
            url: string;
          }[]
        | [];
    }[]
  >([]);

  const [getAllCustomers] = useGetCustomersMutation();
  const [customers, setCustomers] = useState<
    {
      id: string;
      full_name: string;
      email: string;
      phone: string;
    }[]
  >([]);

  const handleGetAppointmentDetails = async () => {
    try {
      const response = await getAppointmentById({ appointmentId }).unwrap();

      form.setFieldsValue({
        customerId: response.customer.id,
        doctorId: response.doctor.id,
        services: response.details.map((d) => d.service.id),
        date: dayjs(response.appointment_date),
        time: [dayjs(response.startTime), dayjs(response.endTime)],
        note: response.note,
      });

      setDoctorSelected(response.doctor.id);
      setAppointment(response);
    } catch {
      showError("Không thể tải chi tiết lịch hẹn");
    }
  };

  const handleGetServicesByDoctor = async (doctorId: string) => {
    try {
      const response = await getServiceByDoctor(doctorId).unwrap();

      if (!response.services) {
        setServices([]);
        return;
      }

      setServices(
        response.services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price,
          images: s.images || [],
        }))
      );
    } catch {
      showError("Không thể tải dịch vụ của bác sĩ này");
    }
  };

  const handleGetCustomers = async () => {
    try {
      const response = await getAllCustomers().unwrap();
      setCustomers(response);
    } catch {
      showError("Không thể tải danh sách khách hàng");
    }
  };

  useEffect(() => {
    if (doctorSelected) {
      handleGetServicesByDoctor(doctorSelected);
    }
  }, [doctorSelected]);

  useEffect(() => {
    if (isOpen) {
      handleGetAppointmentDetails();
      handleGetCustomers();
    }
  }, [isOpen]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    if (!appointment) return;
    
    try {
      const payload = {
        customerId: appointment.customer.id,
        doctorId: appointment.doctor.id,
        staffId: appointment.staffId || null,
        appointment_date: appointment.appointment_date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        details: values.services.map((id: string) => ({
          serviceId: id,
          price: services.find((s) => s.id === id)?.price || 0,
        })),
        note: appointment.note || "",
        voucherId: appointment.voucherId || null,
      };

      await updateAppointment({
        appointmentId,
        data: payload,
      }).unwrap();
      message.success("Cập nhật dịch vụ thành công!");
      form.resetFields();
      onClose();
      onReload?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể cập nhật dịch vụ");
    }
  };

  return (
    <Modal
      title="Cập nhật lịch hẹn"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        className={styles.form}
      >
        {/* Hiển thị thông tin khách hàng - chỉ xem */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>
            Khách hàng
          </label>
          <Input 
            value={appointment?.customer?.full_name || ""} 
            disabled 
            style={{ backgroundColor: '#f5f5f5' }}
          />
        </div>

        {/* Hiển thị ngày giờ - chỉ xem */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>
            Giờ hẹn
          </label>
          <Input 
            value={
              appointment 
                ? `${dayjs(appointment.startTime).format("HH:mm")} - ${dayjs(appointment.endTime).format("HH:mm")}`
                : ""
            } 
            disabled 
            style={{ backgroundColor: '#f5f5f5' }}
          />
        </div>

        {/* Chỉ cho phép chỉnh sửa dịch vụ */}
        <Form.Item
          label="Dịch vụ"
          name="services"
          rules={[
            { required: true, message: "Vui lòng chọn ít nhất 1 dịch vụ" },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn dịch vụ"
            options={services.map((service) => ({
              label: `${service.name} - ${service.price.toLocaleString()} VND`,
              value: service.id,
            }))}
          />
        </Form.Item>

        {/* Hiển thị ghi chú - chỉ xem */}
        {appointment?.note && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>
              Ghi chú
            </label>
            <Input.TextArea 
              value={appointment.note} 
              disabled 
              rows={3}
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </div>
        )}

        <Form.Item className={styles.actions}>
          <Space>
            <Button onClick={onClose}>Huỷ</Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Xác nhận
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateAppointmentModal;
