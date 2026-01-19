import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Space,
  Table,
  Divider,
  Modal,
  Form,
  Button,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { showError, showSuccess } from "@/libs/toast";
import { AppointmentColumn } from "./_components/columnTypes";
import FancyButton from "@/components/FancyButton";
import {
  useGetAppointmentsForManagementMutation,
  useUpdateAppointmentStatusConfirmedMutation,
  useUpdateAppointmentStatusRejectedMutation,
  type AppointmentProps,
} from "@/services/appointment";
import type { AppointmentTableProps } from "./_components/type";
import CreateAppointment from "./add";
import { appointmentStatusEnum } from "@/common/types/auth";
import { useAuthStore } from "@/hooks/UseAuth";

const { RangePicker } = DatePicker;

export default function OrderManagementAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [createState, setCreateState] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentTableProps[]>([]);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  const [getAppointmentsForManagement] =
    useGetAppointmentsForManagementMutation();

  const { auth } = useAuthStore();

  const [updateConfirmed] = useUpdateAppointmentStatusConfirmedMutation();
  const [updateRejected] = useUpdateAppointmentStatusRejectedMutation();

  const [rejectModal, setRejectModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentProps>();

  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);

  const handleGetAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await getAppointmentsForManagement();
      const tempRes = res.data ?? [];
      setAppointments(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tempRes.map((appointment: any) => ({
          ...appointment,
          onConfirm: () => handleUpdateStatus(appointment.id, "confirmed"),
          onReject: () => {
            setSelectedAppointment(appointment);
            setRejectModal(true);
          },
          onUpdate: () => {},
          onRemove: () => console.log("Xóa:", appointment.id),
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
    // Polling every 5 seconds for real-time updates
    const interval = setInterval(handleGetAppointments, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: "confirmed" | "imported"
  ) => {
    setIsLoading(true);
    try {
      let updateMutation;
      switch (status) {
        case "confirmed":
          updateMutation = updateConfirmed;
          break;
        default:
          throw new Error("Unknown status");
      }
      await updateMutation({
        appointmentId: id,
        staff: { id: auth.accountId || "" },
      });
      showSuccess("Cập nhật trạng thái thành công");
      handleEvent();
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Unknown");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectAppointment = async (values: { cancelReason: string }) => {
    try {
      const res = await updateRejected({
        appointmentId: selectedAppointment?.id || "",
        reason: values.cancelReason || "Nhân viên từ chối lịch hẹn",
      });

      if (res) {
        showSuccess("Từ chối lịch hẹn thành công.");
        handleEvent();
      } else {
        showError("Từ chối lịch hẹn thất bại.");
      }

      setRejectModal(false);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi từ chối lịch hẹn.";
      showError(msg);
    }
  };

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
                mode="multiple"
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
                  { label: "Quá hạn", value: appointmentStatusEnum.Overdue },
                ]}
              />
              <Divider type="vertical" />
              <FancyButton
                variant="primary"
                label="Thêm lịch hẹn"
                size="middle"
                onClick={() => setCreateState(true)}
                // disabled={true}
              />
              <CreateAppointment
                isOpen={createState}
                onClose={() => setCreateState(false)}
                onReload={handleGetAppointments}
              />
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

      {/* Reject Modal */}
      <Modal
        title="Từ chối lịch hẹn"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleRejectAppointment}>
          <Form.Item
            label="Lý do từ chối"
            name="cancelReason"
            rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do từ chối lịch hẹn..."
            />
          </Form.Item>

          <Form.Item>
            <div className="d-flex justify-content-center gap-4">
              <Button onClick={() => setRejectModal(false)}>Huỷ</Button>
              <Button type="primary" htmlType="submit">
                Xác nhận từ chối
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
