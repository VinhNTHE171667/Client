import { Card, Col, DatePicker, Input, Row, Space, Table, Divider } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import AddSpa from "./add";
import UpdateSpa from "./update";
import { showError, showSuccess } from "@/libs/toast";
import { AppointmentColumn } from "./_components/columnTypes";
import FancyButton from "@/components/FancyButton";
import { configRoutes } from "@/constants/route";
import { Link } from "react-router-dom";
import FancyBreadcrumb from "@/components/FancyBreadcrumb";
import {
  useGetAppointmentsForManagementMutation,
  useUpdateAppointmentStatusConfirmedMutation,
  useUpdateAppointmentStatusImportedMutation,
} from "@/services/appointment";
import type { AppointmentTableProps } from "./_components/type";

const { RangePicker } = DatePicker;

export default function OrderManagementStaff() {
  const [isLoading, setIsLoading] = useState(false);
  const [createState, setCreateState] = useState(false);
  const [updateState, setUpdateState] = useState(false);
  const [updateId, setUpdateId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentTableProps[]>([]);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  const [getAppointmentsForManagement] =
    useGetAppointmentsForManagementMutation();

  const [updateConfirmed] = useUpdateAppointmentStatusConfirmedMutation();
  const [updateImported] = useUpdateAppointmentStatusImportedMutation();

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

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
          onImport: () => handleUpdateStatus(appointment.id, "imported"),
          onUpdate: () => handleUpdate(appointment.id),
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
        case "imported":
          updateMutation = updateImported;
          break;
        default:
          throw new Error("Unknown status");
      }
      await updateMutation({ appointmentId: id });
      showSuccess("Cập nhật trạng thái thành công");
      handleGetAppointments();
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Unknown");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchSearch =
      search === "" || a.id.toLowerCase().includes(search.toLowerCase());

    const matchDate =
      !dateRange ||
      dayjs(a.appointment_date).isSame(dateRange[0], "day") ||
      dayjs(a.appointment_date).isSame(dateRange[1], "day") ||
      (dayjs(a.appointment_date).isAfter(dateRange[0], "day") &&
        dayjs(a.appointment_date).isBefore(dateRange[1], "day"));

    return matchSearch && matchDate;
  });

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Lịch hẹn</strong>
          </h4>
        </Col>
        <Col style={{ marginLeft: "auto" }}>
          <FancyBreadcrumb
            items={[
              {
                title: <Link to={configRoutes.staffDashboard}>Dashboard</Link>,
              },
              { title: <span>Lịch hẹn</span> },
            ]}
            separator=">"
          />
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
                placeholder="Tìm theo mã lịch hẹn..."
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
              <Divider type="vertical" />
              <FancyButton
                variant="primary"
                label="Thêm lịch hẹn"
                size="middle"
                onClick={() => setCreateState(true)}
                disabled={true}
              />
              <AddSpa
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
        <UpdateSpa
          id={updateId}
          isOpen={updateState}
          onClose={() => setUpdateState(false)}
          onReload={handleGetAppointments}
        />
      </Card>
    </>
  );
}
