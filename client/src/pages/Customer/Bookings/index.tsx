import React, { useEffect, useState } from "react";
import { type SlotInfo, type Event as RBCEvent } from "react-big-calendar";
import dayjs from "dayjs";
import { Modal, Form, Input, TimePicker, Button, message, Card } from "antd";
import { Container } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Booking.module.scss";
import { configRoutes } from "@/constants/route";
import BookingCalendarCore from "@/components/BookingCalendarCore";

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

interface LocationState {
  services: Service[];
  doctorId?: string;
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

  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state || {}) as LocationState;
  const services = state.services ?? [];

  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event("loading"));
    }, 300);
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
    setSelectedSlot(slotInfo);
    setOpen(true);
  };

  const handleFinish = async (values: BookingFormValues) => {
    if (!selectedSlot) {
      message.error("Vui lòng chọn khung giờ trên lịch trước.");
      return;
    }

    try {
      setLoading(true);

      const startBase = new Date(selectedSlot.start);
      const endBase = new Date(selectedSlot.end);

      if (values.time) {
        const t = values.time;
        startBase.setHours(t.hour(), t.minute(), 0, 0);
        endBase.setTime(startBase.getTime() + 60 * 60 * 1000);
      }

      const newEvent: RBCEvent = {
        title: `Hẹn: ${values.name}`,
        start: startBase,
        end: endBase,
      };

      setEvents((prev) => [...prev, newEvent]);

      message.success("Đặt lịch thành công!");
      setOpen(false);
      form.resetFields();
    } catch (err) {
      console.error(err);
      message.error("Đặt lịch thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className={styles.bookingPage}>
      <Card className={styles.bookingCard}>
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
                src={service.images?.[0]?.url || "/no-image.jpg"}
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
        onCancel={() => setOpen(false)}
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

          <Form.Item label="Giờ cụ thể (tuỳ chọn)" name="time">
            <TimePicker
              format="HH:mm"
              style={{ width: "100%" }}
              minuteStep={15}
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm (nếu có)" />
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
