import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Space,
  Table,
  Divider,
  Select,
  message,
  Modal,
  Form,
  InputNumber,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { showError, showSuccess } from "@/libs/toast";
import { AppointmentColumn } from "./_components/columnTypes";
import { configRoutes } from "@/constants/route";
import {
  useCreateLinkPaymentMutation,
  useGetAppointmentsForManagementMutation,
  useUpdatePaymentStatusPaidMutation,
  useRefundAppointmentMutation, // ← THÊM MỚI: mutation hoàn tiền
  type AppointmentProps,
} from "@/services/appointment";
import type { AppointmentTableProps } from "./_components/type";
import { appointmentStatusEnum } from "@/common/types/auth";
import { useAuthStore } from "@/hooks/UseAuth";

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function OrderManagementCasher() {
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentTableProps[]>([]);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);

  const { auth } = useAuthStore();
  const staffId = auth.accountId || "";

  const [getAppointmentsForManagement] =
    useGetAppointmentsForManagementMutation();

  const [createPaymentLink] = useCreateLinkPaymentMutation();
  const [updatePaymentStatusPaid] = useUpdatePaymentStatusPaidMutation();
  const [refundAppointment] = useRefundAppointmentMutation(); // ← THÊM

  // === STATE CHO MODAL HOÀN TIỀN ===
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [currentAppointment, setCurrentAppointment] =
    useState<AppointmentTableProps | null>(null);
  const [form] = Form.useForm();

  const handleGetAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await getAppointmentsForManagement();
      const tempRes = res.data ?? [];
      setAppointments(
        tempRes.map((appointment: any) => ({
          ...appointment,
          onPaymentByCash: () => handlePaymentByCash(appointment),
          onPaymentByQR: () => handlePaymentByQR(appointment),
          onRefund: () => handleRefund(appointment), // ← THÊM CALLBACK
        }))
      );
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Unknown");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetAppointments();
  }, []);

  const filteredAppointments = appointments.filter((a) => {
    const matchSearch =
      search === "" ||
      a.customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.customer.email.toLowerCase().includes(search.toLowerCase()) ||
      a.customer.phone.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || statusFilter.includes(a.status);

    const matchDate =
      !dateRange ||
      dayjs(a.appointment_date).isSame(dateRange[0], "day") ||
      dayjs(a.appointment_date).isSame(dateRange[1], "day") ||
      (dayjs(a.appointment_date).isAfter(dateRange[0], "day") &&
        dayjs(a.appointment_date).isBefore(dateRange[1], "day"));

    return matchSearch && matchDate && matchStatus;
  });

  const handlePaymentByCash = async (item: AppointmentProps) => {
    if (!staffId) {
      showError("Lỗi", "Không tìm thấy ID nhân viên. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      await updatePaymentStatusPaid({
        orderCode: item.orderCode || "",
        paymentMethod: "cash",
        staffId,
      }).unwrap();

      showSuccess(
        "Cập nhật trạng thái thanh toán thành công!",
        "Lịch hẹn đã được cập nhật trạng thái thanh toán bằng tiền mặt."
      );

      handleEvent();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo đặt cọc.";
      showError("Thanh toán thất bại!", msg);
    }
  };

  const handlePaymentByQR = async (item: AppointmentProps) => {
    if (!staffId) {
      showError("Lỗi", "Không tìm thấy ID nhân viên. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const totalAmount = Math.ceil(item.totalAmount - item.depositAmount);

      const payload = {
        appointmentId: item.id,
        amount: totalAmount,
        description: `Thanh toan #${item.id}`.slice(0, 25),
        returnUrl: `${window.location.origin}${configRoutes.paymentSuccessPaid}`,
        cancelUrl: `${window.location.origin}${configRoutes.paymentFailPaid}`,
        customerName: item.customer?.full_name || "Khách hàng",
      };
      const res = await createPaymentLink(payload).unwrap();

      if (res?.checkoutUrl) {
        message.success("Tạo liên kết thanh toán thành công!");
        window.location.href = res.checkoutUrl;
        handleEvent();
      } else {
        throw new Error("Không nhận được liên kết thanh toán từ máy chủ.");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo đặt cọc.";
      message.error(msg);
    }
  };

  // === HANDLE HOÀN TIỀN ===
  const handleRefund = (appointment: AppointmentTableProps) => {
    setCurrentAppointment(appointment);
    form.setFieldsValue({
      refundAmount: appointment.depositAmount || 0,
      refundMethod: "cash",
      refundReason: "",
    });
    setRefundModalVisible(true);
  };

  const handleRefundOk = async () => {
    try {
      const values = await form.validateFields();
      if (!currentAppointment || !staffId) return;

      await refundAppointment({
        id: currentAppointment.id,
        body: {
          refundAmount: values.refundAmount,
          refundMethod: values.refundMethod,
          refundReason: values.refundReason,
          staffId,
        },
      }).unwrap();

      showSuccess("Hoàn tiền thành công!", "Lịch hẹn đã được cập nhật trạng thái hoàn tiền.");
      setRefundModalVisible(false);
      handleEvent(); // refresh danh sách
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Hoàn tiền thất bại!";
      showError("Lỗi", msg);
    }
  };

  const handleEvent = () => {
    handleGetAppointments();
  };

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Lịch hẹn</strong>
          </h4>
        </Col>
        <Col style={{ marginLeft: "auto" }}></Col>
      </Row>

      <Card className="mt-2">
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Space>
              <Input.Search
                placeholder="Tìm theo tên khách hàng..."
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 250 }}
              />
              <RangePicker
                onChange={(val) =>
                  setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
                }
                format="DD/MM/YYYY"
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                allowClear
                placeholder="Chọn trạng thái"
                value={statusFilter ?? undefined}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 200 }}
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
                  {
                    label: "Hoàn thành",
                    value: appointmentStatusEnum.Completed,
                  },
                  { label: "Đã huỷ", value: appointmentStatusEnum.Cancelled },
                  { label: "Đã hoàn tiền", value: appointmentStatusEnum.Refunded }, // ← THÊM (nếu muốn filter)
                ]}
              />
              <Divider type="vertical" />
            </Space>
          </Col>
        </Row>

        <Table
          loading={isLoading}
          rowKey="id"
          columns={AppointmentColumn()}
          dataSource={filteredAppointments}
          scroll={{ x: "max-content" }}
          tableLayout="fixed"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            position: ["bottomRight"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong ${total} lịch hẹn`,
          }}
        />
      </Card>

      {/* === MODAL HOÀN TIỀN === */}
      <Modal
        title="Hoàn tiền đặt cọc"
        open={refundModalVisible}
        onOk={handleRefundOk}
        onCancel={() => setRefundModalVisible(false)}
        okText="Xác nhận hoàn tiền"
        cancelText="Huỷ"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Khách hàng">
            <Text strong>{currentAppointment?.customer?.full_name}</Text>
          </Form.Item>
          <Form.Item label="Số tiền đặt cọc hiện tại">
            <Text>
              {(currentAppointment?.depositAmount || 0).toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </Text>
          </Form.Item>

          <Form.Item
            name="refundAmount"
            label="Số tiền hoàn"
            rules={[{ required: true, message: "Vui lòng nhập số tiền hoàn" }]}
          >
            <InputNumber
              min={0}
              max={currentAppointment?.depositAmount || 0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "100%" }}
              addonAfter="VND"
            />
          </Form.Item>

          <Form.Item
            name="refundMethod"
            label="Phương thức hoàn tiền"
            rules={[{ required: true, message: "Vui lòng chọn phương thức" }]}
          >
            <Select
              options={[
                { label: "Tiền mặt", value: "cash" },
                { label: "QR Code", value: "qr" },
                { label: "Thẻ", value: "card" },
              ]}
            />
          </Form.Item>

          <Form.Item name="refundReason" label="Lý do hoàn tiền (tuỳ chọn)">
            <Input.TextArea rows={3} placeholder="Nhập lý do..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}