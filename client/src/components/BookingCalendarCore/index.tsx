import React, { useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type SlotInfo,
  type View,
  type Event as RBCEvent,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import styles from "./BookingCalendarCore.module.scss";

const locales = { vi };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BookingCalendarCoreProps {
  events: RBCEvent[];
  onSelectSlot: (slot: SlotInfo) => void;
}

const BookingCalendarCore: React.FC<BookingCalendarCoreProps> = ({
  events,
  onSelectSlot,
}) => {
  const [currentView, setCurrentView] = useState<View>("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  return (
    <div className={styles.calendarContainer}>
      <Calendar
        step={60}
        timeslots={1}
        selectable
        popup={false}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectSlot={onSelectSlot}
        style={{ height: "75vh", backgroundColor: "#fff" }}
        min={new Date(0, 0, 0, 9, 0, 0)}
        max={new Date(0, 0, 0, 17, 0, 0)}
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
        view={currentView}
        date={currentDate}
        onView={(view) => setCurrentView(view)}
        onNavigate={(date) => setCurrentDate(date)}
        messages={{
          next: "Tiếp",
          previous: "Trước",
          today: "Hôm nay",
          month: "Tháng",
          week: "Tuần",
          day: "Ngày",
        }}
        views={["month", "week", "day"]}
        defaultView="week"
        formats={{
          timeGutterFormat: (date, culture, localizer) =>
            localizer
              ? localizer.format(date, "HH:mm", culture)
              : format(date, "HH:mm"),
        }}
      />
    </div>
  );
};

export default BookingCalendarCore;
