import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  DatePicker,
  Select,
  message,
  Space,
  Modal,
  Input,
} from "antd";
import dayjs from "dayjs";
import {
  useCreateAppointmentMutation,
  useGetAppointmentsBookedByDoctorMutation,
} from "@/services/appointment";
import styles from "./CreateAppointment.module.scss";
import {
  useGetCustomersMutation,
  useGetDoctorsMutation,
  useGetPublicDoctorProfileMutation,
  type DoctorDatas,
} from "@/services/account";
import { showError } from "@/libs/toast";
import { useAuthStore } from "@/hooks/UseAuth";
import FancyButton from "@/components/FancyButton";
import AddCustomer from "@/pages/Admin/AccountCustomer/add";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onReload?: () => void;
};

const { Option } = Select;

const CreateAppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onReload,
}) => {
  const [form] = Form.useForm();
  const [createAppointment, { isLoading: isCreating }] =
    useCreateAppointmentMutation();

  const [getAllPublicDoctors] = useGetDoctorsMutation();
  const [getServiceByDoctor] = useGetPublicDoctorProfileMutation();
  const [getAllCustomers] = useGetCustomersMutation();

  const [
    triggerGetBooked,
    { data: bookedAppointments = [], isFetching: loadingBooked },
  ] = useGetAppointmentsBookedByDoctorMutation();

  const [allDoctors, setAllDoctors] = useState<DoctorDatas[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<
    { id: string; name: string; price: number }[]
  >([]);

  const [filteredDoctors, setFilteredDoctors] = useState<DoctorDatas[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);

  const [doctorId, setDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const { auth } = useAuthStore();

  const timeSlots = [
    { label: "09:00 - 10:00", value: "09:00-10:00" },
    { label: "10:00 - 11:00", value: "10:00-11:00" },
    { label: "11:00 - 12:00", value: "11:00-12:00" },
    { label: "12:00 - 13:00", value: "12:00-13:00" },
    { label: "13:00 - 14:00", value: "13:00-14:00" },
    { label: "14:00 - 15:00", value: "14:00-15:00" },
    { label: "15:00 - 16:00", value: "15:00-16:00" },
    { label: "16:00 - 17:00", value: "16:00-17:00" },
  ];

  const getBookedSlots = () => {
    if (!Array.isArray(bookedAppointments) || !selectedDate) return [];

    const selectedDateStr = selectedDate.format("YYYY-MM-DD");

    return bookedAppointments
      .filter((appt: any) => {
        const apptDate = dayjs(appt.startTime).format("YYYY-MM-DD");
        const status = (appt.status || "").toLowerCase();

        return (
          apptDate === selectedDateStr &&
          !["cancelled", "rejected", "completed"].includes(status)
        );
      })
      .map((appt: any) => {
        const start = dayjs(appt.startTime).format("HH:mm");
        const end = dayjs(appt.endTime).format("HH:mm");
        return `${start}-${end}`;
      });
  };

  const bookedSlots = getBookedSlots();

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [doctorsRes, customersRes] = await Promise.all([
          getAllPublicDoctors({}).unwrap(),
          getAllCustomers({}).unwrap(),
        ]);

        const activeDoctors = doctorsRes.filter((d: DoctorDatas) => d.isActive);
        setAllDoctors(activeDoctors);
        setFilteredDoctors(activeDoctors);
        setAllCustomers(customersRes);
        setFilteredCustomers(customersRes);
      } catch (err) {
        showError("Không thể tải dữ liệu");
      }
    };

    loadData();

    form.resetFields();
    setDoctorId("");
    setSelectedDate(null);
    setServices([]);
    setFilteredServices([]);
  }, [isOpen]);

  useEffect(() => {
    if (!doctorId) {
      setServices([]);
      setFilteredServices([]);
      return;
    }

    const loadServices = async () => {
      try {
        const res = await getServiceByDoctor(doctorId).unwrap();
        const list = (res.services || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          price: s.price || 0,
        }));
        setServices(list);
        setFilteredServices(list);
      } catch {
        showError("Không tải được dịch vụ");
      }
    };

    loadServices();
  }, [doctorId]);

  useEffect(() => {
    if (doctorId && selectedDate) {
      triggerGetBooked({
        doctorId,
        date: selectedDate.format("YYYY-MM-DD"),
      });
      form.setFieldsValue({ time: undefined });
    } else {
      form.setFieldsValue({ time: undefined });
    }
  }, [doctorId, selectedDate, triggerGetBooked, form]);

  const handleSubmit = async (values: any) => {
    try {
      const date = values.date as dayjs.Dayjs;
      const [startStr, endStr] = (values.time as string).split("-");

      const startTime = date
        .hour(+startStr.split(":")[0])
        .minute(+startStr.split(":")[1])
        .second(0)
        .millisecond(0);

      const endTime = date
        .hour(+endStr.split(":")[0])
        .minute(+endStr.split(":")[1])
        .second(0)
        .millisecond(0);

      const payload = {
        customerId: values.customerId,
        doctorId: values.doctorId,
        staffId: auth.accountId,
        appointment_date: date.format("YYYY-MM-DD"),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        details: values.services.map((id: string) => ({
          serviceId: id,
          price: services.find((s) => s.id === id)?.price || 0,
        })),
        note: values.note || "",
        voucherId: null,
      };

      await createAppointment(payload).unwrap();
      message.success("Tạo lịch hẹn thành công!");
      onClose();
      onReload?.();
    } catch (err: any) {
      message.error(err?.data?.message || "Tạo lịch hẹn thất bại");
    }
  };

  return (
    <Modal
      title="Tạo lịch hẹn mới"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Khách hàng */}
        <Form.Item
          label="Khách hàng"
          name="customerId"
          rules={[{ required: true, message: "-- Chọn khách hàng --" }]}
        >
          <Select
            showSearch
            placeholder="Tìm tên, email, SĐT..."
            filterOption={false}
            onSearch={(val) => {
              const search = val.toLowerCase();
              setFilteredCustomers(
                allCustomers.filter((c) =>
                  [c.full_name, c.email, c.phone].some((f) =>
                    f?.toString().toLowerCase().includes(search)
                  )
                )
              );
            }}
            notFoundContent="Không tìm thấy"
          >
            {filteredCustomers.map((c) => (
              <Option key={c.id} value={c.id} label={c.full_name}>
                <div>
                  <strong>{c.full_name}-{c.phone || "Chưa có SĐT"} • {c.email}</strong>
                  
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Space className="mb-4">
          <FancyButton
            label="Thêm khách hàng mới"
            onClick={() => setIsAddingCustomer(true)}
          />
          <AddCustomer
            isOpen={isAddingCustomer}
            onClose={() => setIsAddingCustomer(false)}
            onReload={async () => {
              const res = await getAllCustomers({}).unwrap();
              setAllCustomers(res);
              setFilteredCustomers(res);
            }}
          />
        </Space>

        {/* Bác sĩ */}
        <Form.Item
          label="Bác sĩ"
          name="doctorId"
          rules={[{ required: true, message: "Chọn bác sĩ" }]}
        >
          <Select
            showSearch
            placeholder="Tìm tên hoặc chuyên môn..."
            filterOption={false}
            onSearch={(val) => {
              const search = val.toLowerCase();
              setFilteredDoctors(
                allDoctors.filter((d) =>
                  [d.full_name, d.specialty].some((f) =>
                    f?.toString().toLowerCase().includes(search)
                  )
                )
              );
            }}
            onChange={(val) => {
              setDoctorId(val as string);
              form.setFieldsValue({ services: [], time: undefined });
              setSelectedDate(null);
            }}
          >
            {filteredDoctors.map((d) => (
              <Option key={d.id} value={d.id} label={d.full_name}>
                <strong>{d.full_name}</strong>
                {d.specialty && (
                  <span style={{ color: "#1890ff", marginLeft: 8 }}>
                    ({d.specialty})
                  </span>
                )}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Dịch vụ */}
        <Form.Item
          label="Dịch vụ"
          name="services"
          rules={[{ required: true, message: "Chọn ít nhất 1 dịch vụ" }]}
        >
          <Select
            mode="multiple"
            disabled={!doctorId}
            placeholder={doctorId ? "Chọn dịch vụ" : "Chọn bác sĩ trước"}
            showSearch
            filterOption={false}
            onSearch={(val) => {
              setFilteredServices(
                services.filter((s) =>
                  s.name.toLowerCase().includes(val.toLowerCase())
                )
              );
            }}
          >
            {filteredServices.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name} - <strong>{s.price.toLocaleString()}₫</strong>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Ngày */}
        <Form.Item label="Ngày hẹn" name="date" rules={[{ required: true }]}>
          <DatePicker
            style={{ width: "100%" }}
            disabledDate={(d) => d.isBefore(dayjs().startOf("day"))}
            onChange={(date) => {
              setSelectedDate(date);
              form.setFieldsValue({ time: undefined }); // reset giờ
            }}
          />
        </Form.Item>

        {/* Giờ - đã fix reset */}
        <Form.Item
          label="Khung giờ"
          name="time"
          rules={[{ required: true, message: "Chọn khung giờ" }]}
        >
          <Select
            placeholder="Chọn khung giờ"
            loading={loadingBooked}
            disabled={!doctorId || !selectedDate}
          >
            {timeSlots.map((slot) => {
              const isBooked = bookedSlots.includes(slot.value);
              return (
                <Option key={slot.value} value={slot.value} disabled={isBooked}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span>{slot.label}</span>
                    {isBooked && (
                      <span style={{ color: "#ff4d4f", fontWeight: 500 }}>
                        (Đã đặt)
                      </span>
                    )}
                  </div>
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item className={styles.actions}>
          <Space>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={isCreating}>
              Tạo lịch hẹn
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateAppointmentModal;
