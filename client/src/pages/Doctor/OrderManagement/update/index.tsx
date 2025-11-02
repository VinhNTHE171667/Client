import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  TimePicker,
  Select,
  message,
  Space,
  Modal,
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
    try {
      const appointmentDate = values.date;
      const startTime = values.time[0];
      const endTime = values.time[1];

      const startDateTime = appointmentDate
        .hour(startTime.hour())
        .minute(startTime.minute())
        .second(0);

      const endDateTime = appointmentDate
        .hour(endTime.hour())
        .minute(endTime.minute())
        .second(0);

      const payload = {
        customerId: values.customerId,
        doctorId: doctorSelected,
        staffId: appointment?.staffId || null,
        appointment_date: values.date.format("YYYY-MM-DD"),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        details: values.services.map((id: string) => ({
          serviceId: id,
          price: services.find((s) => s.id === id)?.price || 0,
        })),
        note: values.note || "",
        voucherId: null,
      };

      await updateAppointment({
        appointmentId,
        data: payload,
      }).unwrap();
      message.success("Cập nhật lịch hẹn thành công!");
      form.resetFields();
      onClose();
      onReload?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể cập nhật lịch hẹn");
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
        <Form.Item
          label="Chọn khách hàng"
          name="customerId"
          rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
        >
          <Select
            placeholder="Chọn khách hàng"
            options={customers.map((customer) => ({
              label: customer.full_name,
              value: customer.id,
            }))}
          />
        </Form.Item>

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

        <Form.Item
          label="Ngày hẹn"
          name="date"
          rules={[{ required: true, message: "Vui lòng chọn ngày hợp lệ" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            disabledDate={(current) => {
              return current && current < dayjs().startOf("day");
            }}
          />
        </Form.Item>

        <Form.Item
          label="Giờ hẹn"
          name="time"
          rules={[
            { required: true, message: "Vui lòng chọn giờ từ 09:00 đến 17:00" },
          ]}
        >
          <TimePicker.RangePicker
            format="HH:mm"
            style={{ width: "100%" }}
            minuteStep={15}
            disabledTime={() => {
              const disabledHours = Array.from(
                { length: 24 },
                (_, i) => i
              ).filter((h) => h < 9 || h > 16);
              return {
                disabledHours: () => disabledHours,
                disabledMinutes: () => [],
                disabledSeconds: () => [],
              };
            }}
            onChange={(times) => {
              if (times && times[0]) {
                const start = times[0];
                const end = start.clone().add(1, "hour");
                const endHour = end.hour() > 17 ? 17 : end.hour();
                const endMinute = end.hour() > 17 ? 0 : end.minute();
                const finalEnd = end.clone().hour(endHour).minute(endMinute);
                form.setFieldsValue({ time: [start, finalEnd] });
              }
            }}
          />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
        </Form.Item>

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
