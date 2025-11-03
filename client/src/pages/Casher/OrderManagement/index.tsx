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
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { showError, showSuccess } from "@/libs/toast";
import { AppointmentColumn } from "./_components/columnTypes";
import { configRoutes } from "@/constants/route";
import { Link } from "react-router-dom";
import FancyBreadcrumb from "@/components/FancyBreadcrumb";
import {
  useCreateLinkPaymentMutation,
  useGetAppointmentsForManagementMutation,
  useUpdatePaymentStatusPaidMutation,
  type AppointmentProps,
} from "@/services/appointment";
import type { AppointmentTableProps } from "./_components/type";
import { appointmentStatusEnum } from "@/common/types/auth";

const { RangePicker } = DatePicker;

export default function OrderManagementCasher() {
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentTableProps[]>([]);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  const [getAppointmentsForManagement] =
    useGetAppointmentsForManagementMutation();

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
          onPaymentByCash: () => handlePaymentByCash(appointment),
          onPaymentByQR: () => handlePaymentByQR(appointment),
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
      search === "" || a.id.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || statusFilter.includes(a.status);

    const matchDate =
      !dateRange ||
      dayjs(a.appointment_date).isSame(dateRange[0], "day") ||
      dayjs(a.appointment_date).isSame(dateRange[1], "day") ||
      (dayjs(a.appointment_date).isAfter(dateRange[0], "day") &&
        dayjs(a.appointment_date).isBefore(dateRange[1], "day"));

    return matchSearch && matchDate && matchStatus;
  });

  const [createPaymentLink] = useCreateLinkPaymentMutation();
  const [paymentCash] = useUpdatePaymentStatusPaidMutation();

  const handlePaymentByCash = async (item: AppointmentProps) => {
    try {
      await paymentCash({
        orderCode: item.orderCode || "",
      }).unwrap();

      showSuccess(
        "Cập nhật trạng thái thanh toán thành công!",
        "Lịch hẹn đã được cập nhật trạng thái thanh toán bằng tiền mặt."
      );

      handleEvent();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo đặt cọc.";
      message.error(msg);
    }
  };

  const handlePaymentByQR = async (item: AppointmentProps) => {
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
      } else {
        throw new Error("Không nhận được liên kết thanh toán từ máy chủ.");
      }
      handleEvent();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo đặt cọc.";
      message.error(msg);
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
    </>
  );
}
