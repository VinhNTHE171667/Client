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
  // useCreateLinkPaymentMutation,
  type CreateAppointmentProps,
} from "@/services/appointment";
import { showError, showSuccess } from "@/libs/toast";
import { useAuthStore } from "@/hooks/UseAuth";

import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import { appointmentStatusEnum } from "@/common/types/auth";

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
}

interface BookingFormValues {
  name: string;
  phone: string;
  note?: string;
  time?: dayjs.Dayjs;
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

  // const [appointmentsBooked, setAppointmentsBooked] = useState<
  //   AppointmentProps[]
  // >([]);

  const { auth } = useAuthStore();

  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state || {}) as LocationState;
  const services = state.services ?? [];
  const doctorId = state.doctorId;
  const appointmentId = state.appointmentId;
  const oldSlot = state.oldSlot;
  const full_name = state.full_name;
  const phone = state.phone;
  const note = state.note;

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setTimeout(() => {
      window.dispatchEvent(new Event("loading"));
    }, 300);

    handleGetBookedAppointments();
  }, []);

  // const [createLinkPayment] = useCreateLinkPaymentMutation();

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

    if (full_name || phone || note) {
      form.setFieldsValue({
        name: full_name || "",
        phone: phone || "",
        note: note || "",
      });
    }

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
        doctorId: doctorId || null,
        staffId: null,
        appointment_date: dayjs(selectedSlot.start).toISOString(),
        startTime: dayjs(selectedSlot.start).toISOString(),
        endTime: dayjs(selectedSlot.end).toISOString(),
        details: services.map((service) => ({
          serviceId: service.id,
          price: Number(service.price),
        })),
        note: values.note || "",
        voucherId: null,
      };

      if (appointmentId) {
        await updateAppointment({
          appointmentId: appointmentId,
          data: payload,
        });

        navigate(configRoutes.customerOrders);
      } else {
        await createAppointment(payload).unwrap();
        navigate(configRoutes.customerOrders);
      }

      // console.log("Created appointment:", res);

      // const totalAmount = services.reduce(
      //   (sum, service) => sum + service.price,
      //   0
      // );
      // const paymentLinkResponse = await createLinkPayment({
      //   appointmentId: res.id,
      //   amount: totalAmount,
      //   description: "Thanh toán cho lịch hẹn",
      //   returnUrl: window.location.origin + configRoutes.paymentSuccess,
      //   cancelUrl: window.location.origin + configRoutes.paymentFail,
      //   customerName: values.name,
      // }).unwrap();

      // window.location.href = paymentLinkResponse.checkoutUrl;

      showSuccess("Đặt lịch thành công!");

      setOpen(false);
      form.resetFields();
    } catch {
      showError("Đặt lịch thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetBookedAppointments = async () => {
    if (!state.doctorId) return;

    try {
      const [res, res1] = await Promise.all([
        getAppointmentsBookedByDoctor({ doctorId: state.doctorId }),
        getAppointmentsBookedByCustomer({ customerId: auth.accountId! }),
      ]);

      if ("data" in res && res.data && "data" in res1 && res1.data) {
        const booked: Appointment[] = res.data;
        const booked1: Appointment[] = res1.data;

        const filterValid = (list: Appointment[]): Appointment[] =>
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

        const merged = [...filterValid(booked), ...filterValid(booked1)].map(
          toEvent
        );

        const uniqueEvents = merged.reduce<RBCEvent[]>((acc, current) => {
          const exists = acc.some(
            (ev) =>
              ev.start?.getTime() === current.start?.getTime() &&
              ev.end?.getTime() === current.end?.getTime()
          );
          if (!exists) acc.push(current);
          return acc;
        }, []);

        if (appointmentId && oldSlot?.start && oldSlot?.end) {
          const highlightEvent: RBCEvent = {
            title: "Lịch cũ",
            start: new Date(oldSlot.start),
            end: new Date(oldSlot.end),
            allDay: false,
          };

          const filtered = uniqueEvents.filter((ev) => {
            const sameTime =
              ev.start?.getTime() === new Date(oldSlot.start).getTime() &&
              ev.end?.getTime() === new Date(oldSlot.end).getTime();
            return !(ev.title === "Lịch cũ" || sameTime);
          });

          setEvents([...filtered, highlightEvent]);
        } else {
          setEvents(uniqueEvents);
        }
      } else {
        console.error("Failed to fetch appointments:", res.error);
      }
    } catch (error) {
      console.error("Error fetching booked appointments:", error);
    }
  };

  const handleBack = () => {
    navigate(configRoutes.customerOrders);
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
          setEvents((prev) =>
            prev.filter((event) => event.title !== "Đang chọn")
          );
        }}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className={styles.form}
        >
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Nhập họ và tên của bạn" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          {/* <Form.Item label="Giờ cụ thể (tuỳ chọn)" name="time">
            <TimePicker
              format="HH:mm"
              style={{ width: "100%" }}
              minuteStep={15}
            />
          </Form.Item> */}

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm (nếu có)" />
          </Form.Item>

          {/* <Form.Item label="Voucher">
            <Select
              placeholder="Chọn voucher"
              allowClear
              value={selectedVoucherId ?? undefined}
              onChange={(value) => setSelectedVoucherId(value)}
              options={vouchers.map((v) => ({
                label: `${v.code} - Giảm ${
                  v.discountAmount || v.discountPercent
                }%`,
                value: v.id,
              }))}
            />
          </Form.Item> */}

          <Form.Item label="Membership giảm giá">
            <Input
              value={membershipDiscount}
              onChange={(e) => setMembershipDiscount(Number(e.target.value))}
              type="number"
              min={0}
              max={100}
              addonAfter="%"
              placeholder="Nhập % giảm giá nếu có"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className={styles.submitBtn}
          >
            Xác nhận
          </Button>
        </Form>
      </Modal>
    </Container>
  );
};

export default BookingCalendar;
