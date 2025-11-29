"use client";
import type React from "react";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
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
import styles from "./Order.module.scss";
import {
  useCreateLinkPaymentMutation,
  useGetAppointmentsByCustomerMutation,
  useUpdateAppointmentMutationCancelMutation,
  type AppointmentProps,
} from "@/services/appointment";
import { useAuthStore } from "@/hooks/UseAuth";
import {
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
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
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentProps>();
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState<
    { serviceId: string; rating?: number; comment?: string }[]
  >([]);
  const [viewFeedbackModal, setViewFeedbackModal] = useState(false);
  const [viewFeedbacks, setViewFeedbacks] = useState<FeedbackResponse[]>([]);
  const [getFeedbackByAppointment, { isLoading: isLoadingFeedback }] =
    useFindByAppointmentMutation();
  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const navigate = useNavigate();
  const [updateCancelAppointment] =
    useUpdateAppointmentMutationCancelMutation();
  const [createPaymentLink] = useCreateLinkPaymentMutation();
  const [createFeedbacks] = useCreateFeedbacksMutation();
  const handleEvent = async () => {
    if (auth?.accountId) {
      try {
        const res = await getAppointments({
          customerId: auth.accountId,
        }).unwrap();
        setAppointments(res);
      } catch {
        setAppointments([]);
      }
    }
  };
  useEffect(() => {
    handleEvent();
    const intervalId = setInterval(() => {
      handleEvent();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [auth]);
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
        (dayjs(item.startTime).isSameOrAfter(dateRange[0], "day") &&
          dayjs(item.startTime).isSameOrBefore(dateRange[1], "day"));
      return matchStatus && matchDate;
    });
  }, [appointments, statusFilter, dateRange]);
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    console.log("Slot selected:", slotInfo);
  };
  const handleSelectEvent = (event: RBCEvent) => {
    const appointment = event.resource as AppointmentProps;
    setSelectedAppointment(appointment);
    setEditModal(true);
  };
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
      await handleEvent();
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
        totalAmount: selectedAppointment?.totalAmount || null,
        voucherId: selectedAppointment?.voucherId || null,
      },
    });
  };
  const handleDeposit = async (item: AppointmentProps) => {
    try {
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
      await handleEvent();
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
    <div className={styles.ordersPageWrapper}>
      {/* Header Section */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Quản Lí Lịch Hẹn</h1>
          <p className={styles.pageSubtitle}>
            Theo dõi và quản lí tất cả các cuộc hẹn của bạn một cách dễ dàng
          </p>
        </div>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${
              viewMode === "calendar" ? styles.active : ""
            }`}
            onClick={() => setViewMode("calendar")}
            aria-label="View calendar"
          >
            <CalendarOutlined className={styles.toggleIcon} /> Lịch
          </button>
          <button
            className={`${styles.toggleBtn} ${
              viewMode === "list" ? styles.active : ""
            }`}
            onClick={() => setViewMode("list")}
            aria-label="View list"
          >
            <UnorderedListOutlined className={styles.toggleIcon} /> Danh Sách
          </button>
        </div>
      </div>
      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className={styles.calendarContainer}>
          <Card className={styles.calendarCard}>
            <div className={styles.calendarWrapper}>
              <Calendar
                localizer={localizer}
                events={events}
                timeslots={1}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
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
                        ? "#dc2626"
                        : event.resource?.status === "COMPLETED"
                        ? "#16a34a"
                        : "#0ea5e9",
                    borderRadius: "8px",
                    color: "#fff",
                    border: "none",
                    padding: "6px 10px",
                    fontSize: "13px",
                    fontWeight: "500",
                  },
                })}
                slotPropGetter={(date) => {
                  const now = new Date();
                  if (date < now) {
                    return {
                      style: {
                        backgroundColor: "#f3f4f6",
                        opacity: 0.5,
                      },
                    };
                  }
                  return {
                    style: {
                      backgroundColor: "#f0f9ff",
                      cursor: "pointer",
                    },
                  };
                }}
              />
            </div>
          </Card>
        </div>
      )}
      {/* List View */}
      {viewMode === "list" && (
        <div className={styles.listContainer}>
          {/* Filter Section */}
          <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Khoảng thời gian</label>
              <DatePicker.RangePicker
                format="DD/MM/YYYY"
                onChange={(range) => setDateRange(range)}
                placeholder={["Từ ngày", "Đến ngày"]}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Trạng thái</label>
              <Select
                allowClear
                placeholder="Chọn trạng thái"
                value={statusFilter ?? undefined}
                onChange={(value) => setStatusFilter(value)}
                mode="multiple"
                className={styles.filterInput}
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
            </div>
            <Button
              className={styles.clearBtn}
              onClick={() => {
                setDateRange(null);
                setStatusFilter(null);
              }}
            >
              Xoá Bộ Lọc
            </Button>
          </div>
          {/* Appointments List */}
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Empty
              description="Không có lịch hẹn nào"
              className={styles.emptyState}
            />
          ) : (
            <div className={styles.appointmentsList}>
              {filteredAppointments.map((item) => {
                const totalPrice = Number(item.totalAmount).toLocaleString(
                  "vi-VN"
                );
                const isPending = item.status === appointmentStatusEnum.Pending;
                const isConfirmed =
                  item.status === appointmentStatusEnum.Confirmed;
                const isPay = item.status === appointmentStatusEnum.Paid;
                return (
                  <div key={item.id} className={styles.appointmentCard}>
                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.customerSection}>
                        <Avatar
                          size={56}
                          src={item.customer?.avatar || NoImage}
                          className={styles.avatar}
                        />
                        <div className={styles.customerInfo}>
                          <h3 className={styles.customerName}>
                            {item.customer?.full_name || "Khách hàng"}
                          </h3>
                          <Tag
                            color={statusTagColor(item.status)}
                            className={styles.statusTag}
                          >
                            {translateStatus(item.status)}
                          </Tag>
                        </div>
                      </div>
                      <div className={styles.priceSection}>
                        <span className={styles.priceLabel}>Tổng tiền</span>
                        <span className={styles.priceValue}>{totalPrice}₫</span>
                      </div>
                    </div>
                    {/* Card Details */}
                    <div className={styles.cardDetails}>
                      <div className={styles.detailItem}>
                        <ClockCircleOutlined className={styles.detailIcon} />
                        <div className={styles.detailContent}>
                          <span className={styles.detailLabel}>Ngày & Giờ</span>
                          <span className={styles.detailValue}>
                            {dayjs(item.startTime).format("DD/MM/YYYY HH:mm")}
                          </span>
                        </div>
                      </div>
                      <div className={styles.detailItem}>
                        <TeamOutlined className={styles.detailIcon} />
                        <div className={styles.detailContent}>
                          <span className={styles.detailLabel}>Bác sĩ</span>
                          <span className={styles.detailValue}>
                            {item.doctor?.full_name || "Chưa có"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.detailItem}>
                        <PhoneOutlined className={styles.detailIcon} />
                        <div className={styles.detailContent}>
                          <span className={styles.detailLabel}>Dịch vụ</span>
                          <span className={styles.detailValue}>
                            {item.details
                              ?.map((d) => d.service?.name)
                              .join(", ") || "Không có"}
                          </span>
                        </div>
                      </div>
                      {item.note && (
                        <div className={styles.noteSection}>
                          <span className={styles.noteLabel}>Ghi chú:</span>
                          <span className={styles.noteValue}>{item.note}</span>
                        </div>
                      )}
                    </div>
                    {/* Card Actions */}
                    <div className={styles.cardActions}>
                      <Button
                        type="text"
                        size="small"
                        onClick={() => {
                          setSelectedAppointment(item);
                          setDetailModal(true);
                        }}
                        className={styles.actionBtn}
                      >
                        Chi Tiết
                      </Button>
                      {isPending && (
                        <>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() =>
                              handleSelectEvent({
                                id: item.id,
                                title:
                                  item.details?.[0]?.service?.name ??
                                  "Lịch hẹn",
                                start: new Date(item.startTime ?? new Date()),
                                end: new Date(
                                  item.endTime ?? item.startTime ?? new Date()
                                ),
                                resource: item,
                              } as RBCEvent)
                            }
                            className={styles.actionBtn}
                          >
                            Chỉnh Sửa
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              setSelectedAppointment(item);
                              setCancelModal(true);
                            }}
                            className={styles.actionBtn}
                          >
                            Huỷ
                          </Button>
                        </>
                      )}
                      {isConfirmed && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleDeposit(item)}
                          className={styles.actionBtn}
                        >
                          Đặt Cọc 50%
                        </Button>
                      )}
                      {isPay && (
                        <>
                          <Button
                            type="primary"
                            size="small"
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
                            className={styles.actionBtn}
                          >
                            {item.isFeedbackGiven ? "Đã Đánh Giá" : "Đánh Giá"}
                          </Button>
                          {item.isFeedbackGiven && (
                            <Button
                              type="text"
                              size="small"
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleViewFeedback(item)}
                              className={styles.actionBtn}
                            >
                              Xem Đánh Giá
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Modals */}
      <Modal
        title="Chỉnh Sửa Lịch Hẹn"
        open={editModal}
        onOk={handleSaveEdit}
        onCancel={() => setEditModal(false)}
        okText="Lưu"
        cancelText="Huỷ"
        wrapClassName={styles.modal}
      >
        <p>
          Bạn sắp chỉnh sửa lịch hẹn: {selectedAppointment?.customer?.full_name}
        </p>
        <p>
          Ngày:{" "}
          {dayjs(selectedAppointment?.startTime).format("DD/MM/YYYY HH:mm")}
        </p>
      </Modal>
      <Modal
        title="Huỷ Lịch Hẹn"
        open={cancelModal}
        onOk={() =>
          handleCancelAppointment({ cancelReason: "Khách hàng huỷ lịch hẹn" })
        }
        onCancel={() => setCancelModal(false)}
        okText="Xác Nhận Huỷ"
        cancelText="Đóng"
        wrapClassName={styles.modal}
      >
        <p>
          Bạn có chắc chắn muốn huỷ lịch hẹn với{" "}
          {selectedAppointment?.customer?.full_name}?
        </p>
        <p className={styles.cautionText}>Hành động này không thể hoàn tác.</p>
      </Modal>
      <Modal
        title="Chi Tiết Lịch Hẹn"
        open={detailModal}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            Đóng
          </Button>,
        ]}
        wrapClassName={styles.modal}
      >
        {selectedAppointment && (
          <div className={styles.detailsModal}>
            <div className={styles.detailGroup}>
              <span className={styles.label}>Khách hàng:</span>
              <span>{selectedAppointment.customer?.full_name}</span>
            </div>
            <div className={styles.detailGroup}>
              <span className={styles.label}>Ngày:</span>
              <span>
                {dayjs(selectedAppointment.startTime).format(
                  "DD/MM/YYYY HH:mm"
                )}
              </span>
            </div>
            <div className={styles.detailGroup}>
              <span className={styles.label}>Bác sĩ:</span>
              <span>{selectedAppointment.doctor?.full_name || "Chưa có"}</span>
            </div>
            <div className={styles.detailGroup}>
              <span className={styles.label}>Nhân viên:</span>
              <span>{selectedAppointment.staff?.full_name || "Chưa có"}</span>
            </div>
            <div className={styles.servicesSection}>
              <h4>Dịch vụ</h4>
              {selectedAppointment.details?.map((detail) => (
                <div key={detail.serviceId} className={styles.serviceItem}>
                  {detail.service?.image && (
                    <img
                      src={detail.service.image || "/placeholder.svg"}
                      alt={detail.service.name}
                      className={styles.serviceImage}
                    />
                  )}
                  <div className={styles.serviceContent}>
                    <p className={styles.serviceName}>{detail.service?.name}</p>
                    <p className={styles.servicePrice}>
                      {Number(detail.price).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.voucherSection}>
              <h4>Voucher</h4>

              {selectedAppointment.voucher ? (
                <div className={styles.voucherItem}>
                  <p className={styles.voucherCode}>
                    Mã voucher: {selectedAppointment.voucher.code}
                  </p>

                  {selectedAppointment.voucher.discountAmount && (
                    <p className={styles.voucherDiscount}>
                      Giảm:{" "}
                      {Number(
                        selectedAppointment.voucher.discountAmount
                      ).toLocaleString("vi-VN")}
                      ₫
                    </p>
                  )}

                  {selectedAppointment.voucher.discountPercent && (
                    <p className={styles.voucherDiscount}>
                      Giảm: {selectedAppointment.voucher.discountPercent}%
                    </p>
                  )}
                </div>
              ) : (
                <p className={styles.noVoucher}>Không dùng voucher nào</p>
              )}
            </div>

            <div className={styles.totalAmount}>
              <span>Đã đặt cọc:</span>
              <span>
                {Number(selectedAppointment.depositAmount).toLocaleString(
                  "vi-VN"
                )}
                ₫
              </span>
            </div>

            <div className={styles.totalAmount}>
              <span>Tổng cộng:</span>
              <span>
                {Number(selectedAppointment.totalAmount).toLocaleString(
                  "vi-VN"
                )}
                ₫
              </span>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        title="Đánh Giá Dịch Vụ"
        open={feedbackModal}
        onOk={handleCreateFeedbacks}
        onCancel={() => setFeedbackModal(false)}
        okText="Gửi Đánh Giá"
        cancelText="Huỷ"
        wrapClassName={styles.modal}
      >
        <div className={styles.feedbackModal}>
          <div className={styles.feedbackList}>
            {feedbacks.map((feedback, index) => (
              <div key={index} className={styles.feedbackItem}>
                <div className={styles.feedbackContent}>
                  <h5>
                    {selectedAppointment?.details?.[index]?.service?.name}
                  </h5>
                  <div className={styles.ratingControl}>
                    <Rate
                      value={feedback.rating}
                      onChange={(value) => {
                        const newFeedbacks = [...feedbacks];
                        newFeedbacks[index].rating = value;
                        setFeedbacks(newFeedbacks);
                      }}
                    />
                  </div>
                  <Input.TextArea
                    placeholder="Nhận xét của bạn..."
                    value={feedback.comment}
                    onChange={(e) => {
                      const newFeedbacks = [...feedbacks];
                      newFeedbacks[index].comment = e.target.value;
                      setFeedbacks(newFeedbacks);
                    }}
                    className={styles.feedbackTextarea}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
      <Modal
        title="Xem Đánh Giá"
        open={viewFeedbackModal}
        footer={[
          <Button key="close" onClick={() => setViewFeedbackModal(false)}>
            Đóng
          </Button>,
        ]}
        wrapClassName={styles.modal}
      >
        {isLoadingFeedback ? (
          <Spin />
        ) : (
          <div className={styles.feedbackList}>
            {viewFeedbacks.map((feedback) => (
              <div key={feedback.id} className={styles.feedbackItem}>
                <div className={styles.feedbackContent}>
                  <h5>{feedback.service?.name}</h5>
                  <div className={styles.ratingControl}>
                    <Rate value={feedback.rating} disabled />
                  </div>
                  {feedback.comment && <p>{feedback.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
export default CustomerOrders;
