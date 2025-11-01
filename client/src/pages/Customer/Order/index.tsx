import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  List,
  Avatar,
  Tag,
  Spin,
  Empty,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
} from "antd";
import {
  Calendar,
  dateFnsLocalizer,
  type SlotInfo,
  type Event as RBCEvent,
  type View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import dayjs from "dayjs";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./Order.module.scss";
import {
  useCreateLinkPaymentMutation,
  useGetAppointmentsByCustomerMutation,
  type AppointmentProps,
} from "@/services/appointment";
import { useAuthStore } from "@/hooks/UseAuth";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { configRoutes } from "@/constants/route";

const { confirm } = Modal;

const locales = { vi };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomerOrders: React.FC = () => {
  const { auth } = useAuthStore();
  const [getAppointments, { isLoading }] =
    useGetAppointmentsByCustomerMutation();
  const [appointments, setAppointments] = useState<AppointmentProps[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>("week");
  const [editModal, setEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentProps | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (auth?.accountId) {
      getAppointments({ customerId: auth.accountId })
        .unwrap()
        .then(setAppointments)
        .catch(() => setAppointments([]));
    }
  }, [auth]);

  const events: RBCEvent[] = useMemo(
    () =>
      appointments.map((a) => ({
        id: a.id,
        title: a.details?.[0]?.service?.[0]?.name ?? "Lịch hẹn",
        start: new Date(a.startTime ?? new Date()),
        end: new Date(a.endTime ?? a.startTime ?? new Date()),
        resource: a,
      })),
    [appointments]
  );

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    console.log("Slot selected:", slotInfo);
  };

  const handleSelectEvent = (event: RBCEvent) => {
    const appointment = event.resource as AppointmentProps;
    setSelectedAppointment(appointment);
    form.setFieldsValue({
      note: appointment.note,
      date: dayjs(appointment.startTime),
    });
    setEditModal(true);
  };

  const handleCancelAppointment = (item: AppointmentProps) => {
    confirm({
      title: "Xác nhận huỷ lịch hẹn?",
      icon: <ExclamationCircleOutlined />,
      content:
        "Bạn có chắc muốn huỷ lịch hẹn này? Hành động này không thể hoàn tác.",
      okText: "Huỷ lịch",
      cancelText: "Đóng",
      okButtonProps: { danger: true },
      onOk() {
        message.success("Đã huỷ lịch hẹn!");
      },
    });
  };

  const handleSaveEdit = () => {
    form.validateFields().then((values) => {
      message.success("Cập nhật lịch hẹn thành công!");
      setEditModal(false);
    });
  };
  const [createPaymentLink] = useCreateLinkPaymentMutation();

  const handleDeposit = async (item: AppointmentProps) => {
    try {
      const total = (item.details ?? []).reduce(
        (sum, d) => sum + Number(d.price ?? 0),
        0
      );

      if (total <= 0) {
        message.error("Không có giá trị dịch vụ để đặt cọc.");
        return;
      }

      const depositAmount = Math.ceil(total * 0.5);

      const payload = {
        appointmentId: item.id,
        amount: depositAmount,
        description: `Coc lich hen #${item.id}`.slice(0, 25),
        returnUrl: `${window.location.origin}${configRoutes.paymentSuccess}`,
        cancelUrl: `${window.location.origin}${configRoutes.paymentFail}`,
        customerName: item.customer?.full_name || "Khách hàng",
      };

      const res = await createPaymentLink(payload).unwrap();

      if (res?.checkoutUrl) {
        message.success("Tạo liên kết thanh toán thành công!");
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error("Không nhận được liên kết thanh toán từ máy chủ.");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo đặt cọc.";
      message.error(msg);
    }
  };

  const statusTagColor = (status?: string) =>
    status === "CANCELLED"
      ? "red"
      : status === "COMPLETED"
      ? "green"
      : status === "CONFIRMED" || status === "confirmed"
      ? "blue"
      : "cyan";

  return (
    <Container className={styles.ordersPage}>
      <Row>
        <Col xs={12}>
          <Card className={styles.calendarCard}>
            <h3 className={`${styles.sectionTitle} cus-text-primary`}>
              Lịch hẹn của bạn
            </h3>

            <div style={{ height: "75vh" }}>
              <Calendar
                localizer={localizer}
                events={events}
                timeslots={1}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%", backgroundColor: "#fff" }}
                step={60}
                selectable
                popup={true}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                date={currentDate}
                view={currentView}
                onView={(v) => setCurrentView(v)}
                onNavigate={(d) => setCurrentDate(d)}
                min={new Date(0, 0, 0, 9, 0, 0)}
                max={new Date(0, 0, 0, 17, 0, 0)}
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
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor:
                      event.resource?.status === "CANCELLED"
                        ? "#f87171"
                        : event.resource?.status === "COMPLETED"
                        ? "#4ade80"
                        : "#60a5fa",
                    borderRadius: "8px",
                    color: "#fff",
                    border: "none",
                    padding: "4px 8px",
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
            </div>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card className={styles.listCard}>
            <h3 className={`${styles.sectionTitle} cus-text-primary`}>
              Danh sách lịch hẹn
            </h3>

            {isLoading ? (
              <Spin size="large" className="d-block mx-auto my-5" />
            ) : appointments.length === 0 ? (
              <Empty description="Không có lịch hẹn nào." />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={appointments}
                renderItem={(item) => {
                  const totalPrice = item.details
                    ?.reduce((sum, d) => sum + Number(d.price ?? 0), 0)
                    .toLocaleString("vi-VN");
                  const isConfirmed =
                    item.status === "CONFIRMED" || item.status === "confirmed";
                  const isImported =
                    item.status === "IMPORTED" || item.status === "imported";

                  return (
                    <Card
                      className={styles.orderCard}
                      key={item.id}
                      bordered={false}
                    >
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              shape="square"
                              size={72}
                              src={
                                item.details?.[0]?.service?.[0]?.images?.[0]
                                  ?.url
                              }
                            />
                          }
                          title={
                            <div className={styles.header}>
                              <h4>
                                {item.details?.[0]?.service?.[0]?.name ||
                                  "Dịch vụ"}
                              </h4>
                              <Tag color={statusTagColor(item.status)}>
                                {item.status}
                              </Tag>
                            </div>
                          }
                          description={
                            <>
                              <p>
                                <strong>Ngày:</strong>{" "}
                                {dayjs(item.startTime).format(
                                  "DD/MM/YYYY HH:mm"
                                )}
                              </p>
                              <p>
                                <strong>Bác sĩ:</strong>{" "}
                                {item.doctor
                                  ? item.doctor.full_name
                                  : "Chưa có"}
                              </p>
                              <p>
                                <strong>Ghi chú:</strong>{" "}
                                {item.note || "Không có"}
                              </p>
                            </>
                          }
                        />
                        <div className={styles.footer}>
                          <div
                            className={`${styles.totalPrice} cus-text-primary`}
                          >
                            {totalPrice}₫
                          </div>
                          <div className={styles.actions}>
                            {!isImported && (
                              <>
                                <Button
                                  icon={<EditOutlined />}
                                  onClick={() =>
                                    handleSelectEvent({
                                      ...item,
                                      resource: item,
                                      start: new Date(item.startTime),
                                      end: new Date(
                                        item.endTime ?? item.startTime
                                      ),
                                    })
                                  }
                                >
                                  Chỉnh sửa
                                </Button>

                                <Button
                                  icon={<DeleteOutlined />}
                                  danger
                                  onClick={() => handleCancelAppointment(item)}
                                >
                                  Huỷ
                                </Button>
                              </>
                            )}
                            {isConfirmed && (
                              <Button
                                type="primary"
                                onClick={() => handleDeposit(item)}
                                style={{ marginLeft: 8 }}
                              >
                                Đặt cọc 50%
                              </Button>
                            )}
                          </div>
                        </div>
                      </List.Item>
                    </Card>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Chỉnh sửa lịch hẹn"
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={handleSaveEdit}
        okText="Lưu thay đổi"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Ngày hẹn"
            name="date"
            rules={[{ required: true, message: "Vui lòng chọn ngày hẹn" }]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú..." />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};

export default CustomerOrders;
