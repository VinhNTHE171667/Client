import React, { useState, useMemo } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type Event as RBCEvent,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import { Modal, Button, Tag, Image } from "antd";
import dayjs from "dayjs";
import styles from "./CustomerOrdersCalendar.module.scss";

const locales = { vi };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AppointmentEvent extends RBCEvent {
  id: string;
  doctor?: string;
  serviceName?: string;
  image?: string;
  price?: number;
  status?: string;
}

interface Props {
  appointments: AppointmentEvent[];
  onCancel: (id: string) => void;
  onEdit: (id: string) => void;
}

const CustomerOrdersCalendar: React.FC<Props> = ({
  appointments,
  onCancel,
  onEdit,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(
    null
  );

  const events = useMemo(
    () =>
      appointments
        .filter((a) => a.start && a.end)
        .map((a) => ({
          ...a,
          title: a.serviceName ?? "Lịch hẹn",
          start: new Date(a.start ?? new Date()),
          end: new Date(a.end ?? new Date()),
        })),
    [appointments]
  );

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Hoàn thành":
        return "green";
      case "Đang chờ":
        return "blue";
      case "Đã huỷ":
        return "red";
      default:
        return "default";
    }
  };

  return (
    <div className={styles.calendarContainer}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{
          height: "75vh",
          backgroundColor: "#fff",
          borderRadius: "12px",
        }}
        popup
        onSelectEvent={(event) => setSelectedEvent(event as AppointmentEvent)}
        views={["month", "week", "day"]}
        defaultView="week"
        messages={{
          next: "Tiếp",
          previous: "Trước",
          today: "Hôm nay",
          month: "Tháng",
          week: "Tuần",
          day: "Ngày",
        }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor:
              event.status === "Đã huỷ"
                ? "#ffcccc"
                : event.status === "Hoàn thành"
                ? "#d4edda"
                : "#dbeafe",
            borderRadius: "8px",
            color: "#333",
            border: "none",
          },
        })}
        slotPropGetter={(date) => {
          const now = new Date();

          if (date < now) {
            return {
              style: {
                backgroundColor: "#e0e0e0",
                opacity: 0.6,
                pointerEvents: "none",
              },
            };
          }

          return {
            style: {
              backgroundColor: "#f0f8ff",
              cursor: "pointer",
            },
          };
        }}
      />

      <Modal
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        centered
        width={420}
      >
        {selectedEvent && (
          <div className={styles.modalContent}>
            <Image
              src={selectedEvent.image}
              alt={selectedEvent.serviceName}
              width={120}
              height={120}
              style={{
                borderRadius: 12,
                objectFit: "cover",
                marginBottom: 16,
              }}
            />
            <h2>{selectedEvent.serviceName}</h2>
            <p>
              <strong>Ngày:</strong>{" "}
              {dayjs(selectedEvent.start).format("DD/MM/YYYY HH:mm")}
            </p>
            <p>
              <strong>Bác sĩ:</strong> {selectedEvent.doctor ?? "Chưa có"}
            </p>
            <p>
              <strong>Giá:</strong>{" "}
              {selectedEvent.price?.toLocaleString("vi-VN")}₫
            </p>
            <Tag color={getStatusColor(selectedEvent.status)}>
              {selectedEvent.status}
            </Tag>

            <div className={styles.modalActions}>
              <Button onClick={() => onEdit(selectedEvent.id)} type="primary">
                Chỉnh sửa
              </Button>
              <Button
                danger
                onClick={() => onCancel(selectedEvent.id)}
                style={{ marginLeft: 8 }}
              >
                Huỷ
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerOrdersCalendar;
