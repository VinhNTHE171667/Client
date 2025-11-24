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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => setSelectedRowKeys(selectedKeys),
  };

  const { auth } = useAuthStore();

  const handleRequestCancelMultiple = async () => {
    if (!cancelReason) {
      showError("Lỗi", "Vui lòng nhập lý do hủy");
      return;
    }

    try {
      await doctorRequestCancelBulk({
        appointmentIds: selectedRowKeys as string[],
        doctorId: auth.accountId || "",
        reason: cancelReason,
      });
      showSuccess("Đã gửi yêu cầu hủy các lịch hẹn");
      setSelectedRowKeys([]);
      setCancelReason("");
      setCancelModalVisible(false);
      handleEvent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showError("Lỗi", error?.data?.message || "Không gửi được yêu cầu");
    }
  };

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  const handleGetAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await getAppointmentsForManagement({
        doctorId: auth.accountId || "",
      });
      const tempRes = res.data ?? [];
      setAppointments(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tempRes.map((appointment: any) => ({
          ...appointment,
          onComplete: () => handleUpdateStatus(appointment.id, "completed"),
          onUpdate: () => handleUpdate(appointment.id),
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

  const handleUpdateStatus = async (id: string, status: "completed") => {
    setIsLoading(true);
    try {
      let updateMutation;
      switch (status) {
        case "completed":
          updateMutation = updateCompleted;
          break;
        default:
          throw new Error("Unknown status");
      }
      await updateMutation({ appointmentId: id });
      showSuccess("Cập nhật trạng thái thành công");
      handleEvent();
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Unknown");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchSearch =
      search === "" ||
      a.customer.full_name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || statusFilter.includes(a.status);

    const matchDate =
      !dateRange ||
      dayjs(a.appointment_date).isSame(dateRange[0], "day") ||
      dayjs(a.appointment_date).isSame(dateRange[1], "day") ||
      (dayjs(a.appointment_date).isAfter(dateRange[0], "day") &&
        dayjs(a.appointment_date).isBefore(dateRange[1], "day"));

    return matchSearch && matchDate && matchStatus;
  });

  const handleEvent = () => handleGetAppointments();

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
                ]}
              />
              <Divider type="vertical" />
              <CreateAppointment
                isOpen={createState}
                onClose={() => setCreateState(false)}
                onReload={handleGetAppointments}
              />
              <Divider type="vertical" />
              <Button
                type="primary"
                disabled={selectedRowKeys.length === 0}
                onClick={() => setCancelModalVisible(true)}
              >
                Gửi yêu cầu hủy
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

      <UpdateAppointmentModal
        appointmentId={updateId}
        isOpen={updateState}
        onClose={() => setUpdateState(false)}
        onReload={handleGetAppointments}
      />

      <Modal
        title="Lý do hủy lịch hẹn"
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        onOk={handleRequestCancelMultiple}
        okText="Xác nhận"
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
