import React, { useEffect, useRef, useState } from "react";
import { type SlotInfo, type Event as RBCEvent } from "react-big-calendar";
import dayjs from "dayjs";
import { Modal, Form, Input, Button, message, Card, Select } from "antd";
import { Container } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Booking.module.scss";
import { configRoutes } from "@/constants/route";
import BookingCalendarCore from "@/components/BookingCalendarCore";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  useCreateAppointmentMutation,
  useGetAppointmentsBookedByCustomerMutation,
  useGetAppointmentsBookedByDoctorMutation,
  useUpdateAppointmentMutation,
  type CreateAppointmentProps,
} from "@/services/appointment";
import { showError, showSuccess } from "@/libs/toast";
import { useAuthStore } from "@/hooks/UseAuth";
import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import { appointmentStatusEnum } from "@/common/types/auth";
import { useFindVouchersByCustomerMutation } from "@/services/voucher";
import { useGetMembershipByCustomerMutation } from "@/services/membership";
import { handleError } from "@/utils/format";

interface ServiceImage {
  url: string;
  alt?: string;
}

interface Doctor {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  images?: ServiceImage[];
  doctor?: Doctor;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface LocationState {
  services: Service[];
  doctorId?: string;
  appointmentId?: string;
  oldSlot?: {
    start: Date;
    end: Date;
  };
  full_name?: string;
  phone?: string;
  note?: string;
  totalAmount?: number;
  voucherId?: string;
}

interface BookingFormValues {
  name: string;
  phone: string;
  note?: string;
}

const BookingCalendar: React.FC = () => {
  const [form] = Form.useForm<BookingFormValues>();
  const [events, setEvents] = useState<RBCEvent[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [createAppointment] = useCreateAppointmentMutation();
  const [updateAppointment] = useUpdateAppointmentMutation();
  const [getAppointmentsBookedByDoctor] =
    useGetAppointmentsBookedByDoctorMutation();
  const [getAppointmentsBookedByCustomer] =
    useGetAppointmentsBookedByCustomerMutation();

  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(
    null
  );
  const [membershipDiscount, setMembershipDiscount] = useState<number>(0);

  const [getMembershipByCustomer] = useGetMembershipByCustomerMutation();
  const [getVouchersByCustomer] = useFindVouchersByCustomerMutation();

  const [vouchers, setVouchers] = useState<
    {
      id: string;
      code: string;
      discountAmount: number;
      discountPercent: number;
      maxDiscount: number;
    }[]
  >([]);

  const { auth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state || {}) as LocationState;
  const services = state.services ?? [];
  const doctorId = state.doctorId;
  const appointmentId = state.appointmentId;
  const oldSlot = state.oldSlot;
  const full_name = auth?.fullName;
  const phone = auth?.phone;
  const note = state.note;
  const totalAmount = state.totalAmount;
  const voucherId = state.voucherId;

  const subtotal = services.reduce((sum, s) => sum + Number(s.price), 0);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    setTimeout(() => {
      window.dispatchEvent(new Event("loading"));
    }, 300);

    handleGetBookedAppointments();
  }, []);

  if (!services.length) {
    return (
      <Container className={styles.bookingPage}>
        <Card className="p-4 text-center">
          <h3>Không có dịch vụ nào được chọn!</h3>
          <Button type="primary" onClick={() => navigate(configRoutes.cart)}>
            Quay lại giỏ hàng
          </Button>
        </Card>
      </Container>
    );
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const now = new Date();
    if (new Date(slotInfo.start) < now) {
      showError("Không thể chọn khung giờ trong quá khứ.");
      return;
    }

    const highlightEvent: RBCEvent = {
      title: "Đang chọn",
      start: slotInfo.start,
      end: slotInfo.end,
      allDay: false,
    };

    setEvents((prev) => [
      ...prev.filter((event) => event.title !== "Đang chọn"),
      highlightEvent,
    ]);
    setSelectedSlot(slotInfo);

    form.setFieldsValue({
      name: full_name || "",
      phone: phone || "",
      note: note || "",
    });

    setOpen(true);
  };

  const handleFinish = async (values: BookingFormValues) => {
    if (!selectedSlot) {
      message.error("Vui lòng chọn khung giờ trên lịch trước.");
      return;
    }

    try {
      setLoading(true);

      const payload: CreateAppointmentProps = {
        customerId: auth.accountId!,
        doctorId:
          doctorId == null || doctorId === "no-doctor" ? null : doctorId,
        staffId: null,
        appointment_date: dayjs(selectedSlot.start).toISOString(),
        startTime: dayjs(selectedSlot.start).toISOString(),
        endTime: dayjs(selectedSlot.end).toISOString(),
        details: services.map((service) => ({
          serviceId: service.id,
          price: Number(service.price),
        })),
        note: values.note || "",
        voucherId: selectedVoucherId || voucherId || null,
        totalAmount: Number(totalAmount) || calculateTotal(),
        membershipDiscount: membershipDiscount || 0,
      };

      if (appointmentId) {
        await updateAppointment({ appointmentId, data: payload }).unwrap();
        showSuccess("Cập nhật lịch hẹn thành công!");
        navigate(configRoutes.customerOrders);
      } else {
        await createAppointment(payload).unwrap();
        showSuccess("Đặt lịch thành công!");
        navigate(configRoutes.customerOrders);
      }

      setOpen(false);
      form.resetFields();
    } catch (error) {
      handleError(error, "Đặt lịch thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetBookedAppointments = async () => {
    if (!state.doctorId) return;

    try {
      const vouchersResponse = await getVouchersByCustomer(
        auth.accountId!
      ).unwrap();
      const activeVouchers = vouchersResponse.filter(
        (v: any) => v.isActive === true
      );
      setVouchers(activeVouchers);

      const membershipData = await getMembershipByCustomer(
        auth.accountId!
      ).unwrap();
      if (membershipData && membershipData.discountPercent) {
        setMembershipDiscount(Number(membershipData.discountPercent));
      }

      // LẤY LỊCH ĐÃ BOOK
      const [doctorRes, customerRes] = await Promise.all([
        getAppointmentsBookedByDoctor({ doctorId: state.doctorId }),
        getAppointmentsBookedByCustomer({ customerId: auth.accountId! }),
      ]);

      if ("data" in doctorRes && "data" in customerRes) {
        const bookedByDoctor: Appointment[] = doctorRes.data || [];
        const bookedByCustomer: Appointment[] = customerRes.data || [];

        const filterValid = (list: Appointment[]) =>
          list.filter(
            (item) =>
              item.status !== appointmentStatusEnum.Cancelled &&
              item.status !== appointmentStatusEnum.Rejected
          );

        const toEvent = (a: Appointment): RBCEvent => ({
          title: "Booked",
          start: new Date(a.startTime),
          end: new Date(a.endTime),
          allDay: false,
        });

        const mergedEvents = [
          ...filterValid(bookedByDoctor),
          ...filterValid(bookedByCustomer),
        ].map(toEvent);

        const uniqueEvents = mergedEvents.reduce<RBCEvent[]>((acc, curr) => {
          const exists = acc.some(
            (e) =>
              e.start?.getTime() === curr.start?.getTime() &&
              e.end?.getTime() === curr.end?.getTime()
          );
          if (!exists) acc.push(curr);
          return acc;
        }, []);

        if (appointmentId && oldSlot?.start && oldSlot?.end) {
          const oldEvent: RBCEvent = {
            title: "Lịch cũ",
            start: new Date(oldSlot.start),
            end: new Date(oldSlot.end),
            allDay: false,
          };

          const filtered = uniqueEvents.filter(
            (e) =>
              !(
                e.start?.getTime() === new Date(oldSlot.start).getTime() &&
                e.end?.getTime() === new Date(oldSlot.end).getTime()
              )
          );

          setEvents([...filtered, oldEvent]);
        } else {
          setEvents(uniqueEvents);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    }
  };

  const calculateTotal = (): number => {
    let total = subtotal;

    // Áp dụng voucher (chỉ voucher còn hiệu lực)
    if (selectedVoucherId) {
      const voucher = vouchers.find((v) => v.id === selectedVoucherId);
      if (voucher) {
        const amount = Number(voucher.discountAmount || 0);
        const percent = Number(voucher.discountPercent || 0);
        const max = Number(voucher.maxDiscount || 0);

        let discount = 0;
        if (amount > 0) discount = amount;
        else if (percent > 0) discount = (percent / 100) * total;

        if (max > 0) discount = Math.min(discount, max);
        discount = Math.min(discount, total);
        total = total - discount;
      }
    }

    // Áp dụng membership
    if (membershipDiscount > 0) {
      total = total * (1 - membershipDiscount / 100);
    }

    return Math.max(0, Math.round(total));
  };

  const handleBack = () => {
    navigate(configRoutes.customerOrders);
  };

  const getFilteredVouchers = () => {
    return vouchers.filter((v) => {
      let discount = 0;
      if (v.discountAmount > 0) {
        discount = v.discountAmount;
      } else if (v.discountPercent > 0) {
        discount = (v.discountPercent / 100) * subtotal;
        if (v.maxDiscount > 0) {
          discount = Math.min(discount, v.maxDiscount);
        }
      }
      return discount <= 0.5 * subtotal;
    });
  };

  return (
    <Container className={styles.bookingPage}>
      <Card className={styles.bookingCard}>
        <div className={styles.backWrapper}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className={styles.backButton}
          >
            Quay lại danh sách lịch hẹn
          </Button>
        </div>
        <h2 className={styles.title}>Chọn lịch hẹn của bạn</h2>

        <div className={styles.calendarWrapper}>
          <BookingCalendarCore
            events={events}
            onSelectSlot={handleSelectSlot}
          />
        </div>

        <div className={styles.selectedList}>
          {services.map((service) => (
            <div key={service.id} className={styles.serviceItem}>
              <img
                src={service.images?.[0]?.url || NoImage}
                alt={service.name}
                className={styles.serviceImage}
              />
              <div className={styles.serviceInfo}>
                <h4>{service.name}</h4>
                <p className={styles.doctorName}>
                  Bác sĩ: <span>{service.doctor?.name ?? "Chưa có"}</span>
                </p>
                <p className={styles.price}>
                  {service.price.toLocaleString("vi-VN")}₫
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        title="Xác nhận đặt lịch"
        open={open}
        onCancel={() => {
          setOpen(false);
          setEvents((prev) => prev.filter((e) => e.title !== "Đang chọn"));
        }}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ name: full_name }}
        >
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm (nếu có)" />
          </Form.Item>

          {totalAmount === undefined && (
            <>
              <Form.Item label="Chọn voucher giảm giá">
                <Select
                  placeholder="Chọn voucher (chỉ hiển thị voucher còn hiệu lực và giá trị sử dụng <= 50% tổng đơn)"
                  allowClear
                  value={selectedVoucherId}
                  onChange={setSelectedVoucherId}
                  options={getFilteredVouchers().map((v) => {
                    let label = v.code;
                    if (v.discountAmount > 0) {
                      label += ` - Giảm ${Number(
                        v.discountAmount
                      ).toLocaleString("vi-VN")}₫`;
                    } else if (v.discountPercent > 0) {
                      label += ` - Giảm ${v.discountPercent}%`;
                      if (v.maxDiscount) {
                        label += ` (tối đa ${Number(
                          v.maxDiscount
                        ).toLocaleString("vi-VN")}₫)`;
                      }
                    }
                    return { label, value: v.id };
                  })}
                />
              </Form.Item>

              {membershipDiscount > 0 && (
                <Form.Item label="Giảm giá thành viên">
                  <Input
                    value={membershipDiscount}
                    addonAfter="%"
                    disabled
                    style={{ background: "#f0fff0" }}
                  />
                </Form.Item>
              )}

              <Form.Item label="Tổng tiền phải thanh toán">
                <div
                  style={{
                    background: "#e6f7ff",
                    padding: "16px",
                    borderRadius: 8,
                    fontSize: 20,
                    fontWeight: "bold",
                    textAlign: "right",
                    color: "#1890ff",
                  }}
                >
                  {calculateTotal().toLocaleString("vi-VN")}₫
                </div>
              </Form.Item>
            </>
          )}

          {totalAmount !== undefined && (
            <Form.Item label="Tổng tiền">
              <div
                style={{
                  background: "#e6f7ff",
                  padding: "16px",
                  borderRadius: 8,
                  fontSize: 20,
                  fontWeight: "bold",
                  textAlign: "right",
                  color: "#1890ff",
                }}
              >
                {Number(totalAmount).toLocaleString("vi-VN")}₫
              </div>
            </Form.Item>
          )}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            Xác nhận đặt lịch
          </Button>
        </Form>
      </Modal>
    </Container>
  );
};

export default BookingCalendar;
