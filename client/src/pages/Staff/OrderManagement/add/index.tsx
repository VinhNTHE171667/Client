import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  DatePicker,
  TimePicker,
  Select,
  message,
  Space,
  Modal,
  Input,
} from "antd";
import dayjs from "dayjs";
import { useCreateAppointmentMutation } from "@/services/appointment";
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

const CreateAppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onReload,
}) => {
  const [form] = Form.useForm();
  const [createAppointment, { isLoading }] = useCreateAppointmentMutation();
  const [getAllPublicDoctors] = useGetDoctorsMutation();
  const [getServiceByDoctor] = useGetPublicDoctorProfileMutation();
  const [getAllCustomers] = useGetCustomersMutation();

  // Dữ liệu gốc (tải 1 lần)
  const [allDoctors, setAllDoctors] = useState<DoctorDatas[]>([]);
  const [allCustomers, setAllCustomers] = useState<
    { id: string; full_name: string; email: string; phone: string }[]
  >([]);
  const [services, setServices] = useState<
    { id: string; name: string; price: number }[]
  >([]);

  // Dữ liệu đang hiển thị (sau khi filter)
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorDatas[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState(allCustomers);
  const [filteredServices, setFilteredServices] = useState(services);

  const [doctorSelected, setDoctorSelected] = useState<string>("");
  const [createState, setCreateState] = useState<boolean>(false);

  const { auth } = useAuthStore();

  // Tải toàn bộ dữ liệu khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        // Tải bác sĩ
        const doctorsRes = await getAllPublicDoctors({}).unwrap();
        const activeDoctors = doctorsRes.filter((d: DoctorDatas) => d.isActive);
        setAllDoctors(activeDoctors);
        setFilteredDoctors(activeDoctors);

        // Tải khách hàng
        const customersRes = await getAllCustomers({}).unwrap();
        setAllCustomers(customersRes);
        setFilteredCustomers(customersRes);
      } catch (err) {
        showError("Không thể tải dữ liệu");
      }
    };

    loadData();
    form.resetFields();
    setDoctorSelected("");
    setServices([]);
    setFilteredServices([]);
  }, [isOpen]);

  // Tải dịch vụ khi chọn bác sĩ
  useEffect(() => {
    if (!doctorSelected) {
      setServices([]);
      setFilteredServices([]);
      return;
    }

    const loadServices = async () => {
      try {
        const res = await getServiceByDoctor(doctorSelected).unwrap();
        const list = (res.services || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          price: s.price || 0,
        }));
        setServices(list);
        setFilteredServices(list);
      } catch {
        showError("Không tải được dịch vụ");
        setServices([]);
        setFilteredServices([]);
      }
    };

    loadServices();
  }, [doctorSelected]);

  // Tìm kiếm khách hàng (tên, email, sđt)
  const handleSearchCustomer = (value: string) => {
    const lower = value.toLowerCase().trim();
    if (!lower) {
      setFilteredCustomers(allCustomers);
      return;
    }

    const filtered = allCustomers.filter((c) =>
      [c.full_name, c.email, c.phone].some(
        (field) => field && field.toLowerCase().includes(lower)
      )
    );
    setFilteredCustomers(filtered);
  };

  // Tìm kiếm bác sĩ (tên + chuyên môn)
  const handleSearchDoctor = (value: string) => {
    const lower = value.toLowerCase().trim();
    if (!lower) {
      setFilteredDoctors(allDoctors);
      return;
    }

    const filtered = allDoctors.filter((d) =>
      [d.full_name, d.specialty].some(
        (field) => field && field.toLowerCase().includes(lower)
      )
    );
    setFilteredDoctors(filtered);
  };

  // Tìm kiếm dịch vụ
  const handleSearchService = (value: string) => {
    const lower = value.toLowerCase().trim();
    if (!lower) {
      setFilteredServices(services);
      return;
    }

    const filtered = services.filter((s) =>
      s.name.toLowerCase().includes(lower)
    );
    setFilteredServices(filtered);
  };

  const handleSubmit = async (values: any) => {
    try {
      const date = values.date;
      const [start, end] = values.time;

      const startTime = date
        .hour(start.hour())
        .minute(start.minute())
        .second(0);
      const endTime = date.hour(end.hour()).minute(end.minute()).second(0);

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
      form.resetFields();
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
      centered
      width={680}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        {/* Khách hàng */}
        <Form.Item
          label="Khách hàng"
          name="customerId"
          rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
        >
          <Select
            showSearch
            placeholder="Tìm tên, email, số điện thoại..."
            filterOption={false}
            onSearch={handleSearchCustomer}
            notFoundContent="Không tìm thấy khách hàng"
            optionLabelProp="label"
          >
            {filteredCustomers.map((c) => (
              <Select.Option key={c.id} value={c.id} label={c.full_name}>
                <div>
                  <div>
                    <strong>{c.full_name}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {c.phone} • {c.email}
                  </div>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Space className="mb-4">
          <FancyButton
            label="Thêm khách hàng mới"
            size="middle"
            onClick={() => setCreateState(true)}
            variant="primary"
          />
          <AddCustomer
            isOpen={createState}
            onClose={() => setCreateState(false)}
            onReload={() => getAllCustomers({}).unwrap().then(setAllCustomers)}
          />
        </Space>

        {/* Bác sĩ */}
        <Form.Item
          label="Bác sĩ"
          name="doctorId"
          rules={[{ required: true, message: "Vui lòng chọn bác sĩ" }]}
        >
          <Select
            showSearch
            placeholder="Tìm tên bác sĩ hoặc chuyên môn..."
            filterOption={false}
            onSearch={handleSearchDoctor}
            onChange={(val) => {
              setDoctorSelected(val as string);
              form.setFieldsValue({ services: [] });
            }}
            notFoundContent="Không tìm thấy bác sĩ"
            optionLabelProp="label"
          >
            {filteredDoctors.map((d) => (
              <Select.Option key={d.id} value={d.id} label={d.full_name}>
                <div>
                  <strong>{d.full_name}</strong>
                  {d.specialty && (
                    <span style={{ color: "#1890ff", marginLeft: 8 }}>
                      ({d.specialty})
                    </span>
                  )}
                </div>
              </Select.Option>
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
            showSearch
            placeholder="Tìm tên dịch vụ..."
            disabled={!doctorSelected}
            filterOption={false}
            onSearch={handleSearchService}
            notContent={
              doctorSelected
                ? filteredServices.length === 0
                  ? "Không có dịch vụ nào"
                  : null
                : "Vui lòng chọn bác sĩ trước"
            }
          >
            {filteredServices.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name} - <strong>{s.price.toLocaleString()}₫</strong>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Ngày & Giờ */}
        <Form.Item label="Ngày hẹn" name="date" rules={[{ required: true }]}>
          <DatePicker
            style={{ width: "100%" }}
            disabledDate={(d) => d.isBefore(dayjs().startOf("day"))}
          />
        </Form.Item>

        <Form.Item
          label="Giờ hẹn (09:00 - 17:00)"
          name="time"
          rules={[{ required: true, message: "Chọn giờ hẹn" }]}
        >
          <TimePicker.RangePicker
            format="HH:mm"
            minuteStep={15}
            style={{ width: "100%" }}
            disabledHours={() => [
              0, 1, 2, 3, 4, 5, 6, 7, 8, 17, 18, 19, 20, 21, 22, 23,
            ]}
            hideDisabledOptions
          />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea rows={3} placeholder="Ghi chú (nếu có)" />
        </Form.Item>

        <Form.Item className={styles.actions}>
          <Space>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Tạo lịch hẹn
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateAppointmentModal;
