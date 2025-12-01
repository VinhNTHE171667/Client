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
  Button,
  Modal,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { showError, showSuccess } from "@/libs/toast";
import { AppointmentColumn } from "./_components/columnTypes";
import {
  useDoctorRequestCancelBulkMutation,
  useGetAppointmentsManagedByDoctorMutation,
  useUpdateAppointmentMutationCompleteMutation,
  useGetDoctorCancelRequestsMutation,
} from "@/services/appointment";
import type { AppointmentTableProps } from "./_components/type";
import CreateAppointment from "./add";
import { appointmentStatusEnum } from "@/common/types/auth";
import UpdateAppointmentModal from "./update";
import { useAuthStore } from "@/hooks/UseAuth";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function OrderManagementDoctor() {
  const [isLoading, setIsLoading] = useState(false);
  const [createState, setCreateState] = useState(false);
  const [updateState, setUpdateState] = useState(false);
  const [updateId, setUpdateId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentTableProps[]>([]);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);

  const [getAppointmentsForManagement] =
    useGetAppointmentsManagedByDoctorMutation();
  const [updateCompleted] = useUpdateAppointmentMutationCompleteMutation();
  const [doctorRequestCancelBulk] = useDoctorRequestCancelBulkMutation();
  const [getCancelRequests] = useGetDoctorCancelRequestsMutation();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { auth } = useAuthStore();

  const handleGetAppointments = async () => {
    if (!auth?.accountId) return;

    setIsLoading(true);
    try {
      let pendingCancelIds = new Set<string>();
      try {
        const cancelRes = await getCancelRequests().unwrap();
        pendingCancelIds = new Set(cancelRes.map((r: any) => r.appointmentId));
      } catch (err) {
        console.error("Lỗi lấy yêu cầu hủy:", err);
      }

      const res = await getAppointmentsForManagement({
        doctorId: auth.accountId,
      }).unwrap();

      const tempRes = res ?? [];

      const cleanedAppointments = tempRes.map((appointment: any) => {
        const isStillPendingCancel = pendingCancelIds.has(appointment.id);

        if (appointment.statusHandle === "pending" && !isStillPendingCancel) {
          return { ...appointment, statusHandle: null };
        }
        return appointment;
      });

      setAppointments(
        cleanedAppointments.map((appointment: any) => ({
          ...appointment,
          onComplete: () => handleUpdateStatus(appointment.id, "completed"),
          onUpdate: () => handleUpdate(appointment.id),
          hasPendingCancelRequest: pendingCancelIds.has(appointment.id), // cho column dùng
        }))
      );
    } catch (error) {
      showError(
        "Lỗi",
        error instanceof Error ? error.message : "Không thể tải dữ liệu"
      );
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load lần đầu + refresh mỗi 15s
  useEffect(() => {
    handleGetAppointments();

    const interval = setInterval(handleGetAppointments, 15000);
    return () => clearInterval(interval);
  }, [auth]);

  const handleUpdateStatus = async (id: string, status: "completed") => {
    setIsLoading(true);
    try {
      if (status === "completed") {
        await updateCompleted({ appointmentId: id }).unwrap();
        showSuccess("Đã đánh dấu hoàn thành");
      }
      handleGetAppointments(); // reload lại
    } catch (error) {
      showError(
        "Lỗi",
        error instanceof Error ? error.message : "Cập nhật thất bại"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  const handleRequestCancelMultiple = async () => {
    if (!cancelReason.trim()) {
      showError("Lỗi", "Vui lòng nhập lý do hủy");
      return;
    }

    try {
      await doctorRequestCancelBulk({
        appointmentIds: selectedRowKeys as string[],
        doctorId: auth.accountId || "",
        reason: cancelReason,
      }).unwrap();

      showSuccess("Đã gửi yêu cầu hủy thành công");
      setSelectedRowKeys([]);
      setCancelReason("");
      setCancelModalVisible(false);
      handleGetAppointments();
    } catch (error: any) {
      showError("Lỗi", error?.data?.message || "Gửi yêu cầu thất bại");
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchSearch =
      search === "" ||
      a.customer.full_name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || statusFilter.includes(a.status);

    const matchDate =
      !dateRange ||
      (dayjs(a.appointment_date).isSameOrAfter(dateRange[0], "day") &&
        dayjs(a.appointment_date).isSameOrBefore(dateRange[1], "day"));

    return matchSearch && matchStatus && matchDate;
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Lịch hẹn</strong>{" "}
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
                mode="multiple"
                allowClear
                placeholder="Chọn trạng thái"
                value={statusFilter ?? undefined}
                onChange={setStatusFilter}
                style={{ width: 300 }}
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
                ]}
              />
              <Divider type="vertical" />
              <Button type="primary" onClick={() => setCreateState(true)}>
                Tạo lịch hẹn
              </Button>
              <CreateAppointment
                isOpen={createState}
                onClose={() => setCreateState(false)}
                onReload={handleGetAppointments}
              />
              <Divider type="vertical" />
              <Button
                type="primary"
                danger
                disabled={selectedRowKeys.length === 0}
                onClick={() => setCancelModalVisible(true)}
              >
                Gửi yêu cầu hủy ({selectedRowKeys.length})
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          loading={isLoading}
          rowKey="id"
          rowSelection={rowSelection}
          columns={AppointmentColumn()}
          dataSource={filteredAppointments}
          scroll={{ x: "max-content" }}
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

      <UpdateAppointmentModal
        appointmentId={updateId}
        isOpen={updateState}
        onClose={() => setUpdateState(false)}
        onReload={handleGetAppointments}
      />

      <Modal
        title="Nhập lý do hủy lịch hẹn"
        open={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelReason("");
        }}
        onOk={handleRequestCancelMultiple}
        okText="Gửi yêu cầu"
        cancelText="Đóng"
      >
        <TextArea
          rows={4}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Nhập lý do hủy..."
        />
      </Modal>
    </>
  );
}
