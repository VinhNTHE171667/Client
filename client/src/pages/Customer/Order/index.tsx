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
  message,
  DatePicker,
  Select,
  Input,
  Form,
  Rate,
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
  useUpdateAppointmentMutationCancelMutation,
  type AppointmentProps,
} from "@/services/appointment";
import { useAuthStore } from "@/hooks/UseAuth";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { configRoutes } from "@/constants/route";
import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import { useNavigate } from "react-router-dom";
import { appointmentStatusEnum } from "@/common/types/auth";
import { showError, showSuccess } from "@/libs/toast";
import { handleError, statusTagColor, translateStatus } from "@/utils/format";
import {
  useCreateFeedbacksMutation,
  useFindByAppointmentMutation,
  type FeedbackResponse,
} from "@/services/feedback";
import FancyButton from "@/components/FancyButton";

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
  const [cancelModal, setCancelModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentProps>();

  const navigate = useNavigate();
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState<
    { serviceId: string; rating?: number; comment?: string }[]
  >([]);

  const [viewFeedbackModal, setViewFeedbackModal] = useState(false);
  const [viewFeedbacks, setViewFeedbacks] = useState<FeedbackResponse[]>([]);
  const [getFeedbackByAppointment, { isLoading: isLoadingFeedback }] =
    useFindByAppointmentMutation();

  const handleEvent = () => {
    if (auth?.accountId) {
      getAppointments({ customerId: auth.accountId })
        .unwrap()
        .then(setAppointments)
        .catch(() => setAppointments([]));
    }
  };

  useEffect(() => {
    handleEvent();
  }, [auth]);

  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  const events: RBCEvent[] = useMemo(
    () =>
      appointments
        .filter((a) => {
          return (
            a.status !== appointmentStatusEnum.Cancelled &&
            a.status !== appointmentStatusEnum.Rejected &&
            a.status !== appointmentStatusEnum.Completed &&
            a.status !== appointmentStatusEnum.Paid
          );
        })
        .map((a) => ({
          id: a.id,
          title: a.details?.[0]?.service?.name ?? "Lịch hẹn",
          start: new Date(a.startTime ?? new Date()),
          end: new Date(a.endTime ?? a.startTime ?? new Date()),
          resource: a,
        })),
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    if (!statusFilter?.length && !dateRange) {
      return appointments;
    }

    return appointments.filter((item) => {
      const matchStatus =
        !statusFilter?.length || statusFilter.includes(item.status || "");

      const matchDate =
        !dateRange ||
        (dayjs(item.startTime).isAfter(dateRange[0], "day") &&
          dayjs(item.startTime).isBefore(dateRange[1], "day")) ||
        dayjs(item.startTime).isSame(dateRange[0], "day") ||
        dayjs(item.startTime).isSame(dateRange[1], "day");

      return matchStatus && matchDate;
    });
  }, [appointments, statusFilter, dateRange]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    console.log("Slot selected:", slotInfo);
  };

  const handleSelectEvent = (event: RBCEvent) => {
    const appointment = event.resource as AppointmentProps;
    setSelectedAppointment(appointment);

    // form.setFieldsValue({
    //   note: appointment.note,
    //   date: dayjs(appointment.startTime),
    // });
    setEditModal(true);
  };

  const [updateCancelAppointment] =
    useUpdateAppointmentMutationCancelMutation();

  const handleCancelAppointment = async (values: { cancelReason: string }) => {
    try {
      const res = await updateCancelAppointment({
        appointmentId: selectedAppointment?.id || "",
        reason: values.cancelReason || "Khách hàng huỷ lịch hẹn",
      });

      if (res) {
        showSuccess("Huỷ lịch hẹn thành công.");
      } else {
        showError("Huỷ lịch hẹn thất bại.");
      }

      setCancelModal(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi huỷ lịch hẹn.";
      showError(msg);
    }
  };

  const handleSaveEdit = () => {
    navigate(configRoutes.bookings, {
      state: {
        oldSlot: {
          start: selectedAppointment?.startTime || null,
          end: selectedAppointment?.endTime || null,
        },
        appointmentId: selectedAppointment?.id || null,
        doctorId: selectedAppointment?.doctorId || null,
        services: selectedAppointment?.details?.map((d) => d.service) || [],

        full_name: selectedAppointment?.customer?.full_name || null,
        phone: selectedAppointment?.customer?.phone || null,
        note: selectedAppointment?.note || null,
      },
    });
  };
  const [createPaymentLink] = useCreateLinkPaymentMutation();

  const handleDeposit = async (item: AppointmentProps) => {
    try {
      // const total = (item.details ?? []).reduce(
      //   (sum, d) => sum + Number(d.price ?? 0),
      //   0
      // );
      const total = Number(item.totalAmount);

      if (total <= 0) {
        message.error("Không có giá trị dịch vụ để đặt cọc.");
        return;
      }

      const depositAmount = Math.ceil(total * 0.5);

      const payload = {
        appointmentId: item.id,
        amount: depositAmount,
        description: `${item.id}`.slice(0, 25),
        returnUrl: `${window.location.origin}${configRoutes.paymentSuccessDeposit}`,
        cancelUrl: `${window.location.origin}${configRoutes.paymentFailDeposit}`,
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

  const [createFeedbacks] = useCreateFeedbacksMutation();

  const handleCreateFeedbacks = async () => {
    try {
      await createFeedbacks({
        feedbacks: feedbacks.map((f) => ({
          appointmentId: selectedAppointment?.id || "",
          customerId: auth.accountId!,
          serviceId: f.serviceId,
          rating: f.rating!,
          comment: f.comment,
        })),
      }).unwrap();
      showSuccess("Gửi feedback thành công!");
      setFeedbackModal(false);
      handleEvent();
    } catch (err) {
      handleError(err);
    }
  };

  const handleViewFeedback = async (appointment: AppointmentProps) => {
    try {
      const res = await getFeedbackByAppointment(appointment.id).unwrap();
      setViewFeedbacks(res);
      setSelectedAppointment(appointment);
      setViewFeedbackModal(true);
    } catch (err) {
      handleError(err);
    }
  };

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

            <div className={styles.filterBar}>
              <DatePicker.RangePicker
                format="DD/MM/YYYY"
                onChange={(range) => setDateRange(range)}
                style={{ marginRight: 12 }}
              />

              <Select
                allowClear
                placeholder="Chọn trạng thái"
                value={statusFilter ?? undefined}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 200 }}
                mode="multiple"
                options={[
                  {
                    label: "Chờ xác nhận",
                    value: appointmentStatusEnum.Pending,
                  },
                  {
                    label: "Đã xác nhận",
                    value: appointmentStatusEnum.Confirmed,
                  },
                  {
                    label: "Đã đặt cọc",
                    value: appointmentStatusEnum.Deposited,
                  },
                  { label: "Đã duyệt", value: appointmentStatusEnum.Approved },
                  {
                    label: "Bị từ chối",
                    value: appointmentStatusEnum.Rejected,
                  },
                  { label: "Đã thanh toán", value: appointmentStatusEnum.Paid },
                  { label: "Đã huỷ", value: appointmentStatusEnum.Cancelled },
                ]}
              />

              <Button
                onClick={() => {
                  setDateRange(null);
                  setStatusFilter(null);
                }}
              >
                Xoá bộ lọc
              </Button>
            </div>

            {isLoading ? (
              <Spin size="large" className="d-block mx-auto my-5" />
            ) : appointments.length === 0 ? (
              <Empty description="Không có lịch hẹn nào." />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={filteredAppointments}
                renderItem={(item) => {
                  // const totalPrice = item.details
                  //   ?.reduce((sum, d) => sum + Number(d.price ?? 0), 0)
                  //   .toLocaleString("vi-VN");
                  const totalPrice = Number(item.totalAmount).toLocaleString(
                    "vi-VN"
                  );
                  const isPending =
                    item.status === appointmentStatusEnum.Pending;
                  const isConfirmed =
                    item.status === appointmentStatusEnum.Confirmed;
                  const isRejected =
                    item.status === appointmentStatusEnum.Rejected;
                  const isPay = item.status === appointmentStatusEnum.Paid;

                  // const isCancelled =
                  //   item.status === appointmentStatusEnum.Cancelled;

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
                              src={item.customer?.avatar || NoImage}
                            />
                          }
                          title={
                            <div className={styles.header}>
                              <h5>
                                {item.customer?.full_name || "Khách hàng"}{" "}
                              </h5>
                              <Tag color={statusTagColor(item.status)}>
                                {translateStatus(item.status)}
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
                            <Button
                              onClick={() => {
                                setSelectedAppointment(item);
                                setDetailModal(true);
                              }}
                            >
                              Xem chi tiết
                            </Button>

                            {isPending && (
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
                                  onClick={() => {
                                    setSelectedAppointment(item);
                                    setCancelModal(true);
                                  }}
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

                            {isPay && (
                              <>
                                <Button
                                  type="primary"
                                  onClick={() => {
                                    setSelectedAppointment(item);
                                    setFeedbacks(
                                      item.details?.map((d) => ({
                                        serviceId: d.serviceId,
                                        rating: undefined,
                                        comment: "",
                                      })) || []
                                    );
                                    setFeedbackModal(true);
                                  }}
                                  disabled={item.isFeedbackGiven}
                                >
                                  Đánh giá
                                </Button>

                                {item.isFeedbackGiven && (
                                  <Button
                                    onClick={() => handleViewFeedback(item)}
                                    style={{ marginLeft: 8 }}
                                  >
                                    Xem đánh giá
                                  </Button>
                                )}
                              </>
                            )}

                            {isRejected && (
                              <Button
                                onClick={() => {
                                  setRejectReason(
                                    item.rejectionReason ??
                                      "Không có lý do được cung cấp"
                                  );
                                  setRejectModal(true);
                                }}
                              >
                                Xem lý do
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
        title="Chi tiết lịch hẹn"
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={handleSaveEdit}
        okText="Chỉnh sửa"
        okButtonProps={{
          disabled:
            selectedAppointment?.status !== appointmentStatusEnum.Pending,
        }}
        cancelText="Huỷ"
      >
        {selectedAppointment ? (
          <>
            <p>
              <strong>Trạng thái:</strong>{" "}
              <Tag color={statusTagColor(selectedAppointment.status)}>
                {translateStatus(selectedAppointment.status)}
              </Tag>
            </p>

            <p>
              <strong>Ngày:</strong>{" "}
              {dayjs(selectedAppointment.startTime).format("DD/MM/YYYY HH:mm")}
            </p>

            <p>
              <strong>Bác sĩ:</strong>{" "}
              {selectedAppointment.doctor?.full_name || "Chưa có"}
            </p>

            <p>
              <strong>Ghi chú:</strong> {selectedAppointment.note || "Không có"}
            </p>

            <div style={{ marginTop: 12 }}>
              <strong>Dịch vụ:</strong>
              {selectedAppointment.details?.map((detail) => {
                const svc = detail.service;
                const img = svc?.images?.[0]?.url || NoImage;
                return (
                  <div
                    key={detail.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 8,
                      borderBottom: "1px solid #eee",
                      paddingBottom: 8,
                    }}
                  >
                    <img
                      src={img}
                      alt={svc?.name}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        {svc?.name || "Dịch vụ"}
                      </p>
                      <p style={{ margin: 0 }}>
                        Giá: {Number(detail.price ?? 0).toLocaleString("vi-VN")}
                        ₫
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ marginTop: 12, fontWeight: 600 }}>
              Tổng tiền:{" "}
              {/* {selectedAppointment.details
                ?.reduce((sum, d) => sum + Number(d.price ?? 0), 0)
                .toLocaleString("vi-VN")}
              ₫ */}
              {Number(selectedAppointment.totalAmount).toLocaleString("vi-VN")}₫
            </p>
          </>
        ) : (
          <p>Không có thông tin lịch hẹn.</p>
        )}
        {/* <div className={styles.selectedList}>
          {selectedAppointment?.details.map((detail) => {
            const svc = detail.service;
            const imgSrc = svc?.images?.[0]?.url ? svc.images[0].url : NoImage;
            const name = svc?.name ?? "Dịch vụ";
            const doctorName =
              selectedAppointment?.doctor?.full_name ?? "Chưa có";
            const price = Number(
              detail.price ?? svc?.price ?? 0
            ).toLocaleString("vi-VN");
            return (
              <div key={detail.id} className={styles.serviceItem}>
                <img src={imgSrc} alt={name} className={styles.serviceImage} />
                <div className={styles.serviceInfo}>
                  <h4>{name}</h4>
                  <p className={styles.doctorName}>
                    Bác sĩ: <span>{doctorName}</span>
                  </p>
                  <p className={styles.price}>{price}₫</p>
                </div>
              </div>
            );
          })}
        </div> */}
      </Modal>

      <Modal
        title="Huỷ lịch hẹn"
        open={cancelModal}
        onCancel={() => setCancelModal(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCancelAppointment}>
          <Form.Item
            label="Lý do huỷ"
            name="cancelReason"
            rules={[{ required: true, message: "Vui lòng nhập lý do huỷ" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập lý do huỷ lịch hẹn..." />
          </Form.Item>

          <Form.Item>
            <div className="d-flex justify-content-center gap-4">
              <Button onClick={() => setCancelModal(false)}>Huỷ</Button>
              <Button type="primary" htmlType="submit">
                Xác nhận huỷ
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Lý do từ chối lịch hẹn"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setRejectModal(false)}
          >
            Đóng
          </Button>,
        ]}
      >
        <p style={{ whiteSpace: "pre-wrap", fontSize: 15 }}>{rejectReason}</p>
      </Modal>

      <Modal
        title="Chi tiết lịch hẹn"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            Đóng
          </Button>,
        ]}
      >
        {selectedAppointment ? (
          <>
            <p>
              <strong>Trạng thái:</strong>{" "}
              <Tag color={statusTagColor(selectedAppointment.status)}>
                {translateStatus(selectedAppointment.status)}
              </Tag>
            </p>

            <p>
              <strong>Ngày:</strong>{" "}
              {dayjs(selectedAppointment.startTime).format("DD/MM/YYYY HH:mm")}
            </p>

            <p>
              <strong>Bác sĩ:</strong>{" "}
              {selectedAppointment.doctor?.full_name || "Chưa có"}
            </p>

            <p>
              <strong>Ghi chú:</strong> {selectedAppointment.note || "Không có"}
            </p>

            <div style={{ marginTop: 12 }}>
              <strong>Dịch vụ:</strong>
              {selectedAppointment.details?.map((detail) => {
                const svc = detail.service;
                const img = svc?.images?.[0]?.url || NoImage;
                return (
                  <div
                    key={detail.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 8,
                      borderBottom: "1px solid #eee",
                      paddingBottom: 8,
                    }}
                  >
                    <img
                      src={img}
                      alt={svc?.name}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        {svc?.name || "Dịch vụ"}
                      </p>
                      <p style={{ margin: 0 }}>
                        Giá: {Number(detail.price ?? 0).toLocaleString("vi-VN")}
                        ₫
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ marginTop: 12, fontWeight: 600 }}>
              Tổng tiền:{" "}
              {/* {selectedAppointment.details
                ?.reduce((sum, d) => sum + Number(d.price ?? 0), 0)
                .toLocaleString("vi-VN")}
              ₫ */}
              {Number(selectedAppointment.totalAmount).toLocaleString("vi-VN")}₫
            </p>
          </>
        ) : (
          <p>Không có thông tin lịch hẹn.</p>
        )}
      </Modal>

      <Modal
        open={feedbackModal}
        onCancel={() => setFeedbackModal(false)}
        footer={null}
        width={800}
      >
        <div>
          <h3 className="cus-text-primary text-center">Đánh giá dịch vụ</h3>
        </div>
        <div className={styles.feedbackModalContent}>
          <div className={styles.appointmentInfo}>
            <p>
              <strong>Khách hàng:</strong>{" "}
              {selectedAppointment?.customer?.full_name}
            </p>
            <p>
              <strong>Ngày:</strong>{" "}
              {dayjs(selectedAppointment?.startTime).format("DD/MM/YYYY HH:mm")}
            </p>
            <p>
              <strong>Bác sĩ:</strong>{" "}
              {selectedAppointment?.doctor?.full_name || "Chưa có"}
            </p>
            <p>
              <strong>Tổng tiền:</strong>{" "}
              {selectedAppointment?.details
                ?.reduce((sum, d) => sum + Number(d.price ?? 0), 0)
                .toLocaleString("vi-VN")}
              ₫
            </p>
          </div>

          <div className={styles.feedbackList}>
            {feedbacks.map((f, idx) => {
              const detail = selectedAppointment?.details[idx];
              const svc = detail?.service;
              const img = svc?.images?.[0]?.url || NoImage;

              return (
                <div key={f.serviceId} className={styles.feedbackCard}>
                  <div className={styles.feedbackLeft}>
                    <img
                      src={img}
                      alt={svc?.name}
                      className={styles.feedbackImage}
                    />
                    <div>
                      <p className={styles.feedbackServiceName}>{svc?.name}</p>
                      <p className={styles.feedbackServicePrice}>
                        {Number(detail?.price ?? 0).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>

                  <div className={styles.feedbackRight}>
                    <Rate
                      allowHalf
                      value={f.rating}
                      onChange={(val) => {
                        const copy = [...feedbacks];
                        copy[idx].rating = val;
                        setFeedbacks(copy);
                      }}
                    />
                    <Input.TextArea
                      rows={3}
                      placeholder="Cảm nhận của bạn..."
                      value={f.comment}
                      onChange={(e) => {
                        const copy = [...feedbacks];
                        copy[idx].comment = e.target.value;
                        setFeedbacks(copy);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.feedbackFooter}>
            <FancyButton
              onClick={handleCreateFeedbacks}
              variant="primary"
              size="middle"
              label="Gửi đánh giá"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={viewFeedbackModal}
        onCancel={() => setViewFeedbackModal(false)}
        footer={[
          <Button key="close" onClick={() => setViewFeedbackModal(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        <div>
          <h3 className="cus-text-primary text-center">Đánh giá của bạn</h3>
        </div>

        {isLoadingFeedback ? (
          <Spin className="d-block mx-auto my-4" />
        ) : viewFeedbacks.length === 0 ? (
          <Empty description="Chưa có đánh giá nào." />
        ) : (
          <div className={styles.feedbackModalContent}>
            <div className={styles.appointmentInfo}>
              <p>
                <strong>Khách hàng:</strong>{" "}
                {selectedAppointment?.customer?.full_name}
              </p>
              <p>
                <strong>Ngày:</strong>{" "}
                {dayjs(selectedAppointment?.startTime).format(
                  "DD/MM/YYYY HH:mm"
                )}
              </p>
              <p>
                <strong>Bác sĩ:</strong>{" "}
                {selectedAppointment?.doctor?.full_name || "Chưa có"}
              </p>
            </div>

            <div className={styles.feedbackList}>
              {viewFeedbacks.map((f) => {
                const svc = f.service;
                const img = svc?.images?.[0]?.url || NoImage;
                return (
                  <div key={f.id} className={styles.feedbackCard}>
                    <div className={styles.feedbackLeft}>
                      <img
                        src={img}
                        alt={svc?.name}
                        className={styles.feedbackImage}
                      />
                      <div>
                        <p className={styles.feedbackServiceName}>
                          {svc?.name}
                        </p>
                      </div>
                    </div>

                    <div className={styles.feedbackRight}>
                      <Rate allowHalf disabled value={Number(f.rating)} />
                      <Input.TextArea
                        rows={3}
                        value={f.comment}
                        disabled
                        style={{ backgroundColor: "#f9f9f9" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </Container>
  );
};

export default CustomerOrders;
